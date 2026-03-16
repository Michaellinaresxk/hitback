import { useState, useCallback } from 'react';
import type { GameFlow } from '@/hooks/useGameFlow';
import type { Player } from '@/store/types/gameStoreTypes';
import { getBackendPlayerId } from '@/utils/game/gameHelpers';

interface UseBettingActionsParams {
  players: Player[];
  playerIdMap: Record<string, string>;
  flowState: GameFlow;
  placeBetStore: (playerId: string, tokenValue: number) => void;
  placeBetBackend: (playerId: string, tokenValue: number) => Promise<{ success: boolean }>;
  skipBetting: () => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

/**
 * Gestiona toda la lógica de apuestas:
 * visibilidad del modal, validación de tokens y comunicación con el backend.
 */
export function useBettingActions({
  players,
  playerIdMap,
  flowState,
  placeBetStore,
  placeBetBackend,
  skipBetting,
  showSuccess,
  showError,
  showInfo,
}: UseBettingActionsParams) {
  const [showBettingModal, setShowBettingModal] = useState(false);

  const handleStartBetting = useCallback(() => {
    if (!flowState.currentRound || flowState.currentRound.number === 1) return;
    setShowBettingModal(true);
  }, [flowState.currentRound]);

  const handlePlaceBet = useCallback(
    async (playerId: string, tokenValue: number) => {
      const player = players.find((p) => p.id === playerId);

      if (!player) {
        showError('Error', 'Jugador no encontrado');
        return;
      }
      if (player.currentBet > 0) {
        showError('Error', `${player.name} ya apostó en esta ronda`);
        return;
      }
      if (!player.availableTokens.includes(tokenValue)) {
        showError('Error', `Token +${tokenValue} ya fue usado o no disponible`);
        return;
      }

      placeBetStore(playerId, tokenValue);

      const backendPlayerId = getBackendPlayerId(playerId, players, playerIdMap);
      const result = await placeBetBackend(backendPlayerId, tokenValue);

      if (result.success) {
        showSuccess('Token Usado', `${player.name} usó token +${tokenValue} puntos`);
      } else {
        showError('Error', 'No se pudo registrar en el servidor');
      }
    },
    [players, playerIdMap, placeBetStore, placeBetBackend, showSuccess, showError],
  );

  const handleConfirmBets = useCallback(() => {
    const playersWithBets = players.filter((p) => p.currentBet > 0);
    if (playersWithBets.length === 0) {
      showInfo('Sin apuestas', 'No se realizaron apuestas para esta ronda');
    }
    setShowBettingModal(false);
    skipBetting();
  }, [players, showInfo, skipBetting]);

  const handleSkipBetting = useCallback(() => {
    skipBetting();
    setShowBettingModal(false);
  }, [skipBetting]);

  return {
    showBettingModal,
    setShowBettingModal,
    handleStartBetting,
    handlePlaceBet,
    handleConfirmBets,
    handleSkipBetting,
  };
}
