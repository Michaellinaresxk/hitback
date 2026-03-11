import { StateCreator } from 'zustand';

import { audioService } from '@/services/audioService';
import {
  SPEED_ROUND_TIME_LIMIT,
  CURRENT_SPEED_ROUND_INDEX,
} from '@/constants/SpeedRound';

export const createGameSlice: StateCreator<GameStore, [], []> = (set, get) => ({
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
  featuringPlayerId: null,
  stopBlastActive: false,
  stopBlastHolderId: null,
  featuringTargetId: null,

  createNewGame: () => {
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
      featuringPlayerId: null,
      featuringTargetId: null,
      stopBlastActive: false,
      stopBlastHolderId: null,
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
        isFrozen: false,
        frozenForRound: null,
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
    } catch (error) {
      console.error('❌ Error starting game:', error);
      set({ error: 'No se pudo iniciar el juego' });
    }
  },

  setGameActive: (active: boolean) => {
    set({ isActive: active });
  },

  syncPlayersFromBackend: (
    backendPlayers: Array<{
      id: string;
      name: string;
      score: number;
      availableTokens: number[];
    }>,
  ) => {
    set((state: { players: any[] }) => {
      const updatedPlayers = state.players.map((localPlayer, index) => {
        const backendPlayer = backendPlayers[index];

        if (backendPlayer) {
          return {
            ...localPlayer,
            score: backendPlayer.score || localPlayer.score,
            availableTokens:
              backendPlayer.availableTokens || localPlayer.availableTokens,
          };
        }

        return localPlayer;
      });

      return { players: updatedPlayers };
    });
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

  // ─── nextTurn ──────────────────────────────────────────────────────────────
  // FIX FREEZE: ya no se resetea isFrozen de todos en cada turno.
  // Si el siguiente jugador está congelado → se le salta el turno y se consume
  // su freeze (isFrozen: false). El ❄️ visual se mantendrá hasta que el set()
  // lo quite al consumirlo.
  nextTurn: () => {
    const { players, currentTurn } = get();

    let nextTurnIndex = (currentTurn + 1) % players.length;
    let skippedPlayerId: string | null = null;

    // ❄️ ¿El próximo jugador está congelado? Saltarlo una vez.
    const candidatePlayer = players[nextTurnIndex];
    if (candidatePlayer?.isFrozen) {
      skippedPlayerId = candidatePlayer.id;
      console.log(`❄️ ${candidatePlayer.name} está FROZEN — turno saltado`);
      // Avanzar al siguiente jugador después del congelado
      nextTurnIndex = (nextTurnIndex + 1) % players.length;
    }

    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === nextTurnIndex,
      // Solo se consume el freeze del jugador que fue saltado
      isFrozen: player.id === skippedPlayerId ? false : player.isFrozen,
      frozenForRound:
        player.id === skippedPlayerId ? null : player.frozenForRound,
      // Limpiar flags de ronda
      isImmune: player.isImmune && Math.random() > 0.5,
      peekUsed: false,
      currentBet: 0,
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

    const nextPlayer = updatedPlayers[nextTurnIndex];
    if (skippedPlayerId) {
      const skipped = players.find((p) => p.id === skippedPlayerId);
      console.log(
        `❄️ Turno saltado: ${skipped?.name} → ahora juega ${nextPlayer?.name}`,
      );
    } else {
      console.log(`➡️ Next turn: ${nextPlayer?.name}`);
    }

    get().decrementAllianceRounds();
    get().clearStopBlast();
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
});
