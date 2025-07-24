import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGameStore } from '@/store/gameStore';
import RealQRScanner from '@/components/game/QRScanner';

const { width, height } = Dimensions.get('window');

export default function GameScreen() {
  const {
    players,
    currentCard,
    isActive,
    gameMode,
    timeLeft,
    gamePot,
    viralMomentActive,
    scanCard,
    awardPoints,
    placeBet,
    usePowerCard,
    startBattleMode,
    startSpeedRound,
    startViralMoment,
    error,
    setError,
  } = useGameStore();

  const [showScanner, setShowScanner] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showPowerCardsModal, setShowPowerCardsModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [audioPlaying, setAudioPlaying] = useState(false);

  const currentPlayer = players.find((p) => p.isCurrentTurn);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      setError(null);
    }
  }, [error]);

  const handleScanCard = async (qrData: string) => {
    try {
      setShowScanner(false);
      await scanCard(qrData);
      setAudioPlaying(true);
      setShowPointsModal(true);

      setTimeout(() => {
        setAudioPlaying(false);
      }, 5000);
    } catch (error) {
      Alert.alert('Error', 'No se pudo escanear la carta');
    }
  };

  const handleAwardPoints = (playerId: string) => {
    if (!currentCard) return;

    const startTime = Date.now();
    awardPoints(playerId, currentCard.points, Date.now() - startTime);
    setShowPointsModal(false);

    const player = players.find((p) => p.id === playerId);
    Alert.alert(
      '¡Punto!',
      `${player?.name} gana ${currentCard.points} punto${
        currentCard.points > 1 ? 's' : ''
      }`,
      [{ text: 'Continuar' }]
    );
  };

  const handlePlaceBet = (playerId: string, amount: number) => {
    placeBet(playerId, amount);
    setShowBettingModal(false);
    Alert.alert(
      '¡Apuesta realizada!',
      `${players.find((p) => p.id === playerId)?.name} apostó ${amount} token${
        amount > 1 ? 's' : ''
      }`,
      [{ text: 'OK' }]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPlayer = ({ item: player }: { item: any }) => (
    <View
      style={[
        styles.playerCard,
        player.isCurrentTurn && styles.activePlayerCard,
        player.isImmune && styles.immunePlayerCard,
      ]}
    >
      <View style={styles.playerHeader}>
        <Text style={styles.playerName}>{player.name}</Text>
        <View style={styles.playerStats}>
          <Text style={styles.playerScore}>{player.score} pts</Text>
          <View style={styles.tokenContainer}>
            <IconSymbol
              name='bitcoinsign.circle.fill'
              size={16}
              color='#FFD700'
            />
            <Text style={styles.tokenCount}>{player.tokens}</Text>
          </View>
        </View>
      </View>

      {/* Player status indicators */}
      <View style={styles.playerStatus}>
        {player.isImmune && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusEmoji}>🛡️</Text>
            <Text style={styles.statusText}>Inmune</Text>
          </View>
        )}
        {player.boostActive && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusEmoji}>⚡</Text>
            <Text style={styles.statusText}>Boost</Text>
          </View>
        )}
        {player.currentBet > 0 && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusEmoji}>🎰</Text>
            <Text style={styles.statusText}>{player.currentBet}</Text>
          </View>
        )}
      </View>

      {/* Power cards count */}
      <View style={styles.powerCardsIndicator}>
        <IconSymbol name='sparkles' size={14} color='#4ECDC4' />
        <Text style={styles.powerCardsCount}>{player.powerCards.length}</Text>
      </View>
    </View>
  );

  const renderBettingOption = (amount: number) => (
    <TouchableOpacity
      key={amount}
      style={styles.betButton}
      onPress={() => handlePlaceBet(selectedPlayer, amount)}
    >
      <Text style={styles.betButtonText}>
        {amount} Token{amount > 1 ? 's' : ''}
      </Text>
      <Text style={styles.betMultiplier}>
        {getBettingMultiplier(amount)}x puntos
      </Text>
    </TouchableOpacity>
  );

  if (!isActive) {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupText}>Configura el juego para empezar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#F8F9FA' />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle}>🎵 HITBACK</Text>
          <Text style={styles.gameModeText}>
            {gameMode.toUpperCase()}
            {viralMomentActive && ' - ¡VIRAL!'}
          </Text>
        </View>
        <View style={styles.timerContainer}>
          <IconSymbol name='clock' size={16} color='#666666' />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      {/* Game Pot */}
      {gamePot.tokens > 0 && (
        <View style={styles.potContainer}>
          <Text style={styles.potLabel}>🏆 BOTE ACUMULADO</Text>
          <View style={styles.potTokens}>
            {Array.from({ length: gamePot.tokens }).map((_, i) => (
              <Text key={i} style={styles.potToken}>
                🪙
              </Text>
            ))}
            <Text style={styles.potCount}>({gamePot.tokens})</Text>
          </View>
        </View>
      )}

      {/* Players List */}
      <FlatList
        data={sortedPlayers}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.playersList}
        contentContainerStyle={styles.playersListContent}
      />

      {/* Current Turn */}
      <View style={styles.currentTurnContainer}>
        <Text style={styles.turnLabel}>🎯 Turno de:</Text>
        <Text style={styles.currentTurnName}>
          {currentPlayer?.name || 'Nadie'}
        </Text>
      </View>

      {/* Main Actions */}
      <View style={styles.mainActions}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <IconSymbol name='qrcode.viewfinder' size={32} color='#FFFFFF' />
          <Text style={styles.scanButtonText}>Escanear Carta</Text>
        </TouchableOpacity>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.bettingButton}
            onPress={() => setShowBettingModal(true)}
          >
            <Text style={styles.actionButtonText}>🎰 Apostar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.powerButton}
            onPress={() => setShowPowerCardsModal(true)}
          >
            <Text style={styles.actionButtonText}>⚡ Poderes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Mode Buttons */}
      <View style={styles.gameModeButtons}>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => {
            if (players.length >= 2) {
              startBattleMode(players[0].id, players[1].id);
            }
          }}
        >
          <Text style={styles.modeButtonText}>⚔️ Battle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => startSpeedRound()}
        >
          <Text style={styles.modeButtonText}>⚡ Speed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => startViralMoment()}
        >
          <Text style={styles.modeButtonText}>🔥 Viral</Text>
        </TouchableOpacity>
      </View>

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
                <Text style={styles.modalTitle}>
                  🎤 {currentCard.track.title}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {currentCard.track.artist} • {currentCard.track.year}
                </Text>

                <View style={styles.audioStatus}>
                  <IconSymbol
                    name={audioPlaying ? 'speaker.wave.3' : 'speaker.slash'}
                    size={24}
                    color='#4ECDC4'
                  />
                  <Text style={styles.audioText}>
                    {audioPlaying
                      ? 'Audio reproduciéndose...'
                      : 'Audio terminado'}
                  </Text>
                </View>

                <Text style={styles.questionText}>{currentCard.question}</Text>
                <Text style={styles.answerText}>✅ {currentCard.answer}</Text>

                <Text style={styles.pointsLabel}>
                  ¿Quién acertó? ({currentCard.points} punto
                  {currentCard.points > 1 ? 's' : ''})
                </Text>

                <FlatList
                  data={players}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item: player }) => (
                    <TouchableOpacity
                      style={styles.playerButton}
                      onPress={() => handleAwardPoints(player.id)}
                    >
                      <Text style={styles.playerButtonText}>{player.name}</Text>
                      {player.currentBet > 0 && (
                        <Text style={styles.playerBetIndicator}>
                          🎰 {player.currentBet} •{' '}
                          {getBettingMultiplier(player.currentBet)}x
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                />

                <TouchableOpacity
                  style={styles.noWinnerButton}
                  onPress={() => setShowPointsModal(false)}
                >
                  <Text style={styles.noWinnerText}>Nadie acertó</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Betting Modal */}
      <Modal visible={showBettingModal} transparent animationType='slide'>
        <View style={styles.modalOverlay}>
          <View style={styles.bettingModal}>
            <Text style={styles.modalTitle}>🎰 Sistema de Apuestas</Text>

            <Text style={styles.bettingInfo}>
              Selecciona jugador y cantidad a apostar:
            </Text>

            <FlatList
              data={players.filter((p) => p.tokens > 0)}
              keyExtractor={(item) => item.id}
              renderItem={({ item: player }) => (
                <View style={styles.playerBettingCard}>
                  <Text style={styles.playerBettingName}>{player.name}</Text>
                  <Text style={styles.playerBettingTokens}>
                    🪙 {player.tokens}
                  </Text>

                  <View style={styles.bettingOptions}>
                    {[1, 2, 3].map(
                      (amount) =>
                        player.tokens >= amount && (
                          <TouchableOpacity
                            key={amount}
                            style={styles.betOptionButton}
                            onPress={() => {
                              setSelectedPlayer(player.id);
                              handlePlaceBet(player.id, amount);
                            }}
                          >
                            <Text style={styles.betOptionText}>{amount}</Text>
                            <Text style={styles.betOptionMultiplier}>
                              {getBettingMultiplier(amount)}x
                            </Text>
                          </TouchableOpacity>
                        )
                    )}
                  </View>
                </View>
              )}
            />

            <TouchableOpacity
              style={styles.closeBettingButton}
              onPress={() => setShowBettingModal(false)}
            >
              <Text style={styles.closeBettingText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Power Cards Modal */}
      <Modal visible={showPowerCardsModal} transparent animationType='slide'>
        <View style={styles.modalOverlay}>
          <View style={styles.powerCardsModal}>
            <Text style={styles.modalTitle}>⚡ Cartas de Poder</Text>

            <FlatList
              data={players}
              keyExtractor={(item) => item.id}
              renderItem={({ item: player }) => (
                <View style={styles.playerPowerCard}>
                  <Text style={styles.playerPowerName}>{player.name}</Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {player.powerCards.map((powerCard) => (
                      <TouchableOpacity
                        key={powerCard.id}
                        style={[
                          styles.powerCardItem,
                          powerCard.currentUses >= powerCard.usageLimit &&
                            styles.usedPowerCard,
                        ]}
                        onPress={() => {
                          if (powerCard.currentUses < powerCard.usageLimit) {
                            usePowerCard(player.id, powerCard.id);
                          }
                        }}
                        disabled={powerCard.currentUses >= powerCard.usageLimit}
                      >
                        <Text style={styles.powerCardEmoji}>
                          {powerCard.emoji}
                        </Text>
                        <Text style={styles.powerCardName}>
                          {powerCard.name}
                        </Text>
                        <Text style={styles.powerCardUses}>
                          {powerCard.currentUses}/{powerCard.usageLimit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            />

            <TouchableOpacity
              style={styles.closePowerButton}
              onPress={() => setShowPowerCardsModal(false)}
            >
              <Text style={styles.closePowerText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#F8F9FA',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  setupText: {
    fontSize: 18,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  gameModeText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  timerText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  potContainer: {
    backgroundColor: '#FFD700',
    margin: 15,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  potLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 5,
  },
  potTokens: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  potToken: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  potCount: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  playersList: {
    maxHeight: 120,
  },
  playersListContent: {
    paddingHorizontal: 15,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 15,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activePlayerCard: {
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  immunePlayerCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  playerHeader: {
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  playerScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenCount: {
    marginLeft: 3,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  playerStatus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 5,
    marginBottom: 3,
  },
  statusEmoji: {
    fontSize: 12,
    marginRight: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
  },
  powerCardsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  powerCardsCount: {
    marginLeft: 3,
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  currentTurnContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  turnLabel: {
    fontSize: 16,
    color: '#666666',
  },
  currentTurnName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 5,
  },
  mainActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
  },
  scanButtonText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bettingButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 15,
    marginRight: 7.5,
    alignItems: 'center',
  },
  powerButton: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 15,
    marginLeft: 7.5,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gameModeButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#9B59B6',
    padding: 12,
    borderRadius: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsModal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 15,
  },
  audioStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
  },
  audioText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 10,
  },
  answerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#27AE60',
    textAlign: 'center',
    marginBottom: 20,
  },
  pointsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 15,
  },
  playerButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  playerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerBetIndicator: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 3,
    opacity: 0.9,
  },
  noWinnerButton: {
    backgroundColor: '#95A5A6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  noWinnerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bettingModal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    maxHeight: '80%',
    width: '90%',
  },
  bettingInfo: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  playerBettingCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  playerBettingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 5,
  },
  playerBettingTokens: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 10,
  },
  bettingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  betOptionButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  betOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  betOptionMultiplier: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  closeBettingButton: {
    backgroundColor: '#95A5A6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeBettingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  powerCardsModal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    maxHeight: '80%',
    width: '90%',
  },
  playerPowerCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  playerPowerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  powerCardItem: {
    backgroundColor: '#4ECDC4',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  usedPowerCard: {
    backgroundColor: '#95A5A6',
    opacity: 0.5,
  },
  powerCardEmoji: {
    fontSize: 20,
    marginBottom: 3,
  },
  powerCardName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  powerCardUses: {
    fontSize: 8,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  closePowerButton: {
    backgroundColor: '#95A5A6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closePowerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  betButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  betButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  betMultiplier: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
});
