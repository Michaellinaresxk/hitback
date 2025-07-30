// hooks/usePowerCards.ts - ⚡ FIXED POWER CARDS HOOK
import { useGameStore } from '@/store/gameStore';
import { canUsePowerCard } from '@/utils/gameHelpers';
import { useCallback, useMemo } from 'react';

export interface PowerCard {
  id: string;
  type: 'robo' | 'escudo' | 'boost' | 'refresh' | 'peek' | 'precision';
  name: string;
  description: string;
  emoji: string;
  usageLimit: number;
  currentUses: number;
}

export const usePowerCards = () => {
  const { players, usePowerCard, addPowerCardToPlayer } = useGameStore();

  // ⚡ Use power card
  const handleUsePowerCard = useCallback(
    (playerId: string, powerCardId: string, targetPlayerId?: string) => {
      const player = players.find((p) => p.id === playerId);
      const targetPlayer = targetPlayerId
        ? players.find((p) => p.id === targetPlayerId)
        : undefined;

      if (!player) {
        return { success: false, error: 'Jugador no encontrado' };
      }

      const powerCard = player.powerCards?.find((pc) => pc.id === powerCardId);
      if (!powerCard) {
        return { success: false, error: 'Carta de poder no encontrada' };
      }

      const validation = canUsePowerCard(player, powerCardId, targetPlayer);
      if (!validation.canUse) {
        return {
          success: false,
          error: validation.reason || 'No se puede usar',
        };
      }

      usePowerCard(playerId, powerCardId, targetPlayerId);
      return { success: true };
    },
    [players, usePowerCard]
  );

  // 🃏 Get available power cards for player
  const getAvailablePowerCards = useCallback(
    (playerId: string): PowerCard[] => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return [];

      return (player.powerCards || []).filter(
        (pc) => pc.currentUses < pc.usageLimit
      );
    },
    [players]
  );

  // 🎯 Can use specific power card
  const canUsePowerCardCheck = useCallback(
    (
      playerId: string,
      powerCardId: string,
      targetPlayerId?: string
    ): boolean => {
      const player = players.find((p) => p.id === playerId);
      const targetPlayer = targetPlayerId
        ? players.find((p) => p.id === targetPlayerId)
        : undefined;

      if (!player) return false;

      const validation = canUsePowerCard(player, powerCardId, targetPlayer);
      return validation.canUse;
    },
    [players]
  );

  // 📊 Power card statistics
  const powerStats = useMemo(() => {
    const totalPowerCards = players.reduce(
      (sum, p) => sum + (p.powerCards?.length || 0),
      0
    );

    const usedPowerCards = players.reduce(
      (sum, p) =>
        sum +
        (p.powerCards?.reduce((cardSum, pc) => cardSum + pc.currentUses, 0) ||
          0),
      0
    );

    const activePowers = players.reduce((sum, p) => {
      let active = 0;
      if (p.isImmune) active++;
      if (p.boostActive) active++;
      if (p.peekUsed) active++;
      return sum + active;
    }, 0);

    return {
      totalPowerCards,
      usedPowerCards,
      activePowers,
      availablePowerCards: totalPowerCards - usedPowerCards,
    };
  }, [players]);

  // 🎁 Generate random power card
  const generateRandomPowerCard = useCallback((): PowerCard => {
    const templates = [
      { type: 'robo', name: 'Ladrón Musical', emoji: '🥷', usageLimit: 2 },
      { type: 'escudo', name: 'Escudo Sónico', emoji: '🛡️', usageLimit: 1 },
      { type: 'boost', name: 'Amplificador', emoji: '⚡', usageLimit: 3 },
      {
        type: 'refresh',
        name: 'Segunda Oportunidad',
        emoji: '🔄',
        usageLimit: 2,
      },
      { type: 'peek', name: 'Spoiler', emoji: '👁️', usageLimit: 1 },
      {
        type: 'precision',
        name: 'Precisión Total',
        emoji: '🎯',
        usageLimit: 2,
      },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];

    return {
      ...template,
      id: `power_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: getPowerDescription(template.type),
      currentUses: 0,
    } as PowerCard;
  }, []);

  // 🎁 Award power card by difficulty
  const awardPowerCardByDifficulty = useCallback(
    (playerId: string, difficulty: string) => {
      const chances: Record<string, number> = {
        easy: 0.1,
        medium: 0.25,
        hard: 0.45,
        expert: 0.7,
      };

      const chance = chances[difficulty] || 0.1;

      if (Math.random() < chance) {
        const newPowerCard = generateRandomPowerCard();
        addPowerCardToPlayer(playerId, newPowerCard);
        return newPowerCard;
      }

      return null;
    },
    [generateRandomPowerCard, addPowerCardToPlayer]
  );

  // 🔥 Get power card effect description
  const getPowerCardEffect = useCallback((type: PowerCard['type']) => {
    return getPowerDescription(type);
  }, []);

  return {
    // State
    powerStats,

    // Actions
    handleUsePowerCard,
    generateRandomPowerCard,
    awardPowerCardByDifficulty,

    // Queries
    getAvailablePowerCards,
    canUsePowerCard: canUsePowerCardCheck,
    getPowerCardEffect,

    // Utilities
    hasAvailablePowers: (playerId: string) =>
      getAvailablePowerCards(playerId).length > 0,
  };
};

// Helper function for power descriptions
const getPowerDescription = (type: string): string => {
  const descriptions = {
    robo: 'Roba 1 token de otro jugador',
    escudo: 'Inmune a robos por 2 rondas',
    boost: 'Tu próxima respuesta vale doble puntos',
    refresh: 'Recupera 1 token perdido',
    peek: 'Ve la respuesta 3 segundos antes',
    precision: '+2 puntos extra si aciertas año exacto',
  };
  return descriptions[type as keyof typeof descriptions] || 'Poder especial';
};
