import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGameFlow } from '@/hooks/useGameFlow';
import { useFeedback } from '@/components/game/GameFeedback';
import { soundEffects } from '@/services/SoundEffectsService';

interface UseGameEffectsProps {
  checkBackendConnection: () => Promise<void>;
}

export const useGameEffects = ({
  checkBackendConnection,
}: UseGameEffectsProps) => {
  const { isActive, players, error, setError, setShowGameEndModal } =
    useGameStore();
  const { flowState, showError, showWarning } = useFeedback();
  const { getBettingStatus, getCurrentPhase } = useGameFlow();

  const bettingStatus = getBettingStatus();
  const currentPhase = getCurrentPhase();

  useEffect(() => {
    if (isActive) {
      checkBackendConnection();
      soundEffects.initialize();
    }
  }, [isActive]);

  useEffect(() => {
    if (error) {
      showError('Error', error);
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (flowState.currentError) {
      showWarning('Aviso', flowState.currentError);
    }
  }, [flowState.currentError]);

  // Game over handling
  useEffect(() => {
    if (flowState.gameOver && flowState.gameWinner) {
      soundEffects.playVictory();
      setShowGameEndModal(true);
    }
  }, [flowState.gameOver, flowState.gameWinner]);

  // Show points modal after betting phase ends
  useEffect(() => {
    if (
      flowState.questionVisible &&
      flowState.currentRound &&
      !bettingStatus.isActive &&
      currentPhase === 'question'
    ) {
      return true; // Indica que debe mostrar el modal
    }
    return false;
  }, [
    flowState.questionVisible,
    flowState.currentRound,
    bettingStatus.isActive,
    currentPhase,
  ]);
};
