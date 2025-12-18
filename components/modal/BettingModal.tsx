// components/modal/BettingModal.tsx
// ✅ FIX: Agregar countdown visual para el tiempo de apuestas

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

interface BettingModalProps {
  visible: boolean;
  onClose: () => void;
  players: any[];
  currentCard: any;
  onPlaceBet: (playerId: string, amount: number) => void;
  bettingTimeLeft?: number; // ✅ NUEVO: Tiempo restante
}

export default function BettingModal({
  visible,
  onClose,
  players,
  currentCard,
  onPlaceBet,
  bettingTimeLeft = 10, // ✅ Default 10 segundos
}: BettingModalProps) {
  const { t } = useTranslation();

  const getBettingMultiplier = (betAmount: number): number => {
    if (betAmount === 1) return 2;
    if (betAmount === 2) return 3;
    if (betAmount >= 3) return 4;
    return 1;
  };

  // ✅ Determinar si es tiempo urgente (menos de 5 segundos)
  const isUrgent = bettingTimeLeft <= 5;

  const renderPlayer = ({ item: player }: { item: any }) => {
    if (player.currentBet > 0) {
      return (
        <View style={styles.playerItem}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.alreadyBet}>
            ✅ Apostó {player.currentBet} token
            {player.currentBet > 1 ? 's' : ''}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.playerItem}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerTokens}>🪙 {player.tokens} tokens</Text>
        </View>

        <View style={styles.bettingOptions}>
          {[1, 2, 3].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.betButton,
                player.tokens < amount && styles.betButtonDisabled,
              ]}
              onPress={() => onPlaceBet(player.id, amount)}
              disabled={player.tokens < amount}
            >
              <Text style={styles.betAmount}>{amount}</Text>
              <Text style={styles.betMultiplier}>
                {getBettingMultiplier(amount)}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (!visible || !currentCard) return null;

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* ✅ NUEVO: Header con countdown */}
          <View style={styles.header}>
            <Text style={styles.title}>🎲 Sistema de Apuestas</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name='xmark' size={24} color='#64748B' />
            </TouchableOpacity>
          </View>

          {/* ✅ NUEVO: Countdown prominente */}
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

          {/* Card Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {currentCard.track?.title || 'Canción actual'}
            </Text>
            <Text style={styles.cardArtist}>
              {currentCard.track?.artist || ''}
            </Text>
            <View style={styles.cardPointsContainer}>
              <Text style={styles.cardPoints}>
                Puntos base:{' '}
                {currentCard.question?.points || currentCard.points || 0}
              </Text>
            </View>
          </View>

          {/* Multipliers Info */}
          <View style={styles.multipliers}>
            <Text style={styles.multipliersTitle}>🎯 Multiplicadores</Text>
            <View style={styles.multiplierRow}>
              <View style={styles.multiplierItem}>
                <Text style={styles.multiplierTokens}>1 token</Text>
                <Text style={styles.multiplierValue}>×2</Text>
              </View>
              <View style={styles.multiplierItem}>
                <Text style={styles.multiplierTokens}>2 tokens</Text>
                <Text style={styles.multiplierValue}>×3</Text>
              </View>
              <View style={styles.multiplierItem}>
                <Text style={styles.multiplierTokens}>3 tokens</Text>
                <Text style={styles.multiplierValue}>×4</Text>
              </View>
            </View>
          </View>

          {/* Players Title */}
          <Text style={styles.playersTitle}>
            👥 Selecciona jugador para apostar
          </Text>

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
            <Text style={styles.cancelText}>Cerrar (sin apostar)</Text>
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
    maxHeight: '88%',
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

  // ✅ NUEVO: Countdown styles
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

  // Multipliers
  multipliers: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  multipliersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 12,
    textAlign: 'center',
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  multiplierItem: {
    alignItems: 'center',
  },
  multiplierTokens: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  multiplierValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
  },

  // Players
  playersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  playersList: {
    maxHeight: 200,
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
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  alreadyBet: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  bettingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  betButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  betButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  betAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  betMultiplier: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
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
