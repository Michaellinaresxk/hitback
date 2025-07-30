// components/BettingModal.tsx - 🎰 MODAL DE SISTEMA DE APUESTAS
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useBettingSystem } from '@/hooks/useBettingSystem';
import React from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface BettingModalProps {
  visible: boolean;
  players: any[];
  currentCard: any;
  onClose: () => void;
}

export default function BettingModal({
  visible,
  players,
  currentCard,
  onClose,
}: BettingModalProps) {
  const {
    handlePlaceBet,
    getBettingOptions,
    getBettingMultiplier,
    bettingStats,
  } = useBettingSystem();

  const placeBet = (playerId: string, amount: number) => {
    const result = handlePlaceBet(playerId, amount);

    if (result.success) {
      const player = players.find((p) => p.id === playerId);
      Alert.alert(
        '🎰 Apuesta Realizada',
        `${player.name} apostó ${amount} token${
          amount > 1 ? 's' : ''
        }\nMultiplicador: ${getBettingMultiplier(amount)}x`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const renderPlayer = ({ item: player }: { item: any }) => {
    const bettingOptions = getBettingOptions(player.id);

    return (
      <View style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <Text style={styles.playerName}>{player.name}</Text>
          <View style={styles.tokensContainer}>
            <IconSymbol
              name='bitcoinsign.circle.fill'
              size={16}
              color='#F59E0B'
            />
            <Text style={styles.tokensText}>{player.tokens} tokens</Text>
          </View>
        </View>

        {player.currentBet > 0 ? (
          // Already has a bet
          <View style={styles.activeBetContainer}>
            <IconSymbol
              name='checkmark.circle.fill'
              size={20}
              color='#10B981'
            />
            <Text style={styles.activeBetText}>
              Apostó {player.currentBet} token{player.currentBet > 1 ? 's' : ''}
            </Text>
            <Text style={styles.multiplierText}>
              {getBettingMultiplier(player.currentBet)}x multiplicador
            </Text>
          </View>
        ) : (
          // Betting options
          <View style={styles.bettingOptions}>
            {bettingOptions.map((option) => (
              <TouchableOpacity
                key={option.amount}
                style={styles.betButton}
                onPress={() => placeBet(player.id, option.amount)}
                activeOpacity={0.8}
              >
                <View style={styles.betAmount}>
                  <Text style={styles.betAmountText}>{option.amount}</Text>
                  <Text style={styles.betAmountLabel}>
                    token{option.amount > 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.multiplierBadge}>{option.multiplier}x</Text>
                <Text style={styles.potentialPoints}>
                  {option.potentialPoints} pts
                </Text>
              </TouchableOpacity>
            ))}

            {bettingOptions.length === 0 && (
              <Text style={styles.noTokensText}>Sin tokens disponibles</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🎰 Sistema de Apuestas</Text>
            <Text style={styles.modalSubtitle}>
              Multiplica tus puntos apostando tokens antes de responder
            </Text>
          </View>

          {/* Current Card Info */}
          {currentCard && (
            <View style={styles.cardInfo}>
              <Text style={styles.cardInfoText}>
                Carta actual: {currentCard.points} punto
                {currentCard.points > 1 ? 's' : ''} base
              </Text>
            </View>
          )}

          {/* Betting Rules */}
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>📋 Reglas de Apuestas:</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleText}>🥉 1 token = 2x puntos</Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleText}>🥈 2 tokens = 3x puntos</Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleText}>🥇 3+ tokens = 4x puntos</Text>
            </View>
            <Text style={styles.warningText}>
              ⚠️ Si fallas, pierdes los tokens apostados
            </Text>
          </View>

          {/* Stats */}
          {bettingStats.activeBets > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                📊 {bettingStats.activeBets} jugador
                {bettingStats.activeBets > 1 ? 'es' : ''} apostando
              </Text>
              <Text style={styles.statsText}>
                💰 {bettingStats.totalTokensBet} tokens en juego
              </Text>
            </View>
          )}

          {/* Players List */}
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={renderPlayer}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
          />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
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
    maxHeight: '85%',
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  cardInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardInfoText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  rulesContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },
  ruleItem: {
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  warningText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 8,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  playersList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerHeader: {
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
  tokensContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokensText: {
    fontSize: 12,
    color: '#E2E8F0',
    marginLeft: 4,
    fontWeight: '600',
  },
  activeBetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  activeBetText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  multiplierText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  bettingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  betButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  betAmount: {
    alignItems: 'center',
    marginBottom: 4,
  },
  betAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  betAmountLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  multiplierBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  potentialPoints: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noTokensText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#64748B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
