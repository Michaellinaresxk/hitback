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
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGameStore } from '@/store/gameStore';
import RealQRScanner from '@/components/game/QRScanner';
import AudioPlayer from '@/components/game/AudioPlayer';
import CardDisplay from '@/components/game/CardDisplay';
import PlayerScoreboard from '@/components/game/PlayerScoreboard';
import { audioService } from '@/services/audioService';
import GameEndModal from '@/components/game/GameEndModal';
import { SpeedRound, ViralMoment } from '@/components/game/SpecialGameModes';

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
    battleModeActive,
    speedRoundActive,
    selectedBattlePlayers,
    audioFinished,
    showQuestion,
    showAnswer,
    showGameEndModal,
    round,
    error,
    scanCard,
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
  const winner = players.find((p) => p.score >= 15);

  // ✅ BACKEND CONNECTION TEST ON MOUNT
  useEffect(() => {
    const testBackend = async () => {
      const isConnected = await audioService.testConnection();
      if (!isConnected) {
        Alert.alert(
          '⚠️ Backend No Conectado',
          'El servidor no está disponible. Revisa que esté corriendo en:\n' +
            audioService.getServerUrl(),
          [{ text: 'OK' }]
        );
      }
    };

    if (isActive) {
      testBackend();
    }
  }, [isActive]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      setError(null);
    }
  }, [error]);

  // ✅ AUTO-SHOW POINTS MODAL WHEN AUDIO FINISHES
  useEffect(() => {
    if (audioFinished && showQuestion && currentCard) {
      setShowPointsModal(true);
    }
  }, [audioFinished, showQuestion, currentCard]);

  // ✅ BACKEND QR SCANNING
  const handleScanCard = async (qrData: string) => {
    try {
      setShowScanner(false);

      // ✅ Use backend scanning with correct response structure
      const cardData = await audioService.scanQRAndPlay(qrData);

      if (cardData.success) {
        // ✅ FIXED: Convert backend response to our card format
        const gameCard = {
          id: cardData.data.track.id,
          qrCode: qrData,
          cardType: cardData.data.scan.cardType,
          track: {
            title: cardData.data.track.title,
            artist: cardData.data.track.artist,
            year: cardData.data.track.year,
            genre: cardData.data.track.genre,
            album: cardData.data.track.album || '',
            decade:
              cardData.data.track.decade ||
              `${Math.floor(cardData.data.track.year / 10) * 10}s`,
            // ✅ FIXED: Use correct audio URL from backend response
            previewUrl: cardData.data.audio.url,
          },
          question: cardData.data.question.text,
          answer: cardData.data.question.answer,
          points: cardData.data.scan.points,
          difficulty: cardData.data.scan.difficulty,
          // ✅ Additional data from backend
          challengeType: cardData.data.question.challengeType,
          hints: cardData.data.question.hints || [],
          audioUrl: cardData.data.audio.url,
          audioAvailable: cardData.data.audio.hasAudio,
          duration: cardData.data.audio.duration,
        };

        // ✅ Set card in store (this will trigger game logic)
        await scanCard(qrData, gameCard);

        console.log('✅ Game card processed successfully:', gameCard);

        // ✅ Show success feedback
        Alert.alert(
          '🎵 Carta Escaneada',
          `${gameCard.track.title} - ${gameCard.track.artist}\n` +
            `Tipo: ${gameCard.cardType.toUpperCase()} | Dificultad: ${gameCard.difficulty.toUpperCase()}\n` +
            `Puntos: ${gameCard.points}`,
          [{ text: 'Continuar' }]
        );
      }
    } catch (error) {
      console.error('❌ Scan error:', error);

      // ✅ Enhanced error handling with specific messages
      let errorMessage = 'Error desconocido';
      let errorTitle = '❌ Error de Escaneo';

      if (error.message.includes('HTTP 404')) {
        errorTitle = '🎵 Carta No Encontrada';
        errorMessage =
          'Esta carta no existe en la base de datos.\n\nVerifica que el código QR sea correcto.';
      } else if (error.message.includes('HTTP 400')) {
        errorTitle = '📱 Código QR Inválido';
        errorMessage =
          'El formato del código QR no es válido.\n\nFormato esperado: HITBACK_001_SONG_EASY';
      } else if (error.message.includes('fetch')) {
        errorTitle = '🌐 Sin Conexión';
        errorMessage =
          'No se puede conectar al servidor.\n\nVerifica tu conexión WiFi y que el servidor esté corriendo.';
      } else {
        errorMessage = error.message || 'No se pudo procesar la carta';
      }

      Alert.alert(errorTitle, errorMessage, [
        {
          text: '🧪 Probar Conexión',
          onPress: async () => {
            const connected = await audioService.testConnection();
            Alert.alert(
              connected ? '✅ Conectado' : '❌ Sin Conexión',
              connected
                ? 'El servidor está funcionando correctamente'
                : `No se puede conectar a:\n${audioService.getServerUrl()}\n\n` +
                    '• Verifica que el servidor esté corriendo\n' +
                    '• Ambos dispositivos en la misma WiFi\n' +
                    '• IP correcta en audioService.ts'
            );
          },
        },
        { text: 'OK', style: 'cancel' },
      ]);
    }
  };
  const handleAwardPoints = (playerId: string) => {
    if (!currentCard) return;

    awardPoints(playerId, undefined, 2000);
    setShowPointsModal(false);

    const player = players.find((p) => p.id === playerId);
    Alert.alert(
      '🎉 Punto Otorgado',
      `${player?.name} gana ${currentCard.points} punto${
        currentCard.points > 1 ? 's' : ''
      }`,
      [{ text: 'Continuar' }]
    );
  };

  const handlePlaceBet = (playerId: string, amount: number) => {
    placeBet(playerId, amount);
    const player = players.find((p) => p.id === playerId);
    Alert.alert(
      '🎰 Apuesta Realizada',
      `${player?.name} apostó ${amount} token${amount > 1 ? 's' : ''}\n` +
        `Multiplicador: ${getBettingMultiplier(amount)}x`,
      [{ text: 'OK' }]
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

    Alert.alert('⚡ Poder Activado', `${player.name} usó: ${powerCard.name}`, [
      { text: 'OK' },
    ]);
  };

  // ✅ SPECIAL MODES HANDLERS
  const handleSpecialMode = (modeType: 'battle' | 'speed' | 'viral') => {
    if (modeType === 'battle') {
      if (players.length < 2) {
        Alert.alert(
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
        Alert.alert('Error', 'Necesitas una carta activa para Viral Moment');
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

  // ✅ GAME END HANDLERS
  const handleNewGame = () => {
    setShowGameEndModal(false);
    createNewGame();
  };

  const handleBackToMenu = () => {
    setShowGameEndModal(false);
    createNewGame();
    // Navigate to main menu if needed
  };

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

  if (!isActive) {
    return (
      <View style={styles.setupContainer}>
        <IconSymbol name='gamecontroller' size={48} color='#64748B' />
        <Text style={styles.setupText}>Configure el juego para empezar</Text>
        <TouchableOpacity
          style={styles.testConnectionButton}
          onPress={async () => {
            const connected = await audioService.testConnection();
            Alert.alert(
              connected ? '✅ Conectado' : '❌ Desconectado',
              connected
                ? 'Backend funcionando correctamente'
                : `No se pudo conectar a:\n${audioService.getServerUrl()}`
            );
          }}
        >
          <Text style={styles.testConnectionText}>
            🧪 Probar Conexión Backend
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

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
          onRevealAnswer={() => setShowAnswer(true)}
          audioFinished={audioFinished}
        />
      )}

      {/* Audio Player */}
      {currentCard && (
        <AudioPlayer
          previewUrl={currentCard.track.previewUrl}
          trackTitle={currentCard.track.title}
          artist={currentCard.track.artist}
          duration={5000}
          autoPlay={true}
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
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
          activeOpacity={0.9}
        >
          <IconSymbol name='qrcode.viewfinder' size={28} color='#FFFFFF' />
          <Text style={styles.scanButtonText}>Escanear Carta</Text>
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
                    nextTurn();
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

      {/* Betting Modal */}
      <Modal visible={showBettingModal} transparent animationType='slide'>
        <View style={styles.modalOverlay}>
          <View style={styles.bettingModal}>
            <Text style={styles.modalTitle}>🎰 Sistema de Apuestas</Text>
            <Text style={styles.bettingInfo}>
              Apuesta tokens para multiplicar tus puntos:
            </Text>

            <FlatList
              data={players.filter((p) => p.tokens > 0)}
              keyExtractor={(item) => item.id}
              renderItem={({ item: player }) => (
                <View style={styles.playerBettingCard}>
                  <View style={styles.bettingPlayerHeader}>
                    <Text style={styles.playerBettingName}>{player.name}</Text>
                    <View style={styles.playerTokens}>
                      <IconSymbol
                        name='bitcoinsign.circle.fill'
                        size={16}
                        color='#F59E0B'
                      />
                      <Text style={styles.playerBettingTokens}>
                        {player.tokens}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bettingOptions}>
                    {[1, 2, 3].map(
                      (amount) =>
                        player.tokens >= amount && (
                          <TouchableOpacity
                            key={amount}
                            style={styles.betOptionButton}
                            onPress={() => {
                              handlePlaceBet(player.id, amount);
                              setShowBettingModal(false);
                            }}
                            activeOpacity={0.8}
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
              activeOpacity={0.8}
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

                  {player.powerCards?.length > 0 ? (
                    <FlatList
                      data={player.powerCards}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(power) => power.id}
                      renderItem={({ item: powerCard }) => (
                        <TouchableOpacity
                          style={[
                            styles.powerCardItem,
                            powerCard.currentUses >= powerCard.usageLimit &&
                              styles.usedPowerCard,
                          ]}
                          onPress={() => {
                            if (powerCard.currentUses < powerCard.usageLimit) {
                              handleUsePowerCard(player.id, powerCard.id);
                              setShowPowerCardsModal(false);
                            }
                          }}
                          disabled={
                            powerCard.currentUses >= powerCard.usageLimit
                          }
                          activeOpacity={0.8}
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
                      )}
                    />
                  ) : (
                    <Text style={styles.noPowerCards}>Sin cartas de poder</Text>
                  )}
                </View>
              )}
            />

            <TouchableOpacity
              style={styles.closePowerButton}
              onPress={() => setShowPowerCardsModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.closePowerText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Player Selection Modal (for Battle Mode) */}
      <Modal visible={showPlayerSelection} transparent animationType='slide'>
        <PlayerSelectionModal
          visible={showPlayerSelection}
          players={players}
          onSelectPlayers={handlePlayerSelection}
          onClose={() => setShowPlayerSelection(false)}
          title='⚔️ Seleccionar Luchadores'
        />
      </Modal>

      {/* Special Game Modes */}
      {battleModeActive && selectedBattlePlayers && (
        <BattleMode
          visible={battleModeActive}
          onClose={() => {
            useGameStore.setState({
              battleModeActive: false,
              gameMode: 'normal',
            });
          }}
          player1Id={selectedBattlePlayers.player1Id}
          player2Id={selectedBattlePlayers.player2Id}
        />
      )}

      <SpeedRound
        visible={speedRoundActive}
        onClose={() => {
          useGameStore.setState({
            speedRoundActive: false,
            gameMode: 'normal',
          });
        }}
      />

      <ViralMoment
        visible={viralMomentActive}
        onClose={() => {
          useGameStore.setState({
            viralMomentActive: false,
            gameMode: 'normal',
          });
        }}
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

// Player Selection Component
interface PlayerSelectionModalProps {
  visible: boolean;
  players: any[];
  onSelectPlayers: (player1Id: string, player2Id: string) => void;
  onClose: () => void;
  title: string;
}

function PlayerSelectionModal({
  visible,
  players,
  onSelectPlayers,
  onClose,
  title,
}: PlayerSelectionModalProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else if (prev.length < 2) {
        return [...prev, playerId];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (selectedPlayers.length === 2) {
      onSelectPlayers(selectedPlayers[0], selectedPlayers[1]);
      setSelectedPlayers([]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType='slide'>
      <View style={styles.modalOverlay}>
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionTitle}>{title}</Text>
          <Text style={styles.selectionSubtitle}>
            Selecciona 2 jugadores para la batalla
          </Text>

          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={({ item: player }) => (
              <TouchableOpacity
                style={[
                  styles.selectionPlayerButton,
                  selectedPlayers.includes(player.id) &&
                    styles.selectedSelectionPlayer,
                ]}
                onPress={() => handlePlayerToggle(player.id)}
              >
                <Text style={styles.selectionPlayerName}>{player.name}</Text>
                <Text style={styles.selectionPlayerScore}>
                  {player.score} pts
                </Text>
                {selectedPlayers.includes(player.id) && (
                  <IconSymbol
                    name='checkmark.circle.fill'
                    size={24}
                    color='#4ECDC4'
                  />
                )}
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={[
              styles.confirmSelectionButton,
              selectedPlayers.length !== 2 && styles.disabledButton,
            ]}
            onPress={handleConfirm}
            disabled={selectedPlayers.length !== 2}
          >
            <Text style={styles.confirmSelectionText}>
              Iniciar Batalla ({selectedPlayers.length}/2)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelSelectionButton}
            onPress={onClose}
          >
            <Text style={styles.cancelSelectionText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
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

  // Header
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

  // Pot
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

  // Current Turn
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

  // Main Actions
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

  // Game Mode Buttons
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

  // Modals
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

  // Betting Modal
  bettingModal: {
    backgroundColor: '#1E293B',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    maxHeight: '80%',
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bettingInfo: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  playerBettingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  bettingPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerBettingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  playerTokens: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerBettingTokens: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  bettingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  betOptionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  closeBettingButton: {
    backgroundColor: '#64748B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeBettingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Power Cards Modal
  powerCardsModal: {
    backgroundColor: '#1E293B',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    maxHeight: '80%',
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerPowerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  playerPowerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  powerCardItem: {
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  usedPowerCard: {
    backgroundColor: '#64748B',
    opacity: 0.6,
  },
  powerCardEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  powerCardName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  powerCardUses: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noPowerCards: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  closePowerButton: {
    backgroundColor: '#64748B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closePowerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Player Selection Modal
  selectionContainer: {
    backgroundColor: '#1E293B',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    maxHeight: '70%',
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectionPlayerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedSelectionPlayer: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  selectionPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  selectionPlayerScore: {
    fontSize: 14,
    color: '#94A3B8',
  },
  confirmSelectionButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmSelectionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelSelectionButton: {
    backgroundColor: '#64748B',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelSelectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
