import React, { useState } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';

// External Components
import AudioPlayer from '@/components/game/AudioPlayer';
import GameEndModal from '@/components/game/GameEndModal';
import GameFeedback, { useFeedback } from '@/components/game/GameFeedback';
import PlayerScoreboard from '@/components/game/PlayerScoreboard';
import BettingModal from '@/components/modal/BettingModal';

// Hooks & Services
import { useGameFlow } from '@/hooks/useGameFlow';
import { useGameStore } from '@/store/gameStore';
import { gameSessionService } from '@/services/GameSessionService';
import { soundEffects } from '@/services/SoundEffectsService';

// Constants
import { REPRODUCTION_TIME_LIMIT } from '@/constants/TrackConfig';
import { SCORE_TO_WIN } from '@/constants/Points';

// Types
import type { Player as StorePlayer } from '@/store/gameStore';
import { getBackendPlayerId, validateBet } from '@/utils/game/gameHelpers';
import GameSetupScreen from '../setup-game';
import { styles } from '@/components/game/gameScreen/styles';
import { GameHeader } from '@/components/game/gameScreen/GameHeader';
import { BettingPhase } from '@/components/game/gameScreen/BettingPhase';
import { GamePot } from '@/components/game/gameScreen/GamePot';
import { CurrentTurn } from '@/components/game/gameScreen/CurrentTurn';
import { MainAction } from '@/components/game/gameScreen/MainAction';
import PointsAwardModal from '@/components/game/gameScreen/PointsAwardModal';

// Custom hook para efectos
const useGameEffects = () => {
  const { flowState, getBettingStatus, getCurrentPhase, testConnection } =
    useGameFlow();
  const { isActive, error, setError, setShowGameEndModal } = useGameStore();
  const { showError, showWarning } = useFeedback();

  const bettingStatus = getBettingStatus();
  const currentPhase = getCurrentPhase();

  // Aquí irían los useEffect originales...
  // Pero para simplificar, los mantendremos en el componente principal
  // O puedes moverlos aquí

  return {
    shouldShowPointsModal:
      flowState.questionVisible &&
      flowState.currentRound &&
      !bettingStatus.isActive &&
      currentPhase === 'question',
  };
};

export default function GameScreen() {
  const { t } = useTranslation();

  // Store
  const {
    players,
    isActive,
    timeLeft,
    showGameEndModal,
    round,
    placeBet,
    setShowGameEndModal,
    createNewGame,
    nextTurn,
    clearBets,
    gamePot,
  } = useGameStore();

  // Game Flow
  const {
    flowState,
    nextRound,
    handleAudioFinished,
    revealAnswer,
    placeBet: placeBetBackend,
    endBettingPhase,
    prepareNextRound,
    resetFlow,
    testConnection,
    getBettingStatus,
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

  // Derived state
  const currentPlayer = players.find((p) => p.isCurrentTurn);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const bettingStatus = getBettingStatus();
  const currentPhase = getCurrentPhase();

  // Effects
  React.useEffect(() => {
    if (isActive) {
      checkBackendConnection();
      soundEffects.initialize();

      // Crear mapa de IDs
      const idMap: Record<string, string> = {};
      players.forEach((player, index) => {
        idMap[player.id] = `player_${index + 1}`;
      });
      setPlayerIdMap(idMap);
      console.log('📋 Player ID Map created:', idMap);
    }
  }, [isActive, players.length]);

  React.useEffect(() => {
    // Show points modal effect
    if (
      flowState.questionVisible &&
      flowState.currentRound &&
      !bettingStatus.isActive &&
      currentPhase === 'question'
    ) {
      setShowPointsModal(true);
    }
  }, [
    flowState.questionVisible,
    flowState.currentRound,
    bettingStatus.isActive,
    currentPhase,
  ]);

  // Handlers (mantén los mismos handlers que en tu código original)
  const checkBackendConnection = async () => {
    const isConnected = await testConnection();
    if (!isConnected) {
      showWarning(
        'Backend Desconectado',
        'El servidor no está disponible. Verifica la conexión.'
      );
    }
  };

  const handleNextRound = async () => {
    console.log('🎵 Next Round button pressed');
    const success = await nextRound();

    if (success && flowState.currentRound) {
      showInfo(
        'Nueva Ronda',
        `Ronda ${
          flowState.currentRound.number
        } - ${flowState.currentRound.question.type.toUpperCase()}`
      );
    }
  };

  const handleOpenBetting = () => {
    if (!flowState.currentRound) {
      showWarning('Error', 'Necesitas iniciar una ronda primero');
      return;
    }

    if (!bettingStatus.canBet) {
      if (currentPhase === 'audio') {
        showWarning('Espera', 'Espera a que termine el audio');
      } else {
        showWarning('Error', 'No es momento de apostar');
      }
      return;
    }

    setShowBettingModal(true);
  };

  const handlePlaceBet = async (playerId: string, amount: number) => {
    const player = players.find((p) => p.id === playerId);
    const validation = validateBet(player, amount);

    if (!validation.valid) {
      showError('Error', validation.error!);
      return;
    }

    // Place bet locally
    placeBet(playerId, amount);

    // Use backend ID
    const backendPlayerId = getBackendPlayerId(playerId, players, playerIdMap);
    console.log(`🎰 Mapping ID: ${playerId} -> ${backendPlayerId}`);

    const result = await placeBetBackend(backendPlayerId, amount);

    if (result.success) {
      showSuccess('Token Usado', `${player!.name} usó token +${amount} puntos`);
    } else {
      showError('Error', 'No se pudo registrar en el servidor');
    }

    setShowBettingModal(false);
  };

  const handleWrongAnswer = async () => {
    soundEffects.playWrong();
    const result = await revealAnswer(null);

    if (result) {
      showInfo(
        'Nadie Acertó',
        `La respuesta era: ${result.correctAnswer}\n"${result.trackInfo.title}" - ${result.trackInfo.artist}`
      );
    }

    const playersWithBets = players.filter(
      (p) => p.currentBet && p.currentBet > 0
    );
    if (playersWithBets.length > 0) {
      const totalLost = playersWithBets.reduce(
        (sum, p) => sum + (p.currentBet || 0),
        0
      );
      showWarning('Tokens Perdidos', `${totalLost} tokens perdidos`);
    }

    clearBets();
    setShowPointsModal(false);

    setTimeout(() => {
      nextTurn();
      prepareNextRound();
    }, 2000);
  };

  const handleAwardPoints = async (playerId: string) => {
    if (!flowState.currentRound) return;

    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    soundEffects.playCorrect();
    const backendPlayerId = getBackendPlayerId(playerId, players, playerIdMap);
    console.log(`🏆 Awarding points: ${playerId} -> ${backendPlayerId}`);

    const result = await revealAnswer(backendPlayerId);

    if (result) {
      showSuccess(
        '🎉 ¡Correcto!',
        `${player.name} gana ${result.pointsAwarded} puntos\n"${result.trackInfo.title}" - ${result.trackInfo.artist}`
      );

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
      nextTurn();
      prepareNextRound();
    }, 2000);
  };

  const handleNewGame = () => {
    setShowGameEndModal(false);
    resetFlow();
    soundEffects.dispose();
    gameSessionService.clearCurrentSession();
    createNewGame();
  };

  const handleBackToMenu = () => {
    setShowGameEndModal(false);
    resetFlow();
    gameSessionService.clearCurrentSession();
    createNewGame();
  };

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
      <ScrollView>
        <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

        <GameFeedback messages={messages} onMessageDismiss={dismissFeedback} />

        {/* Header */}
        <GameHeader timeLeft={timeLeft} currentPhase={currentPhase} />

        {/* Betting Phase */}
        <BettingPhase
          bettingStatus={bettingStatus}
          onOpenBetting={handleOpenBetting}
          onEndBetting={endBettingPhase}
        />

        {/* Game Pot */}
        {gamePot?.tokens > 0 && <GamePot tokens={gamePot.tokens} />}

        {/* Audio Player */}
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

        {/* Current Turn */}
        <CurrentTurn
          currentPlayerName={currentPlayer?.name || ''}
          round={round}
          currentPhase={currentPhase}
        />

        {/* Main Action */}
        <MainAction
          isLoading={flowState.isLoading}
          currentPhase={currentPhase}
          canStartNextRound={canStartNextRound()}
          onNextRound={handleNextRound}
          questionVisible={flowState.questionVisible}
          currentRound={flowState.currentRound}
        />

        {/* Players Scoreboard */}
        <PlayerScoreboard
          players={sortedPlayers}
          showDetailedStats={true}
          highlightWinner={sortedPlayers.some((p) => p.score >= SCORE_TO_WIN)}
        />

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
                  question: flowState.currentRound.question,
                  track: { title: 'Canción actual', artist: '' },
                }
              : null
          }
          onPlaceBet={handlePlaceBet}
          bettingTimeLeft={bettingStatus.timeLeft}
        />

        <GameEndModal
          visible={showGameEndModal}
          players={players}
          gameTimeElapsed={1200 - timeLeft}
          totalRounds={round}
          onNewGame={handleNewGame}
          onBackToMenu={handleBackToMenu}
        />
      </ScrollView>
    </View>
  );
}
