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
}

export default function BettingModal({
  visible,
  onClose,
  players,
  currentCard,
  onPlaceBet,
}: BettingModalProps) {
  const { t } = useTranslation();

  const getBettingMultiplier = (betAmount: number): number => {
    if (betAmount === 1) return 2;
    if (betAmount === 2) return 3;
    if (betAmount >= 3) return 4;
    return 1;
  };

  const renderPlayer = ({ item: player }: { item: any }) => {
    if (player.currentBet > 0) {
      return (
        <View style={styles.playerItem}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.alreadyBet}>
            {t('bettingModal.players.alreadyBet')}
            {player.currentBet}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.playerItem}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerTokens}>{player.tokens} tokens</Text>
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
          <View style={styles.header}>
            <Text style={styles.title}>🎲 Sistema de Apuestas</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name='xmark' size={24} color='#64748B' />
            </TouchableOpacity>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{currentCard.track.title}</Text>
            <Text style={styles.cardArtist}>{currentCard.track.artist}</Text>
            <Text style={styles.cardPoints}>
              {t('bettingModal.cardInfo.basePoints')} {currentCard.points}
            </Text>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>
              📋 {t('bettingModal.instructions.title')}
            </Text>
            <Text style={styles.instructionText}>
              • {t('bettingModal.instructions.step1')}
            </Text>
            <Text style={styles.instructionText}>
              • {t('bettingModal.instructions.step2')}
            </Text>
            <Text style={styles.instructionText}>
              • {t('bettingModal.instructions.step3')}
            </Text>
          </View>

          <View style={styles.multipliers}>
            <Text style={styles.multipliersTitle}>
              🎯 {t('bettingModal.multipliers.title')}
            </Text>
            <View style={styles.multiplierRow}>
              <Text style={styles.multiplierText}>
                {t('bettingModal.multipliers.option1')}
              </Text>
              <Text style={styles.multiplierText}>
                {' '}
                {t('bettingModal.multipliers.option2')}
              </Text>
              <Text style={styles.multiplierText}>
                {' '}
                {t('bettingModal.multipliers.option3')}
              </Text>
            </View>
          </View>

          <Text style={styles.playersTitle}>
            👥 {t('bettingModal.players.selectionTitle')}
          </Text>

          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={renderPlayer}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
          />

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>
              {t('bettingModal.buttons.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1E293B',
    width: width * 0.9,
    maxHeight: '85%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 8,
  },
  cardInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  cardArtist: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  cardPoints: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  multipliers: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  multipliersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  multiplierText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  playersList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  playerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  },
  bettingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  betButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  betButtonDisabled: {
    backgroundColor: '#64748B',
    opacity: 0.5,
  },
  betAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  betMultiplier: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#64748B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
