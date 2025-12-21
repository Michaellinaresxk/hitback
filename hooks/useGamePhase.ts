import { useGameStore } from '@/store/gameStore';
import { useGameFlow } from '@/hooks/useGameFlow';

export const useGamePhase = () => {
  const { players, gamePot } = useGameStore();
  const { flowState, getBettingStatus, getCurrentPhase, canStartNextRound } =
    useGameFlow();

  const currentPlayer = players.find((p) => p.isCurrentTurn);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const bettingStatus = getBettingStatus();
  const currentPhase = getCurrentPhase();

  return {
    currentPlayer,
    sortedPlayers,
    gamePot,
    bettingStatus,
    currentPhase,
    canStartNextRound: canStartNextRound(),
    flowState,
  };
};
