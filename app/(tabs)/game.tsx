import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, StatusBar } from 'react-native';
// External Components
import AudioPlayer from '@/components/game/AudioPlayer';
import GameEndModal from '@/components/game/GameEndModal';
import GameFeedback, { useFeedback } from '@/components/game/GameFeedback';
import PlayerScoreboard from '@/components/game/PlayerScoreboard';
import BettingModal from '@/components/modal/BettingModal';
import { ComboNotification } from '@/components/rewards/ComboNotification';
import { PowerCardScanModal } from '@/components/powercard/PowerCardScanModal';

// Hooks & Services
import { useGameFlow } from '@/hooks/useGameFlow';
import { useGameStore } from '@/store/gameStore';
import { gameSessionService } from '@/services/GameSessionService';
import { soundEffects } from '@/services/SoundEffectsService';

// Constants
import { REPRODUCTION_TIME_LIMIT } from '@/constants/TrackConfig';
import { SCORE_TO_WIN } from '@/constants/Points';

// Types
import { getBackendPlayerId } from '@/utils/game/gameHelpers';
import GameSetupScreen from '../setup-game';
import { styles } from '@/components/game/gameScreen/styles';
import { GameHeader } from '@/components/game/gameScreen/GameHeader';
import { GamePot } from '@/components/game/gameScreen/GamePot';
import { CurrentTurn } from '@/components/game/gameScreen/CurrentTurn';
import { MainAction } from '@/components/game/gameScreen/MainAction';
import PointsAwardModal from '@/components/game/gameScreen/PointsAwardModal';
import AllianceModal from '@/components/modal/AllianceModal';
import FeaturingModal from '@/components/modal/FeaturingModal';
import LossStreakModal from '@/components/modal/LossStreakModal';

export default function GameScreen() {
  const { t } = useTranslation();

  // Store
  const players = useGameStore((state) => state.players ?? []);
  const isActive = useGameStore((state) => state.isActive);
  const timeLeft = useGameStore((state) => state.timeLeft);
  const showGameEndModal = useGameStore((state) => state.showGameEndModal);
  const round = useGameStore((state) => state.round);
  const gamePot = useGameStore((state) => state.gamePot);
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
  // ✅ FREEZE — selector junto al resto de acciones del store
  const toggleFreezePlayer = useGameStore((state) => state.toggleFreezePlayer);

  // Featuring state
  const featuringPlayerId = useGameStore((state) => state.featuringPlayerId);
  const featuringTargetId = useGameStore((state) => state.featuringTargetId);
  const activateFeaturing = useGameStore((state) => state.activateFeaturing);
  const clearFeaturing = useGameStore((state) => state.clearFeaturing);

  const updateLossStreaks = useGameStore((state) => state.updateLossStreaks);
  const applyBSideBonus = useGameStore((state) => state.applyBSideBonus);

  const [bSideNotification, setBSideNotification] = useState<{
    visible: boolean;
    playerNames: string[];
  } | null>(null);

  // 2. Estado local para el modal:
  const [showFeaturingModal, setShowFeaturingModal] = useState(false);
  const [featuringPortadorId, setFeaturingPortadorId] = useState<string | null>(
    null,
  );

  // Local State
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showAllianceModal, setShowAllianceModal] = useState(false);
  const [playerIdMap, setPlayerIdMap] = useState<Record<string, string>>({});
  const [gameStarted, setGameStarted] = useState(false);

  const stopBlastActive = useGameStore((state) => state.stopBlastActive);
  const stopBlastHolderId = useGameStore((state) => state.stopBlastHolderId);
  const activateStopBlast = useGameStore((state) => state.activateStopBlast);

  // Game Flow
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

  // Feedback
  const {
    messages,
    dismissFeedback,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  } = useFeedback();

  // ✅ COMBO FLOW STATE - Initial state object for reuse
  const INITIAL_COMBO_STATE = {
    isActive: false,
    showNotification: false,
    showScanner: false,
    playerId: null as string | null,
    playerName: '',
    comboName: '',
    comboEmoji: '',
    comboDescription: '',
  };

  const [comboFlowState, setComboFlowState] = useState(INITIAL_COMBO_STATE);

  // Refs for preventing duplicate operations
  const isPowerCardProcessingRef = useRef(false);
  const isAdvancingTurnRef = useRef(false);

  // ✅ Memoized derived state
  const currentPlayer = useMemo(
    () => players.find((p) => p.isCurrentTurn),
    [players],
  );

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players],
  );

  const currentPhase = flowState.phase;

  // ✅ Memoized betting button visibility
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

  // ✅ Memoized canStartNextRound - CRITICAL FIX
  const canStart = useMemo(() => {
    const comboActive = comboFlowState.isActive;
    const isLoading = flowState.isLoading;
    const phase = flowState.phase;

    console.log('🔍 canStart check:', {
      comboFlowStateIsActive: comboActive,
      flowStateIsLoading: isLoading,
      flowStatePhase: phase,
    });

    if (comboActive) {
      console.log('⛔ canStart blocked by comboFlowState.isActive');
      return false;
    }

    const result = !isLoading && (phase === 'answer' || phase === 'idle');
    console.log(`✅ canStart result: ${result}`);
    return result;
  }, [flowState.isLoading, flowState.phase, comboFlowState.isActive]);

  // Effects
  useEffect(() => {
    if (isActive && players.length >= 2 && !gameStarted) {
      initializeGame();
    }
  }, [isActive, players.length, gameStarted]);

  useEffect(() => {
    if (flowState.phase === 'question' && flowState.currentRound) {
      setShowPointsModal(true);
    }
  }, [flowState.phase, flowState.currentRound]);

  // ✅ Safety: Reset refs if stuck for too long
  useEffect(() => {
    let safetyTimer: NodeJS.Timeout | null = null;

    if (comboFlowState.isActive) {
      safetyTimer = setTimeout(() => {
        console.warn(
          '⚠️ Safety: Combo flow was active for too long, resetting',
        );
        setComboFlowState(INITIAL_COMBO_STATE);
        isPowerCardProcessingRef.current = false;
        isAdvancingTurnRef.current = false;
      }, 30000);
    }

    return () => {
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [comboFlowState.isActive]);

  const committedFeaturingIds = useMemo<string[]>(() => {
    const ids: string[] = [];
    if (featuringPlayerId) ids.push(featuringPlayerId);
    if (featuringTargetId) ids.push(featuringTargetId);
    return ids;
  }, [featuringPlayerId, featuringTargetId]);

  const handleScoreboardUsePowerCard = useCallback(
    async (playerId: string, cardId: string) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) {
        showError('Error', 'Jugador no encontrado');
        return;
      }

      const powerCard = player.powerCards.find((pc) => pc.id === cardId);
      if (!powerCard) {
        showError('Error', 'Carta no encontrada en el inventario');
        return;
      }

      if (powerCard.currentUses >= powerCard.usageLimit) {
        showError('Error', 'Esta carta ya fue usada');
        return;
      }

      if (player.boostActive) {
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
          const usePowerCardStore = useGameStore.getState().usePowerCard;
          usePowerCardStore(playerId, cardId);

          showSuccess(
            '⚡ ¡Carta Activada!',
            `${player.name} activó ${powerCard.emoji || '⚡'} ${powerCard.name}\n¡Tu próxima respuesta correcta vale x2 puntos!`,
          );

          console.log(`✅ PowerCard activated: ${powerCard.name}`);
        } else {
          showError('Error', result.error || 'No se pudo activar la carta');
        }
      } catch (error: any) {
        console.error('❌ Error using power card:', error);
        showError('Error', error.message || 'No se pudo usar la carta');
      }
    },
    [players, playerIdMap, showSuccess, showError],
  );

  const initializeGame = useCallback(async () => {
    try {
      console.log('🎮 Initializing game...');

      const idMap: Record<string, string> = {};
      players.forEach((player, index) => {
        idMap[player.id] = `player_${index + 1}`;
      });
      setPlayerIdMap(idMap);

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

  const handleStartBetting = useCallback(() => {
    if (!flowState.currentRound || flowState.currentRound.number === 1) {
      return;
    }
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

      const backendPlayerId = getBackendPlayerId(
        playerId,
        players,
        playerIdMap,
      );
      const result = await placeBetBackend(backendPlayerId, tokenValue);

      if (result.success) {
        showSuccess(
          'Token Usado',
          `${player.name} usó token +${tokenValue} puntos`,
        );
      } else {
        showError('Error', 'No se pudo registrar en el servidor');
      }
    },
    [
      players,
      playerIdMap,
      placeBetStore,
      placeBetBackend,
      showSuccess,
      showError,
    ],
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

  const advanceToNextTurn = useCallback(() => {
    if (isAdvancingTurnRef.current) {
      console.log('⏳ Already advancing turn, skipping');
      return;
    }
    isAdvancingTurnRef.current = true;

    console.log('🔄 Advancing to next turn');

    setTimeout(() => {
      nextTurn();
      prepareNextRound();

      setTimeout(() => {
        isAdvancingTurnRef.current = false;
        console.log('✅ Turn advance complete');
      }, 100);
    }, 50);
  }, [nextTurn, prepareNextRound]);

  const handleWrongAnswer = useCallback(async () => {
    soundEffects.playWrong();
    const result = await revealAnswer(null);

    if (result) {
      showInfo(
        'Nadie Acertó',
        `La respuesta era: ${result.correctAnswer}\n"${result.trackInfo.title}" - ${result.trackInfo.artist}`,
      );
    }

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

    // ✅ B-SIDE — nadie ganó → todos suman lossStreak
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
    updateLossStreaks, // ← agregar a dependencias
  ]);

  const applyFeaturingBonus = useGameStore(
    (state) => state.applyFeaturingBonus,
  );

  const handleAwardPoints = useCallback(
    async (playerId: string) => {
      if (!flowState.currentRound) return;

      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      soundEffects.playCorrect();
      const backendPlayerId = getBackendPlayerId(
        playerId,
        players,
        playerIdMap,
      );

      // 1️⃣ Backend calcula los puntos del ganador (100%)
      const result = await revealAnswer(backendPlayerId);

      if (result) {
        const pts = result.pointsAwarded as number;

        showSuccess(
          '🎉 ¡Correcto!',
          `${player.name} gana ${pts} pts\n"${result.trackInfo.title}" - ${result.trackInfo.artist}`,
        );

        // 2️⃣ Alliance 50/50
        if (pts) awardAllianceBonus(playerId, pts);

        // 3️⃣ Featuring 100/100
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

        // 4️⃣ B-SIDE comeback +1
        const bSideApplied = applyBSideBonus(playerId);
        if (bSideApplied) {
          showSuccess('🎶 ¡B-SIDE!', `${player.name} recupera con +1 bonus`);
        }

        // 5️⃣ Actualizar lossStreaks — el ganador resetea, el resto suma
        const newlyActivated = updateLossStreaks(playerId);
        if (newlyActivated.length > 0) {
          const names = newlyActivated
            .map((id) => players.find((p) => p.id === id)?.name)
            .filter((name): name is string => !!name);
          setBSideNotification({ visible: true, playerNames: names });
        }

        // 6️⃣ Combo flow
        if (result.comboStatus) {
          isPowerCardProcessingRef.current = false;
          isAdvancingTurnRef.current = false;

          setComboFlowState({
            isActive: true,
            showNotification: true,
            showScanner: false,
            playerId,
            playerName: player.name,
            comboName: result.comboStatus.type.replace('_', ' '),
            comboEmoji: '🔥',
            comboDescription: result.comboStatus.message,
          });

          setShowPointsModal(false);
          return;
        }

        // 7️⃣ Game over
        if (result.gameOver && result.gameWinner) {
          setTimeout(() => setShowGameEndModal(true), 1500);
          setShowPointsModal(false);
          return;
        }
      }

      setShowPointsModal(false);
      setTimeout(() => advanceToNextTurn(), 2000);
    },
    [
      flowState.currentRound,
      players,
      playerIdMap,
      revealAnswer,
      showSuccess,
      setShowGameEndModal,
      advanceToNextTurn,
      awardAllianceBonus,
      applyFeaturingBonus,
      applyBSideBonus,
      updateLossStreaks,
      featuringPlayerId,
      featuringTargetId,
      clearFeaturing,
    ],
  );

  const handleNewGame = useCallback(() => {
    setShowGameEndModal(false);
    setGameActive(false);
    setGameStarted(false);
    soundEffects.dispose();
    gameSessionService.clearCurrentSession();
    createNewGame();
  }, [setShowGameEndModal, setGameActive, createNewGame]);

  const handleBackToMenu = useCallback(() => {
    setShowGameEndModal(false);
    setGameActive(false);
    setGameStarted(false);
    gameSessionService.clearCurrentSession();
    createNewGame();
  }, [setShowGameEndModal, setGameActive, createNewGame]);

  const handleComboNotificationClose = useCallback(() => {
    console.log('✅ Combo notification closed, opening scanner');
    isPowerCardProcessingRef.current = false;

    setComboFlowState((prev) => ({
      ...prev,
      showNotification: false,
      showScanner: true,
    }));
  }, []);

  const handlePowerCardScanned = useCallback(
    async (qrCode: string) => {
      console.log('🔥 handlePowerCardScanned called with:', qrCode);

      if (isPowerCardProcessingRef.current) {
        console.log('⏳ Already processing power card, ignoring');
        return;
      }
      isPowerCardProcessingRef.current = true;

      const playerIdForScan = comboFlowState.playerId;
      const playerNameForScan = comboFlowState.playerName;

      setComboFlowState({
        isActive: false,
        showNotification: false,
        showScanner: false,
        playerId: null,
        playerName: '',
        comboName: '',
        comboEmoji: '',
        comboDescription: '',
      });

      if (!playerIdForScan) {
        console.error('❌ No player ID for scan');
        showError('Error', 'No se encontró el jugador del combo');
        isPowerCardProcessingRef.current = false;
        setTimeout(() => advanceToNextTurn(), 200);
        return;
      }

      const player = players.find((p) => p.id === playerIdForScan);
      if (!player) {
        console.error('❌ Player not found');
        showError('Error', 'Jugador no encontrado');
        isPowerCardProcessingRef.current = false;
        setTimeout(() => advanceToNextTurn(), 200);
        return;
      }

      try {
        console.log(
          `🔍 Scanning power card QR: ${qrCode} for player ${playerIdForScan}`,
        );

        const backendPlayerId = getBackendPlayerId(
          playerIdForScan,
          players,
          playerIdMap,
        );

        const result = await gameSessionService.scanPowerCard(
          qrCode,
          backendPlayerId,
        );

        if (result.success) {
          console.log(`✅ Power card scanned: ${result.data.cardName}`);

          const powerCard = {
            id: result.data.cardId,
            name: result.data.cardName,
            emoji: result.data.emoji,
            type: result.data.cardId.split('_')[1],
            currentUses: 0,
            usageLimit: 1,
          };

          addPowerCard(playerIdForScan, powerCard);

          showSuccess(
            '⚡ ¡Carta Obtenida!',
            `${playerNameForScan} ha obtenido: ${result.data.emoji} ${result.data.cardName}`,
          );
        } else {
          showError('Error', 'No se pudo añadir la carta');
        }
      } catch (error: any) {
        console.error('❌ Error scanning power card:', error);
        showError('Error', error.message || 'No se pudo escanear la carta');
      }

      console.log('🧹 Cleanup complete, advancing to next turn');
      isPowerCardProcessingRef.current = false;

      setTimeout(() => {
        console.log('🔄 Calling advanceToNextTurn');
        advanceToNextTurn();
      }, 300);
    },
    [
      comboFlowState.playerId,
      comboFlowState.playerName,
      players,
      playerIdMap,
      addPowerCard,
      showSuccess,
      showError,
      advanceToNextTurn,
    ],
  );

  const handlePowerCardScanClose = useCallback(() => {
    console.log('⭕ Power card scan skipped');

    if (isPowerCardProcessingRef.current) {
      console.log('⏳ Processing in progress, ignoring close');
      return;
    }
    isPowerCardProcessingRef.current = true;

    setComboFlowState({
      isActive: false,
      showNotification: false,
      showScanner: false,
      playerId: null,
      playerName: '',
      comboName: '',
      comboEmoji: '',
      comboDescription: '',
    });

    isPowerCardProcessingRef.current = false;

    setTimeout(() => {
      advanceToNextTurn();
    }, 300);
  }, [advanceToNextTurn]);

  const handleFeaturingPlayer = useCallback(
    (playerId: string) => {
      // Si ya tiene featuring activo → cancelar
      if (featuringPlayerId === playerId) {
        clearFeaturing();
        return;
      }
      // Abrir modal para elegir compañero
      setFeaturingPortadorId(playerId);
      setShowFeaturingModal(true);
    },
    [featuringPlayerId, clearFeaturing],
  );

  // Handler cuando el GM selecciona el compañero en el modal:
  const handleFeaturingPartnerSelected = useCallback(
    (partnerId: string) => {
      if (!featuringPortadorId) return;
      activateFeaturing(featuringPortadorId, partnerId);
      setShowFeaturingModal(false);
      setFeaturingPortadorId(null);
    },
    [featuringPortadorId, activateFeaturing],
  );

  // ✅ FREEZE — handler antes de los early returns
  const handleFreezePlayer = useCallback(
    (playerId: string) => {
      toggleFreezePlayer(playerId);
    },
    [toggleFreezePlayer],
  );

  const handleStopBlast = useCallback(
    (playerId: string) => {
      activateStopBlast(playerId);
    },
    [activateStopBlast],
  );

  // Early returns — SIEMPRE después de todos los hooks
  if (!isActive && !showGameEndModal) {
    return <GameSetupScreen />;
  }

  if (!isActive && showGameEndModal) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle='light-content' backgroundColor='#0F172A' />
        <GameEndModal
          visible={true}
          players={players}
          gameTimeElapsed={1200 - timeLeft}
          totalRounds={round}
          onNewGame={handleNewGame}
          onBackToMenu={handleBackToMenu}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />
      <GameFeedback messages={messages} onMessageDismiss={dismissFeedback} />
      <ScrollView>
        <GameHeader
          timeLeft={timeLeft}
          currentPhase={currentPhase}
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

        <CurrentTurn
          currentPlayerName={currentPlayer?.name || ''}
          round={round}
          currentPhase={currentPhase}
        />

        <MainAction
          isLoading={flowState.isLoading}
          currentPhase={currentPhase}
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
          onFreezePlayer={handleFreezePlayer}
          onFeaturingPlayer={handleFeaturingPlayer}
          onStopBlast={handleStopBlast}
          stopBlastHolderId={stopBlastHolderId}
          featuringPlayerId={featuringPlayerId}
          featuringTargetId={featuringTargetId}
        />
      </ScrollView>
      {/* Modals */}
      <PointsAwardModal
        visible={showPointsModal}
        flowState={flowState}
        players={players}
        onAwardPoints={handleAwardPoints}
        onWrongAnswer={handleWrongAnswer}
        onClose={() => setShowPointsModal(false)}
        stopBlastActive={stopBlastActive}
        stopBlastHolderId={stopBlastHolderId}
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
        onClose={() => {
          setShowFeaturingModal(false);
          setFeaturingPortadorId(null);
        }}
      />
      <GameEndModal
        visible={showGameEndModal}
        players={players}
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
        visible={bSideNotification?.visible ?? false}
        playerNames={bSideNotification?.playerNames ?? []}
        onClose={() => setBSideNotification(null)}
      />
    </View>
  );
}
