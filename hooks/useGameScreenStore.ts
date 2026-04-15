import { useGameStore } from '@/store/gameStore';
import type { Player as StorePlayer } from '@/store/types/gameStoreTypes';

/**
 * Consolida todos los selectores de useGameStore que necesita la pantalla del juego.
 * Elimina el boilerplate de 25+ llamadas individuales en game.tsx.
 *
 * Nota: casteamos `players` a StorePlayer[] porque el runtime store usa el tipo
 * completo de store/types/gameStoreTypes, mientras que GameStore expone el tipo
 * mínimo de types/game.types. Ambos son compatibles en runtime.
 */
export function useGameScreenStore() {
  // ── State ─────────────────────────────────────────────────────────────────
  const players = useGameStore(
    (state) => (state.players ?? []) as unknown as StorePlayer[],
  );
  const isActive = useGameStore((state) => state.isActive);
  const timeLeft = useGameStore((state) => state.timeLeft);
  const showGameEndModal = useGameStore((state) => state.showGameEndModal);
  const round = useGameStore((state) => state.round);
  const gamePot = useGameStore((state) => state.gamePot);

  // Featuring
  const featuringPlayerId = useGameStore((state) => state.featuringPlayerId);
  const featuringTargetId = useGameStore((state) => state.featuringTargetId);

  // Duel
  const duelActive = useGameStore((state) => state.duelActive);
  const duelPlayer1Id = useGameStore((state) => state.duelPlayer1Id);
  const duelPlayer2Id = useGameStore((state) => state.duelPlayer2Id);

  // Stop Blast
  const stopBlastActive = useGameStore((state) => state.stopBlastActive);
  const stopBlastHolderId = useGameStore((state) => state.stopBlastHolderId);

  // ── Actions ───────────────────────────────────────────────────────────────
  const placeBetStore = useGameStore((state) => state.placeBet);
  const setShowGameEndModal = useGameStore(
    (state) => state.setShowGameEndModal,
  );
  const createNewGame = useGameStore((state) => state.createNewGame);
  const nextTurn = useGameStore((state) => state.nextTurn);
  const clearBets = useGameStore((state) => state.clearBets);
  const setGameActive = useGameStore((state) => state.setGameActive);
  const addPowerCard = useGameStore((state) => state.addPowerCard);
  const awardAllianceBonus = useGameStore((state) => state.awardAllianceBonus);
  const toggleFreezePlayer = useGameStore((state) => state.toggleFreezePlayer);
  const applyRoyalties = useGameStore((state) => state.applyRoyalties);
  const applyArtistHold = useGameStore((state) => state.applyArtistHold);
  const activateFeaturing = useGameStore((state) => state.activateFeaturing);
  const clearFeaturing = useGameStore((state) => state.clearFeaturing);
  const updateLossStreaks = useGameStore((state) => state.updateLossStreaks);
  const applyBSideBonus = useGameStore((state) => state.applyBSideBonus);
  const activateDuel = useGameStore((state) => state.activateDuel);
  const activateStopBlast = useGameStore((state) => state.activateStopBlast);
  const applyFeaturingBonus = useGameStore(
    (state) => state.applyFeaturingBonus,
  );
  const applyCopyrights = useGameStore((state) => state.applyCopyrights);
  const applySoldOut = useGameStore((state) => state.applySoldOut);
  const applyBadReview = useGameStore((state) => state.applyBadReview);
  const applyManagementFee = useGameStore((state) => state.applyManagementFee);
  const applyCharityShow = useGameStore((state) => state.applyCharityShow);

  return {
    // State
    players,
    isActive,
    timeLeft,
    showGameEndModal,
    round,
    gamePot,
    featuringPlayerId,
    featuringTargetId,
    duelActive,
    duelPlayer1Id,
    duelPlayer2Id,
    stopBlastActive,
    stopBlastHolderId,
    // Actions
    placeBetStore,
    setShowGameEndModal,
    createNewGame,
    nextTurn,
    clearBets,
    setGameActive,
    addPowerCard,
    awardAllianceBonus,
    toggleFreezePlayer,
    applyRoyalties,
    applyArtistHold,
    activateFeaturing,
    clearFeaturing,
    updateLossStreaks,
    applyBSideBonus,
    activateDuel,
    activateStopBlast,
    applyFeaturingBonus,
    applyCopyrights,
    applySoldOut,
    applyBadReview,
    applyManagementFee,
    applyCharityShow,
  };
}
