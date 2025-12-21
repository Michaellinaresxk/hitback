// store/slices/gameSlice.ts
import { StateCreator } from 'zustand';
import { GameStore } from '../types/gameTypes';
import { audioService } from '@/services/audioService';
import {
  SPEED_ROUND_TIME_LIMIT,
  CURRENT_SPEED_ROUND_INDEX,
} from '@/constants/SpeedRound';

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (
  set,
  get
) => ({
  id: '',
  currentTurn: 0,
  gameMode: 'normal',
  timeLeft: 0,
  isActive: false,
  round: 1,
  gamePot: { tokens: 0, powerCards: [] },
  viralMomentActive: false,
  battleRound: null,
  currentSpeedRoundIndex: CURRENT_SPEED_ROUND_INDEX,
  speedRoundTimeLeft: SPEED_ROUND_TIME_LIMIT,
  battleModeActive: false,
  speedRoundActive: false,
  selectedBattlePlayers: null,

  createNewGame: () => {
    console.log('🎮 Creating new game...');

    audioService.stopAudio();
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    set({
      id: `game_${Date.now()}`,
      players: [],
      currentTurn: 0,
      gameMode: 'normal',
      timeLeft: 0,
      isActive: false,
      round: 1,
      currentCard: null,
      isScanning: false,
      error: null,
      timerInterval: null,
      gamePot: { tokens: 0, powerCards: [] },
      viralMomentActive: false,
      audioFinished: false,
      showQuestion: false,
      showAnswer: false,
      showGameEndModal: false,
      backendConnected: false,
      lastBackendCheck: null,
    });

    console.log('✅ New game created');
  },

  startGame: async () => {
    const { players } = get();

    if (players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para empezar');
    }

    try {
      console.log('🎮 Starting game...');

      const backendConnected = await get().checkBackendConnection();
      if (!backendConnected) {
        console.warn('⚠️ Backend not connected');
      }

      await audioService.initializeAudio();

      const updatedPlayers = players.map((player, index) => ({
        ...player,
        isCurrentTurn: index === 0,
        score: 0,
        availableTokens: [1, 2, 3],
        powerCards: [],
        currentBet: 0,
        consecutiveWins: 0,
        cardTypeStreaks: {},
        difficultyStreaks: {},
      }));

      set({
        players: updatedPlayers,
        isActive: true,
        currentTurn: 0,
        timeLeft: 1200,
        gameMode: 'normal',
        round: 1,
        error: null,
        backendConnected,
      });

      get().startTimer(1200);
      console.log('✅ Game started - Each player has tokens: [+1, +2, +3]');
    } catch (error) {
      console.error('❌ Error starting game:', error);
      set({ error: 'No se pudo iniciar el juego' });
    }
  },

  endGame: async () => {
    console.log('🏁 Ending game...');

    await audioService.stopAudio();
    get().stopTimer();

    const { players } = get();
    const winner = players.reduce((max, player) =>
      player.score > max.score ? player : max
    );

    console.log(`🏆 Winner: ${winner.name} (${winner.score} pts)`);

    set({
      isActive: false,
      currentCard: null,
      gameMode: 'normal',
      viralMomentActive: false,
      audioFinished: false,
      showQuestion: false,
      showAnswer: false,
      showGameEndModal: true,
    });
  },

  nextTurn: () => {
    const { players, currentTurn } = get();
    const nextTurnIndex = (currentTurn + 1) % players.length;

    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === nextTurnIndex,
      isImmune: player.isImmune && Math.random() > 0.5,
      peekUsed: false,
    }));

    set({
      players: updatedPlayers,
      currentTurn: nextTurnIndex,
      currentCard: null,
      round: get().round + 1,
      audioFinished: false,
      showQuestion: false,
      showAnswer: false,
    });

    console.log(`➡️ Next turn: ${updatedPlayers[nextTurnIndex].name}`);
    get().clearBets();
  },

  startTimer: (duration: number) => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);

    set({ timeLeft: duration });

    const newInterval = setInterval(() => {
      const { timeLeft, isActive } = get();
      if (!isActive || timeLeft <= 0) {
        get().stopTimer();
        if (timeLeft <= 0) get().endGame();
        return;
      }
      set((state) => ({ timeLeft: state.timeLeft - 1 }));
    }, 1000);

    set({ timerInterval: newInterval });
  },

  stopTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
      set({ timerInterval: null });
    }
  },

  startBattleMode: (player1Id: string, player2Id: string) => {
    set({
      gameMode: 'battle',
      battleModeActive: true,
      selectedBattlePlayers: { player1Id, player2Id },
      battleRound: { player1Id, player2Id, active: true },
    });
  },

  startSpeedRound: () => {
    set({
      gameMode: 'speed',
      speedRoundActive: true,
      speedRoundTimeLeft: SPEED_ROUND_TIME_LIMIT,
      speedRoundAnswers: {},
      currentSpeedRoundIndex: 0,
    });
  },

  startViralMoment: () => {
    set({
      gameMode: 'viral',
      viralMomentActive: true,
    });
  },
});
