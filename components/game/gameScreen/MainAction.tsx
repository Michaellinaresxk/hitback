import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface MainActionProps {
  isLoading: boolean;
  currentPhase: string;
  canStartNextRound: boolean;
  onNextRound: () => void;
  questionVisible: boolean;
  currentRound?: {
    question: {
      icon: string;
      text: string;
      points: number;
    };
  };
}

export const MainAction: React.FC<MainActionProps> = ({
  isLoading,
  currentPhase,
  canStartNextRound,
  onNextRound,
  questionVisible,
  currentRound,
}) => {
  const getButtonText = () => {
    if (isLoading) return 'Cargando...';
    if (currentPhase === 'idle') return 'Siguiente Canción';
    if (currentPhase === 'answer') return 'Siguiente Ronda';
    return 'Ronda en Curso...';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.nextRoundButton,
          isLoading && styles.nextRoundButtonLoading,
          !canStartNextRound && styles.nextRoundButtonDisabled,
        ]}
        onPress={onNextRound}
        activeOpacity={0.9}
        disabled={isLoading || !canStartNextRound}
      >
        <IconSymbol
          name={isLoading ? 'hourglass' : 'play.circle.fill'}
          size={32}
          color='#FFFFFF'
        />
        <Text style={styles.nextRoundButtonText}>{getButtonText()}</Text>
      </TouchableOpacity>

      {questionVisible && currentRound && (
        <View style={styles.questionPreview}>
          <Text style={styles.questionPreviewIcon}>
            {currentRound.question.icon}
          </Text>
          <Text style={styles.questionPreviewText}>
            {currentRound.question.text}
          </Text>
          <Text style={styles.questionPreviewPoints}>
            {currentRound.question.points} puntos
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
});
