import { useRef, useCallback } from 'react';

interface UseGameTurnActionsParams {
  nextTurn: () => void;
  prepareNextRound: () => void;
}

/**
 * Gestiona el avance de turno con protección contra ejecuciones duplicadas.
 * Centraliza los refs de procesamiento que comparten useComboFlow y usePointsActions.
 */
export function useGameTurnActions({ nextTurn, prepareNextRound }: UseGameTurnActionsParams) {
  const isAdvancingTurnRef = useRef(false);
  const isPowerCardProcessingRef = useRef(false);

  const advanceToNextTurn = useCallback(() => {
    if (isAdvancingTurnRef.current) {
      console.log('⏳ Already advancing turn, skipping');
      return;
    }
    isAdvancingTurnRef.current = true;
    console.log('🔄 Advancing to next turn');

    setTimeout(() => {
      nextTurn();
      prepareNextRound();
      setTimeout(() => {
        isAdvancingTurnRef.current = false;
        console.log('✅ Turn advance complete');
      }, 100);
    }, 50);
  }, [nextTurn, prepareNextRound]);

  /** Resetea ambos refs — llamado cuando el combo flow toma el control. */
  const resetProcessingRefs = useCallback(() => {
    isPowerCardProcessingRef.current = false;
    isAdvancingTurnRef.current = false;
  }, []);

  return {
    advanceToNextTurn,
    resetProcessingRefs,
    isPowerCardProcessingRef,
    isAdvancingTurnRef,
  };
}
