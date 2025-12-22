import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
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
import { GamePot } from '@/components/game/gameScreen/GamePot';
import { CurrentTurn } from '@/components/game/gameScreen/CurrentTurn';
import { MainAction } from '@/components/game/gameScreen/MainAction';
import PointsAwardModal from '@/components/game/gameScreen/PointsAwardModal';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function GameScreen() {
  const { t } = useTranslation();

  // Store
  const {
    players,
    isActive,
    timeLeft,
    showGameEndModal,
    round,
    placeBet: placeBetStore,
    setShowGameEndModal,
    createNewGame,
    startGame,
    nextTurn,
    clearBets,
    gamePot,
    setGameActive,
    syncPlayersFromBackend, // ✅ AÑADIR si existe en tu store
  } = useGameStore();

  // Game Flow
  const {
    flowState,
    nextRound,
    handleAudioFinished,
    revealAnswer,
    placeBet: placeBetBackend,
    skipBetting,
    prepareNextRound,
    startAudioAfterBets,
    registerBet,
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
  const [gameStarted, setGameStarted] = useState(false);

  // Derived state
  const currentPlayer = players.find((p) => p.isCurrentTurn);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const bettingStatus = getBettingStatus();
  const currentPhase = getCurrentPhase();

  // Effects
  useEffect(() => {
    console.log(
      `🎮 GameScreen: isActive=${isActive}, gameStarted=${gameStarted}, players=${players.length}`
    );

    if (isActive && players.length >= 2 && !gameStarted) {
      initializeGame();
    }
  }, [isActive, players.length]);

  useEffect(() => {
    console.log(
      `🔄 Flow state changed: phase=${flowState.phase}, round=${flowState.roundNumber}`
    );

    // Mostrar modal de puntos cuando se termina el audio
    if (flowState.phase === 'question' && flowState.currentRound) {
      console.log('🎯 Showing points modal');
      setShowPointsModal(true);
    }
  }, [flowState.phase, flowState.roundNumber, flowState.currentRound]);

  // Helper function para determinar si mostrar apuestas
  const shouldShowBettingButton = (): boolean => {
    const roundNumber = flowState.currentRound?.number || 0;
    const shouldShow =
      roundNumber > 1 &&
      flowState.phase === 'betting' &&
      !flowState.hasPlacedBet &&
      !flowState.audioPlaying;

    console.log(
      `🎰 shouldShowBettingButton: round=${roundNumber}, phase=${flowState.phase}, hasBet=${flowState.hasPlacedBet}, audio=${flowState.audioPlaying} => ${shouldShow}`
    );

    return shouldShow;
  };

  // Handlers
  const initializeGame = async () => {
    try {
      console.log('🎮 Initializing game...');

      // Crear mapa de IDs
      const idMap: Record<string, string> = {};
      players.forEach((player, index) => {
        idMap[player.id] = `player_${index + 1}`;
      });
      setPlayerIdMap(idMap);

      await soundEffects.initialize();
      await checkBackendConnection();

      setGameStarted(true);
      console.log('✅ Game initialized');
    } catch (error) {
      console.error('❌ Error initializing game:', error);
      showError('Error', 'No se pudo inicializar el juego');
    }
  };

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

  const handleStartBetting = () => {
    if (!flowState.currentRound || flowState.currentRound.number === 1) {
      return;
    }
    console.log(
      `🎰 Opening betting modal for round ${flowState.currentRound.number}`
    );
    setShowBettingModal(true);
  };

  const handlePlaceBet = async (playerId: string, tokenValue: number) => {
    const player = players.find((p) => p.id === playerId);

    if (!player) {
      showError('Error', 'Jugador no encontrado');
      return;
    }

    // ✅ Validar que el jugador no haya apostado ya en esta ronda
    if (player.currentBet > 0) {
      showError('Error', `${player.name} ya apostó en esta ronda`);
      return;
    }

    if (!player.availableTokens.includes(tokenValue)) {
      showError('Error', `Token +${tokenValue} ya fue usado o no disponible`);
      return;
    }

    console.log(`🎯 Betting: ${player.name} -> +${tokenValue}`);

    // 1. Place bet localmente en el store
    placeBetStore(playerId, tokenValue);

    // 2. Enviar al backend
    const backendPlayerId = getBackendPlayerId(playerId, players, playerIdMap);

    const result = await placeBetBackend(backendPlayerId, tokenValue);

    if (result.success) {
      showSuccess(
        'Token Usado',
        `${player.name} usó token +${tokenValue} puntos`
      );
      // ✅ NO cerrar modal automáticamente - dejar que otros apuesten
      // setShowBettingModal(false);
    } else {
      showError('Error', 'No se pudo registrar en el servidor');
      // ✅ Revertir apuesta local si falla en backend
      // Podrías necesitar una función para revertir
    }
  };

  const handleSkipBetting = () => {
    console.log('⏭️ Skipping betting phase');
    skipBetting();
    setShowBettingModal(false);
  };

  const handleStartAudio = () => {
    console.log('🎵 Starting audio manually');
    startAudioAfterBets();
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

      // ✅ SINCRONIZAR PUNTOS DESDE BACKEND
      if (result.players && Array.isArray(result.players)) {
        syncPlayersFromBackend(result.players);
      }
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

    // Preparar para siguiente ronda
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

    // 1. Revelar respuesta en backend
    const result = await revealAnswer(backendPlayerId);

    if (result) {
      showSuccess(
        '🎉 ¡Correcto!',
        `${player.name} gana ${result.pointsAwarded} puntos\n"${result.trackInfo.title}" - ${result.trackInfo.artist}`
      );

      // ✅ SINCRONIZAR PUNTOS DESDE BACKEND
      if (result.players && Array.isArray(result.players)) {
        syncPlayersFromBackend(result.players);
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

    // 3. Preparar siguiente ronda
    setTimeout(() => {
      nextTurn();
      prepareNextRound();
    }, 2000);
  };

  const handleNewGame = () => {
    setShowGameEndModal(false);
    setGameActive(false);
    setGameStarted(false);
    soundEffects.dispose();
    gameSessionService.clearCurrentSession();
    createNewGame();
  };

  const handleBackToMenu = () => {
    setShowGameEndModal(false);
    setGameActive(false);
    setGameStarted(false);
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
          hasPlacedBet={flowState.hasPlacedBet}
          onStartBetting={handleStartBetting}
          onSkipBetting={handleSkipBetting}
          showBettingButton={shouldShowBettingButton()}
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
                  roundNumber: flowState.currentRound.number,
                  question: flowState.currentRound.question,
                  track: {
                    title:
                      flowState.currentRound.track.title || 'Canción actual',
                    artist: flowState.currentRound.track.artist || '',
                  },
                }
              : null
          }
          onPlaceBet={handlePlaceBet}
          onSkipBetting={handleSkipBetting}
          onStartAudio={handleStartAudio}
          betsPlaced={flowState.betsPlaced}
          allBetsPlaced={flowState.allBetsPlaced}
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

// Estilos locales
const localStyles = StyleSheet.create({
  bettingOpportunityContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
  },

  bettingOpportunityButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
    gap: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  bettingOpportunityText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },

  bettingOpportunitySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '600',
  },

  skipBettingButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  skipBettingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
