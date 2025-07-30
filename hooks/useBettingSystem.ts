// hooks/useBettingSystem.ts - 🎰 FIXED BETTING SYSTEM HOOK
import { useGameStore } from '@/store/gameStore';
import { useCallback, useMemo } from 'react';

interface BettingOption {
  amount: number;
  multiplier: number;
  potentialPoints: number;
}

export const useBettingSystem = () => {
  const { players, placeBet, currentCard } = useGameStore();

  // 💰 Get betting multiplier
  const getBettingMultiplier = useCallback((betAmount: number): number => {
    if (betAmount === 1) return 2;
    if (betAmount === 2) return 3;
    if (betAmount >= 3) return 4;
    return 1;
  }, []);

  // 🎯 Calculate potential points
  const calculatePotentialPoints = useCallback(
    (basePoints: number, betAmount: number): number => {
      return basePoints * getBettingMultiplier(betAmount);
    },
    [getBettingMultiplier]
  );

  // 🎲 Place bet for player
  const handlePlaceBet = useCallback(
    (playerId: string, amount: number) => {
      const player = players.find((p) => p.id === playerId);

      if (!player) {
        return { success: false, error: 'Jugador no encontrado' };
      }

      if (player.tokens < amount) {
        return { success: false, error: 'Tokens insuficientes' };
      }

      if (amount < 1 || amount > 3) {
        return { success: false, error: 'Apuesta debe ser 1-3 tokens' };
      }

      if (player.currentBet > 0) {
        return { success: false, error: 'Ya tienes una apuesta activa' };
      }

      placeBet(playerId, amount);
      return { success: true };
    },
    [players, placeBet]
  );

  // 📊 Get betting options for player
  const getBettingOptions = useCallback(
    (playerId: string): BettingOption[] => {
      const player = players.find((p) => p.id === playerId);
      const basePoints = currentCard?.points || 1;

      if (!player || player.currentBet > 0) return [];

      const options: BettingOption[] = [];
      const maxBet = Math.min(3, player.tokens);

      for (let amount = 1; amount <= maxBet; amount++) {
        const multiplier = getBettingMultiplier(amount);
        options.push({
          amount,
          multiplier,
          potentialPoints: calculatePotentialPoints(basePoints, amount),
        });
      }

      return options;
    },
    [players, currentCard, getBettingMultiplier, calculatePotentialPoints]
  );

  // 📈 Betting statistics
  const bettingStats = useMemo(() => {
    const activeBets = players.filter((p) => p.currentBet > 0);
    const totalTokensBet = activeBets.reduce((sum, p) => sum + p.currentBet, 0);
    const totalPotentialReward = activeBets.reduce((sum, p) => {
      const basePoints = currentCard?.points || 1;
      return sum + calculatePotentialPoints(basePoints, p.currentBet);
    }, 0);

    return {
      activeBets: activeBets.length,
      totalTokensBet,
      totalPotentialReward,
      playersWithBets: activeBets,
      hasActiveBets: activeBets.length > 0,
    };
  }, [players, currentCard, calculatePotentialPoints]);

  // ✅ Can player bet?
  const canPlayerBet = useCallback(
    (playerId: string, amount: number): boolean => {
      const player = players.find((p) => p.id === playerId);
      return !!(
        player &&
        player.tokens >= amount &&
        amount >= 1 &&
        amount <= 3 &&
        player.currentBet === 0
      );
    },
    [players]
  );

  // 🎯 Get player's current bet info
  const getPlayerBetInfo = useCallback(
    (playerId: string) => {
      const player = players.find((p) => p.id === playerId);
      if (!player || player.currentBet === 0) return null;

      const basePoints = currentCard?.points || 1;
      const multiplier = getBettingMultiplier(player.currentBet);

      return {
        amount: player.currentBet,
        multiplier,
        potentialPoints: calculatePotentialPoints(
          basePoints,
          player.currentBet
        ),
        tokensAtRisk: player.currentBet,
      };
    },
    [players, currentCard, getBettingMultiplier, calculatePotentialPoints]
  );

  return {
    // State
    bettingStats,

    // Actions
    handlePlaceBet,

    // Queries
    getBettingOptions,
    canPlayerBet,
    getPlayerBetInfo,
    getBettingMultiplier,
    calculatePotentialPoints,
  };
};
