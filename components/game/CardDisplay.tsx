import { IconSymbol } from '@/components/ui/IconSymbol';
import { Difficulty, GameCard } from '@/types/game.types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CardDisplayProps {
  card: GameCard | null;
  showAnswer?: boolean;
  showQuestion?: boolean;
  onRevealAnswer?: () => void;
  audioFinished?: boolean;
}

export default function CardDisplay({
  card,
  showAnswer = false,
  showQuestion = false,
  onRevealAnswer,
  audioFinished = false,
}: CardDisplayProps) {
  if (!card) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name='qrcode.viewfinder' size={48} color='#64748B' />
        <Text style={styles.emptyText}>Escanea una carta para empezar</Text>
      </View>
    );
  }

  const getCardTypeConfig = () => {
    const configs = {
      song: {
        emoji: '🎵',
        color: '#F59E0B',
        label: 'SONG CARD',
      },
      artist: {
        emoji: '🎤',
        color: '#EF4444',
        label: 'ARTIST CARD',
      },
      decade: {
        emoji: '📅',
        color: '#3B82F6',
        label: 'DECADE CARD',
      },
      lyrics: {
        emoji: '📝',
        color: '#10B981',
        label: 'LYRICS CARD',
      },
      challenge: {
        emoji: '🔥',
        color: '#8B5CF6',
        label: 'CHALLENGE CARD',
      },
    };
    return configs[card.cardType];
  };

  const getDifficultyConfig = (difficulty: Difficulty) => {
    const configs = {
      easy: { color: '#10B981', label: 'EASY' },
      medium: { color: '#F59E0B', label: 'MEDIUM' },
      hard: { color: '#EF4444', label: 'HARD' },
      expert: { color: '#8B5CF6', label: 'EXPERT' },
    };
    return configs[difficulty];
  };

  const cardConfig = getCardTypeConfig();
  const difficultyConfig = getDifficultyConfig(card.difficulty);

  return (
    <View style={styles.container}>
      {/* Card Header */}
      <View style={[styles.header, { backgroundColor: cardConfig.color }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.cardEmoji}>{cardConfig.emoji}</Text>
          <Text style={styles.cardType}>{cardConfig.label}</Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: difficultyConfig.color },
            ]}
          >
            <Text style={styles.difficultyText}>{difficultyConfig.label}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{card.points} pts</Text>
          </View>
        </View>
      </View>

      {/* Track Info */}
      <View style={styles.trackSection}>
        <Text style={styles.trackTitle}>{card.track.title}</Text>
        <Text style={styles.trackArtist}>{card.track.artist}</Text>
        <Text style={styles.trackYear}>
          {card.track.year} • {card.track.genre}
        </Text>
      </View>

      {/* Audio Status */}
      <View style={styles.audioSection}>
        {!audioFinished ? (
          <View style={styles.audioPlaying}>
            <IconSymbol name='speaker.wave.3' size={20} color='#3B82F6' />
            <Text style={styles.audioText}>Audio reproduciendo...</Text>
            <View style={styles.audioWave} />
          </View>
        ) : (
          <View style={styles.audioFinished}>
            <IconSymbol
              name='checkmark.circle.fill'
              size={20}
              color='#10B981'
            />
            <Text style={styles.audioFinishedText}>Audio terminado</Text>
          </View>
        )}
      </View>

      {/* Question Section */}
      {showQuestion && audioFinished && (
        <View style={styles.questionSection}>
          <Text style={styles.questionLabel}>PREGUNTA:</Text>
          <Text style={styles.questionText}>{card.question}</Text>

          {!showAnswer && onRevealAnswer && (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={onRevealAnswer}
              activeOpacity={0.8}
            >
              <IconSymbol name='eye.fill' size={16} color='#FFFFFF' />
              <Text style={styles.revealButtonText}>Ver Respuesta</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Answer Section */}
      {showAnswer && (
        <View style={styles.answerSection}>
          <Text style={styles.answerLabel}>RESPUESTA:</Text>
          <Text style={styles.answerText}>{card.answer}</Text>

          {card.cardType === 'challenge' && (
            <View style={styles.challengeNote}>
              <IconSymbol name='info.circle' size={16} color='#F59E0B' />
              <Text style={styles.challengeText}>
                El Game Master decide si se completó correctamente
              </Text>
            </View>
          )}
        </View>
      )}

      {/* QR Code Info */}
      <View style={styles.qrSection}>
        <Text style={styles.qrText}>QR: {card.track.qrCode}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    margin: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    margin: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  cardType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  trackYear: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  audioSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  audioPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  audioText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  audioWave: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  audioFinished: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  audioFinishedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 8,
  },
  questionSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 24,
    marginBottom: 16,
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 12,
  },
  revealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  answerSection: {
    padding: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    lineHeight: 24,
  },
  challengeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
  },
  challengeText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  qrSection: {
    padding: 12,
    alignItems: 'center',
  },
  qrText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});
