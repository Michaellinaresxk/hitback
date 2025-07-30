// components/game/CardDisplay.tsx - 🎴 FIXED CARD DISPLAY
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CardDisplayProps {
  card: any;
  isAudioPlaying: boolean;
  showQuestion: boolean;
  showAnswer: boolean;
  onRevealAnswer: () => void;
  flowPhase: string;
}

// 🎯 Helper function moved to component file to avoid import issues
const getCardInfo = (cardType: string, difficulty: string) => {
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

export default function CardDisplay({
  card,
  isAudioPlaying,
  showQuestion,
  showAnswer,
  onRevealAnswer,
  flowPhase,
}: CardDisplayProps) {
  if (!card) return null;

  const cardInfo = getCardInfo(card.cardType, card.difficulty);

  // 🎵 PHASE: Audio Playing
  if (isAudioPlaying || flowPhase === 'audio') {
    return (
      <View style={styles.container}>
        <View
          style={[styles.audioPlayingCard, { borderColor: cardInfo.color }]}
        >
          <View style={styles.audioIcon}>
            <IconSymbol
              name='speaker.wave.3.fill'
              size={48}
              color={cardInfo.color}
            />
          </View>

          <Text style={styles.audioTitle}>🎵 Reproduciendo Audio</Text>
          <Text style={styles.audioSubtitle}>Escucha atentamente...</Text>

          <View style={styles.cardTypeIndicator}>
            <Text style={styles.cardTypeEmoji}>{cardInfo.emoji}</Text>
            <Text style={[styles.cardTypeName, { color: cardInfo.color }]}>
              {cardInfo.name.toUpperCase()}
            </Text>
            <Text style={styles.cardPoints}>{cardInfo.points} PTS</Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { backgroundColor: cardInfo.color }]}
            />
          </View>
        </View>
      </View>
    );
  }

  // ❓ PHASE: Question
  if (showQuestion) {
    return (
      <View style={styles.container}>
        <View style={[styles.questionCard, { borderColor: cardInfo.color }]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTypeRow}>
              <Text style={styles.cardTypeEmoji}>{cardInfo.emoji}</Text>
              <Text style={[styles.cardTypeName, { color: cardInfo.color }]}>
                {cardInfo.name.toUpperCase()}
              </Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{cardInfo.points}</Text>
              <Text style={styles.pointsLabel}>PTS</Text>
            </View>
          </View>

          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>PREGUNTA:</Text>
            <Text style={styles.questionText}>{card.question}</Text>
          </View>

          {/* Answer Section */}
          {showAnswer ? (
            <View style={styles.answerContainer}>
              <Text style={styles.answerLabel}>RESPUESTA:</Text>
              <Text style={styles.answerText}>✅ {card.answer}</Text>

              {/* Track Info */}
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>{card.track.title}</Text>
                <Text style={styles.trackArtist}>por {card.track.artist}</Text>
                {card.track.year && (
                  <Text style={styles.trackYear}>({card.track.year})</Text>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={onRevealAnswer}
              activeOpacity={0.8}
            >
              <IconSymbol name='eye.fill' size={20} color='#FFFFFF' />
              <Text style={styles.revealButtonText}>Revelar Respuesta</Text>
            </TouchableOpacity>
          )}

          {/* Difficulty Badge */}
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: cardInfo.difficultyColor },
            ]}
          >
            <Text style={styles.difficultyText}>{cardInfo.difficulty}</Text>
          </View>
        </View>
      </View>
    );
  }

  // 🔍 PHASE: Scanning
  if (flowPhase === 'scanning') {
    return (
      <View style={styles.container}>
        <View style={styles.scanningCard}>
          <IconSymbol name='qrcode.viewfinder' size={48} color='#3B82F6' />
          <Text style={styles.scanningText}>Procesando carta...</Text>
        </View>
      </View>
    );
  }

  // 💤 PHASE: Idle
  return (
    <View style={styles.container}>
      <View style={styles.idleCard}>
        <IconSymbol name='music.note' size={48} color='#64748B' />
        <Text style={styles.idleText}>Escanea una carta para empezar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  // Audio Playing Card
  audioPlayingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  audioIcon: {
    marginBottom: 16,
  },
  audioTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  audioSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  cardTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    borderRadius: 2,
  },

  // Question Card
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTypeEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  cardTypeName: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardPoints: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
  },
  pointsBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Question
  questionContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 24,
  },

  // Answer
  answerContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 12,
  },
  trackInfo: {
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 2,
  },
  trackYear: {
    fontSize: 12,
    color: '#64748B',
  },

  // Reveal Button
  revealButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  revealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Difficulty Badge
  difficultyBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Scanning Card
  scanningCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  scanningText: {
    fontSize: 16,
    color: '#3B82F6',
    marginTop: 16,
    fontWeight: '500',
  },

  // Idle Card
  idleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  idleText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '500',
  },
});
