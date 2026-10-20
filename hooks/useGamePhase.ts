import { useGameStore } from '@/store/gameStore';
import { useGameFlow } from '@/hooks/useGameFlow';

export const useGamePhase = () => {
  const { players, gamePot } = useGameStore();
  const { flowState, getBettingStatus, getCurrentPhase, canStartNextRound } =
    useGameFlow();

  // No turn order: all players can answer every question.
  // sortedPlayers is the canonical display order (by score).
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const bettingStatus = getBettingStatus();
  const currentPhase = getCurrentPhase();

  return {
    sortedPlayers,
    gamePot,
    bettingStatus,
    currentPhase,
    canStartNextRound: canStartNextRound(),
    flowState,
  };
};
