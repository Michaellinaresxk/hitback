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
  availableTokens: number[];
  currentBet: number;
}

interface BettingModalProps {
  visible: boolean;
  onClose: () => void;
  players: Player[];
  currentCard: any;
  onPlaceBet: (playerId: string, tokenValue: number) => void;
  onSkipBetting?: () => void;
}

export default function BettingModal({
  visible,
  onClose,
  players,
  currentCard,
  onPlaceBet,
  onSkipBetting,
}: BettingModalProps) {
  const { t } = useTranslation();

  const isTokenAvailable = (player: Player, tokenValue: number): boolean => {
    return (
      player.availableTokens.includes(tokenValue) && player.currentBet === 0
    );
  };

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
              ✅ Ya apostó +{player.currentBet}
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

          {/* Mensaje informativo */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Cada jugador puede apostar{' '}
              <Text style={styles.highlight}>1 token por ronda</Text>
            </Text>
            <Text style={styles.infoSubtext}>
              Tokens son personales y no se comparten
            </Text>
            <Text style={styles.infoSubtext}>
              Si aciertas: Puntos base + valor del token
            </Text>
          </View>

          {/* Players List */}
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={renderPlayer}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
          />

          {/* Botón para saltar apuestas */}
          {onSkipBetting && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                onSkipBetting();
                onClose();
              }}
            >
              <Text style={styles.skipText}>
                ⏭️ Saltar apuesta y escuchar audio
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cerrar</Text>
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
  infoContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  infoText: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  highlight: {
    color: '#F59E0B',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  playersList: {
    maxHeight: 300,
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
  bettingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
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
    backgroundColor: '#10B981',
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
  startAudioButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  startAudioText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginBottom: 12,
  },
  skipText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
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
