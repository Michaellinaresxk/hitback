import { StateCreator } from 'zustand';

import { audioService } from '@/services/audioService';
import {
  SPEED_ROUND_TIME_LIMIT,
  CURRENT_SPEED_ROUND_INDEX,
} from '@/constants/SpeedRound';
import { GAME_DURATION } from '@/constants/Game';
import { generateRoute } from '@/utils/worldtourUtils';
import { BoardTile } from '@/types/worldTour.types';
import type { BackstageCard, PlayMode } from '@/types/backstage.types';
import type { GameSession } from '@/services/GameSessionService';
import type { GameStore, Player } from '../types/gameStoreTypes';

export const createGameSlice = ((set, get, ..._rest) => ({
  id: '',
  currentTurn: 0,
  worldTourRoutes: null as Record<string, BoardTile[]> | null,
  playMode: null as PlayMode | null,
  backstageInterval: null as number | null,
  pendingBackstageCard: null as BackstageCard | null,
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
      playMode: null,
      backstageInterval: null,
      pendingBackstageCard: null,
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

  startGame: async (
    routesOrOptions?:
      | Record<string, BoardTile[]>
      | {
          routes?: Record<string, BoardTile[]>;
          playMode?: PlayMode;
          backstageInterval?: number;
        },
  ) => {
    const options =
      routesOrOptions &&
      typeof routesOrOptions === 'object' &&
      !Array.isArray(routesOrOptions) &&
      ('routes' in routesOrOptions ||
        'playMode' in routesOrOptions ||
        'backstageInterval' in routesOrOptions)
        ? (routesOrOptions as {
            routes?: Record<string, BoardTile[]>;
            playMode?: PlayMode;
            backstageInterval?: number;
          })
        : {
            routes: routesOrOptions as Record<string, BoardTile[]> | undefined,
          };
    const initialRoutes = options.routes;
    const playMode = options.playMode ?? null;
    const backstageInterval =
      playMode === 'digital' ? options.backstageInterval ?? 3 : null;
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

      const route =
        initialRoutes ??
        Object.fromEntries(
          updatedPlayers.map((player) => [player.id, generateRoute()]),
        );

      set({
        players: updatedPlayers,
        worldTourRoutes: route,
        playMode,
        backstageInterval,
        pendingBackstageCard: null,
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

  restoreGame: async (session: GameSession) => {
    if (!session.worldTourRoutes) {
      throw new Error('La sesión no contiene rutas recuperables de World Tour');
    }

    await audioService.initializeAudio();
    const restoredPlayers: Player[] = session.players.map(
      (backendPlayer, index) => {
        const effects = backendPlayer.effects || {};
        return {
          id: `restored_${index + 1}`,
          name: backendPlayer.name,
          score: backendPlayer.score,
          correctAnswers: backendPlayer.stats?.correctAnswers ?? 0,
          isCurrentTurn: false,
          availableTokens: [...backendPlayer.availableTokens],
          powerCards: backendPlayer.powerCards ?? [],
          currentBet: 0,
          isImmune: false,
          boostActive: false,
          peekUsed: false,
          consecutiveWins: 0,
          cardTypeStreaks: {},
          difficultyStreaks: {},
          isFrozen: Boolean(effects.isFrozen),
          boardPosition: backendPlayer.boardPosition,
          frozenForRound: effects.frozenForRound ?? null,
          artistHoldRoundsLeft: Math.max(0, Number(effects.frozenRoundsLeft) || 0),
          lossStreak: Math.max(0, Number(effects.lossStreak) || 0),
          bSideActive: Boolean(effects.bSideActive),
        };
      },
    );

    const backendIdToLocal = new Map(
      session.players.map((p, i) => [p.id, `restored_${i + 1}`]),
    );

    const restoredRoutes = Object.fromEntries(
      session.players.map((backendPlayer, index) => {
        const route = session.worldTourRoutes?.[backendPlayer.id];
        if (!route || route.length !== 22) {
          throw new Error(`La ruta de ${backendPlayer.name} está incompleta`);
        }
        return [`restored_${index + 1}`, route];
      }),
    );

    const restoredAlliances = (session.alliances || [])
      .filter((a: any) => a.status === 'active' && a.roundsLeft > 0)
      .map((a: any) => ({
        id: a.id,
        player1Id: backendIdToLocal.get(a.player1Id) || a.player1Id,
        player2Id: backendIdToLocal.get(a.player2Id) || a.player2Id,
        roundsLeft: a.roundsLeft,
        createdAtRound: a.createdAtRound,
      }));

    const activeEffects = (session.activeEffects || []).filter((e: any) => e.status === 'active');
    const stopBlast = activeEffects.find((e: any) => e.type === 'STOP_BLAST');
    const duel = activeEffects.find((e: any) => e.type === 'DUEL');
    const featuring = activeEffects.find((e: any) => e.type === 'FEATURING');

    const isPlaying = session.status === 'playing';
    const configuredDuration =
      session.config.timeLimit || session.timeRemaining || 0;
    const elapsedSeconds = session.startedAt
      ? Math.max(
          0,
          Math.floor((Date.now() - Date.parse(session.startedAt)) / 1000),
        )
      : 0;
    const remainingSeconds = Math.max(0, configuredDuration - elapsedSeconds);

    set({
      id: session.id,
      players: restoredPlayers,
      worldTourRoutes: restoredRoutes,
      playMode: (session.config?.playMode as PlayMode) || 'physical',
      backstageInterval:
        session.config?.playMode === 'digital'
          ? session.config.backstageInterval ?? 3
          : null,
      pendingBackstageCard: session.backstageCard ?? null,
      alliances: restoredAlliances,
      isActive: isPlaying,
      currentTurn: 0,
      timeLeft: remainingSeconds,
      round: Math.max(1, session.round),
      gameMode: 'normal',
      currentCard: null,
      isScanning: false,
      error: null,
      showQuestion: false,
      showAnswer: false,
      showGameEndModal: session.status === 'finished',
      backendConnected: true,
      doublePlatinumActive: Boolean(session.doublePlatinumActive),
      stopBlastActive: Boolean(stopBlast),
      stopBlastHolderId: stopBlast ? (backendIdToLocal.get(stopBlast.sourcePlayerId) || stopBlast.sourcePlayerId) : null,
      duelActive: Boolean(duel),
      duelPlayer1Id: duel ? (backendIdToLocal.get(duel.targetPlayerIds?.[0]) || duel.targetPlayerIds?.[0] || null) : null,
      duelPlayer2Id: duel ? (backendIdToLocal.get(duel.targetPlayerIds?.[1]) || duel.targetPlayerIds?.[1] || null) : null,
      featuringPlayerId: featuring ? (backendIdToLocal.get(featuring.sourcePlayerId) || featuring.sourcePlayerId) : null,
      featuringTargetId: featuring ? (backendIdToLocal.get(featuring.targetPlayerIds?.[0]) || featuring.targetPlayerIds?.[0] || null) : null,
    });

    if (isPlaying && remainingSeconds > 0) {
      get().startTimer(remainingSeconds);
    } else if (isPlaying && configuredDuration > 0) {
      await get().endGame();
    }
  },

  setGameActive: (active: boolean) => {
    set({ isActive: active });
  },

  endGame: async () => {
    try {
      await audioService.stopAudio();
    } catch (error) {
      console.warn('⚠️ Error stopping audio during endGame:', error);
    }
    get().stopTimer();

    const { players } = get();
    if (players.length === 0) {
      set({ isActive: false, showGameEndModal: true });
      return;
    }
    const winner = players.reduce((max, player) =>
      player.score > max.score ||
      (player.score === max.score && player.boardPosition > max.boardPosition)
        ? player
        : max,
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

    // Los efectos de ronda (freeze, STOP-BLAST, DUEL) son canónicos en el
    // backend. No se decrementan ni se limpian aquí: hydrateActiveEffects los
    // sincroniza con cada respuesta del servidor.
    const updatedPlayers = players.map((player) => ({
      ...player,
      peekUsed: false as const,
      currentBet: 0,
    }));

    set({
      players: updatedPlayers,
      currentCard: null,
      round: get().round + 1,
      audioFinished: false,
      showQuestion: false,
      showAnswer: false,
    });

    get().decrementAllianceRounds();

    console.log(`➡️ Round advanced — todos los jugadores pueden responder`);
  },

  hydrateActiveEffects: (activeEffects = [], backendPlayers = []) => {
    const live = (Array.isArray(activeEffects) ? activeEffects : []).filter(
      (effect: any) => effect.status === 'active',
    );
    const stopBlast = live.find((effect: any) => effect.type === 'STOP_BLAST');
    const duel = live.find((effect: any) => effect.type === 'DUEL');
    const featuring = live.find((effect: any) => effect.type === 'FEATURING');

    const toLocalId = (backendId?: string | null) => {
      if (!backendId) return null;
      const backendPlayer = backendPlayers.find((p: any) => p.id === backendId);
      if (!backendPlayer) return backendId;
      const local = get().players.find(
        (p) =>
          p.name.trim().toLowerCase() ===
          String(backendPlayer.name).trim().toLowerCase(),
      );
      return local?.id ?? backendId;
    };

    set({
      stopBlastActive: Boolean(stopBlast),
      stopBlastHolderId: stopBlast ? toLocalId(stopBlast.sourcePlayerId) : null,
      duelActive: Boolean(duel),
      duelPlayer1Id: duel ? toLocalId(duel.targetPlayerIds?.[0]) : null,
      duelPlayer2Id: duel ? toLocalId(duel.targetPlayerIds?.[1]) : null,
      featuringPlayerId: featuring ? toLocalId(featuring.sourcePlayerId) : null,
      featuringTargetId: featuring
        ? toLocalId(featuring.targetPlayerIds?.[0])
        : null,
    });

    if (backendPlayers.length) get().syncPlayersFromBackend(backendPlayers);
  },

  startTimer: (duration: number) => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);

    set({ timeLeft: duration });

    const newInterval: ReturnType<typeof setInterval> = setInterval(() => {
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

  setPendingBackstageCard: (card: BackstageCard | null) => {
    set({ pendingBackstageCard: card });
  },

  setGameDuration: (minutes: number) => {
    set({ gameDurationMinutes: minutes });
  },
})) satisfies StateCreator<GameStore, [], [], Partial<GameStore>>;
