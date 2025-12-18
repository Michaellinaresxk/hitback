// Usa gameSessionService para comunicarse con backend
// SINCRONIZA CON gameStore para actualizar puntos
// Maneja fases: idle loading audio betting â†’ question answer

import { useCallback, useEffect, useRef, useState } from 'react';

import { BETTING_TIME_LIMIT } from '@/constants/Betting';
import {
  CurrentRound,
  gameSessionService,
  RoundResult,
} from '@/services/GameSessionService';
import { useGameStore } from '@/store/gameStore';

export type GamePhase =
  | 'idle'
  | 'loading'
  | 'audio'
  | 'betting'
  | 'question'
  | 'answer';

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

  // âœ… NUEVO: Respuesta correcta para mostrar en modal
  correctAnswer: string | null;
  trackInfo: { title: string; artist: string } | null;

  // Errores
  currentError: string | null;

  // Game over
  gameOver: boolean;
  gameWinner: { id: string; name: string; score: number } | null;
  showReward: boolean;
}

// Estado inicial
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
};

export const useGameFlow = () => {
  const [flowState, setFlowState] = useState<GameFlow>(initialState);
  const bettingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Conectar con gameStore para sincronizar puntos
  const { players, endGame, setShowGameEndModal } = useGameStore();

  const [rewardData, setRewardData] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  /**
   * Obtiene la siguiente ronda del backend
   * âœ… Este es el mÃ©todo principal que reemplaza handleQRScan
   */
  const nextRound = useCallback(async (): Promise<boolean> => {
    console.log(`\nðŸŽµ useGameFlowV2.nextRound`);

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
        console.log(`Game Over! Winner: ${result.winner?.name}`);
        setFlowState((prev) => ({
          ...prev,
          phase: 'idle',
          isLoading: false,
          gameOver: true,
          gameWinner: result.winner || null,
        }));

        //Sincronizar con gameStore
        endGame();
        setShowGameEndModal(true);

        return true;
      }

      if (!result.round) {
        throw new Error('Ronda invÃ¡lida');
      }

      console.log(`Round ${result.round.number} received`);
      console.log(`   Question: ${result.round.question.type}`);
      console.log(`   Audio: ${result.round.track.audioUrl ? 'âœ…' : 'âŒ'}`);

      if (!result.round.track.audioUrl) {
        console.warn(
          ` No audio URL for this track - Deezer may not have found it`
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
        audioPlaying: !!result.round!.track.audioUrl, // Solo si hay URL
        audioUrl: result.round!.track.audioUrl || null,
      }));

      // Si no hay audio, saltar directamente a betting
      if (!result.round.track.audioUrl) {
        console.log(`â­ï¸ No audio, skipping to betting phase`);
        setTimeout(() => {
          handleAudioFinished();
        }, 1000);
      }

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error(`âŒ nextRound failed: ${errorMessage}`);

      setFlowState((prev) => ({
        ...prev,
        phase: 'idle',
        isLoading: false,
        currentError: errorMessage,
      }));

      return false;
    }
  }, [endGame, setShowGameEndModal]);

  // AUDIO TERMINADO

  /**
   * Llamado cuando termina el audio
   * Inicia la fase de apuestas
   */
  const handleAudioFinished = useCallback(() => {
    console.log(`ðŸŽµ Audio finished, starting betting phase`);

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

  // TIMER DE APUESTAS

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
        console.log(`â° Betting time expired`);
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

    console.log(`Betting phase ended`);
  }, []);

  // REVELAR RESPUESTA

  /**
   * Revela la respuesta y asigna puntos al ganador
   * ACTUALIZADO: Guarda la respuesta correcta y trackInfo
   */
  // ✅ NUEVO: Función para sincronizar players del backend con el store
  const syncPlayersWithStore = useCallback(
    (
      backendPlayers: Array<{
        id: string;
        name: string;
        score: number;
        tokens: number;
      }>
    ) => {
      console.log(`📊 Syncing ${backendPlayers.length} players with store`);

      useGameStore.setState((state) => ({
        players: state.players.map((localPlayer, index) => {
          // Buscar jugador correspondiente en backend por índice (player_1, player_2, etc.)
          const backendPlayerId = `player_${index + 1}`;
          const backendPlayer = backendPlayers.find(
            (bp) => bp.id === backendPlayerId
          );

          if (backendPlayer) {
            console.log(
              `   → ${localPlayer.name}: score ${localPlayer.score}→${backendPlayer.score}, tokens ${localPlayer.tokens}→${backendPlayer.tokens}`
            );
            return {
              ...localPlayer,
              score: backendPlayer.score,
              tokens: backendPlayer.tokens,
            };
          }
          return localPlayer;
        }),
      }));
    },
    []
  );

  const revealAnswer = useCallback(
    async (winnerId: string | null): Promise<RoundResult | null> => {
      console.log(`✅ Revealing answer, winner: ${winnerId || 'none'}`);

      // Terminar apuestas si aÃºn estÃ¡n activas
      endBettingPhase();

      try {
        const result = await gameSessionService.revealAnswer(winnerId);

        if (!result.success) {
          throw new Error(result.error || 'Error revelando respuesta');
        }

        const roundResult = result.results;

        // âœ… NUEVO: Guardar respuesta correcta y track info
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

        console.log(`   Correct: ${roundResult.correctAnswer}`);
        console.log(
          `   Track: ${roundResult.trackInfo.title} - ${roundResult.trackInfo.artist}`
        );

        // ✅ Sincronizar players del backend con el store
        if (result.players && Array.isArray(result.players)) {
          syncPlayersWithStore(result.players);
        }

        // Si hay game over, actualizar gameStore
        if (roundResult.gameOver && roundResult.gameWinner) {
          console.log(
            `ðŸ† Game Over detected! Winner: ${roundResult.gameWinner.name}`
          );
          endGame();
          setShowGameEndModal(true);
        }

        return roundResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        console.error(`âŒ revealAnswer failed: ${errorMessage}`);

        setFlowState((prev) => ({
          ...prev,
          currentError: errorMessage,
        }));

        return null;
      }
    },
    [endBettingPhase, endGame, setShowGameEndModal, syncPlayersWithStore]
  );

  /**
   * Registra una apuesta en el backend
   */
  const placeBet = useCallback(
    async (
      playerId: string,
      tokens: number
    ): Promise<{ success: boolean; multiplier: number }> => {
      console.log(`ðŸŽ° Placing bet: ${playerId} -> ${tokens} tokens`);

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
        console.error(`âŒ placeBet failed:`, error);
        return { success: false, multiplier: 1 };
      }
    },
    []
  );

  /**
   * âœ… NUEVO: Sincroniza los puntos del backend con el gameStore local
   */
  const syncPlayersFromBackend = useCallback(async () => {
    try {
      const status = await gameSessionService.getStatus();
      if (status.success && status.session) {
        // Los puntos ya vienen del backend, podrÃ­amos actualizar el store
        console.log(`ðŸ“Š Backend session status:`, status.session.players);
        return status.session.players;
      }
    } catch (error) {
      console.error(`âŒ Failed to sync players:`, error);
    }
    return null;
  }, []);

  // RESET PARA SIGUIENTE RONDA

  /**
   * Prepara el estado para la siguiente ronda
   */
  const prepareNextRound = useCallback(() => {
    console.log(`ðŸ”„ Preparing for next round`);

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
    }));
  }, []);

  /**
   * Reset completo del flujo
   */
  const resetFlow = useCallback(() => {
    console.log(`ðŸ”„ Resetting game flow completely`);

    // Limpiar timers
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
      bettingTimerRef.current = null;
    }

    setFlowState(initialState);
  }, []);

  // HELPERS Y GETTERS

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

  // âœ… NUEVO: Getter para la respuesta correcta
  const getCorrectAnswer = useCallback(() => {
    return {
      answer: flowState.correctAnswer,
      trackInfo: flowState.trackInfo,
    };
  }, [flowState.correctAnswer, flowState.trackInfo]);

  // ✅ Getter for reward data
  const getRewardData = useCallback(() => {
    return rewardData;
  }, [rewardData]);

  // ✅ Close reward notification
  const closeRewardNotification = useCallback(() => {
    setRewardData({ show: false, data: null });
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    return gameSessionService.testConnection();
  }, []);

  // CLEANUP

  useEffect(() => {
    return () => {
      if (bettingTimerRef.current) {
        clearInterval(bettingTimerRef.current);
      }
    };
  }, []);

  // RETURN

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
    getRewardData, // ✅ ADD THIS

    // Sync
    syncPlayersFromBackend,
    syncPlayersWithStore,

    // Utils
    testConnection,
    closeRewardNotification, // ✅ ADD THIS
  };
};
