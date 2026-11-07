import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useFeedback } from '@/components/game/GameFeedback';
import { soundEffects } from '@/services/SoundEffectsService';

interface UseGameEffectsProps {
  checkBackendConnection: () => Promise<void>;
}

export const useGameEffects = ({
  checkBackendConnection,
}: UseGameEffectsProps) => {
  const { isActive, error, setError } =
    useGameStore();
  const { showError } = useFeedback();

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

};
