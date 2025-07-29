// components/game/CardDisplay.tsx - VERSION ROBUSTA

import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 🎯 TYPES - Asegurar que todo esté definido
interface CardDisplayProps {
  card?: {
    id?: string;
    type?: string;
    difficulty?: string;
    question?: string;
    answer?: string;
    points?: number;
    hints?: string[];
    color?: string;
    track?: {
      id?: string;
      title?: string;
      artist?: string;
      album?: string;
      year?: number;
      genre?: string;
    };
    audio?: {
      hasAudio?: boolean;
      url?: string;
      duration?: number;
    };
  } | null;
  showAnswer?: boolean;
  showQuestion?: boolean;
  onRevealAnswer?: () => void;
}

const { width } = Dimensions.get('window');

export default function CardDisplay({
  card,
  showAnswer = false,
  showQuestion = false,
  onRevealAnswer,
}: CardDisplayProps) {
  // 🛡️ GUARD: Si no hay card, mostrar placeholder
  if (!card) {
    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, styles.placeholderCard]}>
          <Text style={styles.placeholderText}>🎵</Text>
          <Text style={styles.placeholderSubtext}>Scan a QR to start</Text>
        </View>
      </View>
    );
  }

  // 🛡️ SAFE ACCESSORS - Con valores por defecto
  const safeCard = {
    id: card.id || 'unknown',
    type: card.type || 'SONG',
    difficulty: card.difficulty || 'EASY',
    question: card.question || '¿Cuál es la canción?',
    answer: card.answer || 'Respuesta no disponible',
    points: card.points || 1,
    hints: card.hints || [],
    color: card.color || '#10B981', // ✅ DEFAULT COLOR - EVITA EL ERROR
    track: {
      id: card.track?.id || '001',
      title: card.track?.title || 'Título desconocido',
      artist: card.track?.artist || 'Artista desconocido',
      album: card.track?.album || 'Álbum desconocido',
      year: card.track?.year || 2024,
      genre: card.track?.genre || 'Pop',
    },
    audio: {
      hasAudio: card.audio?.hasAudio || false,
      url: card.audio?.url || '',
      duration: card.audio?.duration || 0,
    },
  };

  // 🎨 DYNAMIC STYLES
  const cardStyle = [
    styles.card,
    {
      borderColor: safeCard.color,
      shadowColor: safeCard.color,
    },
  ];

  const headerStyle = [styles.cardHeader, { backgroundColor: safeCard.color }];

  // 🎯 DIFFICULTY COLORS
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return '#10B981';
      case 'MEDIUM':
        return '#F59E0B';
      case 'HARD':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={cardStyle}>
        {/* 🎯 CARD HEADER */}
        <View style={headerStyle}>
          <Text style={styles.cardType}>
            {safeCard.type} - {safeCard.difficulty}
          </Text>
          <Text style={styles.cardPoints}>
            {safeCard.points} pt{safeCard.points !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* 🎵 TRACK INFO */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={2}>
            {safeCard.track.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {safeCard.track.artist}
          </Text>

          <View style={styles.trackMeta}>
            <Text style={styles.trackMetaText}>
              {safeCard.track.genre} • {safeCard.track.year}
            </Text>
            {safeCard.track.album && (
              <Text style={styles.trackAlbum} numberOfLines={1}>
                {safeCard.track.album}
              </Text>
            )}
          </View>
        </View>

        {/* 🎵 AUDIO STATUS */}
        {safeCard.audio.hasAudio && (
          <View style={styles.audioStatus}>
            <Text style={styles.audioIndicator}>
              🎵 Audio disponible ({safeCard.audio.duration}s)
            </Text>
          </View>
        )}

        {/* ❓ QUESTION SECTION */}
        {showQuestion && (
          <View style={styles.questionSection}>
            <Text style={styles.questionLabel}>Pregunta:</Text>
            <Text style={styles.questionText}>{safeCard.question}</Text>

            {safeCard.hints.length > 0 && (
              <View style={styles.hintsContainer}>
                <Text style={styles.hintsLabel}>💡 Pistas:</Text>
                {safeCard.hints.map((hint, index) => (
                  <Text key={index} style={styles.hintText}>
                    • {hint}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 💡 ANSWER SECTION */}
        {showAnswer && (
          <View style={styles.answerSection}>
            <Text style={styles.answerLabel}>Respuesta:</Text>
            <Text style={styles.answerText}>{safeCard.answer}</Text>
          </View>
        )}

        {/* 🎯 ACTION BUTTON */}
        {showQuestion && !showAnswer && onRevealAnswer && (
          <TouchableOpacity
            style={styles.revealButton}
            onPress={onRevealAnswer}
          >
            <Text style={styles.revealButtonText}>🔍 Revelar Respuesta</Text>
          </TouchableOpacity>
        )}

        {/* 🔧 DEBUG INFO (solo en desarrollo) */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              ID: {safeCard.id} | Color: {safeCard.color}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  card: {
    width: width - 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  placeholderCard: {
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardType: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardPoints: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trackInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  trackMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  trackAlbum: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  audioStatus: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  audioIndicator: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
  },
  questionSection: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 12,
  },
  hintsContainer: {
    marginTop: 8,
  },
  hintsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    marginLeft: 8,
  },
  answerSection: {
    padding: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    lineHeight: 24,
  },
  revealButton: {
    backgroundColor: '#F59E0B',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  revealButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});
