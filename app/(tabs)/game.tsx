import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';

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

export default function GameScreen() {
  const { t } = useTranslation();

  // Store - use shallow comparison to prevent unnecessary re-renders
  const players = useGameStore((state) => state.players);
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
    getCurrentPhase,
    canStartNextRound,
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

  // Local State
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [playerIdMap, setPlayerIdMap] = useState<Record<string, string>>({});
  const [gameStarted, setGameStarted] = useState(false);
  const [showComboNotification, setShowComboNotification] = useState(false);
  const [comboData, setComboData] = useState<{
    playerName: string;
    comboName: string;
    comboEmoji: string;
    comboDescription: string;
  } | null>(null);
  const [showPowerCardScan, setShowPowerCardScan] = useState(false);
  const [comboPlayerId, setComboPlayerId] = useState<string | null>(null);

  // Refs for preventing duplicate operations
  const isPowerCardProcessingRef = useRef(false);
  const isAdvancingTurnRef = useRef(false);

  // ✅ Memoized derived state to prevent re-renders
  const currentPlayer = useMemo(
    () => players.find((p) => p.isCurrentTurn),
    [players],
  );

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players],
  );

  const currentPhase = flowState.phase;

  // ✅ Memoized betting button visibility - NO console.log here!
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

  // ✅ Memoized canStartNextRound
  const canStart = useMemo(() => {
    return (
      !flowState.isLoading &&
      (flowState.phase === 'answer' || flowState.phase === 'idle')
    );
  }, [flowState.isLoading, flowState.phase]);

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

  const handleUsePowerCard = useCallback(
    async (cardId: string) => {
      if (!currentPlayer) {
        showError('Error', 'No hay jugador actual');
        return;
      }

      try {
        const backendPlayerId = getBackendPlayerId(
          currentPlayer.id,
          players,
          playerIdMap,
        );

        const result = await gameSessionService.usePowerCard(
          backendPlayerId,
          cardId,
        );

        if (result.success) {
          showSuccess(
            '⚡ Carta Activada',
            `${currentPlayer.name} activó una PowerCard`,
          );
        } else {
          showError('Error', 'No se pudo activar la carta');
        }
      } catch (error: any) {
        showError('Error', error.message || 'No se pudo usar la carta');
      }
    },
    [currentPlayer, players, playerIdMap, showSuccess, showError],
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

  // Centralized function to advance turn
  const advanceToNextTurn = useCallback(() => {
    if (isAdvancingTurnRef.current) {
      return;
    }
    isAdvancingTurnRef.current = true;

    console.log('🔄 Advancing to next turn');
    nextTurn();
    clearBets();
    prepareNextRound();

    setTimeout(() => {
      isAdvancingTurnRef.current = false;
    }, 500);
  }, [nextTurn, clearBets, prepareNextRound]);

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

    clearBets();
    setShowPointsModal(false);

    setTimeout(() => {
      advanceToNextTurn();
    }, 2000);
  }, [
    revealAnswer,
    players,
    clearBets,
    showInfo,
    showWarning,
    advanceToNextTurn,
  ]);

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

      const result = await revealAnswer(backendPlayerId);

      if (result) {
        showSuccess(
          '🎉 ¡Correcto!',
          `${player.name} gana ${result.pointsAwarded} puntos\n"${result.trackInfo.title}" - ${result.trackInfo.artist}`,
        );

        // CHECK FOR COMBO
        if (result.comboStatus) {
          console.log('🔥 COMBO DETECTED:', result.comboStatus);

          setComboPlayerId(playerId);
          isPowerCardProcessingRef.current = false;

          setComboData({
            playerName: player.name,
            comboName: result.comboStatus.type.replace('_', ' '),
            comboEmoji: '🔥',
            comboDescription: result.comboStatus.message,
          });

          setShowComboNotification(true);
          setShowPointsModal(false);

          // Auto-close combo notification after 4 seconds
          setTimeout(() => {
            setShowComboNotification(false);
            setTimeout(() => {
              setShowPowerCardScan(true);
            }, 500);
          }, 4000);

          return;
        }

        if (result.gameOver && result.gameWinner) {
          setTimeout(() => {
            setShowGameEndModal(true);
          }, 1500);
          setShowPointsModal(false);
          return;
        }
      }

      setShowPointsModal(false);

      setTimeout(() => {
        advanceToNextTurn();
      }, 2000);
    },
    [
      flowState.currentRound,
      players,
      playerIdMap,
      revealAnswer,
      showSuccess,
      setShowGameEndModal,
      advanceToNextTurn,
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

  // Cleanup function for power card flow
  const cleanupAfterPowerCard = useCallback(() => {
    console.log('🧹 Cleaning up after power card flow');
    setComboPlayerId(null);
    setComboData(null);
    setShowComboNotification(false);
    setShowPowerCardScan(false);

    setTimeout(() => {
      advanceToNextTurn();
      isPowerCardProcessingRef.current = false;
    }, 500);
  }, [advanceToNextTurn]);

  const handlePowerCardScanned = useCallback(
    async (qrCode: string) => {
      console.log('📥 handlePowerCardScanned called');

      if (isPowerCardProcessingRef.current) {
        console.log('⏳ Already processing power card, ignoring');
        return;
      }
      isPowerCardProcessingRef.current = true;

      // IMMEDIATELY close the scan modal
      setShowPowerCardScan(false);

      const playerIdForScan = comboPlayerId;

      if (!playerIdForScan) {
        showError('Error', 'No se encontró el jugador del combo');
        cleanupAfterPowerCard();
        return;
      }

      const player = players.find((p) => p.id === playerIdForScan);
      if (!player) {
        showError('Error', 'Jugador no encontrado');
        cleanupAfterPowerCard();
        return;
      }

      try {
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
            `${player.name} ha obtenido: ${result.data.emoji} ${result.data.cardName}`,
          );
          console.log(`✅ Power card added to ${player.name}`);
        } else {
          showError('Error', 'No se pudo añadir la carta');
        }
      } catch (error: any) {
        showError('Error', error.message || 'No se pudo escanear la carta');
      }

      cleanupAfterPowerCard();
    },
    [
      comboPlayerId,
      players,
      playerIdMap,
      addPowerCard,
      showSuccess,
      showError,
      cleanupAfterPowerCard,
    ],
  );

  const handlePowerCardScanClose = useCallback(() => {
    console.log('⭕ Power card scan skipped');

    if (isPowerCardProcessingRef.current) {
      return;
    }
    isPowerCardProcessingRef.current = true;

    setShowPowerCardScan(false);
    cleanupAfterPowerCard();
  }, [cleanupAfterPowerCard]);

  // Early returns
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
        <GameHeader timeLeft={timeLeft} currentPhase={currentPhase} />

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

      <GameEndModal
        visible={showGameEndModal}
        players={players}
        gameTimeElapsed={1200 - timeLeft}
        totalRounds={round}
        onNewGame={handleNewGame}
        onBackToMenu={handleBackToMenu}
      />

      {comboData && (
        <ComboNotification
          visible={showComboNotification}
          onClose={() => {
            setShowComboNotification(false);
            setTimeout(() => setShowPowerCardScan(true), 300);
          }}
          comboName={comboData.comboName}
          comboEmoji={comboData.comboEmoji}
          comboDescription={comboData.comboDescription}
          playerName={comboData.playerName}
        />
      )}

      {comboData && comboPlayerId && (
        <PowerCardScanModal
          visible={showPowerCardScan}
          onClose={handlePowerCardScanClose}
          onCardScanned={handlePowerCardScanned}
          playerName={comboData.playerName}
          comboType={comboData.comboName}
        />
      )}
    </View>
  );
}
