import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useState, useEffect } from 'react';
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
  onConfirmBets?: () => void; // ✅ NUEVA: Para confirmar y continuar
}

export default function BettingModal({
  visible,
  onClose,
  players,
  currentCard,
  onPlaceBet,
  onSkipBetting,
  onConfirmBets, // ✅ NUEVA
}: BettingModalProps) {
  const { t } = useTranslation();
  const [hasAnyBet, setHasAnyBet] = useState(false);

  // Efecto para verificar si hay alguna apuesta
  useEffect(() => {
    const anyBetPlaced = players.some((player) => player.currentBet > 0);
    setHasAnyBet(anyBetPlaced);
    console.log(`🎰 BettingModal: any bet placed = ${anyBetPlaced}`);
  }, [players]);

  const isTokenAvailable = (player: Player, tokenValue: number): boolean => {
    return (
      player.availableTokens.includes(tokenValue) && player.currentBet === 0
    );
  };

  const getAvailableTokens = (player: Player): number[] => {
    return player.availableTokens || [];
  };

  const getBetsSummary = () => {
    const playersWithBets = players.filter((p) => p.currentBet > 0);
    if (playersWithBets.length === 0) return 'Ninguna apuesta aún';

    return playersWithBets.map((p) => `${p.name}: +${p.currentBet}`).join(', ');
  };

  const renderPlayer = ({ item: player }: { item: Player }) => {
    // Si ya apostó en esta ronda
    if (player.currentBet > 0) {
      return (
        <View style={styles.playerItem}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{player.name}</Text>
            <View style={styles.betBadge}>
              <Text style={styles.betBadgeText}>+{player.currentBet}</Text>
            </View>
          </View>
          <View style={styles.betPlacedContainer}>
            <Text style={styles.alreadyBet}>✅ Token apostado</Text>
            <TouchableOpacity
              style={styles.changeBetButton}
              onPress={() => {
                // ✅ Permitir cambiar apuesta
                console.log(`🔄 ${player.name} quiere cambiar apuesta`);
              }}
            >
              <Text style={styles.changeBetText}>Cambiar</Text>
            </TouchableOpacity>
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
              ? `Disponibles: ${availableTokens.join(', ')}`
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
                    {isAvailable ? 'Apostar' : 'Usado'}
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

  const roundNumber = currentCard?.roundNumber || '?';
  const betsSummary = getBetsSummary();

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.roundBadge}>Ronda {roundNumber}</Text>
              <Text style={styles.title}>🎲 Apuestas de Tokens</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name='xmark' size={24} color='#64748B' />
            </TouchableOpacity>
          </View>

          {/* Resumen de apuestas */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Resumen de Apuestas</Text>
            <Text style={styles.summaryText}>{betsSummary}</Text>
          </View>

          {/* Mensaje informativo */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Cada jugador puede apostar{' '}
              <Text style={styles.highlight}>1 token por ronda</Text>
            </Text>
            <Text style={styles.infoSubtext}>
              Los tokens apostados se sumarán a tus puntos si aciertas
            </Text>
          </View>

          {/* Players Title */}
          <Text style={styles.playersTitle}>👥 Jugadores</Text>

          {/* Players List */}
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={renderPlayer}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
          />

          {/* ✅ NUEVO: Botón para confirmar apuestas y continuar */}
          {hasAnyBet && onConfirmBets && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                console.log('✅ Confirmando apuestas y continuando...');
                onConfirmBets();
                onClose();
              }}
            >
              <IconSymbol name='check.circle' size={22} color='#FFFFFF' />
              <Text style={styles.confirmText}>
                CONFIRMAR APUESTAS Y CONTINUAR
              </Text>
            </TouchableOpacity>
          )}

          {/* Botón para saltar apuestas */}
          {onSkipBetting && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                console.log('⏭️ Saltando apuestas...');
                onSkipBetting();
                onClose();
              }}
            >
              <IconSymbol name='forward' size={18} color='#94A3B8' />
              <Text style={styles.skipText}>
                Saltar apuestas y escuchar audio
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  roundBadge: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '700',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 8,
    marginTop: 4,
  },
  summaryContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
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
    marginBottom: 6,
    lineHeight: 20,
  },
  highlight: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
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
    fontWeight: '700',
    color: '#F8FAFC',
  },
  playerTokens: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  betBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  betBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  betPlacedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  alreadyBet: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  changeBetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  changeBetText: {
    fontSize: 11,
    color: '#94A3B8',
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
    gap: 8,
  },
  betButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
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
  // ✅ NUEVO: Botón de confirmar
  confirmButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    gap: 10,
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
