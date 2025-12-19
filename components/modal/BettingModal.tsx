// components/modal/BettingModal.tsx
// ✅ FIX: Sistema de tokens ÚNICOS
// - Cada jugador tiene 3 tokens: +1, +2, +3
// - Cada token se muestra disponible o disabled
// - Una vez usado, el botón se deshabilita permanentemente

import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Player {
  id: string;
  name: string;
  score: number;
  availableTokens: number[]; // ✅ NUEVO: Array de tokens disponibles [1, 2, 3]
  currentBet: number;
  // Compatibilidad
  tokens?: number;
}

interface BettingModalProps {
  visible: boolean;
  onClose: () => void;
  players: Player[];
  currentCard: any;
  onPlaceBet: (playerId: string, tokenValue: number) => void;
  bettingTimeLeft?: number;
}

export default function BettingModal({
  visible,
  onClose,
  players,
  currentCard,
  onPlaceBet,
  bettingTimeLeft = 10,
}: BettingModalProps) {
  const { t } = useTranslation();

  const isUrgent = bettingTimeLeft <= 5;

  // ✅ Helper para verificar si un token está disponible
  const isTokenAvailable = (player: Player, tokenValue: number): boolean => {
    // Usar availableTokens si existe, sino fallback a lógica antigua
    if (player.availableTokens) {
      return player.availableTokens.includes(tokenValue);
    }
    // Fallback: si tiene suficientes tokens (lógica antigua)
    return (player.tokens || 0) >= tokenValue;
  };

  // ✅ Helper para obtener tokens disponibles
  const getAvailableTokens = (player: Player): number[] => {
    return player.availableTokens || [];
  };

  const renderPlayer = ({ item: player }: { item: Player }) => {
    // Si ya apostó en esta ronda
    if (player.currentBet > 0) {
      return (
        <View style={styles.playerItem}>
          <Text style={styles.playerName}>{player.name}</Text>
          <View style={styles.betPlacedContainer}>
            <Text style={styles.alreadyBet}>
              ✅ Usó token +{player.currentBet}
            </Text>
          </View>
        </View>
      );
    }

    const availableTokens = getAvailableTokens(player);
    const hasNoTokens = availableTokens.length === 0;

    return (
      <View style={styles.playerItem}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerTokens}>
            🪙{' '}
            {availableTokens.length > 0
              ? `Tokens: [${availableTokens.join(', ')}]`
              : 'Sin tokens'}
          </Text>
        </View>

        {hasNoTokens ? (
          <View style={styles.noTokensContainer}>
            <Text style={styles.noTokensText}>
              😅 No tiene tokens disponibles
            </Text>
          </View>
        ) : (
          <View style={styles.bettingOptions}>
            {/* ✅ Mostrar los 3 botones, pero disabled si ya se usó ese token */}
            {[1, 2, 3].map((tokenValue) => {
              const isAvailable = isTokenAvailable(player, tokenValue);

              return (
                <TouchableOpacity
                  key={tokenValue}
                  style={[
                    styles.betButton,
                    !isAvailable && styles.betButtonUsed,
                  ]}
                  onPress={() =>
                    isAvailable && onPlaceBet(player.id, tokenValue)
                  }
                  disabled={!isAvailable}
                >
                  <Text
                    style={[
                      styles.betAmount,
                      !isAvailable && styles.betAmountUsed,
                    ]}
                  >
                    +{tokenValue}
                  </Text>
                  <Text
                    style={[
                      styles.betLabel,
                      !isAvailable && styles.betLabelUsed,
                    ]}
                  >
                    {isAvailable ? 'punto' : 'usado'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  if (!visible || !currentCard) return null;

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎲 Usar Token</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name='xmark' size={24} color='#64748B' />
            </TouchableOpacity>
          </View>

          {/* Countdown */}
          <View
            style={[
              styles.countdownContainer,
              isUrgent && styles.countdownUrgent,
            ]}
          >
            <View style={styles.countdownContent}>
              <Text style={styles.countdownIcon}>⏱️</Text>
              <Text
                style={[
                  styles.countdownText,
                  isUrgent && styles.countdownTextUrgent,
                ]}
              >
                {bettingTimeLeft}s
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${(bettingTimeLeft / 10) * 100}%` },
                  isUrgent && styles.progressBarUrgent,
                ]}
              />
            </View>
            {isUrgent && (
              <Text style={styles.urgentText}>¡Apura! Tiempo casi agotado</Text>
            )}
          </View>

          {/* Players Title */}
          <Text style={styles.playersTitle}>👥 Selecciona jugador y token</Text>

          {/* Players List */}
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={renderPlayer}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
          />

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cerrar (sin usar token)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1E293B',
    width: width * 0.92,
    maxHeight: '90%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 8,
  },

  // Countdown styles
  countdownContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  countdownUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  countdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  countdownIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#3B82F6',
  },
  countdownTextUrgent: {
    color: '#EF4444',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  progressBarUrgent: {
    backgroundColor: '#EF4444',
  },
  urgentText: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },

  // Card Info
  cardInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardArtist: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  cardPointsContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cardPoints: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },

  // ✅ Token explanation
  tokenExplanation: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
    textAlign: 'center',
  },
  explanationText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  tokenExamples: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tokenExample: {
    alignItems: 'center',
  },
  tokenBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenBronze: {
    backgroundColor: '#CD7F32',
  },
  tokenSilver: {
    backgroundColor: '#C0C0C0',
  },
  tokenGold: {
    backgroundColor: '#FFD700',
  },
  tokenBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  tokenExampleText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Players
  playersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  playersList: {
    maxHeight: 220,
    marginBottom: 16,
  },
  playerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  playerTokens: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  betPlacedContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  alreadyBet: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  noTokensContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  noTokensText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  bettingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  // ✅ Token buttons
  betButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#10B981', // Verde para disponible
    shadowColor: '#10B981',
  },
  betButtonUsed: {
    backgroundColor: '#334155',
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  betAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  betAmountUsed: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  betLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: 2,
  },
  betLabelUsed: {
    color: '#64748B',
  },

  // Cancel
  cancelButton: {
    backgroundColor: '#475569',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
