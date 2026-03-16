import { useState, useCallback } from 'react';

interface UseFeaturingDuelActionsParams {
  featuringPlayerId: string | null;
  clearFeaturing: () => void;
  activateFeaturing: (portadorId: string, targetId: string) => void;
  activateDuel: (player1Id: string, player2Id: string) => void;
}

/**
 * Gestiona los modales y la lógica de Featuring y Duel.
 * Encapsula el estado de los modales junto con sus handlers de selección.
 */
export function useFeaturingDuelActions({
  featuringPlayerId,
  clearFeaturing,
  activateFeaturing,
  activateDuel,
}: UseFeaturingDuelActionsParams) {
  const [showFeaturingModal, setShowFeaturingModal] = useState(false);
  const [featuringPortadorId, setFeaturingPortadorId] = useState<string | null>(null);
  const [showDuelModal, setShowDuelModal] = useState(false);
  const [duelChallengerId, setDuelChallengerId] = useState<string | null>(null);

  /**
   * Abre el modal de featuring para un jugador.
   * Si el jugador ya tiene featuring activo → lo cancela.
   */
  const handleFeaturingPlayer = useCallback(
    (playerId: string) => {
      if (featuringPlayerId === playerId) {
        clearFeaturing();
        return;
      }
      setFeaturingPortadorId(playerId);
      setShowFeaturingModal(true);
    },
    [featuringPlayerId, clearFeaturing],
  );

  const handleFeaturingPartnerSelected = useCallback(
    (partnerId: string) => {
      if (!featuringPortadorId) return;
      activateFeaturing(featuringPortadorId, partnerId);
      setShowFeaturingModal(false);
      setFeaturingPortadorId(null);
    },
    [featuringPortadorId, activateFeaturing],
  );

  const closeFeaturingModal = useCallback(() => {
    setShowFeaturingModal(false);
    setFeaturingPortadorId(null);
  }, []);

  /** Abre el modal de duel indicando quién es el retador. */
  const openDuelModal = useCallback((challengerId: string) => {
    setDuelChallengerId(challengerId);
    setShowDuelModal(true);
  }, []);

  const handleDuelOpponentSelected = useCallback(
    (opponentId: string) => {
      if (!duelChallengerId) return;
      activateDuel(duelChallengerId, opponentId);
      setShowDuelModal(false);
      setDuelChallengerId(null);
    },
    [duelChallengerId, activateDuel],
  );

  const closeDuelModal = useCallback(() => {
    setShowDuelModal(false);
    setDuelChallengerId(null);
  }, []);

  return {
    // Featuring
    showFeaturingModal,
    featuringPortadorId,
    handleFeaturingPlayer,
    handleFeaturingPartnerSelected,
    closeFeaturingModal,
    // Duel
    showDuelModal,
    duelChallengerId,
    openDuelModal,
    handleDuelOpponentSelected,
    closeDuelModal,
  };
}
