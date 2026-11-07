import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';

// External Components
import AudioPlayer from '@/components/game/AudioPlayer';
import GameEndModal from '@/components/game/GameEndModal';
import GameFeedback, { useFeedback } from '@/components/game/GameFeedback';
import PlayerScoreboard from '@/components/game/PlayerScoreboard';
import BettingModal from '@/components/modal/BettingModal';
import { ComboNotification } from '@/components/rewards/ComboNotification';
import { PowerCardScanModal } from '@/components/powercard/PowerCardScanModal';
import AllianceModal from '@/components/modal/AllianceModal';
import FeaturingModal from '@/components/modal/FeaturingModal';
import LossStreakModal from '@/components/modal/LossStreakModal';
import DuelModal from '@/components/modal/DuelModal';
import ReactionCardPickerModal from '@/components/modal/ReactionCardPickerModal';
import { styles } from '@/components/game/gameScreen/styles';
import { GameHeader } from '@/components/game/gameScreen/GameHeader';
import { GamePot } from '@/components/game/gameScreen/GamePot';
import { CurrentTurn } from '@/components/game/gameScreen/CurrentTurn';
import { MainAction } from '@/components/game/gameScreen/MainAction';
import PointsAwardModal from '@/components/game/gameScreen/PointsAwardModal';

// Hooks
import { useGameFlow } from '@/hooks/useGameFlow';
import { useGameScreenStore } from '@/hooks/useGameScreenStore';
import { useGameTurnActions } from '@/hooks/useGameTurnActions';
import { useComboFlow } from '@/hooks/useComboFlow';
import { useBettingActions } from '@/hooks/useBettingActions';
import { useFeaturingDuelActions } from '@/hooks/useFeaturingDuelActions';
import { usePointsActions } from '@/hooks/usePointsActions';

// Services
import { gameSessionService } from '@/services/GameSessionService';
import { soundEffects } from '@/services/SoundEffectsService';
import { useGameStore } from '@/store/gameStore';

// Constants & Utils
import { REPRODUCTION_TIME_LIMIT } from '@/constants/TrackConfig';
import { SCORE_TO_WIN } from '@/constants/Points';
import { buildPlayerIdMap, getBackendPlayerId } from '@/utils/game/gameHelpers';
import { ReactionCardType } from '@/constants/ReactionCard';

// Screens
import GameSetupScreen from '../setup-game';
import TourLandingModal from '@/components/modal/TourLandingModal';
import { MechanicTrigger } from '@/types/worldTour.types';

export default function GameScreen() {
  // ── Store ──────────────────────────────────────────────────────────────────
  const {
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
    advancePlayerBoard,
    activateDoublePlatinum,
  } = useGameScreenStore();

  // ── Game Flow ──────────────────────────────────────────────────────────────
  const {
    flowState,
    nextRound,
    handleAudioFinished,
    revealAnswer,
    placeBet: placeBetBackend,
    skipBetting,
    prepareNextRound,
    testConnection,
  } = useGameFlow();

  // ── Feedback ───────────────────────────────────────────────────────────────
  const {
    messages,
    dismissFeedback,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  } = useFeedback();

  const reconcileCanonicalScores = useCallback(async () => {
    try {
      const { session } = await gameSessionService.getStatus();
      useGameStore.getState().syncPlayersFromBackend(session.players);
    } catch (error) {
      console.error('❌ Could not reconcile canonical scores:', error);
    }
  }, []);

  const settleScoreAdjustments = useCallback(
    async (
      adjustments: { playerId: string; delta: number; reason: string }[],
    ) => {
      const result = await gameSessionService.applyScoreSettlement(adjustments);
      useGameStore.getState().syncPlayersFromBackend(result.players);
    },
    [],
  );

  // ── Local State ────────────────────────────────────────────────────────────
  const [playerIdMap, setPlayerIdMap] = useState<Record<string, string>>({});
  const [gameStarted, setGameStarted] = useState(false);
  const [showAllianceModal, setShowAllianceModal] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<{
    id: string;
    name: string;
    score: number;
  } | null>(null);

  // ── Turn Actions (must be before hooks that depend on advanceToNextTurn) ───
  const { advanceToNextTurn, resetProcessingRefs, isPowerCardProcessingRef } =
    useGameTurnActions({ nextTurn, prepareNextRound });

  // ── Combo Flow ─────────────────────────────────────────────────────────────
  const {
    comboFlowState,
    activateCombo,
    handleComboNotificationClose,
    handlePowerCardScanned,
    handlePowerCardScanClose,
  } = useComboFlow({
    players,
    playerIdMap,
    addPowerCard,
    showSuccess,
    showError,
    advanceToNextTurn,
    resetProcessingRefs,
    isPowerCardProcessingRef,
    applyImmediateCardEffect: async (playerId, scoreChange) => {
      applyBadReview(playerId); // LABEL FEE siempre es -1: reusa applyBadReview
      const backendId = getBackendPlayerId(playerId, players, playerIdMap);
      try {
        await settleScoreAdjustments([
          { playerId: backendId, delta: scoreChange, reason: 'LABEL_FEE' },
        ]);
      } catch (error) {
        await reconcileCanonicalScores();
        throw error;
      }
    },
  });

  // ── Betting Actions ────────────────────────────────────────────────────────
  const {
    showBettingModal,
    setShowBettingModal,
    handleStartBetting,
    handlePlaceBet,
    handleConfirmBets,
    handleSkipBetting,
  } = useBettingActions({
    players,
    playerIdMap,
    flowState,
    placeBetStore,
    placeBetBackend,
    skipBetting,
    showSuccess,
    showError,
    showInfo,
  });

  // ── Featuring & Duel Actions ───────────────────────────────────────────────
  const {
    showFeaturingModal,
    featuringPortadorId,
    handleFeaturingPlayer,
    handleFeaturingPartnerSelected,
    closeFeaturingModal,
    showDuelModal,
    duelChallengerId,
    openDuelModal,
    handleDuelOpponentSelected,
    closeDuelModal,
  } = useFeaturingDuelActions({
    featuringPlayerId,
    clearFeaturing,
    activateFeaturing,
    activateDuel,
  });

  // ── Points Actions ─────────────────────────────────────────────────────────
  const {
    showPointsModal,
    setShowPointsModal,
    bSideNotification,
    setBSideNotification,
    lastAwardedPointsRef,
    handleAwardPoints,
    handleWrongAnswer,
    landingEvent,
    setLandingEvent,
  } = usePointsActions({
    flowState,
    players,
    playerIdMap,
    advancePlayerBoard,
    revealAnswer,
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
  });

  // ── Derived State ──────────────────────────────────────────────────────────
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players],
  );

  const bettingButtonVisible = useMemo(() => {
    const roundNumber = flowState.currentRound?.number || 0;
    return (
      roundNumber > 1 &&
      flowState.phase === 'betting' &&
      !flowState.hasPlacedBet &&
      !flowState.audioPlaying
    );
  }, [
    flowState.currentRound?.number,
    flowState.phase,
    flowState.hasPlacedBet,
    flowState.audioPlaying,
  ]);

  const canStart = useMemo(() => {
    if (comboFlowState.isActive) {
      console.log('⛔ canStart blocked by comboFlowState.isActive');
      return false;
    }
    const result =
      !flowState.isLoading &&
      (flowState.phase === 'answer' || flowState.phase === 'idle');
    console.log(`✅ canStart result: ${result}`);
    return result;
  }, [flowState.isLoading, flowState.phase, comboFlowState.isActive]);

  const reactionDisabledCards = useMemo(() => {
    const disabled: Partial<Record<ReactionCardType, string>> = {};
    if (duelActive) disabled.DUEL = 'Duel ya activo';
    if (stopBlastActive) disabled.STOP_BLAST = 'Ya activo';
    return disabled;
  }, [duelActive, stopBlastActive]);

  const committedFeaturingIds = useMemo<string[]>(() => {
    const ids: string[] = [];
    if (featuringPlayerId) ids.push(featuringPlayerId);
    if (featuringTargetId) ids.push(featuringTargetId);
    return ids;
  }, [featuringPlayerId, featuringTargetId]);

  const canShowBSideNotification =
    !landingEvent &&
    !showPointsModal &&
    !showBettingModal &&
    !showAllianceModal &&
    !showFeaturingModal &&
    !showDuelModal &&
    !comboFlowState.isActive &&
    reactionTarget === null &&
    !showGameEndModal;

  const initializeGame = useCallback(async () => {
    try {
      console.log('🎮 Initializing game...');
      setPlayerIdMap(buildPlayerIdMap(players));
      await soundEffects.initialize();
      const isConnected = await testConnection();
      if (!isConnected) {
        showWarning('Backend Desconectado', 'El servidor no está disponible.');
      }
      setGameStarted(true);
      console.log('✅ Game initialized');
    } catch (error) {
      console.error('❌ Error initializing game:', error);
      showError('Error', 'No se pudo inicializar el juego');
    }
  }, [players, testConnection, showWarning, showError]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive && players.length >= 2 && !gameStarted) {
      initializeGame();
    }
  }, [isActive, players.length, gameStarted, initializeGame]);

  useEffect(() => {
    if (flowState.phase === 'question' && flowState.currentRound) {
      setShowPointsModal(true);
    }
  }, [flowState.phase, flowState.currentRound, setShowPointsModal]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNextRound = useCallback(async () => {
    console.log('🎵 Next Round button pressed');
    const success = await nextRound();
    if (success && flowState.currentRound) {
      showInfo(
        'Nueva Ronda',
        `Ronda ${flowState.currentRound.number} - ${flowState.currentRound.question.type.toUpperCase()}`,
      );
    }
  }, [nextRound, flowState.currentRound, showInfo]);

  const handleNewGame = useCallback(async () => {
    try {
      await gameSessionService.clearCurrentSession();
    } catch (error) {
      console.error('Could not clear the saved session:', error);
      showError(
        'Error',
        'No se pudo borrar de forma segura la sesión guardada.',
      );
      return;
    }

    setShowGameEndModal(false);
    setGameActive(false);
    setGameStarted(false);
    soundEffects.dispose();
    createNewGame();
  }, [setShowGameEndModal, setGameActive, createNewGame, showError]);

  const handleBackToMenu = useCallback(async () => {
    try {
      await gameSessionService.clearCurrentSession();
    } catch (error) {
      console.error('Could not clear the saved session:', error);
      showError(
        'Error',
        'No se pudo borrar de forma segura la sesión guardada.',
      );
      return;
    }

    setShowGameEndModal(false);
    setGameActive(false);
    setGameStarted(false);
    createNewGame();
  }, [setShowGameEndModal, setGameActive, createNewGame, showError]);

  const handleScoreboardUsePowerCard = useCallback(
    async (playerId: string, cardId: string) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) {
        showError('Error', 'Jugador no encontrado');
        return;
      }

      const storePlayer = player as any;
      const powerCard = storePlayer.powerCards?.find(
        (pc: any) => pc.id === cardId,
      );
      if (!powerCard) {
        showError('Error', 'Carta no encontrada en el inventario');
        return;
      }
      if (powerCard.currentUses >= powerCard.usageLimit) {
        showError('Error', 'Esta carta ya fue usada');
        return;
      }
      if (storePlayer.boostActive) {
        showError('Error', 'Ya tienes un boost activo');
        return;
      }

      console.log(
        `⚡ Activating PowerCard: ${powerCard.name} for ${player.name}`,
      );

      try {
        const backendPlayerId = getBackendPlayerId(
          playerId,
          players,
          playerIdMap,
        );
        const result = await gameSessionService.usePowerCard(
          backendPlayerId,
          cardId,
        );

        if (result.success) {
          (useGameStore.getState() as any).usePowerCard(playerId, cardId);
          const cardTypeLower = ((powerCard as any).type || '').toLowerCase();
          const toastMessage =
            cardTypeLower === 'festival'
              ? `${player.name} usó 🎪 ${powerCard.name}\n¡Todos los jugadores ganan +1 pt!`
              : `${player.name} activó ${(powerCard as any).emoji || '⚡'} ${powerCard.name}\n¡Tu próxima respuesta correcta vale x2 puntos!`;
          showSuccess('⚡ ¡Carta Usada!', toastMessage);
          console.log(`✅ PowerCard used: ${powerCard.name}`);
        } else {
          showError('Error', result.message || 'No se pudo activar la carta');
        }
      } catch (error: any) {
        console.error('❌ Error using power card:', error);
        showError('Error', error.message || 'No se pudo usar la carta');
      }
    },
    [players, playerIdMap, showSuccess, showError],
  );

  const handleTourLandingContinue = useCallback(
    async (mechanicTrigger: MechanicTrigger | null) => {
      setLandingEvent(null);

      if (!mechanicTrigger) {
        advanceToNextTurn();
        return;
      }

      switch (mechanicTrigger) {
        case 'reaction_card':
          advanceToNextTurn();
          break;
        case 'duel':
          if (landingEvent) openDuelModal(landingEvent.playerId);
          else advanceToNextTurn();
          break;
        case 'double_points':
          try {
            await gameSessionService.activateDoublePlatinum();
            activateDoublePlatinum();
            advanceToNextTurn();
          } catch (error) {
            showError(
              'Error',
              error instanceof Error
                ? error.message
                : 'No se pudo activar Double Platinum en el servidor',
            );
          }
          break;
        case 'split_dice':
          advanceToNextTurn();
          break;
        default:
          advanceToNextTurn();
      }
    },
    [
      setLandingEvent,
      advanceToNextTurn,
      landingEvent,
      activateDoublePlatinum,
      openDuelModal,
      showError,
    ],
  );

  const handleReactionCard = useCallback(
    async (cardType: ReactionCardType, playerId: string) => {
      try {
        switch (cardType) {
        case 'MUTE':
          toggleFreezePlayer(playerId);
          break;
        case 'STOP_BLAST':
          activateStopBlast(playerId);
          break;
        case 'DUEL':
          openDuelModal(playerId);
          break;
        case 'FEATURING':
          handleFeaturingPlayer(playerId);
          break;
        case 'ALLIANCE':
          setShowAllianceModal(true);
          break;
        case 'ROYALTIES': {
          // Capturar líder ANTES de mutar el store local
          const leader = [...players].reduce((a, b) =>
            a.score > b.score ? a : b,
          );
          applyRoyalties(playerId);
          // Sincronizar backend solo si el holder no es el líder
          if (leader.id !== playerId) {
            const leaderBackendId = getBackendPlayerId(
              leader.id,
              players,
              playerIdMap,
            );
            const holderBackendId = getBackendPlayerId(
              playerId,
              players,
              playerIdMap,
            );
            await settleScoreAdjustments([
              { playerId: leaderBackendId, delta: -1, reason: 'ROYALTIES' },
              { playerId: holderBackendId, delta: 1, reason: 'ROYALTIES' },
            ]);
          }
          break;
        }
        case 'ARTIST_HOLD':
          applyArtistHold();
          break;
        case 'COPYRIGHTS': {
          const deduction = Math.floor(lastAwardedPointsRef.current / 2);
          applyCopyrights(playerId, lastAwardedPointsRef.current);
          if (deduction > 0) {
            const backendId = getBackendPlayerId(
              playerId,
              players,
              playerIdMap,
            );
            await settleScoreAdjustments([
              { playerId: backendId, delta: -deduction, reason: 'COPYRIGHTS' },
            ]);
          }
          break;
        }
        case 'SOLD_OUT': {
          applySoldOut(playerId);
          const backendIdSoldOut = getBackendPlayerId(
            playerId,
            players,
            playerIdMap,
          );
          await settleScoreAdjustments([
            { playerId: backendIdSoldOut, delta: 1, reason: 'SOLD_OUT' },
          ]);
          break;
        }
        case 'BAD_REVIEW': {
          applyBadReview(playerId);
          const backendIdBadReview = getBackendPlayerId(
            playerId,
            players,
            playerIdMap,
          );
          await settleScoreAdjustments([
            { playerId: backendIdBadReview, delta: -1, reason: 'BAD_REVIEW' },
          ]);
          break;
        }
        case 'MANAGEMENT_FEE': {
          applyManagementFee(playerId);
          const backendIdMgmt = getBackendPlayerId(
            playerId,
            players,
            playerIdMap,
          );
          await settleScoreAdjustments([
            { playerId: backendIdMgmt, delta: -1, reason: 'MANAGEMENT_FEE' },
          ]);
          break;
        }
        case 'CHARITY_SHOW': {
          // El sorteo y la mutación ocurren dentro del store
          const charityResult = applyCharityShow();
          if (charityResult) {
            const {
              leaderId,
              leaderName,
              recipientId,
              recipientName,
              tiedCount,
            } = charityResult;
            const tiedNote =
              tiedCount > 1 ? ` (sorteado entre ${tiedCount})` : '';
            showSuccess(
              '🎸 Charity Show',
              `${leaderName} le regaló 1pt a ${recipientName}${tiedNote}`,
            );
            const leaderBackendId = getBackendPlayerId(
              leaderId,
              players,
              playerIdMap,
            );
            const recipientBackendId = getBackendPlayerId(
              recipientId,
              players,
              playerIdMap,
            );
            await settleScoreAdjustments([
              { playerId: leaderBackendId, delta: -1, reason: 'CHARITY_SHOW' },
              { playerId: recipientBackendId, delta: 1, reason: 'CHARITY_SHOW' },
            ]);
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error('❌ Reaction Card score settlement failed:', error);
      await reconcileCanonicalScores();
      showError(
        'Error',
        error instanceof Error
          ? error.message
          : 'No se pudo sincronizar la puntuación con el servidor.',
      );
      }
    },
    [
      toggleFreezePlayer,
      activateStopBlast,
      openDuelModal,
      handleFeaturingPlayer,
      applyArtistHold,
      players,
      applyRoyalties,
      playerIdMap,
      lastAwardedPointsRef,
      applyCopyrights,
      applySoldOut,
      applyBadReview,
      applyManagementFee,
      applyCharityShow,
      showSuccess,
      settleScoreAdjustments,
      reconcileCanonicalScores,
      showError,
    ],
  );

  // ── Early Returns ──────────────────────────────────────────────────────────
  if (!isActive && !showGameEndModal) {
    return <GameSetupScreen />;
  }

  if (!isActive && showGameEndModal) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle='light-content' backgroundColor='#0F172A' />
        <GameEndModal
          visible={true}
          players={players as any}
          gameTimeElapsed={1200 - timeLeft}
          totalRounds={round}
          onNewGame={handleNewGame}
          onBackToMenu={handleBackToMenu}
        />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />
      <GameFeedback messages={messages} onMessageDismiss={dismissFeedback} />

      <ScrollView>
        <GameHeader
          timeLeft={timeLeft}
          currentPhase={flowState.phase}
          onOpenAlliances={() => setShowAllianceModal(true)}
        />

        {gamePot?.tokens > 0 && <GamePot tokens={gamePot.tokens} />}

        {flowState.audioPlaying &&
          flowState.audioUrl &&
          flowState.currentRound && (
            <AudioPlayer
              previewUrl={flowState.audioUrl}
              trackTitle='Escucha...'
              artist={`${flowState.currentRound.question.type.toUpperCase()}`}
              duration={REPRODUCTION_TIME_LIMIT}
              autoPlay={true}
              onAudioFinished={handleAudioFinished}
            />
          )}

        <CurrentTurn round={round} currentPhase={flowState.phase} />

        <MainAction
          isLoading={flowState.isLoading}
          currentPhase={flowState.phase}
          canStartNextRound={canStart}
          onNextRound={handleNextRound}
          questionVisible={flowState.questionVisible}
          currentRound={flowState.currentRound}
          hasPlacedBet={flowState.hasPlacedBet}
          onStartBetting={handleStartBetting}
          onSkipBetting={handleSkipBetting}
          showBettingButton={bettingButtonVisible}
        />

        <PlayerScoreboard
          players={sortedPlayers}
          showDetailedStats={true}
          highlightWinner={sortedPlayers.some((p) => p.score >= SCORE_TO_WIN)}
          onUsePowerCard={handleScoreboardUsePowerCard}
          canUsePowerCards={
            flowState.phase === 'betting' ||
            flowState.phase === 'question' ||
            flowState.phase === 'idle'
          }
          onPlayerPress={setReactionTarget}
          duelPlayer1Id={duelPlayer1Id}
          duelPlayer2Id={duelPlayer2Id}
          stopBlastHolderId={stopBlastHolderId}
          featuringPlayerId={featuringPlayerId}
          featuringTargetId={featuringTargetId}
        />
      </ScrollView>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <PointsAwardModal
        visible={showPointsModal}
        flowState={flowState}
        players={players}
        onAwardPoints={handleAwardPoints}
        onWrongAnswer={handleWrongAnswer}
        onClose={() => setShowPointsModal(false)}
        stopBlastActive={stopBlastActive}
        stopBlastHolderId={stopBlastHolderId}
        duelActive={duelActive}
        duelPlayer1Id={duelPlayer1Id}
        duelPlayer2Id={duelPlayer2Id}
      />

      <BettingModal
        visible={showBettingModal}
        onClose={() => setShowBettingModal(false)}
        players={players}
        currentCard={
          flowState.currentRound
            ? {
                roundNumber: flowState.currentRound.number,
                question: flowState.currentRound.question,
                track: {
                  title: flowState.currentRound.track.title || 'Canción actual',
                  artist: flowState.currentRound.track.artist || '',
                },
              }
            : null
        }
        onPlaceBet={handlePlaceBet}
        onSkipBetting={handleSkipBetting}
        onConfirmBets={handleConfirmBets}
      />

      <AllianceModal
        visible={showAllianceModal}
        onClose={() => setShowAllianceModal(false)}
      />

      <FeaturingModal
        visible={showFeaturingModal}
        portadorId={featuringPortadorId ?? ''}
        portadorName={
          players.find((p) => p.id === featuringPortadorId)?.name ?? ''
        }
        players={players}
        committedPlayerIds={committedFeaturingIds}
        onSelectPartner={handleFeaturingPartnerSelected}
        onClose={closeFeaturingModal}
      />

      <GameEndModal
        visible={showGameEndModal}
        players={players as any}
        gameTimeElapsed={1200 - timeLeft}
        totalRounds={round}
        onNewGame={handleNewGame}
        onBackToMenu={handleBackToMenu}
      />

      <ComboNotification
        visible={comboFlowState.showNotification}
        onClose={handleComboNotificationClose}
        comboName={comboFlowState.comboName || ''}
        comboEmoji={comboFlowState.comboEmoji || '🔥'}
        comboDescription={comboFlowState.comboDescription || ''}
        playerName={comboFlowState.playerName || ''}
      />

      <PowerCardScanModal
        visible={comboFlowState.showScanner && !!comboFlowState.playerId}
        onClose={handlePowerCardScanClose}
        onCardScanned={handlePowerCardScanned}
        playerName={comboFlowState.playerName || ''}
        comboType={comboFlowState.comboName || ''}
      />

      <LossStreakModal
        visible={Boolean(
          bSideNotification?.visible && canShowBSideNotification,
        )}
        playerNames={bSideNotification?.playerNames ?? []}
        onClose={() => setBSideNotification(null)}
      />

      <DuelModal
        visible={showDuelModal}
        challengerId={duelChallengerId ?? ''}
        challengerName={
          players.find((p) => p.id === duelChallengerId)?.name ?? ''
        }
        players={players}
        onSelectOpponent={handleDuelOpponentSelected}
        onClose={closeDuelModal}
      />

      <ReactionCardPickerModal
        visible={reactionTarget !== null}
        targetPlayer={reactionTarget}
        disabledCards={reactionDisabledCards}
        onSelect={handleReactionCard}
        onClose={() => setReactionTarget(null)}
      />

      <TourLandingModal
        visible={landingEvent !== null}
        event={landingEvent}
        onContinue={handleTourLandingContinue}
      />
    </View>
  );
}
