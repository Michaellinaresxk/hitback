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
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGameStore } from '@/store/gameStore';
import QRScanner from '@/components/game/QRScanner';
import { audioService } from '@/services/audioService';

const { width } = Dimensions.get('window');

export default function GameScreen() {
  const {
    players,
    currentCard,
    isActive,
    gameMode,
    timeLeft,
    isScanning,
    scanCard,
    playCardAudio,
    stopAudio,
    awardPoints,
    nextTurn,
    setScanning,
    startBattleMode,
    startSpeedRound,
    startViralMoment,
  } = useGameStore();

  const [showScanner, setShowScanner] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [timer, setTimer] = useState(0);

  // Initialize audio service
  useEffect(() => {
    audioService.initializeAudio();
  }, []);

  // Game timer
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev >= timeLeft) {
          // Time's up - end game
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleScanCard = async (qrData: string) => {
    try {
      setShowScanner(false);
      await scanCard(qrData);
      setAudioPlaying(true);
      setShowPointsModal(true);

      // Auto-stop audio after 5 seconds
      setTimeout(() => {
        setAudioPlaying(false);
      }, 5000);
    } catch (error) {
      Alert.alert('Error', 'No se pudo escanear la carta');
    }
  };

  const handleAwardPoints = (playerId: string) => {
    if (!currentCard) return;

    awardPoints(playerId, currentCard.points);
    setShowPointsModal(false);

    // Show success feedback
    const player = players.find((p) => p.id === playerId);
    Alert.alert(
      '¡Punto!',
      `${player?.name} gana ${currentCard.points} punto${
        currentCard.points > 1 ? 's' : ''
      }`,
      [{ text: 'Continuar', onPress: nextTurn }]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPlayer = () => {
    return players.find((p) => p.isCurrentTurn);
  };

  const getLeaderboard = () => {
    return [...players].sort((a, b) => b.score - a.score);
  };

  if (!isActive) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎮 Game Master</Text>
          <ThemedText style={styles.subtitle}>No hay partida activa</ThemedText>
        </View>

        <View style={styles.centerContent}>
          <ThemedText style={styles.message}>
            Inicia una nueva partida desde la pantalla principal
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header with timer and current player */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>🎵 HITBACK</Text>
          <View style={styles.timerContainer}>
            <IconSymbol name='clock.fill' size={16} color='#007AFF' />
            <Text style={styles.timer}>{formatTime(timeLeft - timer)}</Text>
          </View>
        </View>

        <View style={styles.currentTurn}>
          <ThemedText style={styles.turnLabel}>Turno de:</ThemedText>
          <Text style={styles.currentPlayer}>
            {getCurrentPlayer()?.name || 'Ninguno'}
          </Text>
        </View>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <ThemedText style={styles.scoreTitle}>Puntuación</ThemedText>
        <FlatList
          data={getLeaderboard()}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.playerScore,
                item.isCurrentTurn && styles.currentPlayerScore,
              ]}
            >
              <Text style={styles.playerPosition}>#{index + 1}</Text>
              <Text style={styles.playerScoreName}>{item.name}</Text>
              <Text style={styles.playerScorePoints}>{item.score} pts</Text>
            </View>
          )}
        />
      </View>

      {/* Current card display */}
      {currentCard && (
        <View style={styles.cardDisplay}>
          <View style={[styles.cardInfo, getCardTypeStyle(currentCard.type)]}>
            <Text style={styles.cardType}>
              {getCardTypeEmoji(currentCard.type)}{' '}
              {getCardTypeName(currentCard.type)}
            </Text>
            <Text style={styles.cardPoints}>{currentCard.points} puntos</Text>
          </View>

          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{currentCard.track.title}</Text>
            <Text style={styles.trackArtist}>{currentCard.track.artist}</Text>
          </View>

          <Text style={styles.question}>{currentCard.question}</Text>

          {audioPlaying && (
            <View style={styles.audioIndicator}>
              <IconSymbol
                name='speaker.wave.2.fill'
                size={20}
                color='#007AFF'
              />
              <Text style={styles.audioText}>Reproduciendo audio...</Text>
            </View>
          )}
        </View>
      )}

      {/* Main actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <IconSymbol name='camera.fill' size={24} color='#FFFFFF' />
          <Text style={styles.scanButtonText}>Escanear Carta</Text>
        </TouchableOpacity>

        {currentCard && (
          <TouchableOpacity style={styles.replayButton} onPress={playCardAudio}>
            <IconSymbol name='arrow.clockwise' size={20} color='#007AFF' />
            <Text style={styles.replayText}>Repetir Audio</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Game modes */}
      <View style={styles.gameModes}>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => startBattleMode('', '')}
        >
          <Text style={styles.modeText}>🎯 Battle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modeButton} onPress={startSpeedRound}>
          <Text style={styles.modeText}>⚡ Speed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modeButton} onPress={startViralMoment}>
          <Text style={styles.modeText}>🔥 Viral</Text>
        </TouchableOpacity>
      </View>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType='slide'
        presentationStyle='fullScreen'
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              onPress={() => setShowScanner(false)}
              style={styles.closeButton}
            >
              <IconSymbol name='xmark' size={24} color='#FFFFFF' />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Escanear Carta</Text>
            <View style={{ width: 24 }} />
          </View>

          <QRScanner
            onScanSuccess={handleScanCard}
            onClose={() => setShowScanner(false)}
            isVisible={showScanner}
          />
        </View>
      </Modal>

      {/* Points Assignment Modal */}
      <Modal visible={showPointsModal} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View style={styles.pointsModal}>
            <Text style={styles.modalTitle}>
              ¿Quién respondió correctamente?
            </Text>

            {currentCard && (
              <View style={styles.answerSection}>
                <Text style={styles.correctAnswer}>
                  Respuesta: {currentCard.answer}
                </Text>
              </View>
            )}

            <FlatList
              data={players}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playerButton}
                  onPress={() => handleAwardPoints(item.id)}
                >
                  <Text style={styles.playerButtonText}>{item.name}</Text>
                  <Text style={styles.playerCurrentScore}>
                    {item.score} pts
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.noWinnerButton}
              onPress={() => {
                setShowPointsModal(false);
                nextTurn();
              }}
            >
              <Text style={styles.noWinnerText}>Nadie acertó</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// Helper functions
const getCardTypeStyle = (type: string) => {
  const styles = {
    song: { backgroundColor: '#FFD700' }, // Yellow
    artist: { backgroundColor: '#FF4444' }, // Red
    decade: { backgroundColor: '#4444FF' }, // Blue
    lyrics: { backgroundColor: '#44FF44' }, // Green
    challenge: { backgroundColor: '#FF8800' }, // Orange
  };
  return styles[type] || styles.song;
};

const getCardTypeEmoji = (type: string) => {
  const emojis = {
    song: '🎵',
    artist: '🎤',
    decade: '📅',
    lyrics: '📝',
    challenge: '🔥',
  };
  return emojis[type] || '🎵';
};

const getCardTypeName = (type: string) => {
  const names = {
    song: 'SONG CARD',
    artist: 'ARTIST CARD',
    decade: 'DECADE CARD',
    lyrics: 'LYRICS CARD',
    challenge: 'CHALLENGE CARD',
  };
  return names[type] || 'SONG CARD';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingTop: 50,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  currentTurn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  turnLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  currentPlayer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  scoreboard: {
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  playerScore: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  currentPlayerScore: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  playerPosition: {
    fontSize: 12,
    opacity: 0.6,
  },
  playerScoreName: {
    fontSize: 14,
    fontWeight: '600',
  },
  playerScorePoints: {
    fontSize: 12,
    color: '#007AFF',
  },
  cardDisplay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trackInfo: {
    marginBottom: 12,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trackArtist: {
    fontSize: 16,
    opacity: 0.7,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  audioText: {
    fontSize: 14,
    color: '#007AFF',
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    gap: 8,
  },
  replayText: {
    fontSize: 16,
    color: '#007AFF',
  },
  gameModes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    padding: 8,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  answerSection: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  correctAnswer: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2E7D32',
  },
  playerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 8,
  },
  playerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  playerCurrentScore: {
    fontSize: 14,
    color: '#007AFF',
  },
  noWinnerButton: {
    backgroundColor: '#FF4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  noWinnerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
