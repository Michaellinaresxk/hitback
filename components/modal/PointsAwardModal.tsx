// components/modal/PointsAwardModal.tsx - 🏆 SELF-CONTAINED MODAL
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PointsAwardModalProps {
  visible: boolean;
  currentCard: any;
  players: any[];
  showAnswer: boolean;
  onAwardPoints: (playerId: string) => void;
  onNoWinner: () => void;
  onRevealAnswer: () => void;
  onClose: () => void;
}

// 🎯 Helper functions moved to component to avoid import issues
const getCardDisplayInfo = (cardType: string, difficulty: string) => {
  const CARD_TYPES = {
    song: { emoji: '🎵', color: '#F59E0B', basePoints: 1, name: 'Canción' },
    artist: { emoji: '🎤', color: '#EF4444', basePoints: 2, name: 'Artista' },
    decade: { emoji: '📅', color: '#3B82F6', basePoints: 3, name: 'Década' },
    lyrics: { emoji: '📝', color: '#10B981', basePoints: 3, name: 'Letra' },
    challenge: {
      emoji: '🔥',
      color: '#8B5CF6',
      basePoints: 5,
      name: 'Challenge',
    },
  };

  const DIFFICULTIES = {
    easy: { color: '#10B981', multiplier: 1.0, name: 'Fácil' },
    medium: { color: '#F59E0B', multiplier: 1.5, name: 'Medio' },
    hard: { color: '#EF4444', multiplier: 2.0, name: 'Difícil' },
    expert: { color: '#8B5CF6', multiplier: 3.0, name: 'Experto' },
  };

  const type =
    CARD_TYPES[cardType as keyof typeof CARD_TYPES] || CARD_TYPES.song;
  const diff =
    DIFFICULTIES[difficulty as keyof typeof DIFFICULTIES] || DIFFICULTIES.easy;

  return {
    ...type,
    difficulty: diff.name,
    difficultyColor: diff.color,
    points: Math.round(type.basePoints * diff.multiplier),
  };
};

const getBettingMultiplier = (betAmount: number): number => {
  if (betAmount === 1) return 2;
  if (betAmount === 2) return 3;
  if (betAmount >= 3) return 4;
  return 1;
};

const calculatePotentialPoints = (
  basePoints: number,
  betAmount: number
): number => {
  return basePoints * getBettingMultiplier(betAmount);
};

export default function PointsAwardModal({
  visible,
  currentCard,
  players,
  showAnswer,
  onAwardPoints,
  onNoWinner,
  onRevealAnswer,
  onClose,
}: PointsAwardModalProps) {
  if (!currentCard) return null;

  const cardInfo = getCardDisplayInfo(
    currentCard.cardType,
    currentCard.difficulty
  );

  const renderPlayer = ({ item: player }: { item: any }) => {
    const potentialPoints =
      player.currentBet > 0
        ? calculatePotentialPoints(currentCard.points, player.currentBet)
        : currentCard.points;

    return (
      <TouchableOpacity
        style={[styles.playerButton, { backgroundColor: cardInfo.color }]}
        onPress={() => onAwardPoints(player.id)}
        activeOpacity={0.8}
      >
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerScore}>Actual: {player.score} pts</Text>
        </View>

        <View style={styles.pointsInfo}>
          <Text style={styles.pointsToWin}>+{potentialPoints}</Text>
          {player.currentBet > 0 && (
            <View style={styles.betInfo}>
              <Text style={styles.betText}>
                Apuesta: {player.currentBet} →{' '}
                {getBettingMultiplier(player.currentBet)}x
              </Text>
            </View>
          )}
          {player.boostActive && (
            <View style={styles.boostBadge}>
              <IconSymbol name='bolt.fill' size={12} color='#FFFFFF' />
              <Text style={styles.boostText}>BOOST</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              🏆 ¿Quién respondió correctamente?
            </Text>
            <Text style={styles.modalSubtitle}>
              {currentCard.track.title} - {currentCard.track.artist}
            </Text>
          </View>

          {/* Card Info */}
          <View
            style={[styles.cardInfoContainer, { borderColor: cardInfo.color }]}
          >
            <View style={styles.cardTypeRow}>
              <Text style={styles.cardEmoji}>{cardInfo.emoji}</Text>
              <Text style={[styles.cardType, { color: cardInfo.color }]}>
                {cardInfo.name.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.basePoints}>
              {currentCard.points} punto{currentCard.points > 1 ? 's' : ''} base
            </Text>
          </View>

          {/* Question/Answer */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>"{currentCard.question}"</Text>
            {showAnswer && (
              <Text style={styles.answerText}>✅ {currentCard.answer}</Text>
            )}
          </View>

          {/* Players List */}
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={renderPlayer}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
          />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!showAnswer && (
              <TouchableOpacity
                style={styles.revealButton}
                onPress={onRevealAnswer}
                activeOpacity={0.8}
              >
                <IconSymbol name='eye.fill' size={16} color='#FFFFFF' />
                <Text style={styles.revealButtonText}>Revelar Respuesta</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.noWinnerButton}
              onPress={onNoWinner}
              activeOpacity={0.8}
            >
              <IconSymbol name='xmark.circle' size={16} color='#FFFFFF' />
              <Text style={styles.noWinnerText}>Nadie Acertó</Text>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol name='xmark' size={20} color='#94A3B8' />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
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
  cardInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  cardType: {
    fontSize: 16,
    fontWeight: '700',
  },
  basePoints: {
    fontSize: 14,
    color: '#94A3B8',
  },
  questionContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  playersList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  playerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  playerScore: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  pointsInfo: {
    alignItems: 'flex-end',
  },
  pointsToWin: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  betInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  betText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  boostText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  revealButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  revealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  noWinnerButton: {
    flex: 1,
    backgroundColor: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  noWinnerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
