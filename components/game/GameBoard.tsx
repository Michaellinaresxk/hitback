// components/game/GameBoard.tsx - 🎮 TU DISEÑO ORIGINAL RESTAURADO
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGameFlow } from '@/hooks/useGameFlow';
import { useGameStore } from '@/store/gameStore';
import {
  checkWinCondition,
  formatTime,
  getPlayerRanking,
} from '@/utils/gameHelpers';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Import optimized components
import BettingModal from '../modal/BettingModal';
import GameEndModal from '../modal/GameEndModal';
import PointsAwardModal from '../modal/PointsAwardModal';
import PowerCardsModal from '../modal/PowerCardModal';
import CardDisplay from './CardDisplay';
import PlayerScoreboard from './PlayerScoreboard';
import RealQRScanner from './QRScanner';

export default function GameBoard() {
  const {
    players,
    currentCard,
    isActive,
    timeLeft,
    round,
    awardPoints,
    nextTurn,
    endGame,
  } = useGameStore();

  const {
    flowState,
    handleQRScan,
    revealAnswer,
    isScanning,
    isAudioPlaying,
    showQuestion,
    showAnswer,
    canAwardPoints,
    cleanup,
  } = useGameFlow();

  // Local state
  const [showScanner, setShowScanner] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [gameEndModal, setGameEndModal] = useState(false);

  // Derived state
  const rankedPlayers = getPlayerRanking(players);
  const currentPlayer = players.find((p) => p.isCurrentTurn);

  // Check win conditions
  useEffect(() => {
    const { gameEnded, winner } = checkWinCondition(players, timeLeft);
    if (gameEnded) {
      setGameEndModal(true);
      endGame();
    }
  }, [players, timeLeft, endGame]);

  // Show points modal when question phase starts
  useEffect(() => {
    if (canAwardPoints && showQuestion) {
      setTimeout(() => setShowPointsModal(true), 500);
    }
  }, [canAwardPoints, showQuestion]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Event handlers
  const handleScanSuccess = async (qrCode: string) => {
    setShowScanner(false);
    await handleQRScan(qrCode);
  };

  const handleAwardPoints = (playerId: string) => {
    if (!currentCard) return;

    awardPoints(playerId, currentCard.points);
    setShowPointsModal(false);

    setTimeout(() => nextTurn(), 1500); // Brief delay for feedback
  };

  const handleNoWinner = () => {
    setShowPointsModal(false);
    setTimeout(() => nextTurn(), 500);
  };

  const getPhaseText = (phase: string): string => {
    const texts = {
      scanning: '🔍 Procesando carta...',
      audio: '🎵 Reproduciendo audio...',
      question: '❓ ¡Respondan rápido!',
      answered: '✅ Puntos otorgados',
    };
    return texts[phase as keyof typeof texts] || '';
  };

  if (!isActive) {
    return (
      <SafeAreaView style={styles.setupContainer}>
        <IconSymbol name='gamecontroller' size={48} color='#64748B' />
        <Text style={styles.setupText}>Configura el juego para empezar</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle}>HITBACK</Text>
          <Text style={styles.gameMode}>JUEGO ACTIVO</Text>
          {flowState.phase !== 'idle' && (
            <Text style={styles.phaseText}>
              {getPhaseText(flowState.phase)}
            </Text>
          )}
        </View>

        <View style={styles.gameStats}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.roundText}>Ronda {round}</Text>
        </View>
      </View>

      {/* Current Turn */}
      {currentPlayer && (
        <View style={styles.currentTurnBanner}>
          <Text style={styles.turnText}>🎯 Turno: {currentPlayer.name}</Text>
        </View>
      )}

      {/* Card Display */}
      <CardDisplay
        card={currentCard}
        isAudioPlaying={isAudioPlaying}
        showQuestion={showQuestion}
        showAnswer={showAnswer}
        onRevealAnswer={revealAnswer}
        flowPhase={flowState.phase}
      />

      {/* Main Actions */}
      <View style={styles.actionPanel}>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={() => setShowScanner(true)}
          disabled={isScanning || isAudioPlaying}
        >
          <IconSymbol
            name={isScanning ? 'hourglass' : 'qrcode.viewfinder'}
            size={24}
            color='#FFFFFF'
          />
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Procesando...' : 'Escanear Carta'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowBettingModal(true)}
          >
            <IconSymbol name='dice.fill' size={20} color='#FFFFFF' />
            <Text style={styles.actionText}>Apostar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => setShowPowerModal(true)}
          >
            <IconSymbol name='sparkles' size={20} color='#FFFFFF' />
            <Text style={styles.actionText}>Poderes</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Award Points - Only show when appropriate */}
        {canAwardPoints && showQuestion && (
          <TouchableOpacity
            style={styles.quickAwardButton}
            onPress={() => setShowPointsModal(true)}
          >
            <IconSymbol name='trophy.fill' size={20} color='#FFFFFF' />
            <Text style={styles.quickAwardText}>¿Quién Ganó?</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Player Scoreboard */}
      <PlayerScoreboard players={rankedPlayers} showDetailedStats={true} />

      {/* Modals */}
      <Modal visible={showScanner} animationType='slide'>
        <RealQRScanner
          isVisible={showScanner}
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      </Modal>

      <PointsAwardModal
        visible={showPointsModal}
        currentCard={currentCard}
        players={players}
        showAnswer={showAnswer}
        onAwardPoints={handleAwardPoints}
        onNoWinner={handleNoWinner}
        onRevealAnswer={revealAnswer}
        onClose={() => setShowPointsModal(false)}
      />

      <BettingModal
        visible={showBettingModal}
        players={players}
        currentCard={currentCard}
        onClose={() => setShowBettingModal(false)}
      />

      <PowerCardsModal
        visible={showPowerModal}
        players={players}
        onClose={() => setShowPowerModal(false)}
      />

      <GameEndModal
        visible={gameEndModal}
        players={rankedPlayers}
        gameTimeElapsed={1200 - timeLeft}
        totalRounds={round}
        onNewGame={() => {
          setGameEndModal(false);
          // Navigate to setup or reset game
        }}
        onBackToMenu={() => {
          setGameEndModal(false);
          // Navigate to home
        }}
      />
    </SafeAreaView>
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
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  gameMode: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  phaseText: {
    fontSize: 10,
    color: '#F59E0B',
    marginTop: 2,
  },
  gameStats: {
    alignItems: 'flex-end',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  roundText: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // Current Turn
  currentTurnBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.2)',
  },
  turnText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },

  // Actions
  actionPanel: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  scanButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  scanButtonDisabled: {
    backgroundColor: '#64748B',
    opacity: 0.6,
  },
  scanButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  quickAwardButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  quickAwardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
