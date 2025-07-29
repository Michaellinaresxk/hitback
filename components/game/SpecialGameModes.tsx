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

// ⚔️ BATTLE MODE - Connected to Real Points
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
  const { players, currentCard, awardPoints, nextTurn } = useGameStore();
  const [battleResults, setBattleResults] = useState<{
    player1Correct: boolean;
    player2Correct: boolean;
  } | null>(null);

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  const generateBattleQuestions = () => {
    if (!currentCard) return { q1: '', q2: '' };

    const baseQuestion = currentCard.question;
    const track = currentCard.track;

    // Generate different questions based on card type
    switch (currentCard.cardType) {
      case 'song':
        return {
          q1: '¿Cuál es el nombre de esta canción?',
          q2: '¿Cómo se llama esta canción?',
        };
      case 'artist':
        return {
          q1: '¿Quién canta esta canción?',
          q2: '¿Cuál es el artista?',
        };
      case 'decade':
        return {
          q1: `¿En qué década salió "${track.title}"?`,
          q2: `¿De qué década es esta canción?`,
        };
      case 'lyrics':
        return {
          q1: 'Completa la letra que escuchaste',
          q2: 'Continúa cantando desde donde terminó',
        };
      case 'challenge':
        return {
          q1: `Imita el estilo de ${track.artist}`,
          q2: `Baila como si fueras ${track.artist}`,
        };
      default:
        return { q1: baseQuestion, q2: baseQuestion };
    }
  };

  const battleQuestions = generateBattleQuestions();

  // ✅ CONNECTED TO REAL POINT SYSTEM
  const handleBattleResult = (player1Won: boolean, player2Won: boolean) => {
    if (!currentCard) return;

    let battlePoints = currentCard.points;

    // Battle mode bonus: +1 point for participating, +2 for winning
    if (player1Won && player2Won) {
      // Both won - give normal points to both
      awardPoints(player1Id, battlePoints, 2500);
      setTimeout(() => {
        awardPoints(player2Id, battlePoints, 2500);
      }, 100);
    } else if (player1Won) {
      // Player 1 wins - gets normal points + battle bonus
      awardPoints(player1Id, battlePoints + 1, 2000);
    } else if (player2Won) {
      // Player 2 wins - gets normal points + battle bonus
      awardPoints(player2Id, battlePoints + 1, 2000);
    } else {
      // No one won - just proceed to next turn
      nextTurn();
    }

    setBattleResults({
      player1Correct: player1Won,
      player2Correct: player2Won,
    });

    setTimeout(() => {
      onClose();
      setBattleResults(null);
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
          <Text style={styles.battleBonus}>+1 punto bonus para el ganador</Text>

          {!battleResults ? (
            <>
              <View style={styles.battlePlayers}>
                <View style={styles.battlePlayer}>
                  <View style={styles.battlePlayerHeader}>
                    <Text style={styles.battlePlayerName}>{player1.name}</Text>
                    <Text style={styles.battlePlayerScore}>
                      {player1.score} pts
                    </Text>
                  </View>
                  <Text style={styles.battleQuestion}>
                    {battleQuestions.q1}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.battleButton,
                      { backgroundColor: '#EF4444' },
                    ]}
                    onPress={() => handleBattleResult(true, false)}
                  >
                    <Text style={styles.battleButtonText}>
                      ✅ {player1.name} Ganó
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.battleVs}>
                  <Text style={styles.vsText}>VS</Text>
                  <Text style={styles.battlePointsText}>
                    {currentCard.points + 1} pts
                  </Text>
                </View>

                <View style={styles.battlePlayer}>
                  <View style={styles.battlePlayerHeader}>
                    <Text style={styles.battlePlayerName}>{player2.name}</Text>
                    <Text style={styles.battlePlayerScore}>
                      {player2.score} pts
                    </Text>
                  </View>
                  <Text style={styles.battleQuestion}>
                    {battleQuestions.q2}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.battleButton,
                      { backgroundColor: '#3B82F6' },
                    ]}
                    onPress={() => handleBattleResult(false, true)}
                  >
                    <Text style={styles.battleButtonText}>
                      ✅ {player2.name} Ganó
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.battleOptions}>
                <TouchableOpacity
                  style={styles.battleOptionButton}
                  onPress={() => handleBattleResult(true, true)}
                >
                  <Text style={styles.battleOptionText}>Ambos Correctos</Text>
                  <Text style={styles.battleOptionSubtext}>
                    {currentCard.points} pts c/u
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.battleOptionButton,
                    { backgroundColor: '#64748B' },
                  ]}
                  onPress={() => handleBattleResult(false, false)}
                >
                  <Text style={styles.battleOptionText}>Ninguno Correcto</Text>
                  <Text style={styles.battleOptionSubtext}>0 pts</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.battleResults}>
              <Text style={styles.resultsTitle}>
                ¡Resultados de la Batalla!
              </Text>
              <View style={styles.resultsList}>
                <Text
                  style={[
                    styles.resultText,
                    {
                      color: battleResults.player1Correct
                        ? '#10B981'
                        : '#EF4444',
                    },
                  ]}
                >
                  {player1.name}:{' '}
                  {battleResults.player1Correct ? '✅ Ganó' : '❌ Perdió'}
                </Text>
                <Text
                  style={[
                    styles.resultText,
                    {
                      color: battleResults.player2Correct
                        ? '#10B981'
                        : '#EF4444',
                    },
                  ]}
                >
                  {player2.name}:{' '}
                  {battleResults.player2Correct ? '✅ Ganó' : '❌ Perdió'}
                </Text>
              </View>
              <Text style={styles.resultsNote}>
                Puntos otorgados automáticamente
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ⚡ SPEED ROUND - Connected to Real Points
interface SpeedRoundProps {
  visible: boolean;
  onClose: () => void;
}

export function SpeedRound({ visible, onClose }: SpeedRoundProps) {
  const { players, awardPoints, nextTurn } = useGameStore();
  const [playerAnswers, setPlayerAnswers] = useState<Record<string, number>>(
    {}
  );
  const [roundActive, setRoundActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (visible && !roundActive) {
      // Reset states
      setPlayerAnswers({});
      setTimeLeft(30);
      setCountdown(3);

      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setRoundActive(true);
            startSpeedTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [visible]);

  const startSpeedTimer = () => {
    const speedInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(speedInterval);
          finishSpeedRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePlayerAnswer = (playerId: string) => {
    if (!roundActive || timeLeft <= 0) return;

    setPlayerAnswers((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + 1,
    }));
  };

  // ✅ CONNECTED TO REAL POINT SYSTEM
  const finishSpeedRound = () => {
    if (Object.keys(playerAnswers).length === 0) {
      Alert.alert('Speed Round Terminado', 'Nadie respondió preguntas');
      onClose();
      return;
    }

    // Find winner (most correct answers)
    const maxAnswers = Math.max(...Object.values(playerAnswers));
    const winners = Object.entries(playerAnswers)
      .filter(([_, answers]) => answers === maxAnswers)
      .map(([playerId]) => playerId);

    // Award points to winner(s) - Speed Round gives 2x normal points
    winners.forEach((winnerId) => {
      const answersCount = playerAnswers[winnerId] || 0;
      const speedBonusPoints = answersCount * 2; // 2 points per correct answer
      awardPoints(winnerId, speedBonusPoints, 1500); // Fast answer time
    });

    // Award participation points to others
    Object.entries(playerAnswers).forEach(([playerId, answers]) => {
      if (!winners.includes(playerId) && answers > 0) {
        awardPoints(playerId, answers, 3000); // 1 point per answer
      }
    });

    const winnerNames = winners
      .map((id) => players.find((p) => p.id === id)?.name)
      .join(', ');

    Alert.alert(
      '⚡ Speed Round Terminado!',
      `Ganador${winners.length > 1 ? 'es' : ''}: ${winnerNames}\n` +
        `Respuestas correctas: ${maxAnswers}`,
      [{ text: 'Continuar', onPress: onClose }]
    );

    // Reset for next round
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
          <Text style={styles.speedSubtitle}>¡Responde rápido para ganar!</Text>

          {countdown > 0 ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{countdown}</Text>
              <Text style={styles.countdownLabel}>¡Prepárate!</Text>
            </View>
          ) : (
            <>
              <View style={styles.speedTimer}>
                <IconSymbol name='timer' size={24} color='#FFD700' />
                <Text style={styles.speedTimerText}>{timeLeft}s</Text>
              </View>

              <Text style={styles.speedInstruction}>
                Toca tu nombre cada vez que sepas una respuesta
              </Text>
              <Text style={styles.speedPoints}>
                2 puntos por respuesta correcta
              </Text>

              <View style={styles.speedPlayers}>
                {players.map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    style={[
                      styles.speedPlayerButton,
                      (playerAnswers[player.id] || 0) > 0 &&
                        styles.activeSpeedPlayer,
                    ]}
                    onPress={() => handlePlayerAnswer(player.id)}
                    disabled={!roundActive || timeLeft <= 0}
                  >
                    <Text style={styles.speedPlayerName}>{player.name}</Text>
                    <Text style={styles.speedPlayerScore}>
                      {playerAnswers[player.id] || 0} respuestas
                    </Text>
                    <Text style={styles.speedPlayerPoints}>
                      {(playerAnswers[player.id] || 0) * 2} pts
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.finishSpeedButton}
                onPress={finishSpeedRound}
              >
                <Text style={styles.finishSpeedText}>Terminar Ahora</Text>
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

// 🔥 VIRAL MOMENT - Connected to Real Points
interface ViralMomentProps {
  visible: boolean;
  onClose: () => void;
}

export function ViralMoment({ visible, onClose }: ViralMomentProps) {
  const { players, currentCard, awardPoints, nextTurn } = useGameStore();
  const [recording, setRecording] = useState(false);
  const [performanceComplete, setPerformanceComplete] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');

  const startRecording = () => {
    setRecording(true);
    Alert.alert(
      '📱 Grabando',
      'El performance está siendo evaluado. ¡Dale todo!',
      [{ text: 'OK' }]
    );

    // Auto-stop recording after 15 seconds
    setTimeout(() => {
      if (recording) {
        stopRecording();
      }
    }, 15000);
  };

  const stopRecording = () => {
    setRecording(false);
    setPerformanceComplete(true);
  };

  // ✅ CONNECTED TO REAL POINT SYSTEM
  const handleViralResult = (playerId: string, success: boolean) => {
    if (!currentCard) return;

    const player = players.find((p) => p.id === playerId);

    if (success) {
      // Viral success: Triple points + viral bonus
      const viralPoints = currentCard.points * 3 + 2; // 3x + 2 bonus
      awardPoints(playerId, viralPoints, 1000); // Very fast "answer"

      Alert.alert(
        '🔥 ¡SE VOLVIÓ VIRAL!',
        `${player?.name} gana ${viralPoints} puntos!\n` +
          `(${currentCard.points}x3 + 2 bonus viral)`,
        [{ text: '¡Increíble!' }]
      );
    } else {
      // Failed viral: No points, but no penalty either
      Alert.alert(
        '😅 ¡Buen Intento!',
        `${player?.name} no se volvió viral, pero todos se divirtieron.\n` +
          'No pierde puntos ni tokens.',
        [{ text: 'Jajaja' }]
      );
      nextTurn(); // Just move to next turn
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
          <Text style={styles.viralSubtitle}>¡Performance Challenge!</Text>

          <View style={styles.viralCard}>
            <Text style={styles.viralCardTitle}>{currentCard.track.title}</Text>
            <Text style={styles.viralCardArtist}>
              {currentCard.track.artist}
            </Text>
            <Text style={styles.viralChallenge}>{currentCard.question}</Text>
          </View>

          <View style={styles.viralRewards}>
            <Text style={styles.viralRewardsTitle}>💰 RECOMPENSAS</Text>
            <View style={styles.viralRewardItem}>
              <Text style={styles.viralRewardText}>
                🔥 Viral: {currentCard.points * 3 + 2} puntos
              </Text>
            </View>
            <View style={styles.viralRewardItem}>
              <Text style={styles.viralRewardText}>
                😅 Falló: 0 puntos (sin penalización)
              </Text>
            </View>
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
                    <Text style={styles.viralPlayerScore}>
                      {player.score} pts
                    </Text>
                    {selectedPlayer === player.id && (
                      <IconSymbol
                        name='checkmark.circle.fill'
                        size={24}
                        color='#10B981'
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
                <Text style={styles.startRecordingText}>
                  Empezar Performance
                </Text>
              </TouchableOpacity>
            </>
          )}

          {recording && (
            <View style={styles.recordingContainer}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>EVALUANDO...</Text>
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
                <Text style={styles.stopRecordingText}>
                  Terminar Performance
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {performanceComplete && (
            <View style={styles.viralResultsContainer}>
              <Text style={styles.viralResultsTitle}>
                ¿Cómo estuvo el performance?
              </Text>

              <View style={styles.viralResultButtons}>
                <TouchableOpacity
                  style={[
                    styles.viralResultButton,
                    { backgroundColor: '#10B981' },
                  ]}
                  onPress={() => handleViralResult(selectedPlayer, true)}
                >
                  <Text style={styles.viralResultText}>
                    🔥 ¡SE VOLVIÓ VIRAL!
                  </Text>
                  <Text style={styles.viralResultSubtext}>
                    {currentCard.points * 3 + 2} puntos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.viralResultButton,
                    { backgroundColor: '#F59E0B' },
                  ]}
                  onPress={() => handleViralResult(selectedPlayer, false)}
                >
                  <Text style={styles.viralResultText}>😅 Buen Intento</Text>
                  <Text style={styles.viralResultSubtext}>0 puntos</Text>
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

const styles = StyleSheet.create({
  // Battle Mode styles
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
    marginBottom: 8,
    opacity: 0.8,
  },
  battleBonus: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 20,
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
  battlePlayerHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  battlePlayerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  battlePlayerScore: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  battleQuestion: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.9,
    minHeight: 40,
  },
  battleButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
  },
  battleButtonText: {
    fontSize: 14,
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
    marginBottom: 4,
  },
  battlePointsText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
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
    alignItems: 'center',
  },
  battleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  battleOptionSubtext: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  battleResults: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 15,
  },
  resultsList: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  resultsNote: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
    textAlign: 'center',
  },

  // Speed Round styles
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
    marginBottom: 5,
  },
  speedSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 15,
    opacity: 0.9,
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
    marginBottom: 8,
    opacity: 0.9,
  },
  speedPoints: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 20,
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
  activeSpeedPlayer: {
    backgroundColor: 'rgba(16,185,129,0.3)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  speedPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  speedPlayerScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginRight: 8,
  },
  speedPlayerPoints: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
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

  // Viral Moment styles
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  viralCardArtist: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 10,
    opacity: 0.8,
  },
  viralChallenge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
  },
  viralRewards: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  viralRewardsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  viralRewardItem: {
    marginBottom: 4,
  },
  viralRewardText: {
    fontSize: 12,
    color: '#FFFFFF',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  viralPlayerScore: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginRight: 8,
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
    backgroundColor: '#10B981',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
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
    marginHorizontal: 5,
  },
  viralResultText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  viralResultSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
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
  disabledButton: {
    opacity: 0.5,
  },
});
