// app/(tabs)/game.tsx - HITBACK Game Screen CORREGIDO
// ✅ Fix: Text strings must be rendered within a Text component
// ✅ Fix: Player IDs sync con backend
// ✅ Fix: awardPoints sin currentCard

import AudioPlayer from '@/components/game/AudioPlayer';
import GameEndModal from '@/components/game/GameEndModal';
import GameFeedback, { useFeedback } from '@/components/game/GameFeedback';
import PlayerScoreboard from '@/components/game/PlayerScoreboard';

import BettingModal from '@/components/modal/BettingModal';
import RewardNotification from '@/components/rewards/RewardNotification';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SCORE_TO_WIN } from '@/constants/Points';
import { REPRODUCTION_TIME_LIMIT } from '@/constants/TrackConfig';
import { useGameFlow } from '@/hooks/useGameFlow';
import { gameSessionService } from '@/services/GameSessionService';
import { soundEffects } from '@/services/SoundEffectsService';
import { useGameStore } from '@/store/gameStore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    isActive,
    gameMode,
    timeLeft,
    gamePot,
    showGameEndModal,
    round,
    error,
    placeBet,
    setError,
    setShowGameEndModal,
    createNewGame,
    nextTurn,
    clearBets,
  } = useGameStore();

  const {
    flowState,
    nextRound,
    handleAudioFinished,
    revealAnswer,
    placeBet: placeBetBackend,
    endBettingPhase,
    prepareNextRound,
    resetFlow,
    getBettingStatus,
    getCurrentPhase,
    canStartNextRound,
    testConnection,
    closeRewardNotification,
    getRewardData,
  } = useGameFlow();

  const {
    messages,
    dismissFeedback,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  } = useFeedback();

  const { t } = useTranslation();

  // Modal States
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showBettingModal, setShowBettingModal] = useState(false);

  // Map de IDs: frontend -> backend
  const [playerIdMap, setPlayerIdMap] = useState<Record<string, string>>({});

  const currentPlayer = players.find((p) => p.isCurrentTurn);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = players.find((p) => p.score >= SCORE_TO_WIN);
  const bettingStatus = getBettingStatus();
  const currentPhase = getCurrentPhase();
  const rewardData = getRewardData();

  // ═══════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (isActive) {
      checkBackendConnection();
      soundEffects.initialize();

      // Crear mapa de IDs cuando el juego inicia
      const idMap: Record<string, string> = {};
      players.forEach((player, index) => {
        // El backend usa player_1, player_2, etc.
        idMap[player.id] = `player_${index + 1}`;
      });
      setPlayerIdMap(idMap);
      console.log('📋 Player ID Map created:', idMap);
    }
  }, [isActive, players.length]);

  useEffect(() => {
    if (error) {
      showError('Error', error);
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (flowState.currentError) {
      showWarning('Aviso', flowState.currentError);
    }
  }, [flowState.currentError]);

  // Show points modal after betting phase ends
  useEffect(() => {
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

  // Game over handling
  useEffect(() => {
    if (flowState.gameOver && flowState.gameWinner) {
      soundEffects.playVictory();
      setShowGameEndModal(true);
    }
  }, [flowState.gameOver, flowState.gameWinner]);

  // También verificar por puntos locales
  useEffect(() => {
    if (winner && isActive) {
      console.log(`🏆 Winner detected locally: ${winner.name}`);
      soundEffects.playVictory();
      setShowGameEndModal(true);
    }
  }, [winner, isActive]);

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  // Obtener ID del backend para un jugador del frontend
  const getBackendPlayerId = (frontendId: string): string => {
    // Si ya tenemos el mapa, usarlo
    if (playerIdMap[frontendId]) {
      return playerIdMap[frontendId];
    }

    // Buscar por índice
    const playerIndex = players.findIndex((p) => p.id === frontendId);
    if (playerIndex !== -1) {
      return `player_${playerIndex + 1}`;
    }

    // Fallback: usar el ID original
    return frontendId;
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

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

    if (!player) {
      showError('Error', 'Jugador no encontrado');
      return;
    }

    if (player.tokens < amount) {
      showError('Error', 'No tienes suficientes tokens');
      return;
    }

    // Place bet locally
    placeBet(playerId, amount);

    // ✅ CORREGIDO: Usar el ID del backend
    const backendPlayerId = getBackendPlayerId(playerId);
    console.log(`🎰 Mapping ID: ${playerId} -> ${backendPlayerId}`);

    const result = await placeBetBackend(backendPlayerId, amount);

    if (result.success) {
      showSuccess(
        'Apuesta Realizada',
        `${player.name} apostó ${amount} token${amount > 1 ? 's' : ''} (${
          result.multiplier
        }x)`
      );
    } else {
      showError('Error', 'No se pudo registrar la apuesta en el servidor');
    }

    setShowBettingModal(false);
  };

  const handleWrongAnswer = async () => {
    soundEffects.playWrong();

    // Revelar respuesta sin ganador
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

    // Preparar siguiente ronda
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

    // ✅ CORREGIDO: Usar el ID del backend para revealAnswer
    const backendPlayerId = getBackendPlayerId(playerId);
    console.log(`🏆 Awarding points: ${playerId} -> ${backendPlayerId}`);

    const result = await revealAnswer(backendPlayerId);

    if (result) {
      // ✅ Los puntos ya se sincronizan automáticamente en useGameFlow.revealAnswer
      // Solo mostramos feedback al usuario

      showSuccess(
        '🎉 ¡Correcto!',
        `${player.name} gana ${result.pointsAwarded} puntos\n"${result.trackInfo.title}" - ${result.trackInfo.artist}`
      );

      // Check game over
      if (result.gameOver && result.gameWinner) {
        setTimeout(() => {
          setShowGameEndModal(true);
        }, 1500);
        setShowPointsModal(false);
        return;
      }
    }

    setShowPointsModal(false);
  };

  // Handler cuando se cierra la notificación de recompensa
  const handleRewardClose = () => {
    closeRewardNotification();

    // Preparar siguiente ronda después de cerrar
    setTimeout(() => {
      nextTurn();
      prepareNextRound();
    }, 500);
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

  // ═══════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseStyle = () => {
    switch (currentPhase) {
      case 'loading':
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
      case 'loading':
        return 'CARGANDO';
      case 'audio':
        return 'AUDIO';
      case 'betting':
        return 'APUESTAS';
      case 'question':
        return 'PREGUNTA';
      case 'answer':
        return 'RESPUESTA';
      default:
        return 'LISTO';
    }
  };

  const getBettingMultiplier = (amount: number): number => {
    return gameSessionService.getBettingMultiplier(amount);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: Setup Screen
  // ═══════════════════════════════════════════════════════════

  if (!isActive && !showGameEndModal) {
    return (
      <View style={styles.setupContainer}>
        <IconSymbol name='gamecontroller' size={48} color='#64748B' />
        <Text style={styles.setupText}>Configure el juego para empezar</Text>
        <Text style={styles.setupSubtext}>
          Ve a la pestaña "Setup" para agregar jugadores
        </Text>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: Game End Screen
  // ═══════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════
  // RENDER: Main Game Screen
  // ═══════════════════════════════════════════════════════════

  return (
    <View style={styles.container}>
      <ScrollView>
        <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

        <GameFeedback messages={messages} onMessageDismiss={dismissFeedback} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>HITBACK</Text>
            <View style={[styles.gameModeIndicator, getPhaseStyle()]}>
              <Text style={styles.gameModeText}>{getPhaseLabel()}</Text>
            </View>
          </View>
          <View style={styles.timerContainer}>
            <IconSymbol name='clock' size={16} color='#F8FAFC' />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {/* Betting Phase UI */}
        {bettingStatus.isActive && (
          <View
            style={[
              styles.bettingPhaseContainer,
              bettingStatus.urgentTime && styles.bettingPhaseUrgent,
            ]}
          >
            <View style={styles.bettingPhaseHeader}>
              <Text style={styles.bettingPhaseTitle}>TIEMPO DE APUESTAS</Text>
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
                onPress={endBettingPhase}
              >
                <IconSymbol name='checkmark.circle' size={18} color='#FFFFFF' />
                <Text style={styles.endBettingText}>Terminar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bettingProgressContainer}>
              <View
                style={[
                  styles.bettingProgress,
                  { width: `${(bettingStatus.timeLeft / 10) * 100}%` },
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
          </View>
        )}

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

        {/* Current Turn Info */}
        <View style={styles.currentTurnContainer}>
          <Text style={styles.turnLabel}>Turno Actual</Text>
          <Text style={styles.currentTurnName}>
            {currentPlayer?.name || 'Nadie'} - Ronda {round}
          </Text>
          <Text style={styles.phaseInfo}>
            <Text>Fase: </Text>
            <Text>{getPhaseLabel()}</Text>
          </Text>
        </View>

        {/* Main Action: Next Round Button */}
        <View style={styles.mainActions}>
          <TouchableOpacity
            style={[
              styles.nextRoundButton,
              flowState.isLoading && styles.nextRoundButtonLoading,
              !canStartNextRound() && styles.nextRoundButtonDisabled,
            ]}
            onPress={handleNextRound}
            activeOpacity={0.9}
            disabled={flowState.isLoading || !canStartNextRound()}
          >
            <IconSymbol
              name={flowState.isLoading ? 'hourglass' : 'play.circle.fill'}
              size={32}
              color='#FFFFFF'
            />
            <Text style={styles.nextRoundButtonText}>
              {flowState.isLoading
                ? 'Cargando...'
                : currentPhase === 'idle'
                ? 'Siguiente Canción'
                : currentPhase === 'answer'
                ? 'Siguiente Ronda'
                : 'Ronda en Curso...'}
            </Text>
          </TouchableOpacity>

          {/* Question Preview */}
          {flowState.questionVisible && flowState.currentRound && (
            <View style={styles.questionPreview}>
              <Text style={styles.questionPreviewIcon}>
                {flowState.currentRound.question.icon}
              </Text>
              <Text style={styles.questionPreviewText}>
                {flowState.currentRound.question.text}
              </Text>
              <Text style={styles.questionPreviewPoints}>
                {flowState.currentRound.question.points} puntos
              </Text>
            </View>
          )}
        </View>

        {/* Players Scoreboard */}
        <PlayerScoreboard
          players={sortedPlayers}
          showDetailedStats={true}
          highlightWinner={!!winner}
        />

        {/* Points Award Modal */}
        <Modal visible={showPointsModal} transparent animationType='fade'>
          <View style={styles.modalOverlay}>
            <View style={styles.pointsModal}>
              {flowState.currentRound && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalEmoji}>
                      {flowState.currentRound.question.icon}
                    </Text>
                    <Text style={styles.modalTitle}>
                      {flowState.currentRound.question.type.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>
                      {flowState.currentRound.question.text}
                    </Text>
                    {flowState.answerRevealed && flowState.roundResult && (
                      <Text style={styles.answerText}>
                        {flowState.roundResult.correctAnswer}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.pointsLabel}>
                    <Text>¿Quién respondió correctamente? (</Text>
                    <Text>{flowState.currentRound.question.points}</Text>
                    <Text> pts)</Text>
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
                        {player.currentBet !== undefined &&
                          player.currentBet > 0 && (
                            <Text style={styles.playerBetIndicator}>
                              <Text>Apuesta: </Text>
                              <Text>{player.currentBet}</Text>
                              <Text> x</Text>
                              <Text>
                                {getBettingMultiplier(player.currentBet)}
                              </Text>
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
                    <Text style={styles.noWinnerText}>Nadie acertó</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Betting Modal */}
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

        {/* Reward Notification */}
        {rewardData.data && (
          <RewardNotification
            visible={rewardData.show}
            onClose={handleRewardClose}
            playerName={rewardData.data.playerName}
            difficulty={rewardData.data.difficulty}
            powerCardWon={rewardData.data.powerCardWon}
            bonusTokens={rewardData.data.bonusTokens}
            combosAchieved={rewardData.data.combosAchieved}
          />
        )}

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

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

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
  setupSubtext: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
    textAlign: 'center',
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

  // Betting Phase
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
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
    textTransform: 'uppercase',
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

  // Pot
  potContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    margin: 20,
    marginTop: 0,
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
  phaseInfo: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Main Actions
  mainActions: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  nextRoundButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    gap: 12,
  },
  nextRoundButtonLoading: {
    backgroundColor: '#64748B',
  },
  nextRoundButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  nextRoundButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Question Preview
  questionPreview: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
  },
  questionPreviewIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  questionPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionPreviewPoints: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '700',
  },

  // Modal
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
  modalEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
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
    fontSize: 18,
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
