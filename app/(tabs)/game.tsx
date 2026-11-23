import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';

// External Components
import AudioPlayer from '@/components/game/AudioPlayer';
import GameEndModal from '@/components/game/GameEndModal';
import GameFeedback, { useFeedback } from '@/components/game/GameFeedback';
import PlayerScoreboard from '@/components/game/PlayerScoreboard';
import BettingModal from '@/components/modal/BettingModal';
import { ComboNotification } from '@/components/rewards/ComboNotification';
import { PowerCardScanModal } from '@/components/powercard/PowerCardScanModal';
import { PowerCardRewardModal } from '@/components/powercard/PowerCardRewardModal';
import AllianceModal from '@/components/modal/AllianceModal';
import FeaturingModal from '@/components/modal/FeaturingModal';
import LossStreakModal from '@/components/modal/LossStreakModal';
import DuelModal from '@/components/modal/DuelModal';
import ReactionCardPickerModal from '@/components/modal/ReactionCardPickerModal';
import BackstageModal from '@/components/modal/BackstageModal';
import BackstageTargetModal from '@/components/modal/BackstageTargetModal';
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
import { useTranslation } from 'react-i18next';

// Constants & Utils
import { REPRODUCTION_TIME_LIMIT } from '@/constants/TrackConfig';
import { SCORE_TO_WIN } from '@/constants/Points';
import { buildPlayerIdMap, getBackendPlayerId } from '@/utils/game/gameHelpers';
import { REACTION_CARDS, ReactionCardType } from '@/constants/ReactionCard';

// Screens
import GameSetupScreen from './setup-game';
import CityHistoryModal from '@/components/modal/CityHistoryModal';
import TourLandingModal from '@/components/modal/TourLandingModal';
import { MechanicTrigger } from '@/types/worldTour.types';

export default function GameScreen() {
  const { t } = useTranslation();
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
    playMode,
    backstageInterval,
    pendingBackstageCard,
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
    clearFeaturing,
    applyBadReview,
    advancePlayerBoard,
    activateDoublePlatinum,
    setPendingBackstageCard,
  } = useGameScreenStore();

  // ── City History Modal ────────────────────────────────────────────────
  const [showCityHistory, setShowCityHistory] = useState(false);
  const selectedPlayerId = showCityHistory ? players[0]?.id : undefined;
  const handleCloseCityHistory = useCallback(() => setShowCityHistory(false), []);
  const handleOpenCityHistory = useCallback(() => setShowCityHistory(true), []);

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
  const gameInitializedRef = useRef(false);
  const [showAllianceModal, setShowAllianceModal] = useState(false);
  const [showBackstageModal, setShowBackstageModal] = useState(false);
  const [backstageBusy, setBackstageBusy] = useState(false);
  const [backstageTargetType, setBackstageTargetType] = useState<ReactionCardType | null>(null);
  const [allianceLockedPlayerId, setAllianceLockedPlayerId] = useState<string | null>(null);
  const [reactionTarget, setReactionTarget] = useState<{
    id: string;
    name: string;
    score: number;
  } | null>(null);

  // ── Turn Actions (must be before hooks that depend on advanceToNextTurn) ───
  const { advanceToNextTurn, resetProcessingRefs, isPowerCardProcessingRef } =
    useGameTurnActions({ nextTurn, prepareNextRound });
  const advanceToNextTurnWithBackstage = useCallback(() => {
    const pending = useGameStore.getState().pendingBackstageCard;
    if (pending) {
      setShowBackstageModal(true);
      return;
    }
    advanceToNextTurn();
  }, [advanceToNextTurn]);

  // ── Combo Flow ─────────────────────────────────────────────────────────────
  const {
    comboFlowState,
    activateCombo,
    handleComboNotificationClose,
    handlePowerCardScanned,
    handlePowerCardScanClose,
    handlePowerCardRewardConfirm,
  } = useComboFlow({
    playMode: playMode ?? 'physical',
    players,
    playerIdMap,
    addPowerCard,
    showSuccess,
    showError,
    advanceToNextTurn: advanceToNextTurnWithBackstage,
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

  const syncCanonicalResponse = useCallback((response: any) => {
    if (Array.isArray(response?.players)) {
      useGameStore.getState().syncPlayersFromBackend(response.players);
    }
    const session = response?.session;
    const backendToLocal = Object.fromEntries(
      Object.entries(playerIdMap).map(([local, backend]) => [backend, local]),
    );
    const alliancesSource = response?.alliances || session?.alliances || [];
    const mappedAlliances = alliancesSource
      .filter((a: any) => a.status === 'active' && a.roundsLeft > 0)
      .map((a: any) => ({
        id: a.id,
        player1Id: backendToLocal[a.player1Id] || a.player1Id,
        player2Id: backendToLocal[a.player2Id] || a.player2Id,
        roundsLeft: a.roundsLeft,
        createdAtRound: a.createdAtRound,
      }));
    const activeEffects = (response?.activeEffects || session?.activeEffects || []).filter((e: any) => e.status === 'active');
    const stopBlast = activeEffects.find((e: any) => e.type === 'STOP_BLAST');
    const duel = activeEffects.find((e: any) => e.type === 'DUEL');
    const featuring = activeEffects.find((e: any) => e.type === 'FEATURING');

    useGameStore.setState({
      alliances: mappedAlliances,
      doublePlatinumActive: Boolean(session?.doublePlatinumActive ?? useGameStore.getState().doublePlatinumActive),
      stopBlastActive: Boolean(stopBlast),
      stopBlastHolderId: stopBlast ? (backendToLocal[stopBlast.sourcePlayerId] || stopBlast.sourcePlayerId) : null,
      duelActive: Boolean(duel),
      duelPlayer1Id: duel ? (backendToLocal[duel.targetPlayerIds?.[0]] || duel.targetPlayerIds?.[0] || null) : null,
      duelPlayer2Id: duel ? (backendToLocal[duel.targetPlayerIds?.[1]] || duel.targetPlayerIds?.[1] || null) : null,
      featuringPlayerId: featuring ? (backendToLocal[featuring.sourcePlayerId] || featuring.sourcePlayerId) : null,
      featuringTargetId: featuring ? (backendToLocal[featuring.targetPlayerIds?.[0]] || featuring.targetPlayerIds?.[0] || null) : null,
    } as any);
  }, [playerIdMap]);

  const handleServerFeaturing = useCallback(async (portadorId: string, targetId: string) => {
    try {
      const response = await gameSessionService.applyReactionCard({
        sourcePlayerId: getBackendPlayerId(portadorId, players, playerIdMap),
        cardType: 'FEATURING',
        targetPlayerId: getBackendPlayerId(targetId, players, playerIdMap),
        idempotencyKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      });
      if (!response?.success) throw new Error(response?.error || 'No se pudo aplicar FEATURING');
      syncCanonicalResponse(response);
      if (useGameStore.getState().pendingBackstageCard?.cardType === 'FEATURING') {
        setPendingBackstageCard(null);
        setShowBackstageModal(false);
        advanceToNextTurn();
      }
    } catch (error) {
      showError('Error', error instanceof Error ? error.message : 'No se pudo aplicar FEATURING');
      await reconcileCanonicalScores();
      throw error;
    }
  }, [players, playerIdMap, syncCanonicalResponse, showError, reconcileCanonicalScores, setPendingBackstageCard, advanceToNextTurn]);

  const handleServerDuel = useCallback(async (challengerId: string, opponentId: string) => {
    try {
      const response = await gameSessionService.applyReactionCard({
        sourcePlayerId: getBackendPlayerId(challengerId, players, playerIdMap),
        cardType: 'DUEL',
        targetPlayerId: getBackendPlayerId(opponentId, players, playerIdMap),
        idempotencyKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      });
      if (!response?.success) throw new Error(response?.error || 'No se pudo aplicar DUEL');
      syncCanonicalResponse(response);
      if (useGameStore.getState().pendingBackstageCard?.cardType === 'DUEL') {
        setPendingBackstageCard(null);
        setShowBackstageModal(false);
        // DUEL must persist into the next round.
      }
    } catch (error) {
      showError('Error', error instanceof Error ? error.message : 'No se pudo aplicar DUEL');
      await reconcileCanonicalScores();
      throw error;
    }
  }, [players, playerIdMap, syncCanonicalResponse, showError, reconcileCanonicalScores, setPendingBackstageCard, advanceToNextTurn]);

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
    activateFeaturing: handleServerFeaturing as any,
    activateDuel: handleServerDuel as any,
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
    clearFeaturing,
    clearBets,
    featuringPlayerId,
    featuringTargetId,

    advanceToNextTurn: advanceToNextTurnWithBackstage,
    activateCombo,
    onBackstageReady: () => setShowBackstageModal(true),
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
      // Use ref to avoid infinite loop - set playerIdMap only once
      if (!gameInitializedRef.current) {
        gameInitializedRef.current = true;
        setPlayerIdMap(buildPlayerIdMap(players));
      }
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
  }, [soundEffects, testConnection, showWarning, showError]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive && players.length >= 2 && !gameStarted && !gameInitializedRef.current) {
      initializeGame();
    }
  }, [isActive, players.length, gameStarted]);

  useEffect(() => {
    if (flowState.phase === 'question' && flowState.currentRound) {
      setShowPointsModal(true);
    }
  }, [flowState.phase, flowState.currentRound, setShowPointsModal]);

  useEffect(() => {
    if (
      playMode === 'digital' &&
      pendingBackstageCard &&
      !showBackstageModal &&
      !backstageTargetType &&
      !landingEvent &&
      !comboFlowState.isActive &&
      !showPointsModal &&
      !showBettingModal &&
      !showFeaturingModal &&
      !showDuelModal &&
      !showAllianceModal
    ) {
      setShowBackstageModal(true);
    }
  }, [
    playMode,
    pendingBackstageCard,
    showBackstageModal,
    backstageTargetType,
    landingEvent,
    comboFlowState.isActive,
    showPointsModal,
    showBettingModal,
    showFeaturingModal,
    showDuelModal,
    showAllianceModal,
  ]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNextRound = useCallback(async () => {
    console.log('🎵 Next Round button pressed');
    if (useGameStore.getState().pendingBackstageCard) {
      try {
        await gameSessionService.discardBackstageCard(
          useGameStore.getState().pendingBackstageCard?.playerId,
        );
      } catch (error) {
        console.error('❌ Failed to discard pending backstage before next round:', error);
      }
      setPendingBackstageCard(null);
      setShowBackstageModal(false);
      setBackstageTargetType(null);
    }
    const success = await nextRound();
    if (success && flowState.currentRound) {
      showInfo(
        'Nueva Ronda',
        `Ronda ${flowState.currentRound.number} - ${flowState.currentRound.question.type.toUpperCase()}`,
      );
    }
  }, [nextRound, flowState.currentRound, showInfo, setPendingBackstageCard]);

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
    gameInitializedRef.current = false; // Reset ref for new game
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
        advanceToNextTurnWithBackstage();
        return;
      }

      switch (mechanicTrigger) {
        case 'reaction_card':
          advanceToNextTurnWithBackstage();
          break;
        case 'duel':
          if (landingEvent) openDuelModal(landingEvent.playerId);
          else advanceToNextTurnWithBackstage();
          break;
        case 'double_points':
          try {
            await gameSessionService.activateDoublePlatinum();
            activateDoublePlatinum();
            advanceToNextTurnWithBackstage();
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
          advanceToNextTurnWithBackstage();
          break;
        default:
          advanceToNextTurnWithBackstage();
      }
    },
    [
      setLandingEvent,
      advanceToNextTurnWithBackstage,
      landingEvent,
      activateDoublePlatinum,
      openDuelModal,
      showError,
    ],
  );

  const handleReactionCard = useCallback(
    async (cardType: ReactionCardType, playerId: string, targetLocalId?: string) => {
      try {
        // Selection-first cards: open UI, command sent on confirmation
        if (cardType === 'FEATURING') {
          handleFeaturingPlayer(playerId);
          return;
        }
        if (cardType === 'ALLIANCE') {
          const pending = useGameStore.getState().pendingBackstageCard;
          setAllianceLockedPlayerId(
            playMode === 'digital' && pending?.cardType === 'ALLIANCE'
              ? playerId
              : null,
          );
          setShowAllianceModal(true);
          return;
        }
        if (cardType === 'DUEL') {
          openDuelModal(playerId);
          return;
        }

        const sourceBackendId = getBackendPlayerId(playerId, players, playerIdMap);
        const targetBackendId = getBackendPlayerId(
          targetLocalId ?? playerId,
          players,
          playerIdMap,
        );
        const payload: Record<string, any> = {};
        if (cardType === 'COPYRIGHTS') {
          payload.lastAwardedPoints = lastAwardedPointsRef.current;
        }
        const needsTarget = ['BAD_REVIEW', 'MANAGEMENT_FEE', 'COPYRIGHTS', 'MUTE'].includes(cardType);

        const response = await gameSessionService.applyReactionCard({
          sourcePlayerId: sourceBackendId,
          cardType,
          targetPlayerId: needsTarget ? targetBackendId : undefined,
          payload,
          idempotencyKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        });

        if (!response?.success) {
          throw new Error(response?.error || 'No se pudo aplicar la Reaction Card');
        }

        syncCanonicalResponse(response);

        if (playMode === 'digital') {
          const pending = useGameStore.getState().pendingBackstageCard;
          if (pending && pending.cardType === cardType) {
            setPendingBackstageCard(null);
            setShowBackstageModal(false);
            // Cards with round-lasting effects must persist; local advanceToNextTurn()
            // would double-decrement server-synced freeze counters.
            const ROUND_LASTING_CARDS: ReactionCardType[] = [
              'STOP_BLAST',
              'MUTE',
              'ARTIST_HOLD',
            ];
            if (!ROUND_LASTING_CARDS.includes(cardType)) {
              advanceToNextTurn();
            }
          }
        }

        if (cardType === 'CHARITY_SHOW' && response.event) {
          const tiedNote = response.event.tiedRecipients > 1 ? ` (sorteado entre ${response.event.tiedRecipients})` : '';
          showSuccess('🎸 Charity Show', `${response.event.leaderName} le regaló 1pt a ${response.event.recipientName}${tiedNote}`);
        }
      } catch (error) {
        console.error('❌ Reaction Card command failed:', error);
        await reconcileCanonicalScores();
        if (playMode === 'digital') {
          const pending = useGameStore.getState().pendingBackstageCard;
          if (pending && pending.cardType === cardType) {
            setPendingBackstageCard(null);
            setShowBackstageModal(false);
            setBackstageTargetType(null);
          }
        }
        showError(
          'Error',
          error instanceof Error
            ? error.message
            : 'No se pudo aplicar la Reaction Card en el servidor.',
        );
      }
    },
    [
      handleFeaturingPlayer,
      openDuelModal,
      players,
      playerIdMap,
      lastAwardedPointsRef,
      syncCanonicalResponse,
      reconcileCanonicalScores,
      showError,
      showSuccess,
      playMode,
      setPendingBackstageCard,
      advanceToNextTurn,
    ],
  );

  const handleBackstageUse = useCallback(async () => {
    if (!pendingBackstageCard || backstageBusy) return;
    const localPlayerId = Object.keys(playerIdMap).find(
      (localId) => playerIdMap[localId] === pendingBackstageCard.playerId,
    );
    if (!localPlayerId) {
      showError('Error', 'No se pudo identificar el jugador del Backstage');
      return;
    }
    const needsTarget = ['MUTE', 'BAD_REVIEW', 'MANAGEMENT_FEE', 'COPYRIGHTS'].includes(
      pendingBackstageCard.cardType,
    );
    if (needsTarget) {
      setShowBackstageModal(false);
      setBackstageTargetType(pendingBackstageCard.cardType);
      return;
    }
    setBackstageBusy(true);
    try {
      await handleReactionCard(pendingBackstageCard.cardType, localPlayerId);
      const stillPending = useGameStore.getState().pendingBackstageCard;
      if (!stillPending || stillPending.cardType !== pendingBackstageCard.cardType) {
        setShowBackstageModal(false);
      } else {
        // Selection-first card: hide scene while the selection modal is open.
        setShowBackstageModal(false);
      }
    } finally {
      setBackstageBusy(false);
    }
  }, [pendingBackstageCard, backstageBusy, playerIdMap, handleReactionCard, showError]);

  const cancelPendingBackstageSelection = useCallback(
    async (expectedType: ReactionCardType) => {
      const pending = useGameStore.getState().pendingBackstageCard;
      if (!pending || pending.cardType !== expectedType) return;
      setBackstageBusy(true);
      try {
        await gameSessionService.discardBackstageCard(pending.playerId);
      } catch (error) {
        console.error('❌ Backstage cancel discard failed:', error);
      } finally {
        setPendingBackstageCard(null);
        setShowBackstageModal(false);
        setBackstageTargetType(null);
        setBackstageBusy(false);
        advanceToNextTurn();
      }
    },
    [setPendingBackstageCard, advanceToNextTurn],
  );

  const handleBackstageTargetSelect = useCallback(
    async (targetLocalId: string) => {
      if (!pendingBackstageCard || !backstageTargetType || backstageBusy) return;
      const localPlayerId = Object.keys(playerIdMap).find(
        (localId) => playerIdMap[localId] === pendingBackstageCard.playerId,
      );
      if (!localPlayerId) {
        showError('Error', 'No se pudo identificar el jugador del Backstage');
        return;
      }
      setBackstageBusy(true);
      try {
        await handleReactionCard(backstageTargetType, localPlayerId, targetLocalId);
        const stillPending = useGameStore.getState().pendingBackstageCard;
        if (!stillPending || stillPending.cardType !== backstageTargetType) {
          setBackstageTargetType(null);
        }
      } finally {
        setBackstageBusy(false);
      }
    },
    [pendingBackstageCard, backstageTargetType, backstageBusy, playerIdMap, handleReactionCard, showError],
  );

  const handleBackstageTargetCancel = useCallback(async () => {
    if (backstageTargetType) {
      await cancelPendingBackstageSelection(backstageTargetType);
      setBackstageTargetType(null);
    }
  }, [backstageTargetType, cancelPendingBackstageSelection]);


  const handleBackstageDiscard = useCallback(async () => {
    if (!pendingBackstageCard || backstageBusy) return;
    setBackstageBusy(true);
    try {
      await gameSessionService.discardBackstageCard(pendingBackstageCard.playerId);
      setPendingBackstageCard(null);
      setShowBackstageModal(false);
      setBackstageTargetType(null);
      advanceToNextTurn();
    } catch (error) {
      console.error('❌ Backstage discard failed:', error);
      showError(
        'Error',
        error instanceof Error ? error.message : 'No se pudo descartar la carta',
      );
    } finally {
      setBackstageBusy(false);
    }
  }, [
    pendingBackstageCard,
    backstageBusy,
    setPendingBackstageCard,
    advanceToNextTurn,
    showError,
  ]);

  const pendingBackstageCityName = pendingBackstageCard?.cityId
    ? t(`tour.cities.${pendingBackstageCard.cityId}.city`, {
        defaultValue: pendingBackstageCard.cityId,
      })
    : undefined;

  // ── Early Returns ──────────────────────────────────────────────────────────
  if (!isActive && !showGameEndModal) {
    return <GameSetupScreen />;
  }

  if (!isActive && showGameEndModal) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle='light-content' />
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
      <StatusBar barStyle='light-content' />
      <GameFeedback messages={messages} onMessageDismiss={dismissFeedback} />

      <ScrollView>
        <GameHeader
          timeLeft={timeLeft}
          currentPhase={flowState.phase}
          onOpenAlliances={() => setShowAllianceModal(true)}
          onCityHistoryPress={handleOpenCityHistory}
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
          onPlayerPress={playMode === 'digital' ? undefined : setReactionTarget}
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
        lockedPlayerId={allianceLockedPlayerId}
        onClose={() => {
          setShowAllianceModal(false);
          setAllianceLockedPlayerId(null);
          void cancelPendingBackstageSelection('ALLIANCE');
        }}
        onDeclare={async (player1Id, player2Id) => {
          try {
            const response = await gameSessionService.applyReactionCard({
              sourcePlayerId: getBackendPlayerId(player1Id, players, playerIdMap),
              cardType: 'ALLIANCE',
              targetPlayerId: getBackendPlayerId(player2Id, players, playerIdMap),
              idempotencyKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            });
            if (!response?.success) throw new Error(response?.error || 'No se pudo crear la alianza');
            syncCanonicalResponse(response);
            setShowAllianceModal(false);
            setAllianceLockedPlayerId(null);
            if (useGameStore.getState().pendingBackstageCard?.cardType === 'ALLIANCE') {
              setPendingBackstageCard(null);
              setShowBackstageModal(false);
              // ALLIANCE has round duration; avoid double-decrement on local/server advance.
            }
          } catch (error) {
            showError('Error', error instanceof Error ? error.message : 'No se pudo crear la alianza');
            await reconcileCanonicalScores();
            throw error;
          }
        }}
        onDissolve={async (allianceId) => {
          try {
            const response = await gameSessionService.dissolveAlliance(allianceId);
            if (!response?.success) throw new Error(response?.error || 'No se pudo disolver la alianza');
            syncCanonicalResponse(response);
          } catch (error) {
            showError('Error', error instanceof Error ? error.message : 'No se pudo disolver la alianza');
            await reconcileCanonicalScores();
          }
        }}
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
        onClose={() => {
          closeFeaturingModal();
          void cancelPendingBackstageSelection('FEATURING');
        }}
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

      <PowerCardRewardModal
        visible={comboFlowState.showReward && !!comboFlowState.cardAwarded}
        onConfirm={handlePowerCardRewardConfirm}
        playerName={comboFlowState.playerName || ''}
        card={comboFlowState.cardAwarded}
      />

      <LossStreakModal
        visible={Boolean(
          bSideNotification?.visible && canShowBSideNotification,
        )}
        playerNames={bSideNotification?.playerNames ?? []}
        onClose={() => setBSideNotification(null)}
        playMode={playMode}
      />

      <DuelModal
        visible={showDuelModal}
        challengerId={duelChallengerId ?? ''}
        challengerName={
          players.find((p) => p.id === duelChallengerId)?.name ?? ''
        }
        players={players}
        onSelectOpponent={handleDuelOpponentSelected}
        onClose={() => {
          closeDuelModal();
          void cancelPendingBackstageSelection('DUEL');
        }}
      />

      <ReactionCardPickerModal
        visible={playMode !== 'digital' && reactionTarget !== null}
        targetPlayer={reactionTarget}
        disabledCards={reactionDisabledCards}
        onSelect={handleReactionCard}
        onClose={() => setReactionTarget(null)}
      />

      <BackstageModal
        visible={showBackstageModal && pendingBackstageCard !== null}
        card={pendingBackstageCard}
        cityName={pendingBackstageCityName}
        onUse={handleBackstageUse}
        onDiscard={handleBackstageDiscard}
      />

      <BackstageTargetModal
        visible={backstageTargetType !== null && pendingBackstageCard !== null}
        cardLabel={
          REACTION_CARDS.find((c) => c.type === backstageTargetType)?.label ??
          backstageTargetType ??
          ''
        }
        cardEmoji={
          REACTION_CARDS.find((c) => c.type === backstageTargetType)?.emoji ?? '🎟️'
        }
        sourcePlayerId={
          pendingBackstageCard
            ? Object.keys(playerIdMap).find(
                (id) => playerIdMap[id] === pendingBackstageCard.playerId,
              ) ?? ''
            : ''
        }
        players={players}
        onSelectTarget={handleBackstageTargetSelect}
        onClose={() => void handleBackstageTargetCancel()}
      />

      <TourLandingModal
        visible={landingEvent !== null}
        event={landingEvent}
        onContinue={handleTourLandingContinue}
/>

      <CityHistoryModal
        visible={showCityHistory}
        onClose={handleCloseCityHistory}
        playerId={selectedPlayerId}
      />
    </View>
  );
}
