import AudioPlayer from '@/components/game/AudioPlayer';
import GameEndModal from '@/components/game/GameEndModal';
import GameFeedback, { useFeedback } from '@/components/game/GameFeedback';
import PlayerScoreboard from '@/components/game/PlayerScoreboard';
import RealQRScanner from '@/components/game/QRScanner';
import BettingModal from '@/components/modal/BettingModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SCORE_TO_WIN } from '@/constants/Points';
import { REPRODUCTION_TIME_LIMIT } from '@/constants/TrackConfig';
import { useGameFlow } from '@/hooks/useGameFlow';
import { soundEffects } from '@/services/SoundEffectsService';
import { useGameStore } from '@/store/gameStore';
import React, { useEffect, useState } from 'react';

import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function GameScreen() {
  const {
    players,
    currentCard,
    isActive,
    gameMode,
    timeLeft,
    gamePot,
    viralMomentActive,
    battleModeActive,
    speedRoundActive,
    selectedBattlePlayers,
    audioFinished,
    showQuestion,
    showAnswer,
    showGameEndModal,
    round,
    error,
    awardPoints,
    placeBet,
    usePowerCard,
    startBattleMode,
    startSpeedRound,
    startViralMoment,
    setError,
    setShowAnswer,
    setShowGameEndModal,
    createNewGame,
    nextTurn,
    clearBets,
  } = useGameStore();

  const {
    flowState,
    handleQRScan,
    handleAudioFinished,
    revealAnswer,
    awardPointsAndAdvance,
    resetFlow,
    testConnection,
    getWinnerInfo,
    endBettingPhase, // Ã¢Å“â€¦ NEW
    getBettingStatus, // Ã¢Å“â€¦ NEW
    getCurrentPhase, // Ã¢Å“â€¦ NEW
  } = useGameFlow();

  const {
    messages,
    dismissFeedback,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  } = useFeedback();

  {
    /* Ã°Å¸Å½Â® Modal States */
  }
  const [showScanner, setShowScanner] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showPowerCardsModal, setShowPowerCardsModal] = useState(false);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [pendingModeType, setPendingModeType] = useState<
    'battle' | 'speed' | 'viral' | null
  >(null);

  const currentPlayer = players.find((p) => p.isCurrentTurn);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = players.find((p) => p.score >= SCORE_TO_WIN);
  const bettingStatus = getBettingStatus();
  const currentPhase = getCurrentPhase();

  useEffect(() => {
    if (isActive) {
      checkBackendConnection();
      soundEffects.initialize();
    }
  }, [isActive]);

  useEffect(() => {
    if (error) {
      showError('Error', error);
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (flowState.currentError) {
      showWarning('Escaneo Fallido', flowState.currentError);
    }
  }, [flowState.currentError]);

  {
    /*  Ã¢Å“â€¦ UPDATED: Show points modal only after betting phase ends */
  }
  useEffect(() => {
    if (
      audioFinished &&
      showQuestion &&
      currentCard &&
      !bettingStatus.isActive
    ) {
      setShowPointsModal(true);
    }
  }, [audioFinished, showQuestion, currentCard, bettingStatus.isActive]);

  useEffect(() => {
    if (showGameEndModal && winner) {
      soundEffects.playVictory();
    }
  }, [showGameEndModal, winner]);

  const checkBackendConnection = async () => {
    const isConnected = await testConnection();
    if (!isConnected) {
      showWarning(
        'Backend Desconectado',
        'El servidor no estÃƒÂ¡ disponible. Algunas funciones pueden no funcionar.'
      );
    }
  };

  {
    /* Ã°Å¸Å½Â¯ QR Scanning Handler */
  }
  const handleScanCard = async (qrData: string) => {
    setShowScanner(false);

    const success = await handleQRScan(qrData);
    if (success && currentCard) {
      showSuccess(
        'Carta Escaneada',
        `${currentCard.track.title} - ${currentCard.track.artist}`
      );
    }
  };

  const handleOpenBetting = () => {
    console.log('Ã°Å¸Å½Â² Opening betting modal...', {
      currentCard: !!currentCard,
      bettingStatus,
      currentPhase,
    });

    if (!currentCard) {
      showWarning('Error', 'Necesitas una carta activa para apostar');
      return;
    }

    if (!bettingStatus.canBet) {
      if (currentPhase === 'audio') {
        showWarning('Espera', 'Espera a que termine el audio');
      } else if (currentPhase === 'betting' && bettingStatus.timeLeft <= 0) {
        showWarning('Error', 'El tiempo de apuestas ha terminado');
      } else {
        showWarning('Error', 'No es momento de apostar');
      }
      return;
    }

    setShowBettingModal(true);
  };

  const handlePlaceBet = (playerId: string, amount: number) => {
    const player = players.find((p) => p.id === playerId);

    if (!player) {
      showError('Error', 'Jugador no encontrado');
      return;
    }

    if (player.tokens < amount) {
      showError('Error', 'No tienes suficientes tokens');
      return;
    }

    if (player.currentBet > 0) {
      showWarning('Error', 'Ya apostaste en esta ronda');
      return;
    }

    // Place bet
    placeBet(playerId, amount);

    // Enhanced feedback
    const multiplier = getBettingMultiplier(amount);
    showSuccess(
      'Apuesta Realizada',
      `${player.name} apostÃƒÂ³ ${amount} token${
        amount > 1 ? 's' : ''
      } (${multiplier}x multiplicador)`
    );

    setShowBettingModal(false);
  };

  const handleWrongAnswer = () => {
    soundEffects.playWrong();

    const playersWithBets = players.filter((p) => p.currentBet > 0);

    if (playersWithBets.length > 0) {
      const totalLostTokens = playersWithBets.reduce(
        (sum, p) => sum + p.currentBet,
        0
      );
      showInfo(
        'Tokens Perdidos',
        `${totalLostTokens} tokens perdidos por apuestas fallidas`
      );
    }

    clearBets();
    setShowPointsModal(false);

    setTimeout(() => {
      nextTurn();
      resetFlow();
    }, 1500);
  };

  const handleAwardPoints = (playerId: string) => {
    if (!currentCard) return;

    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    soundEffects.playCorrect();
    awardPoints(playerId, undefined, 2000);

    setShowPointsModal(false);
    const multiplier =
      player.currentBet > 0 ? getBettingMultiplier(player.currentBet) : 1;
    const finalPoints = currentCard.question.points * multiplier;

    showSuccess(
      player.currentBet > 0
        ? 'Ã°Å¸Å½Â² Apuesta Ganada!'
        : 'Ã°Å¸Ââ€  Punto Otorgado',
      player.currentBet > 0
        ? `${player.name} gana ${finalPoints} puntos (${currentCard.question.points} Ãƒâ€” ${multiplier})`
        : `${player.name} gana ${finalPoints} punto${
            finalPoints > 1 ? 's' : ''
          }`
    );
  };

  const handleUsePowerCard = (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => {
    const player = players.find((p) => p.id === playerId);
    const powerCard = player?.powerCards?.find((pc) => pc.id === powerCardId);

    if (!powerCard) return;

    usePowerCard(playerId, powerCardId, targetPlayerId);

    showInfo('Poder Activado', `${player.name} usÃƒÂ³: ${powerCard.name}`);
  };

  const handleSpecialMode = (modeType: 'battle' | 'speed' | 'viral') => {
    if (modeType === 'battle') {
      if (players.length < 2) {
        showWarning(
          'Error',
          'Se necesitan al menos 2 jugadores para Battle Mode'
        );
        return;
      }
      setPendingModeType('battle');
      setShowPlayerSelection(true);
    } else if (modeType === 'speed') {
      startSpeedRound();
    } else if (modeType === 'viral') {
      if (!currentCard) {
        showWarning('Error', 'Necesitas una carta activa para Viral Moment');
        return;
      }
      startViralMoment();
    }
  };

  const handlePlayerSelection = (player1Id: string, player2Id: string) => {
    setShowPlayerSelection(false);
    if (pendingModeType === 'battle') {
      startBattleMode(player1Id, player2Id);
    }
    setPendingModeType(null);
  };

  const handleNewGame = () => {
    setShowGameEndModal(false);
    resetFlow();
    soundEffects.dispose();
    createNewGame();
  };

  const handleBackToMenu = () => {
    setShowGameEndModal(false);
    resetFlow();
    createNewGame();
  };

  {
    /* Ã°Å¸Å½Â¨ Utility Functions */
  }
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGameModeStyle = () => {
    switch (gameMode) {
      case 'battle':
        return { backgroundColor: '#EF4444', borderColor: '#DC2626' };
      case 'speed':
        return { backgroundColor: '#8B5CF6', borderColor: '#7C3AED' };
      case 'viral':
        return { backgroundColor: '#F59E0B', borderColor: '#D97706' };
      default:
        return { backgroundColor: '#3B82F6', borderColor: '#2563EB' };
    }
  };

  const getPhaseStyle = () => {
    switch (currentPhase) {
      case 'scanning':
        return { backgroundColor: '#3B82F6', borderColor: '#2563EB' };
      case 'audio':
        return { backgroundColor: '#10B981', borderColor: '#059669' };
      case 'betting':
        return { backgroundColor: '#EF4444', borderColor: '#DC2626' };
      case 'question':
        return { backgroundColor: '#F59E0B', borderColor: '#D97706' };
      case 'answer':
        return { backgroundColor: '#8B5CF6', borderColor: '#7C3AED' };
      default:
        return { backgroundColor: '#64748B', borderColor: '#475569' };
    }
  };

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'scanning':
        return 'ESCANEANDO';
      case 'audio':
        return 'AUDIO';
      case 'betting':
        return 'APUESTAS';
      case 'question':
        return 'PREGUNTA';
      case 'answer':
        return 'RESPUESTA';
      default:
        return gameMode.toUpperCase();
    }
  };

  {
    /* 🎮 Setup Screen - Only show if game not active AND not showing end modal */
  }
  if (!isActive && !showGameEndModal) {
    return (
      <View style={styles.setupContainer}>
        <IconSymbol name='gamecontroller' size={48} color='#64748B' />
        <Text style={styles.setupText}>Configure el juego para empezar</Text>

        <TouchableOpacity
          style={styles.testConnectionButton}
          onPress={async () => {
            const connected = await testConnection();
            if (connected) {
              showSuccess('Conectado', 'Backend funcionando correctamente');
            } else {
              showError('Sin Conexión', 'No se pudo conectar al servidor');
            }
          }}
        >
          <Text style={styles.testConnectionText}>🧪 Probar Conexión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  {
    /* 🏆 Game End Screen - Show when game ended with winner */
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

        <View style={styles.header}>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>HITBACK</Text>
            <View style={[styles.gameModeIndicator, getPhaseStyle()]}>
              <Text style={styles.gameModeText}>
                {getPhaseLabel()}
                {viralMomentActive && ' - VIRAL'}
              </Text>
            </View>
          </View>
          <View style={styles.timerContainer}>
            <IconSymbol name='clock' size={16} color='#F8FAFC' />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {bettingStatus.isActive && (
          <View
            style={[
              styles.bettingPhaseContainer,
              bettingStatus.urgentTime && styles.bettingPhaseUrgent,
            ]}
          >
            <View style={styles.bettingPhaseHeader}>
              <Text style={styles.bettingPhaseTitle}>
                Ã°Å¸Å½Â² TIEMPO DE APUESTAS
              </Text>
              <Text
                style={[
                  styles.bettingPhaseTimer,
                  bettingStatus.urgentTime && styles.timerUrgent,
                ]}
              >
                {bettingStatus.timeLeft}s
              </Text>
            </View>

            <Text style={styles.bettingPhaseInstructions}>
              Los jugadores pueden poner sus tokens en la mesa
            </Text>

            <View style={styles.bettingPhaseActions}>
              <TouchableOpacity
                style={styles.registerBetsButton}
                onPress={handleOpenBetting}
              >
                <IconSymbol name='dice.fill' size={18} color='#FFFFFF' />
                <Text style={styles.registerBetsText}>Registrar Apuestas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.endBettingButton}
                onPress={() => endBettingPhase()}
              >
                <IconSymbol name='checkmark.circle' size={18} color='#FFFFFF' />
                <Text style={styles.endBettingText}>Terminar</Text>
              </TouchableOpacity>
            </View>

            {/* Ã¢Å“â€¦ Betting Progress Bar */}
            <View style={styles.bettingProgressContainer}>
              <View
                style={[
                  styles.bettingProgress,
                  { width: `${(bettingStatus.timeLeft / 30) * 100}%` },
                  bettingStatus.urgentTime && styles.progressUrgent,
                ]}
              />
            </View>
          </View>
        )}

        {/* Game Pot */}
        {gamePot?.tokens > 0 && (
          <View style={styles.potContainer}>
            <Text style={styles.potLabel}>POT DEL JUEGO</Text>
            <View style={styles.potValue}>
              <IconSymbol
                name='bitcoinsign.circle.fill'
                size={20}
                color='#F59E0B'
              />
              <Text style={styles.potCount}>{gamePot.tokens} tokens</Text>
            </View>
            <Text style={styles.potSubtext}>Tokens perdidos en apuestas</Text>
          </View>
        )}

        {/* Audio Player - 5 seconds */}
        {currentCard && flowState.audioPlaying && (
          <AudioPlayer
            previewUrl={currentCard.audio?.url || ''}
            trackTitle={currentCard.track.title}
            artist={currentCard.track.artist}
            duration={REPRODUCTION_TIME_LIMIT}
            autoPlay={true}
            onAudioFinished={handleAudioFinished}
          />
        )}

        {/* Current Turn Info */}
        <View style={styles.currentTurnContainer}>
          <Text style={styles.turnLabel}>Turno Actual</Text>
          <Text style={styles.currentTurnName}>
            {currentPlayer?.name || 'No one'} Ã¢â‚¬Â¢ Ronda {round}
          </Text>
          <Text style={styles.phaseInfo}>Fase: {getPhaseLabel()}</Text>
        </View>

        {/* Main Actions */}
        <View style={styles.mainActions}>
          <TouchableOpacity
            style={[
              styles.scanButton,
              flowState.isScanning && styles.scanButtonLoading,
            ]}
            onPress={() => setShowScanner(true)}
            activeOpacity={0.9}
            disabled={flowState.isScanning}
          >
            <IconSymbol
              name={flowState.isScanning ? 'clock' : 'qrcode.viewfinder'}
              size={28}
              color='#FFFFFF'
            />
            <Text style={styles.scanButtonText}>
              {flowState.isScanning ? 'Escaneando...' : 'Escanear Carta'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButtonsRow}>
            {/* <TouchableOpacity
              style={[
                styles.bettingButton,
                !bettingStatus.canBet && styles.bettingButtonDisabled,
              ]}
              onPress={handleOpenBetting}
              activeOpacity={0.9}
              disabled={!bettingStatus.canBet}
            >
              <IconSymbol name='dice.fill' size={20} color='#FFFFFF' />
              <Text style={styles.actionButtonText}>
                {bettingStatus.isActive ? 'Apostar' : 'Sin Apuestas'}
              </Text>
            </TouchableOpacity> */}

            {/* <TouchableOpacity
            style={styles.powerButton}
            onPress={() => setShowPowerCardsModal(true)}
            activeOpacity={0.9}
          >
            <IconSymbol name='sparkles' size={20} color='#FFFFFF' />
            <Text style={styles.actionButtonText}>Poderes</Text>
          </TouchableOpacity> */}
          </View>
        </View>

        {/* Special Game Mode Buttons */}
        {/* <View style={styles.gameModeButtons}>
        <TouchableOpacity
          style={[styles.modeButton, styles.battleButton]}
          onPress={() => handleSpecialMode('battle')}
          activeOpacity={0.8}
        >
          <IconSymbol name='sword.fill' size={16} color='#FFFFFF' />
          <Text style={styles.modeButtonText}>Battle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, styles.speedButton]}
          onPress={() => handleSpecialMode('speed')}
          activeOpacity={0.8}
        >
          <IconSymbol name='bolt.fill' size={16} color='#FFFFFF' />
          <Text style={styles.modeButtonText}>Speed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, styles.viralButton]}
          onPress={() => handleSpecialMode('viral')}
          activeOpacity={0.8}
          disabled={!currentCard}
        >
          <IconSymbol name='flame.fill' size={16} color='#FFFFFF' />
          <Text style={styles.modeButtonText}>Viral</Text>
        </TouchableOpacity>
      </View> */}

        {/* Players Scoreboard */}
        <PlayerScoreboard
          players={sortedPlayers}
          showDetailedStats={true}
          highlightWinner={!!winner}
        />

        {/* QR Scanner Modal */}
        <Modal visible={showScanner} animationType='slide'>
          <RealQRScanner
            isVisible={showScanner}
            onScanSuccess={handleScanCard}
            onClose={() => setShowScanner(false)}
          />
        </Modal>

        {/* Points Award Modal */}
        <Modal visible={showPointsModal} transparent animationType='fade'>
          <View style={styles.modalOverlay}>
            <View style={styles.pointsModal}>
              {currentCard && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {currentCard.track.title}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {currentCard.track.artist} Ã¢â‚¬Â¢{' '}
                      {currentCard.track.year}
                    </Text>
                  </View>

                  <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>
                      {currentCard.question.text}
                    </Text>
                    {showAnswer && (
                      <Text style={styles.answerText}>
                        Ã¢Å“â€¦ {currentCard.question.answer}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.pointsLabel}>
                    Ã‚Â¿QuiÃƒÂ©n respondiÃƒÂ³ correctamente? (
                    {currentCard.question.points} pts)
                  </Text>

                  <FlatList
                    data={players}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item: player }) => (
                      <TouchableOpacity
                        style={styles.playerButton}
                        onPress={() => handleAwardPoints(player.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.playerButtonText}>
                          {player.name}
                        </Text>
                        {player.currentBet > 0 && (
                          <Text style={styles.playerBetIndicator}>
                            Apuesta: {player.currentBet} Ã¢â€ â€™{' '}
                            {getBettingMultiplier(player.currentBet)}x
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  />

                  <TouchableOpacity
                    style={styles.noWinnerButton}
                    onPress={handleWrongAnswer}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.noWinnerText}>Nadie acertÃƒÂ³</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Ã¢Å“â€¦ Betting Modal */}
        <BettingModal
          visible={showBettingModal}
          onClose={() => setShowBettingModal(false)}
          players={players}
          currentCard={currentCard}
          onPlaceBet={handlePlaceBet}
          bettingTimeLeft={bettingStatus.timeLeft}
        />

        {/* Game End Modal */}
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

{
  /* Helper function */
}
function getBettingMultiplier(betAmount: number): number {
  if (betAmount === 1) return 2;
  if (betAmount === 2) return 3;
  if (betAmount >= 3) return 4;
  return 1;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  setupText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  testConnectionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  testConnectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  gameModeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  gameModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timerText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },

  // Ã¢Å“â€¦ NEW: Betting Phase Styles
  bettingPhaseContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  bettingPhaseUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#DC2626',
  },
  bettingPhaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  bettingPhaseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bettingPhaseTimer: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerUrgent: {
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bettingPhaseInstructions: {
    fontSize: 14,
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  bettingPhaseActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  registerBetsButton: {
    flex: 2,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  registerBetsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  endBettingButton: {
    flex: 1,
    backgroundColor: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  endBettingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  bettingProgressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bettingProgress: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  progressUrgent: {
    backgroundColor: '#DC2626',
  },

  potContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  potLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  potValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  potCount: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  potSubtext: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  currentTurnContainer: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  turnLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  currentTurnName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  phaseInfo: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  mainActions: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonLoading: {
    backgroundColor: '#64748B',
  },
  scanButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bettingButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  bettingButtonDisabled: {
    opacity: 0.5,
  },
  powerButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  gameModeButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  battleButton: {
    backgroundColor: '#EF4444',
  },
  speedButton: {
    backgroundColor: '#8B5CF6',
  },
  viralButton: {
    backgroundColor: '#F59E0B',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsModal: {
    backgroundColor: '#1E293B',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    maxHeight: '80%',
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 16,
  },
  playerButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  playerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerBetIndicator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  noWinnerButton: {
    backgroundColor: '#64748B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  noWinnerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
