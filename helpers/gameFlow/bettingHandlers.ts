// gameFlow/bettingHandlers.ts
import { BETTING_TIME_LIMIT } from '@/constants/Betting';
import { GameFlow } from './types';

export const createBettingHandler = (
  setFlowState: React.Dispatch<React.SetStateAction<GameFlow>>
) => {
  let bettingTimerRef: NodeJS.Timeout | null = null;

  const startBettingTimer = () => {
    // Limpiar timer anterior
    if (bettingTimerRef) {
      clearInterval(bettingTimerRef);
    }

    let timeLeft = BETTING_TIME_LIMIT;

    bettingTimerRef = setInterval(() => {
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
  };

  const endBettingPhase = () => {
    if (bettingTimerRef) {
      clearInterval(bettingTimerRef);
      bettingTimerRef = null;
    }

    setFlowState((prev) => ({
      ...prev,
      phase: 'question',
      bettingPhase: false,
      bettingTimeLeft: 0,
    }));

    console.log(`🎰 Betting phase ended`);
  };

  const cleanupBettingTimer = () => {
    if (bettingTimerRef) {
      clearInterval(bettingTimerRef);
      bettingTimerRef = null;
    }
  };

  return {
    startBettingTimer,
    endBettingPhase,
    cleanupBettingTimer,
    getTimerRef: () => bettingTimerRef,
  };
};
