import { useState, useRef, useCallback } from 'react';
import type { GameFlow } from '@/hooks/useGameFlow';
import type { Player } from '@/store/types/gameStoreTypes';
import type { ComboActivationData } from '@/hooks/useComboFlow';
import { soundEffects } from '@/services/SoundEffectsService';
import { getBackendPlayerId } from '@/utils/game/gameHelpers';
import { useGameStore } from '@/store/gameStore';
import { BoardTile } from '@/types/worldTour.types';
import { TourLandingEvent } from '@/components/modal/TourLandingModal';
import { getActForPosition } from '@/utils/worldtourUtils';
import { gameSessionService } from '@/services/GameSessionService';
import type { ScoreModifiers } from '@/services/GameSessionService';

interface BSideNotification {
  visible: boolean;
  playerNames: string[];
}

interface UsePointsActionsParams {
  flowState: GameFlow;
  players: Player[];
  playerIdMap: Record<string, string>;
  advancePlayerBoard: (playerId: string) => BoardTile | null;
  revealAnswer: (
    winnerId: string | null,
    scoreModifiers?: ScoreModifiers,
  ) => Promise<any>;
  awardAllianceBonus: (winnerId: string, pts: number) => void;
  applyFeaturingBonus: (partnerId: string, pts: number) => void;
  applyBSideBonus: (winnerId: string) => boolean;
  updateLossStreaks: (winnerId: string | null) => string[];
  clearFeaturing: () => void;
  clearBets: () => void;
  featuringPlayerId: string | null;
  featuringTargetId: string | null;
  advanceToNextTurn: () => void;
  activateCombo: (data: ComboActivationData) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
}

/**
 * Gestiona la lógica de puntuación:
 * - Otorgar puntos (con Alliance, Featuring, B-SIDE, Combo y Game Over)
 * - Respuesta incorrecta (con pérdida de tokens y B-SIDE)
 * - Notificación de B-SIDE cuando un jugador alcanza el umbral de racha perdedora
 */
export function usePointsActions({
  flowState,
  players,
  playerIdMap,
  revealAnswer,
  advancePlayerBoard,
  awardAllianceBonus,
  applyFeaturingBonus,
  applyBSideBonus,
  updateLossStreaks,
  clearFeaturing,
  clearBets,
  featuringPlayerId,
  featuringTargetId,
  advanceToNextTurn,
  activateCombo,
  showSuccess,
  showError,
  showInfo,
  showWarning,
}: UsePointsActionsParams) {
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [bSideNotification, setBSideNotification] =
    useState<BSideNotification | null>(null);
  /** Puntos ganados en la última ronda — usado por COPYRIGHTS para calcular la deducción. */
  const lastAwardedPointsRef = useRef<number>(0);
  /** Guard: evita que dos taps simultáneos lancen dos revealAnswer en paralelo. */
  const isAwardingRef = useRef(false);
  const [landingEvent, setLandingEvent] = useState<TourLandingEvent | null>(
    null,
  );

  const reconcileCanonicalScores = useCallback(async () => {
    try {
      const { session } = await gameSessionService.getStatus();
      useGameStore.getState().syncPlayersFromBackend(session.players);
    } catch (error) {
      console.error('❌ Could not reconcile canonical scores:', error);
    }
  }, []);

  const handleWrongAnswer = useCallback(async () => {
    soundEffects.playWrong();
    const result = await revealAnswer(null);

    if (!result) {
      await reconcileCanonicalScores();
      showError('Error', 'No se pudo guardar el resultado de la ronda. Inténtalo de nuevo.');
      return;
    }

    showInfo(
      'Nadie Acertó',
      `La respuesta era: ${result.correctAnswer}\n"${result.trackInfo.title}" - ${result.trackInfo.artist}`,
    );

    const playersWithBets = players.filter(
      (p) => p.currentBet && p.currentBet > 0,
    );
    if (playersWithBets.length > 0) {
      const totalLost = playersWithBets.reduce(
        (sum, p) => sum + (p.currentBet || 0),
        0,
      );
      showWarning('Tokens Perdidos', `${totalLost} tokens perdidos`);
    }

    // B-SIDE: nadie ganó → todos suman lossStreak
    const newlyActivated = updateLossStreaks(null);
    if (newlyActivated.length > 0) {
      const names = newlyActivated
        .map((id) => players.find((p) => p.id === id)?.name)
        .filter((name): name is string => !!name);
      setBSideNotification({ visible: true, playerNames: names });
    }

    clearFeaturing();
    clearBets();
    setShowPointsModal(false);

    setTimeout(() => advanceToNextTurn(), 2000);
  }, [
    revealAnswer,
    players,
    clearFeaturing,
    clearBets,
    showInfo,
    showWarning,
    advanceToNextTurn,
    updateLossStreaks,
    reconcileCanonicalScores,
    showError,
  ]);

  const handleAwardPoints = useCallback(
    async (playerId: string) => {
      if (!flowState.currentRound) return;
      // Guard: prevent double-tap from launching two parallel revealAnswer calls
      if (isAwardingRef.current) return;
      isAwardingRef.current = true;

      const player = players.find((p) => p.id === playerId);
      if (!player) {
        isAwardingRef.current = false;
        return;
      }

      // Close modal immediately — before the async call — so the GM can't
      // tap a second player while the backend round is being revealed.
      setShowPointsModal(false);

      try {
        soundEffects.playCorrect();
        const backendPlayerId = getBackendPlayerId(
          playerId,
          players,
          playerIdMap,
        );
        const scoreModifiers: ScoreModifiers = {};
        const alliance = useGameStore.getState().getPlayerAlliance(playerId);
        if (alliance) {
          const partnerId =
            alliance.player1Id === playerId
              ? alliance.player2Id
              : alliance.player1Id;
          scoreModifiers.alliancePartnerId = getBackendPlayerId(
            partnerId,
            players,
            playerIdMap,
          );
        }
        if (
          featuringPlayerId &&
          featuringTargetId &&
          (playerId === featuringPlayerId || playerId === featuringTargetId)
        ) {
          const partnerId =
            playerId === featuringPlayerId
              ? featuringTargetId
              : featuringPlayerId;
          scoreModifiers.featuringPartnerId = getBackendPlayerId(
            partnerId,
            players,
            playerIdMap,
          );
        }
        if (player.bSideActive) {
          scoreModifiers.bSidePlayerId = backendPlayerId;
        }

        const result = await revealAnswer(backendPlayerId, scoreModifiers);

        if (result) {
          const pts = result.pointsAwarded as number;
          lastAwardedPointsRef.current = pts;

          showSuccess(
            '🎉 ¡Correcto!',
            `${player.name} gana ${pts} pts\n"${result.trackInfo.title}" - ${result.trackInfo.artist}`,
          );

          // 1️⃣ Alliance 50/50
          if (pts) {
            const alliance = useGameStore
              .getState()
              .getPlayerAlliance(playerId);
            if (alliance) {
              awardAllianceBonus(playerId, pts);
            }
          }

          // 2️⃣ Featuring 100/100
          if (pts && featuringPlayerId && featuringTargetId) {
            const isInFeaturing =
              playerId === featuringPlayerId || playerId === featuringTargetId;

            if (isInFeaturing) {
              const partnerId =
                playerId === featuringPlayerId
                  ? featuringTargetId
                  : featuringPlayerId;

              applyFeaturingBonus(partnerId, pts);
              const partner = players.find((p) => p.id === partnerId);
              showSuccess(
                '🎤 ¡Featuring!',
                `${partner?.name ?? 'Partner'} también recibe ${pts} pts`,
              );
              clearFeaturing();
            }
          }

          // 3️⃣ B-SIDE comeback +1
          const bSideApplied = applyBSideBonus(playerId);
          if (bSideApplied) {
            showSuccess('🎶 ¡B-SIDE!', `${player.name} recupera con +1 bonus`);
          }

          // 4️⃣ Actualizar lossStreaks — ganador resetea, resto suma
          const newlyActivated = updateLossStreaks(playerId);
          if (newlyActivated.length > 0) {
            const names = newlyActivated
              .map((id) => players.find((p) => p.id === id)?.name)
              .filter((name): name is string => !!name);
            setBSideNotification({ visible: true, playerNames: names });
          }

          // 5️⃣ World Tour: always advance the correct player's board tile
          const tile = advancePlayerBoard(playerId);
          if (Array.isArray(result.players)) {
            useGameStore.getState().syncPlayersFromBackend(result.players);
          }

          // 6️⃣ Game over takes precedence over combo/scanner UI.
          if (result.gameOver && result.gameWinner) {
            setTimeout(() => {
              void useGameStore.getState().endGame().catch((error) => {
                console.error('Could not finalize the World Tour:', error);
                showError(
                  'Error',
                  error instanceof Error
                    ? error.message
                    : 'No se pudo finalizar el tour.',
                );
              });
            }, 1500);
            return;
          }

          // 7️⃣ Combo flow — board already advanced, combo takes UI control
          if (result.comboStatus) {
            activateCombo({
              playerId,
              playerName: player.name,
              comboName: result.comboStatus.type.replace('_', ' '),
              comboEmoji: '🔥',
              comboDescription: result.comboStatus.message,
            });
            return;
          }

          // 8️⃣ Normal flow: show landing modal or go to next turn
          if (tile) {
            const previousAct = getActForPosition(tile.position - 1);
            const currentAct = getActForPosition(tile.position);
            const isActTransition =
              currentAct !== previousAct && currentAct !== 'start';

            setLandingEvent({
              tile,
              playerId,
              playerName: player.name,
              isActTransition,
              newActId:
                isActTransition && currentAct !== 'finish'
                  ? currentAct
                  : undefined,
            });
          } else {
            // Fallback: no route active, go to next turn directly
            setTimeout(() => advanceToNextTurn(), 2000);
          }
        } else {
          await reconcileCanonicalScores();
          showError('Error', 'No se pudo guardar el resultado de la ronda. Inténtalo de nuevo.');
        }
      } catch (error) {
        console.error('❌ Failed to award points:', error);
        await reconcileCanonicalScores();
        showError(
          'Error',
          error instanceof Error
            ? error.message
            : 'No se pudo guardar el resultado de la ronda.',
        );
      } finally {
        isAwardingRef.current = false;
      }
    },
    [
      flowState.currentRound,
      players,
      playerIdMap,
      advancePlayerBoard,
      revealAnswer,
      showSuccess,
      advanceToNextTurn,
      awardAllianceBonus,
      applyFeaturingBonus,
      applyBSideBonus,
      updateLossStreaks,
      featuringPlayerId,
      featuringTargetId,
      clearFeaturing,
      activateCombo,
      reconcileCanonicalScores,
      showError,
    ],
  );

  return {
    showPointsModal,
    setShowPointsModal,
    bSideNotification,
    setBSideNotification,
    lastAwardedPointsRef,
    landingEvent,
    setLandingEvent,
    handleAwardPoints,
    handleWrongAnswer,
  };
}
