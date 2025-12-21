import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { gameSessionService } from '@/services/GameSessionService';

interface PointsAwardModalProps {
  visible: boolean;
  flowState: {
    currentRound?: {
      question: {
        icon: string;
        text: string;
        type: string;
        points: number;
      };
    };
    gameMasterAnswer?: {
      correctAnswer: string;
      trackTitle: string;
      trackArtist: string;
    };
  };
  players: Array<{
    id: string;
    name: string;
    currentBet: number;
  }>;
  onAwardPoints: (playerId: string) => void;
  onWrongAnswer: () => void;
  onClose?: () => void;
}

const PointsAwardModal: React.FC<PointsAwardModalProps> = ({
  visible,
  flowState,
  players,
  onAwardPoints,
  onWrongAnswer,
  onClose,
}) => {
  const getBettingMultiplier = (amount: number): number => {
    return gameSessionService.getBettingMultiplier(amount);
  };

  if (!flowState.currentRound) return null;

  const { question } = flowState.currentRound;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pointsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalEmoji}>{question.icon}</Text>
            <Text style={styles.modalTitle}>{question.type.toUpperCase()}</Text>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.text}</Text>

            {/* Mostrar respuesta para Game Master */}
            {flowState.gameMasterAnswer && (
              <View style={styles.gameMasterAnswerContainer}>
                <Text style={styles.gameMasterLabel}>🔑 RESPUESTA:</Text>
                <Text style={styles.gameMasterAnswer}>
                  {flowState.gameMasterAnswer.correctAnswer}
                </Text>
                <Text style={styles.trackInfoText}>
                  "{flowState.gameMasterAnswer.trackTitle}" -{' '}
                  {flowState.gameMasterAnswer.trackArtist}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.pointsLabel}>
            ¿Quién respondió correctamente? ({question.points} pts)
          </Text>

          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={({ item: player }) => (
              <TouchableOpacity
                style={styles.playerButton}
                onPress={() => onAwardPoints(player.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.playerButtonText}>{player.name}</Text>
                {player.currentBet > 0 && (
                  <Text style={styles.playerBetIndicator}>
                    Apuesta: {player.currentBet} x
                    {getBettingMultiplier(player.currentBet)}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={styles.noWinnerButton}
            onPress={onWrongAnswer}
            activeOpacity={0.8}
          >
            <Text style={styles.noWinnerText}>Nadie acertó</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  gameMasterAnswerContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  gameMasterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  gameMasterAnswer: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackInfoText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PointsAwardModal;
