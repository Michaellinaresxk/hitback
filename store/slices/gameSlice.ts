import { StateCreator } from 'zustand';

import { audioService } from '@/services/audioService';
import {
  SPEED_ROUND_TIME_LIMIT,
  CURRENT_SPEED_ROUND_INDEX,
} from '@/constants/SpeedRound';
import { GAME_DURATION } from '@/constants/Game';
import { generateRoute } from '@/utils/worldtourUtils';
import { BoardTile } from '@/types/worldTour.types';

export const createGameSlice: StateCreator<GameStore, [], []> = (set, get) => ({
  id: '',
  currentTurn: 0,
  worldTourRoutes: null as Record<string, BoardTile[]> | null,
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
  featuringPlayerId: null,
  stopBlastActive: false,
  stopBlastHolderId: null,
  duelActive: false,
  duelPlayer1Id: null,
  duelPlayer2Id: null,
  featuringTargetId: null,
  doublePlatinumActive: false,
  gameDurationMinutes: GAME_DURATION / 60,

  createNewGame: () => {
    audioService.stopAudio();
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    set({
      id: `game_${Date.now()}`,
      players: [],
      worldTourRoutes: null,
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
      featuringPlayerId: null,
      featuringTargetId: null,
      stopBlastActive: false,
      stopBlastHolderId: null,
      duelActive: false,
      duelPlayer1Id: null,
      duelPlayer2Id: null,
      doublePlatinumActive: false,
    });
  },

  startGame: async () => {
    const { players } = get();

    if (players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para empezar');
    }

    try {
      const backendConnected = await get().checkBackendConnection();
      if (!backendConnected) {
        console.warn('⚠️ Backend not connected');
      }

      await audioService.initializeAudio();
      const durationSeconds = get().gameDurationMinutes * 60;

      const updatedPlayers = players.map((player) => ({
        ...player,
        isCurrentTurn: false, // No turn order — all players can answer every question
        score: 0,
        availableTokens: [1, 2, 3],
        boardPosition: 0,
        powerCards: [],
        currentBet: 0,
        consecutiveWins: 0,
        cardTypeStreaks: {},
        difficultyStreaks: {},
        isFrozen: false,
        frozenForRound: null,
      }));

      const route: Record<string, BoardTile[]> = {};
      for (const player of updatedPlayers) {
        route[player.id] = generateRoute();
      }

      set({
        players: updatedPlayers,
        worldTourRoutes: route,
        isActive: true,
        currentTurn: 0,
        timeLeft: durationSeconds,
        gameMode: 'normal',
        round: 1,
        error: null,
        backendConnected,
      });

      get().startTimer(durationSeconds);
    } catch (error) {
      console.error('❌ Error starting game:', error);
      set({ error: 'No se pudo iniciar el juego', isActive: false });
      throw error;
    }
  },

  setGameActive: (active: boolean) => {
    set({ isActive: active });
  },

  endGame: async () => {
    await audioService.stopAudio();
    get().stopTimer();

    const { players } = get();
    const winner = players.reduce((max, player) =>
      player.score > max.score ? player : max,
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

  // ─── nextTurn (advanceRound) ──────────────────────────────────────────────
  // No hay orden de turnos: todos los jugadores pueden responder cada pregunta.
  // Solo avanza el tablero quien responde correctamente.
  // Aquí solo decrementamos el freeze de TODOS los jugadores congelados y
  // limpiamos el estado de ronda.
  nextTurn: () => {
    const { players } = get();

    const updatedPlayers = players.map((player) => {
      const basePatch = { peekUsed: false as const, currentBet: 0 };
      if (!player.isFrozen) return { ...player, ...basePatch };

      // Decrement freeze counter for every frozen player each round
      const roundsLeft = Math.max(0, (player.artistHoldRoundsLeft || 0) - 1);
      if (roundsLeft > 0) {
        console.log(
          `❄️ ${player.name} FROZEN — ${roundsLeft} ronda(s) restante(s)`,
        );
      } else {
        console.log(`▶️ ${player.name} descongelado`);
      }
      return {
        ...player,
        ...basePatch,
        artistHoldRoundsLeft: roundsLeft,
        isFrozen: roundsLeft > 0,
        frozenForRound: roundsLeft > 0 ? player.frozenForRound : null,
      };
    });

    set({
      players: updatedPlayers,
      currentCard: null,
      round: get().round + 1,
      audioFinished: false,
      showQuestion: false,
      showAnswer: false,
    });

    get().decrementAllianceRounds();
    get().clearStopBlast();
    get().clearDuel();

    console.log(`➡️ Round advanced — todos los jugadores pueden responder`);
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
      set((state: { timeLeft: number }) => ({ timeLeft: state.timeLeft - 1 }));
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

  activateFeaturing: (portadorId: string, targetId: string) => {
    const { players } = get();
    const portador = players.find((p) => p.id === portadorId);
    const target = players.find((p) => p.id === targetId);
    console.log(`🎤 Featuring activado: ${portador?.name} ft. ${target?.name}`);
    set({ featuringPlayerId: portadorId, featuringTargetId: targetId });
  },

  clearFeaturing: () => {
    set({ featuringPlayerId: null, featuringTargetId: null });
  },

  activateStopBlast: (holderId: string) => {
    const { players } = get();
    const holder = players.find((p) => p.id === holderId);
    console.log(`🛑 STOP-BLAST activado por: ${holder?.name}`);
    set({ stopBlastActive: true, stopBlastHolderId: holderId });
  },

  clearStopBlast: () => {
    set({ stopBlastActive: false, stopBlastHolderId: null });
  },

  activateDuel: (player1Id: string, player2Id: string) => {
    const { players } = get();
    const p1 = players.find((p) => p.id === player1Id);
    const p2 = players.find((p) => p.id === player2Id);
    console.log(`⚔️ Duel: ${p1?.name} vs ${p2?.name}`);
    set({
      duelActive: true,
      duelPlayer1Id: player1Id,
      duelPlayer2Id: player2Id,
    });
  },

  clearDuel: () => {
    set({ duelActive: false, duelPlayer1Id: null, duelPlayer2Id: null });
  },

  activateDoublePlatinum: () => {
    const { players } = get();
    const holder = players.find((p: any) =>
      p.powerCards?.some(
        (pc: any) => pc.type === 'double_platinum' && pc.isActive,
      ),
    );
    console.log(
      `💿 DOUBLE PLATINUM activado${holder ? ` por ${holder.name}` : ''}`,
    );
    set({ doublePlatinumActive: true });
  },

  clearDoublePlatinum: () => {
    set({ doublePlatinumActive: false });
  },

  setGameDuration: (minutes: number) => {
    set({ gameDurationMinutes: minutes });
  },
});
