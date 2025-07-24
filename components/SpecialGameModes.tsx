import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGameStore } from '@/store/gameStore';

const { width, height } = Dimensions.get('window');

// Battle Mode Component
interface BattleModeProps {
  visible: boolean;
  onClose: () => void;
  player1Id: string;
  player2Id: string;
}

export function BattleMode({
  visible,
  onClose,
  player1Id,
  player2Id,
}: BattleModeProps) {
  const { players, currentCard, awardPoints } = useGameStore();
  const [battlerResults, setBattlerResults] = useState<{
    player1Correct: boolean;
    player2Correct: boolean;
  } | null>(null);

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  const generateBattleQuestions = () => {
    if (!currentCard) return { q1: '', q2: '' };

    const questions = {
      song: ['¿Cuál es la canción?', '¿Cuál es el nombre de esta canción?'],
      artist: ['¿Quién canta esta canción?', '¿Cuál es el artista?'],
      decade: ['¿De qué década es?', '¿En qué década salió?'],
      lyrics: ['Completa la letra', 'Sigue cantando'],
      challenge: ['Imita al artista', 'Baila la canción'],
    };

    const cardQuestions = questions[currentCard.cardType] || questions.song;
    return {
      q1: cardQuestions[0],
      q2: cardQuestions[1],
    };
  };

  const battleQuestions = generateBattleQuestions();

  const handleBattleResult = (player1Won: boolean, player2Won: boolean) => {
    if (!currentCard) return;

    if (player1Won) {
      awardPoints(player1Id, currentCard.points);
    }
    if (player2Won) {
      awardPoints(player2Id, currentCard.points);
    }

    setBattlerResults({
      player1Correct: player1Won,
      player2Correct: player2Won,
    });

    setTimeout(() => {
      onClose();
      setBattlerResults(null);
    }, 3000);
  };

  if (!visible || !player1 || !player2 || !currentCard) return null;

  return (
    <Modal visible={visible} transparent animationType='slide'>
      <View style={styles.battleOverlay}>
        <View style={styles.battleContainer}>
          <Text style={styles.battleTitle}>⚔️ BATTLE MODE</Text>
          <Text style={styles.battleSubtitle}>
            {currentCard.track.title} - {currentCard.track.artist}
          </Text>

          {!battlerResults ? (
            <>
              <View style={styles.battlePlayers}>
                <View style={styles.battlePlayer}>
                  <Text style={styles.battlePlayerName}>{player1.name}</Text>
                  <Text style={styles.battleQuestion}>
                    {battleQuestions.q1}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.battleButton,
                      { backgroundColor: '#E74C3C' },
                    ]}
                    onPress={() => handleBattleResult(true, false)}
                  >
                    <Text style={styles.battleButtonText}>✅ Correcto</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.battleVs}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                <View style={styles.battlePlayer}>
                  <Text style={styles.battlePlayerName}>{player2.name}</Text>
                  <Text style={styles.battleQuestion}>
                    {battleQuestions.q2}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.battleButton,
                      { backgroundColor: '#3498DB' },
                    ]}
                    onPress={() => handleBattleResult(false, true)}
                  >
                    <Text style={styles.battleButtonText}>✅ Correcto</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.battleOptions}>
                <TouchableOpacity
                  style={styles.battleOptionButton}
                  onPress={() => handleBattleResult(true, true)}
                >
                  <Text style={styles.battleOptionText}>Ambos correctos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.battleOptionButton}
                  onPress={() => handleBattleResult(false, false)}
                >
                  <Text style={styles.battleOptionText}>Ninguno correcto</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.battleResults}>
              <Text style={styles.resultsTitle}>¡Resultados!</Text>
              <View style={styles.resultsList}>
                <Text
                  style={[
                    styles.resultText,
                    {
                      color: battlerResults.player1Correct
                        ? '#27AE60'
                        : '#E74C3C',
                    },
                  ]}
                >
                  {player1.name}: {battlerResults.player1Correct ? '✅' : '❌'}
                </Text>
                <Text
                  style={[
                    styles.resultText,
                    {
                      color: battlerResults.player2Correct
                        ? '#27AE60'
                        : '#E74C3C',
                    },
                  ]}
                >
                  {player2.name}: {battlerResults.player2Correct ? '✅' : '❌'}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.closeBattleButton} onPress={onClose}>
            <Text style={styles.closeBattleText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Speed Round Component
interface SpeedRoundProps {
  visible: boolean;
  onClose: () => void;
}

export function SpeedRound({ visible, onClose }: SpeedRoundProps) {
  const {
    players,
    speedRoundCards,
    speedRoundTimeLeft,
    currentSpeedRoundIndex,
    awardPoints,
  } = useGameStore();

  const [playerAnswers, setPlayerAnswers] = useState<Record<string, number>>(
    {}
  );
  const [roundActive, setRoundActive] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (visible && !roundActive) {
      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setRoundActive(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [visible]);

  const handlePlayerAnswer = (playerId: string) => {
    if (!roundActive) return;

    setPlayerAnswers((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + 1,
    }));
  };

  const finishSpeedRound = () => {
    // Find winner (most correct answers)
    const maxAnswers = Math.max(...Object.values(playerAnswers));
    const winners = Object.entries(playerAnswers)
      .filter(([_, answers]) => answers === maxAnswers)
      .map(([playerId]) => playerId);

    // Award points to winner(s)
    winners.forEach((winnerId) => {
      awardPoints(winnerId, speedRoundCards.length * 2); // 2 points per card
    });

    Alert.alert(
      '¡Speed Round Terminado!',
      `Ganador${winners.length > 1 ? 'es' : ''}: ${winners
        .map((id) => players.find((p) => p.id === id)?.name)
        .join(', ')}`
    );

    onClose();
    setPlayerAnswers({});
    setRoundActive(false);
    setCountdown(3);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType='slide'>
      <View style={styles.speedOverlay}>
        <View style={styles.speedContainer}>
          <Text style={styles.speedTitle}>⚡ SPEED ROUND</Text>

          {countdown > 0 ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdown}</Text>
              <Text style={styles.countdownLabel}>¡Prepárate!</Text>
            </View>
          ) : (
            <>
              <View style={styles.speedTimer}>
                <IconSymbol name='timer' size={24} color='#FFD700' />
                <Text style={styles.speedTimerText}>{speedRoundTimeLeft}s</Text>
              </View>

              <Text style={styles.speedInstruction}>
                5 cartas - 30 segundos - ¡El que más acierte gana!
              </Text>

              <View style={styles.speedPlayers}>
                {players.map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    style={styles.speedPlayerButton}
                    onPress={() => handlePlayerAnswer(player.id)}
                  >
                    <Text style={styles.speedPlayerName}>{player.name}</Text>
                    <Text style={styles.speedPlayerScore}>
                      {playerAnswers[player.id] || 0} correctas
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.finishSpeedButton}
                onPress={finishSpeedRound}
              >
                <Text style={styles.finishSpeedText}>Terminar Round</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.closeSpeedButton} onPress={onClose}>
            <Text style={styles.closeSpeedText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Viral Moment Component
interface ViralMomentProps {
  visible: boolean;
  onClose: () => void;
}

export function ViralMoment({ visible, onClose }: ViralMomentProps) {
  const { players, currentCard, awardPoints, viralMomentActive } =
    useGameStore();
  const [recording, setRecording] = useState(false);
  const [performanceComplete, setPerformanceComplete] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');

  const startRecording = () => {
    setRecording(true);
    Alert.alert(
      '📱 Grabando',
      'La cámara está grabando el performance. ¡Dale todo!',
      [{ text: 'OK' }]
    );
  };

  const stopRecording = () => {
    setRecording(false);
    setPerformanceComplete(true);
  };

  const handleViralResult = (playerId: string, success: boolean) => {
    if (!currentCard) return;

    if (success) {
      // Double points for viral success
      awardPoints(playerId, currentCard.points * 2);
      Alert.alert(
        '🔥 ¡VIRAL!',
        `${players.find((p) => p.id === playerId)?.name} gana doble puntos!`,
        [{ text: '¡Genial!' }]
      );
    } else {
      Alert.alert(
        '😅 ¡Fallaste!',
        'Pierdes el turno pero todos se divirtieron',
        [{ text: 'Jajaja' }]
      );
    }

    onClose();
    setRecording(false);
    setPerformanceComplete(false);
    setSelectedPlayer('');
  };

  if (!visible || !currentCard) return null;

  return (
    <Modal visible={visible} transparent animationType='slide'>
      <View style={styles.viralOverlay}>
        <View style={styles.viralContainer}>
          <Text style={styles.viralTitle}>🔥 VIRAL MOMENT</Text>
          <Text style={styles.viralSubtitle}>Challenge Card Activada</Text>

          <View style={styles.viralCard}>
            <Text style={styles.viralCardTitle}>{currentCard.track.title}</Text>
            <Text style={styles.viralCardArtist}>
              {currentCard.track.artist}
            </Text>
            <Text style={styles.viralChallenge}>{currentCard.question}</Text>
          </View>

          {!recording && !performanceComplete && (
            <>
              <Text style={styles.viralInstruction}>
                Selecciona quién va a hacer el challenge:
              </Text>

              <FlatList
                data={players}
                keyExtractor={(item) => item.id}
                renderItem={({ item: player }) => (
                  <TouchableOpacity
                    style={[
                      styles.viralPlayerButton,
                      selectedPlayer === player.id &&
                        styles.selectedViralPlayer,
                    ]}
                    onPress={() => setSelectedPlayer(player.id)}
                  >
                    <Text style={styles.viralPlayerName}>{player.name}</Text>
                    {selectedPlayer === player.id && (
                      <IconSymbol
                        name='checkmark.circle.fill'
                        size={24}
                        color='#27AE60'
                      />
                    )}
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={[
                  styles.startRecordingButton,
                  !selectedPlayer && styles.disabledButton,
                ]}
                onPress={startRecording}
                disabled={!selectedPlayer}
              >
                <IconSymbol name='video.circle' size={24} color='#FFFFFF' />
                <Text style={styles.startRecordingText}>Empezar Grabación</Text>
              </TouchableOpacity>
            </>
          )}

          {recording && (
            <View style={styles.recordingContainer}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>GRABANDO...</Text>
              </View>

              <Text style={styles.recordingPlayer}>
                {players.find((p) => p.id === selectedPlayer)?.name}
              </Text>

              <Text style={styles.recordingChallenge}>
                {currentCard.question}
              </Text>

              <TouchableOpacity
                style={styles.stopRecordingButton}
                onPress={stopRecording}
              >
                <IconSymbol name='stop.circle' size={24} color='#FFFFFF' />
                <Text style={styles.stopRecordingText}>Parar Grabación</Text>
              </TouchableOpacity>
            </View>
          )}

          {performanceComplete && (
            <View style={styles.viralResultsContainer}>
              <Text style={styles.viralResultsTitle}>¿Cómo lo hizo?</Text>

              <View style={styles.viralResultButtons}>
                <TouchableOpacity
                  style={[
                    styles.viralResultButton,
                    { backgroundColor: '#27AE60' },
                  ]}
                  onPress={() => handleViralResult(selectedPlayer, true)}
                >
                  <Text style={styles.viralResultText}>🔥 ¡VIRAL!</Text>
                  <Text style={styles.viralResultSubtext}>Doble puntos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.viralResultButton,
                    { backgroundColor: '#E74C3C' },
                  ]}
                  onPress={() => handleViralResult(selectedPlayer, false)}
                >
                  <Text style={styles.viralResultText}>😅 Falló</Text>
                  <Text style={styles.viralResultSubtext}>Pierde turno</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.closeViralButton} onPress={onClose}>
            <Text style={styles.closeViralText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Player Selection Modal for Battle Mode
interface PlayerSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlayers: (player1Id: string, player2Id: string) => void;
  title: string;
}

export function PlayerSelectionModal({
  visible,
  onClose,
  onSelectPlayers,
  title,
}: PlayerSelectionModalProps) {
  const { players } = useGameStore();
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
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType='slide'>
      <View style={styles.selectionOverlay}>
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
  // Battle Mode Styles
  battleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  battleContainer: {
    backgroundColor: '#1A1A2E',
    width: width * 0.95,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  battleTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 10,
  },
  battleSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  battlePlayers: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  battlePlayer: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
  },
  battlePlayerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  battleQuestion: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.9,
  },
  battleButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
  },
  battleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  battleVs: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFD700',
  },
  battleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  battleOptionButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
  },
  battleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  battleResults: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 15,
  },
  resultsList: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  closeBattleButton: {
    backgroundColor: '#95A5A6',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
  },
  closeBattleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Speed Round Styles
  speedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedContainer: {
    backgroundColor: '#9B59B6',
    width: width * 0.9,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  speedTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  countdownText: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFD700',
  },
  countdownLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
  },
  speedTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 15,
  },
  speedTimerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 5,
  },
  speedInstruction: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  speedPlayers: {
    width: '100%',
    marginBottom: 20,
  },
  speedPlayerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  speedPlayerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  speedPlayerScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
  finishSpeedButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  finishSpeedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  closeSpeedButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  closeSpeedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Viral Moment Styles
  viralOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viralContainer: {
    backgroundColor: '#FF6B6B',
    width: width * 0.9,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  viralTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  viralSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    opacity: 0.9,
  },
  viralCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  viralCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  viralCardArtist: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
    opacity: 0.8,
  },
  viralChallenge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
  },
  viralInstruction: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  viralPlayerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    width: '100%',
  },
  selectedViralPlayer: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  viralPlayerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  startRecordingButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  startRecordingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  recordingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recordingPlayer: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  recordingChallenge: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  stopRecordingButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 15,
  },
  stopRecordingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  viralResultsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  viralResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  viralResultButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  viralResultButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  viralResultText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  viralResultSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  closeViralButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  closeViralText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Player Selection Styles
  selectionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionContainer: {
    backgroundColor: '#FFFFFF',
    width: width * 0.9,
    maxHeight: height * 0.7,
    borderRadius: 20,
    padding: 25,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 10,
  },
  selectionSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectionPlayerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedSelectionPlayer: {
    backgroundColor: '#E8F8F5',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  selectionPlayerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  selectionPlayerScore: {
    fontSize: 14,
    color: '#666666',
  },
  confirmSelectionButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  confirmSelectionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelSelectionButton: {
    backgroundColor: '#95A5A6',
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
