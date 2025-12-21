// useGameFlow.ts (REFACTORIZADO)
import { useCallback, useEffect, useRef, useState } from 'react';

import { gameSessionService } from '@/services/GameSessionService';
import { useGameStore } from '@/store/gameStore';
import { GameFlow } from '@/helpers/gameFlow/types';
import {
  getAudioState,
  getLoadingState,
  initialState,
} from '@/helpers/gameFlow/state';
import { createSyncHandler } from '@/helpers/gameFlow/syncHandlers';
import { createBettingHandler } from '@/helpers/gameFlow/bettingHandlers';
import { createPhaseHandlers } from '@/helpers/gameFlow/phaseHandlers';
import {
  canStartNextRound,
  getBettingStatus,
  getCorrectAnswer,
  getCurrentPhase,
  getRewardData,
  isRoundActive,
} from '@/helpers/gameFlow/utils';

export const useGameFlow = () => {
  const [flowState, setFlowState] = useState<GameFlow>(initialState);
  const { players, endGame, setShowGameEndModal } = useGameStore();

  // Inicializar handlers con dependencias
  const { syncPlayersWithStore } = createSyncHandler();
  const bettingHandler = createBettingHandler(setFlowState);
  const phaseHandlers = createPhaseHandlers(setFlowState, {
    endGame,
    setShowGameEndModal,
    syncPlayersWithStore,
    endBettingPhase: bettingHandler.endBettingPhase,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGUIENTE RONDA
  // ═══════════════════════════════════════════════════════════════════════════

  const nextRound = useCallback(async (): Promise<boolean> => {
    console.log(`\n🎵 ═══ NEXT ROUND START ═══`);

    try {
      setFlowState((prev) => ({ ...prev, ...getLoadingState() }));

      const result = await gameSessionService.nextRound();

      if (!result.success) {
        throw new Error(
          result.error || 'No se pudo obtener la siguiente ronda'
        );
      }

      if (result.gameOver) {
        console.log(`🏆 Game Over! Winner: ${result.winner?.name}`);
        setFlowState((prev) => ({
          ...prev,
          phase: 'idle',
          isLoading: false,
          gameOver: true,
          gameWinner: result.winner || null,
        }));

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

      setFlowState((prev) => ({
        ...prev,
        ...getAudioState(result.round!, result.gameMasterData),
      }));

      if (!result.round.track.audioUrl) {
        console.log(`⏭️ No audio, skipping to betting phase`);
        setTimeout(() => {
          phaseHandlers.handleAudioFinished();
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
  // SYNC CON BACKEND
  // ═══════════════════════════════════════════════════════════════════════════

  const syncPlayersFromBackend = useCallback(async () => {
    try {
      console.log(`🔄 Fetching players from backend...`);
      const status = await gameSessionService.getStatus();

      if (status.success && status.session) {
        console.log(`🔄 Backend session status:`, status.session.players);

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

  const resetFlow = useCallback(() => {
    console.log(`🔄 Resetting game flow completely`);
    bettingHandler.cleanupBettingTimer();
    setFlowState(initialState);
  }, [bettingHandler]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS Y HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getBettingStatusCallback = useCallback(
    () => getBettingStatus(flowState),
    [flowState]
  );

  const getCurrentPhaseCallback = useCallback(
    () => getCurrentPhase(flowState),
    [flowState]
  );

  const isRoundActiveCallback = useCallback(
    () => isRoundActive(flowState),
    [flowState]
  );

  const canStartNextRoundCallback = useCallback(
    () => canStartNextRound(flowState),
    [flowState]
  );

  const getCorrectAnswerCallback = useCallback(
    () => getCorrectAnswer(flowState),
    [flowState]
  );

  const getRewardDataCallback = useCallback(
    () => getRewardData(flowState),
    [flowState]
  );

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
      bettingHandler.cleanupBettingTimer();
    };
  }, [bettingHandler]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // Estado
    flowState,

    // Acciones principales
    nextRound,
    handleAudioFinished: phaseHandlers.handleAudioFinished,
    revealAnswer: phaseHandlers.revealAnswer,
    placeBet: phaseHandlers.placeBet,

    // Control de fases
    endBettingPhase: bettingHandler.endBettingPhase,
    prepareNextRound: phaseHandlers.prepareNextRound,
    resetFlow,

    // Getters
    getBettingStatus: getBettingStatusCallback,
    getCurrentPhase: getCurrentPhaseCallback,
    isRoundActive: isRoundActiveCallback,
    canStartNextRound: canStartNextRoundCallback,
    getCorrectAnswer: getCorrectAnswerCallback,
    getRewardData: getRewardDataCallback,
    closeRewardNotification,

    // Sync
    syncPlayersFromBackend,
    syncPlayersWithStore,

    // Utils
    testConnection,
  };
};
