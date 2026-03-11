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
    isFrozen?: boolean;
  }>;
  onAwardPoints: (playerId: string) => void;
  onWrongAnswer: () => void;
  onClose?: () => void;
  // ── STOP-BLAST ──────────────────────────────────────────────────────────
  stopBlastActive?: boolean;
  stopBlastHolderId?: string | null;
  // ── DUEL ────────────────────────────────────────────────────────────────
  duelActive?: boolean;
  duelPlayer1Id?: string | null;
  duelPlayer2Id?: string | null;
}

const PointsAwardModal: React.FC<PointsAwardModalProps> = ({
  visible,
  flowState,
  players,
  onAwardPoints,
  onWrongAnswer,
  onClose,
  stopBlastActive = false,
  stopBlastHolderId = null,
  duelActive = false,
  duelPlayer1Id = null,
  duelPlayer2Id = null,
}) => {
  const getBettingMultiplier = (amount: number): number => {
    return gameSessionService.getBettingMultiplier(amount);
  };

  if (!flowState.currentRound) return null;

  const { question } = flowState.currentRound;

  // STOP-BLAST → solo el holder
  // DUEL       → solo los dos duelistas
  // Normal     → todos
  const eligiblePlayers = (() => {
    if (stopBlastActive && stopBlastHolderId)
      return players.filter((p) => p.id === stopBlastHolderId);
    if (duelActive && duelPlayer1Id && duelPlayer2Id)
      return players.filter(
        (p) => p.id === duelPlayer1Id || p.id === duelPlayer2Id,
      );
    return players;
  })();

  const activeMechanic = stopBlastActive
    ? 'stopBlast'
    : duelActive
      ? 'duel'
      : null;

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

          {/* Banners de mecánicas activas */}
          {activeMechanic === 'stopBlast' && (
            <View
              style={[styles.mechanicBanner, styles.mechanicBannerStopBlast]}
            >
              <Text
                style={[
                  styles.mechanicBannerText,
                  styles.mechanicBannerTextStopBlast,
                ]}
              >
                🛑 STOP-BLAST — solo un jugador puede ganar
              </Text>
            </View>
          )}
          {activeMechanic === 'duel' && (
            <View style={[styles.mechanicBanner, styles.mechanicBannerDuel]}>
              <Text
                style={[
                  styles.mechanicBannerText,
                  styles.mechanicBannerTextDuel,
                ]}
              >
                ⚔️ DUEL — solo los duelistas pueden ganar
              </Text>
            </View>
          )}

          {/* Respuesta */}
          <View style={styles.answerContainer}>
            <Text style={styles.answerText}>
              {flowState.correctAnswer ||
                flowState.currentRound?.gameMasterAnswer?.correct ||
                '(Cargando...)'}
            </Text>
            {(flowState.trackInfo ||
              flowState.currentRound?.gameMasterAnswer) && (
              <Text style={styles.trackInfoText}>
                🎵{' '}
                {flowState.trackInfo?.artist ||
                  flowState.currentRound?.gameMasterAnswer?.trackArtist}
              </Text>
            )}
          </View>

          <Text style={styles.pointsLabel}>
            ¿Quién respondió correctamente? ({question.points} pts)
          </Text>

          <FlatList
            data={eligiblePlayers}
            keyExtractor={(item) => item.id}
            renderItem={({ item: player }) => {
              const frozen = player.isFrozen ?? false;

              return (
                <TouchableOpacity
                  style={[
                    styles.playerButton,
                    frozen && styles.playerButtonFrozen,
                    activeMechanic === 'stopBlast' &&
                      styles.playerButtonStopBlast,
                    activeMechanic === 'duel' && styles.playerButtonDuel,
                  ]}
                  onPress={() => onAwardPoints(player.id)}
                  disabled={frozen}
                  activeOpacity={frozen ? 1 : 0.8}
                >
                  <Text
                    style={[
                      styles.playerButtonText,
                      frozen && styles.playerButtonTextFrozen,
                    ]}
                  >
                    {frozen ? '⏸️  ' : ''}
                    {activeMechanic === 'stopBlast' ? '🛑  ' : ''}
                    {activeMechanic === 'duel' ? '⚔️  ' : ''}
                    {player.name}
                  </Text>
                  {player.currentBet > 0 && !frozen && (
                    <Text style={styles.playerBetIndicator}>
                      Apuesta: {player.currentBet} x
                      {getBettingMultiplier(player.currentBet)}
                    </Text>
                  )}
                  {frozen && (
                    <Text style={styles.frozenLabel}>en pausa esta ronda</Text>
                  )}
                </TouchableOpacity>
              );
            }}
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
  modalEmoji: { fontSize: 48, marginBottom: 8 },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },

  // ── Mechanic banners ──────────────────────────────────────────────────
  mechanicBanner: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  mechanicBannerStopBlast: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  mechanicBannerDuel: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  mechanicBannerText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  mechanicBannerTextStopBlast: { color: '#F87171' },
  mechanicBannerTextDuel: { color: '#FB923C' },

  // ── Answer ────────────────────────────────────────────────────────────
  answerContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  answerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
  },
  trackInfoText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 16,
  },

  // ── Player buttons ────────────────────────────────────────────────────
  playerButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  playerButtonStopBlast: {
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  playerButtonDuel: {
    backgroundColor: '#C2410C',
    borderWidth: 2,
    borderColor: '#FB923C',
  },
  playerButtonFrozen: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    opacity: 0.5,
  },
  playerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerButtonTextFrozen: {
    color: '#475569',
    textDecorationLine: 'line-through',
  },
  playerBetIndicator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  frozenLabel: {
    fontSize: 11,
    color: '#475569',
    marginTop: 3,
    fontStyle: 'italic',
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

export default PointsAwardModal;
