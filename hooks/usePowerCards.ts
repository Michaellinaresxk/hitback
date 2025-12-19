// ═══════════════════════════════════════════════════════════════════════════
// HOOK PARA USAR POWER CARDS FÁCILMENTE
// ═══════════════════════════════════════════════════════════════════════════

import { usePowerCardStore } from '@/store/powerCardStore';
import { useCallback } from 'react';

/**
 * Hook personalizado para usar Power Cards en componentes
 *
 * Uso:
 * const { useCard, scanCard, inventory, activeEffects } = usePowerCards(playerId, sessionId);
 */
export function usePowerCards(playerId: string, sessionId: string) {
  const store = usePowerCardStore();

  const scanCard = useCallback(
    async (qrCode: string) => {
      return store.scanCard(qrCode, playerId, sessionId);
    },
    [playerId, sessionId, store.scanCard]
  );

  const useCard = useCallback(
    async (cardId: string) => {
      return store.useCard(cardId, playerId, sessionId);
    },
    [playerId, sessionId, store.useCard]
  );

  const inventory = store.getPlayerInventory(playerId);
  const activeEffects = store.getPlayerActiveEffects(playerId);

  return {
    // Acciones
    scanCard,
    useCard,

    // Estado
    inventory,
    cards: inventory?.cards || [],
    activeEffects,
    usedCards: inventory?.usedCards || [],

    // Estado de carga
    isLoading: store.isLoading,
    error: store.error,

    // Resultado de última acción
    lastResult: store.lastActionResult,

    // Helpers
    hasBoost: activeEffects.boost,
    hasShield: activeEffects.shield,
    hasCounter: activeEffects.counter,
    cardsCount: inventory?.cards.length || 0,
    canUseCard: (inventory?.cards.length || 0) > 0,
  };
}
