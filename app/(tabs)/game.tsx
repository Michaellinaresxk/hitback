// app/(tabs)/game.tsx - FIXED Turns & Feedback
import AudioPlayer from '@/components/game/AudioPlayer';
import CardDisplay from '@/components/game/CardDisplay';
import GameEndModal from '@/components/game/GameEndModal';
import GameFeedback, { useFeedback } from '@/components/game/GameFeedback';
import PlayerScoreboard from '@/components/game/PlayerScoreboard';
import RealQRScanner from '@/components/game/QRScanner';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGameFlow } from '@/hooks/useGameFlow';
import { useGameStore } from '@/store/gameStore';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function GameScreen() {
  // 🎮 Game Store
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
  } = useGameStore();

  // 🎯 Custom Hooks
  const {
    flowState,
    handleQRScan,
    handleAudioFinished,
    revealAnswer,
    awardPointsAndAdvance, // 🔧 FIXED: Use new method
    resetFlow,
    testConnection,
    getWinnerInfo, // 🔧 FIXED: Get winner info for correct feedback
  } = useGameFlow();
  const {
    messages,
    dismissFeedback,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  } = useFeedback();

  // 🎮 Modal States
  const [showScanner, setShowScanner] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showPowerCardsModal, setShowPowerCardsModal] = useState(false);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [pendingModeType, setPendingModeType] = useState<
    'battle' | 'speed' | 'viral' | null
  >(null);

  // 🎯 Computed Values
  const currentPlayer = players.find((p) => p.isCurrentTurn);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = players.find((p) => p.score >= 15);

  // 🔄 Effects
  useEffect(() => {
    if (isActive) {
      checkBackendConnection();
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

  // Show points modal when audio finishes
  useEffect(() => {
    if (audioFinished && showQuestion && currentCard) {
      setShowPointsModal(true);
    }
  }, [audioFinished, showQuestion, currentCard]);

  // 🧪 Backend Connection Check
  const checkBackendConnection = async () => {
    const isConnected = await testConnection();
    if (!isConnected) {
      showWarning(
        'Backend Desconectado',
        'El servidor no está disponible. Algunas funciones pueden no funcionar.'
      );
    }
  };

  // 🎯 QR Scanning Handler
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

  // 🏆 Points Award Handler - FIXED with auto turn advance
  const handleAwardPoints = (playerId: string) => {
    if (!currentCard) return;

    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    // Award points through game store
    awardPoints(playerId, undefined, 2000);

    // Handle turn advance and feedback through game flow
    const winnerInfo = awardPointsAndAdvance(playerId, player.name);

    setShowPointsModal(false);

    // 🔧 FIXED: Show feedback to correct player
    showSuccess(
      'Punto Otorgado',
      `${player.name} gana ${currentCard.points} punto${
        currentCard.points > 1 ? 's' : ''
      }`
    );
  };

  // 🎰 Betting Handler
  const handlePlaceBet = (playerId: string, amount: number) => {
    placeBet(playerId, amount);
    const player = players.find((p) => p.id === playerId);

    if (player) {
      showInfo(
        'Apuesta Realizada',
        `${player.name} apostó ${amount} token${
          amount > 1 ? 's' : ''
        } (${getBettingMultiplier(amount)}x)`
      );
    }
  };

  // ⚡ Power Card Handler
  const handleUsePowerCard = (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => {
    const player = players.find((p) => p.id === playerId);
    const powerCard = player?.powerCards?.find((pc) => pc.id === powerCardId);

    if (!powerCard) return;

    usePowerCard(playerId, powerCardId, targetPlayerId);

    showInfo('Poder Activado', `${player.name} usó: ${powerCard.name}`);
  };

  // 🎮 Special Modes
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

  // 🎮 Game End Handlers
  const handleNewGame = () => {
    setShowGameEndModal(false);
    resetFlow();
    createNewGame();
  };

  const handleBackToMenu = () => {
    setShowGameEndModal(false);
    resetFlow();
    createNewGame();
  };

  // 🎨 Utility Functions
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

  // 🎮 Setup Screen
  if (!isActive) {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

      {/* Feedback System - Replaces Alerts */}
      <GameFeedback messages={messages} onMessageDismiss={dismissFeedback} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle}>HITBACK</Text>
          <View style={[styles.gameModeIndicator, getGameModeStyle()]}>
            <Text style={styles.gameModeText}>
              {gameMode.toUpperCase()}
              {viralMomentActive && ' - VIRAL'}
            </Text>
          </View>
        </View>
        <View style={styles.timerContainer}>
          <IconSymbol name='clock' size={16} color='#F8FAFC' />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      {/* Game Pot */}
      {gamePot?.tokens > 0 && (
        <View style={styles.potContainer}>
          <Text style={styles.potLabel}>ACUMULADO</Text>
          <View style={styles.potValue}>
            <IconSymbol
              name='bitcoinsign.circle.fill'
              size={20}
              color='#F59E0B'
            />
            <Text style={styles.potCount}>{gamePot.tokens} tokens</Text>
          </View>
        </View>
      )}

      {/* Current Card Display */}
      {currentCard && (
        <CardDisplay
          card={currentCard}
          showAnswer={showAnswer}
          showQuestion={showQuestion}
          onRevealAnswer={revealAnswer}
          audioFinished={audioFinished}
        />
      )}

      {/* Audio Player - 5 seconds */}
      {currentCard && (
        <AudioPlayer
          previewUrl={currentCard.track.previewUrl}
          trackTitle={currentCard.track.title}
          artist={currentCard.track.artist}
          duration={5000} // 🔧 FIXED: 5 seconds
          autoPlay={true}
          onAudioFinished={handleAudioFinished}
        />
      )}

      {/* Current Turn Info */}
      <View style={styles.currentTurnContainer}>
        <Text style={styles.turnLabel}>Turno Actual</Text>
        <Text style={styles.currentTurnName}>
          {currentPlayer?.name || 'No one'} • Ronda {round}
        </Text>
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
          <TouchableOpacity
            style={styles.bettingButton}
            onPress={() => setShowBettingModal(true)}
            activeOpacity={0.9}
          >
            <IconSymbol name='dice.fill' size={20} color='#FFFFFF' />
            <Text style={styles.actionButtonText}>Apostar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.powerButton}
            onPress={() => setShowPowerCardsModal(true)}
            activeOpacity={0.9}
          >
            <IconSymbol name='sparkles' size={20} color='#FFFFFF' />
            <Text style={styles.actionButtonText}>Poderes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Special Game Mode Buttons */}
      <View style={styles.gameModeButtons}>
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
      </View>

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
                    {currentCard.track.artist} • {currentCard.track.year}
                  </Text>
                </View>

                <View style={styles.questionContainer}>
                  <Text style={styles.questionText}>
                    {currentCard.question}
                  </Text>
                  {showAnswer && (
                    <Text style={styles.answerText}>
                      ✅ {currentCard.answer}
                    </Text>
                  )}
                </View>

                <Text style={styles.pointsLabel}>
                  ¿Quién respondió correctamente? ({currentCard.points} pts)
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
                      <Text style={styles.playerButtonText}>{player.name}</Text>
                      {player.currentBet > 0 && (
                        <Text style={styles.playerBetIndicator}>
                          Apuesta: {player.currentBet} →{' '}
                          {getBettingMultiplier(player.currentBet)}x
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                />

                <TouchableOpacity
                  style={styles.noWinnerButton}
                  onPress={() => {
                    setShowPointsModal(false);
                    // 🔧 FIXED: Auto advance turn even when no winner
                    setTimeout(() => {
                      nextTurn();
                      resetFlow();
                    }, 500);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.noWinnerText}>Nadie acertó</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Game End Modal */}
      <GameEndModal
        visible={showGameEndModal}
        players={players}
        gameTimeElapsed={1200 - timeLeft}
        totalRounds={round}
        onNewGame={handleNewGame}
        onBackToMenu={handleBackToMenu}
      />
    </View>
  );
}

// Helper function
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
