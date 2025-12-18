// hooks/useGameFlow.ts - HITBACK Game Flow Hook
// ✅ CORREGIDO: Sincronización de puntos entre backend y frontend
// ✅ AÑADIDO: getRewardData y closeRewardNotification
// ✅ MEJORADO: Logging para debug

import { useCallback, useEffect, useRef, useState } from 'react';

import { BETTING_TIME_LIMIT } from '@/constants/Betting';
import {
  CurrentRound,
  gameSessionService,
  RoundResult,
} from '@/services/GameSessionService';
import { useGameStore } from '@/store/gameStore';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export type GamePhase =
  | 'idle'
  | 'loading'
  | 'audio'
  | 'betting'
  | 'question'
  | 'answer';

export interface RewardData {
  type: 'tokens' | 'powerCard' | 'combo' | 'achievement';
  amount?: number;
  name?: string;
  description?: string;
  icon?: string;
}

export interface GameFlow {
  // Fases del juego
  phase: GamePhase;
  isLoading: boolean;

  // Ronda actual
  currentRound: CurrentRound | null;

  // Audio
  audioPlaying: boolean;
  audioUrl: string | null;

  // Betting
  bettingPhase: boolean;
  bettingTimeLeft: number;

  // Pregunta y respuesta
  questionVisible: boolean;
  answerRevealed: boolean;
  roundResult: RoundResult | null;

  // Respuesta correcta para mostrar en modal
  correctAnswer: string | null;
  trackInfo: { title: string; artist: string } | null;

  // Errores
  currentError: string | null;

  // Game over
  gameOver: boolean;
  gameWinner: { id: string; name: string; score: number } | null;

  // Rewards
  showReward: boolean;
  rewardData: RewardData | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTADO INICIAL
// ═══════════════════════════════════════════════════════════════════════════

const initialState: GameFlow = {
  phase: 'idle',
  isLoading: false,
  currentRound: null,
  audioPlaying: false,
  audioUrl: null,
  bettingPhase: false,
  bettingTimeLeft: BETTING_TIME_LIMIT,
  questionVisible: false,
  answerRevealed: false,
  roundResult: null,
  correctAnswer: null,
  trackInfo: null,
  currentError: null,
  gameOver: false,
  gameWinner: null,
  showReward: false,
  rewardData: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const useGameFlow = () => {
  const [flowState, setFlowState] = useState<GameFlow>(initialState);
  const bettingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Conectar con gameStore para sincronizar puntos
  const { players, endGame, setShowGameEndModal } = useGameStore();

  // ═══════════════════════════════════════════════════════════════════════════
  // SINCRONIZACIÓN DE PLAYERS (CORREGIDO)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * ✅ CORREGIDO: Sincroniza players del backend con el store local
   * Usa ÍNDICE directo en lugar de buscar por ID (más confiable)
   */
  const syncPlayersWithStore = useCallback(
    (
      backendPlayers: Array<{
        id: string;
        name: string;
        score: number;
        tokens: number;
      }>
    ) => {
      console.log(`\n📊 ═══ SYNC PLAYERS START ═══`);
      console.log(`📊 Backend players received: ${backendPlayers.length}`);
      console.log(`📊 Backend data:`, JSON.stringify(backendPlayers, null, 2));

      useGameStore.setState((state) => {
        console.log(`📊 Local players count: ${state.players.length}`);

        const updatedPlayers = state.players.map((localPlayer, index) => {
          // ✅ CORREGIDO: Sincronizar directamente por ÍNDICE
          // El backend mantiene el mismo orden que el frontend
          const backendPlayer = backendPlayers[index];

          if (backendPlayer) {
            const scoreChanged = localPlayer.score !== backendPlayer.score;
            const tokensChanged = localPlayer.tokens !== backendPlayer.tokens;

            if (scoreChanged || tokensChanged) {
              console.log(
                `   ✅ ${localPlayer.name} [${index}]: ` +
                  `score ${localPlayer.score}→${backendPlayer.score}, ` +
                  `tokens ${localPlayer.tokens}→${backendPlayer.tokens}`
              );
            } else {
              console.log(`   ℹ️ ${localPlayer.name} [${index}]: sin cambios`);
            }

            return {
              ...localPlayer,
              score: backendPlayer.score,
              tokens: backendPlayer.tokens,
            };
          }

          console.log(
            `   ⚠️ No backend data for index ${index} (${localPlayer.name})`
          );
          return localPlayer;
        });

        console.log(`📊 ═══ SYNC PLAYERS END ═══\n`);

        return { players: updatedPlayers };
      });
    },
    []
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGUIENTE RONDA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene la siguiente ronda del backend
   * Este es el método principal que reemplaza handleQRScan
   */
  const nextRound = useCallback(async (): Promise<boolean> => {
    console.log(`\n🎵 ═══ NEXT ROUND START ═══`);

    try {
      // Actualizar estado: cargando
      setFlowState((prev) => ({
        ...prev,
        phase: 'loading',
        isLoading: true,
        currentError: null,
        currentRound: null,
        audioPlaying: false,
        audioUrl: null,
        questionVisible: false,
        answerRevealed: false,
        roundResult: null,
        correctAnswer: null,
        trackInfo: null,
        bettingPhase: false,
        bettingTimeLeft: BETTING_TIME_LIMIT,
        showReward: false,
        rewardData: null,
      }));

      // Llamar al backend
      const result = await gameSessionService.nextRound();

      if (!result.success) {
        throw new Error(
          result.error || 'No se pudo obtener la siguiente ronda'
        );
      }

      // Verificar game over
      if (result.gameOver) {
        console.log(`🏆 Game Over! Winner: ${result.winner?.name}`);
        setFlowState((prev) => ({
          ...prev,
          phase: 'idle',
          isLoading: false,
          gameOver: true,
          gameWinner: result.winner || null,
        }));

        // Sincronizar con gameStore
        endGame();
        setShowGameEndModal(true);

        return true;
      }

      if (!result.round) {
        throw new Error('Ronda inválida');
      }

      console.log(`🎵 Round ${result.round.number} received`);
      console.log(`   Question: ${result.round.question.type}`);
      console.log(`   Audio: ${result.round.track.audioUrl ? '✅' : '❌'}`);

      if (!result.round.track.audioUrl) {
        console.warn(
          `⚠️ No audio URL for this track - Deezer may not have found it`
        );
      }

      // Actualizar estado: audio playing
      setFlowState((prev) => ({
        ...prev,
        phase: 'audio',
        isLoading: false,
        currentRound: {
          number: result.round!.number,
          track: result.round!.track,
          question: result.round!.question,
        },
        audioPlaying: !!result.round!.track.audioUrl,
        audioUrl: result.round!.track.audioUrl || null,
      }));

      // Si no hay audio, saltar directamente a betting
      if (!result.round.track.audioUrl) {
        console.log(`⏭️ No audio, skipping to betting phase`);
        setTimeout(() => {
          handleAudioFinished();
        }, 1000);
      }

      console.log(`🎵 ═══ NEXT ROUND END ═══\n`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ nextRound failed: ${errorMessage}`);

      setFlowState((prev) => ({
        ...prev,
        phase: 'idle',
        isLoading: false,
        currentError: errorMessage,
      }));

      return false;
    }
  }, [endGame, setShowGameEndModal]);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO TERMINADO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Llamado cuando termina el audio
   * Inicia la fase de apuestas
   */
  const handleAudioFinished = useCallback(() => {
    console.log(`🎵 Audio finished, starting betting phase`);

    setFlowState((prev) => ({
      ...prev,
      phase: 'betting',
      audioPlaying: false,
      bettingPhase: true,
      bettingTimeLeft: BETTING_TIME_LIMIT,
      questionVisible: true,
    }));

    // Iniciar timer de apuestas
    startBettingTimer();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMER DE APUESTAS
  // ═══════════════════════════════════════════════════════════════════════════

  const startBettingTimer = useCallback(() => {
    // Limpiar timer anterior
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
    }

    let timeLeft = BETTING_TIME_LIMIT;

    bettingTimerRef.current = setInterval(() => {
      timeLeft -= 1;

      setFlowState((prev) => ({
        ...prev,
        bettingTimeLeft: timeLeft,
      }));

      if (timeLeft <= 0) {
        console.log(`⏰ Betting time expired`);
        endBettingPhase();
      }
    }, 1000);
  }, []);

  /**
   * Termina la fase de apuestas manualmente o por timeout
   */
  const endBettingPhase = useCallback(() => {
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
      bettingTimerRef.current = null;
    }

    setFlowState((prev) => ({
      ...prev,
      phase: 'question',
      bettingPhase: false,
      bettingTimeLeft: 0,
    }));

    console.log(`🎰 Betting phase ended`);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // REVELAR RESPUESTA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Revela la respuesta y asigna puntos al ganador
   * ✅ CORREGIDO: Sincroniza correctamente los puntos
   */
  const revealAnswer = useCallback(
    async (winnerId: string | null): Promise<RoundResult | null> => {
      console.log(`\n✅ ═══ REVEAL ANSWER START ═══`);
      console.log(`✅ Winner ID: ${winnerId || 'none'}`);

      // Terminar apuestas si aún están activas
      endBettingPhase();

      try {
        const result = await gameSessionService.revealAnswer(winnerId);

        console.log(`✅ Backend response:`, JSON.stringify(result, null, 2));

        if (!result.success) {
          throw new Error(result.error || 'Error revelando respuesta');
        }

        const roundResult = result.results;

        // Guardar respuesta correcta y track info
        setFlowState((prev) => ({
          ...prev,
          phase: 'answer',
          answerRevealed: true,
          roundResult: roundResult,
          correctAnswer: roundResult.correctAnswer,
          trackInfo: roundResult.trackInfo,
          gameOver: roundResult.gameOver || false,
          gameWinner: roundResult.gameWinner || null,
        }));

        console.log(`✅ Correct answer: ${roundResult.correctAnswer}`);
        console.log(
          `✅ Track: ${roundResult.trackInfo.title} - ${roundResult.trackInfo.artist}`
        );
        console.log(`✅ Points awarded: ${roundResult.pointsAwarded}`);

        // ✅ CRÍTICO: Sincronizar players del backend con el store
        if (result.players && Array.isArray(result.players)) {
          console.log(`✅ Syncing ${result.players.length} players...`);
          syncPlayersWithStore(result.players);
        } else {
          console.warn(`⚠️ No players array in response!`);
          console.warn(`⚠️ result.players:`, result.players);
        }

        // Si hay game over, actualizar gameStore
        if (roundResult.gameOver && roundResult.gameWinner) {
          console.log(
            `🏆 Game Over detected! Winner: ${roundResult.gameWinner.name}`
          );
          endGame();
          setShowGameEndModal(true);
        }

        // Mostrar recompensa si hay puntos
        if (roundResult.pointsAwarded > 0 && winnerId) {
          setFlowState((prev) => ({
            ...prev,
            showReward: true,
            rewardData: {
              type: 'tokens',
              amount: roundResult.pointsAwarded,
              name: 'Puntos Ganados',
              description: `¡Has ganado ${roundResult.pointsAwarded} puntos!`,
              icon: '🏆',
            },
          }));
        }

        console.log(`✅ ═══ REVEAL ANSWER END ═══\n`);
        return roundResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ revealAnswer failed: ${errorMessage}`);

        setFlowState((prev) => ({
          ...prev,
          currentError: errorMessage,
        }));

        return null;
      }
    },
    [endBettingPhase, endGame, setShowGameEndModal, syncPlayersWithStore]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // APUESTAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Registra una apuesta en el backend
   */
  const placeBet = useCallback(
    async (
      playerId: string,
      tokens: number
    ): Promise<{ success: boolean; multiplier: number }> => {
      console.log(`🎰 Placing bet: ${playerId} -> ${tokens} tokens`);

      try {
        const result = await gameSessionService.placeBet(playerId, tokens);

        if (!result.success) {
          throw new Error(result.error || 'Error registrando apuesta');
        }

        console.log(`   Multiplier: ${result.bet.multiplier}x`);

        return {
          success: true,
          multiplier: result.bet.multiplier,
        };
      } catch (error) {
        console.error(`❌ placeBet failed:`, error);
        return { success: false, multiplier: 1 };
      }
    },
    []
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC CON BACKEND
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sincroniza los puntos del backend con el gameStore local
   * Útil para refrescar el estado manualmente
   */
  const syncPlayersFromBackend = useCallback(async () => {
    try {
      console.log(`🔄 Fetching players from backend...`);
      const status = await gameSessionService.getStatus();

      if (status.success && status.session) {
        console.log(`🔄 Backend session status:`, status.session.players);

        // Sincronizar con el store
        if (status.session.players && Array.isArray(status.session.players)) {
          syncPlayersWithStore(status.session.players);
        }

        return status.session.players;
      }
    } catch (error) {
      console.error(`❌ Failed to sync players:`, error);
    }
    return null;
  }, [syncPlayersWithStore]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET Y PREPARACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Prepara el estado para la siguiente ronda
   */
  const prepareNextRound = useCallback(() => {
    console.log(`🔄 Preparing for next round`);

    // Limpiar timers
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
      bettingTimerRef.current = null;
    }

    setFlowState((prev) => ({
      ...prev,
      phase: 'idle',
      currentRound: null,
      audioPlaying: false,
      audioUrl: null,
      bettingPhase: false,
      bettingTimeLeft: BETTING_TIME_LIMIT,
      questionVisible: false,
      answerRevealed: false,
      roundResult: null,
      correctAnswer: null,
      trackInfo: null,
      currentError: null,
      showReward: false,
      rewardData: null,
    }));
  }, []);

  /**
   * Reset completo del flujo
   */
  const resetFlow = useCallback(() => {
    console.log(`🔄 Resetting game flow completely`);

    // Limpiar timers
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
      bettingTimerRef.current = null;
    }

    setFlowState(initialState);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS Y HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getBettingStatus = useCallback(() => {
    return {
      isActive: flowState.bettingPhase,
      timeLeft: flowState.bettingTimeLeft,
      canBet: flowState.bettingPhase && flowState.bettingTimeLeft > 0,
      urgentTime: flowState.bettingTimeLeft <= 10,
    };
  }, [flowState.bettingPhase, flowState.bettingTimeLeft]);

  const getCurrentPhase = useCallback((): GamePhase => {
    return flowState.phase;
  }, [flowState.phase]);

  const isRoundActive = useCallback(() => {
    return flowState.currentRound !== null;
  }, [flowState.currentRound]);

  const canStartNextRound = useCallback(() => {
    return (
      flowState.phase === 'idle' ||
      flowState.phase === 'answer' ||
      flowState.answerRevealed
    );
  }, [flowState.phase, flowState.answerRevealed]);

  /**
   * Getter para la respuesta correcta
   */
  const getCorrectAnswer = useCallback(() => {
    return {
      answer: flowState.correctAnswer,
      trackInfo: flowState.trackInfo,
    };
  }, [flowState.correctAnswer, flowState.trackInfo]);

  /**
   * ✅ AÑADIDO: Getter para reward data
   */
  const getRewardData = useCallback(() => {
    return {
      show: flowState.showReward,
      data: flowState.rewardData,
    };
  }, [flowState.showReward, flowState.rewardData]);

  /**
   * ✅ AÑADIDO: Cierra la notificación de recompensa
   */
  const closeRewardNotification = useCallback(() => {
    setFlowState((prev) => ({
      ...prev,
      showReward: false,
      rewardData: null,
    }));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST DE CONEXIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  const testConnection = useCallback(async (): Promise<boolean> => {
    return gameSessionService.testConnection();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    return () => {
      if (bettingTimerRef.current) {
        clearInterval(bettingTimerRef.current);
      }
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // Estado
    flowState,

    // Acciones principales
    nextRound,
    handleAudioFinished,
    revealAnswer,
    placeBet,

    // Control de fases
    endBettingPhase,
    prepareNextRound,
    resetFlow,

    // Getters
    getBettingStatus,
    getCurrentPhase,
    isRoundActive,
    canStartNextRound,
    getCorrectAnswer,
    getRewardData, // ✅ AÑADIDO
    closeRewardNotification, // ✅ AÑADIDO

    // Sync
    syncPlayersFromBackend,
    syncPlayersWithStore,

    // Utils
    testConnection,
  };
};
