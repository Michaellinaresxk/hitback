// components/PowerCardsModal.tsx - ⚡ MODAL DE CARTAS DE PODER
import { usePowerCards } from '@/hooks/usePowerCard';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PowerCardsModalProps {
  visible: boolean;
  players: any[];
  onClose: () => void;
}

export default function PowerCardsModal({
  visible,
  players,
  onClose,
}: PowerCardsModalProps) {
  const {
    handleUsePowerCard,
    getAvailablePowerCards,
    canUsePowerCard,
    getPowerCardEffect,
    powerStats,
  } = usePowerCards();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showTargetSelection, setShowTargetSelection] = useState(false);
  const [pendingPowerCard, setPendingPowerCard] = useState<any>(null);

  const usePowerCard = (
    playerId: string,
    powerCard: any,
    targetPlayerId?: string
  ) => {
    const result = handleUsePowerCard(playerId, powerCard.id, targetPlayerId);

    if (result.success) {
      const player = players.find((p) => p.id === playerId);
      Alert.alert(
        '⚡ Poder Activado',
        `${player.name} usó ${powerCard.name}!\n${powerCard.description}`,
        [{ text: 'OK' }]
      );
      setShowTargetSelection(false);
      setPendingPowerCard(null);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handlePowerCardPress = (playerId: string, powerCard: any) => {
    // Si necesita objetivo (robo), mostrar selector
    if (powerCard.type === 'robo') {
      setPendingPowerCard({ playerId, powerCard });
      setShowTargetSelection(true);
    } else {
      usePowerCard(playerId, powerCard);
    }
  };

  const handleTargetSelection = (targetPlayerId: string) => {
    if (pendingPowerCard) {
      usePowerCard(
        pendingPowerCard.playerId,
        pendingPowerCard.powerCard,
        targetPlayerId
      );
    }
  };

  const renderPlayer = ({ item: player }: { item: any }) => {
    const availablePowerCards = getAvailablePowerCards(player.id);

    return (
      <View style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <Text style={styles.playerName}>{player.name}</Text>
          <View style={styles.activeEffectsContainer}>
            {player.isImmune && (
              <View style={styles.activeEffect}>
                <Text style={styles.activeEffectText}>🛡️ Escudo</Text>
              </View>
            )}
            {player.boostActive && (
              <View style={styles.activeEffect}>
                <Text style={styles.activeEffectText}>⚡ Boost</Text>
              </View>
            )}
            {player.peekUsed && (
              <View style={styles.activeEffect}>
                <Text style={styles.activeEffectText}>👁️ Peek</Text>
              </View>
            )}
          </View>
        </View>

        {availablePowerCards.length > 0 ? (
          <View style={styles.powerCardsGrid}>
            {availablePowerCards.map((powerCard) => (
              <TouchableOpacity
                key={powerCard.id}
                style={[
                  styles.powerCardButton,
                  !canUsePowerCard(player.id, powerCard.id) &&
                    styles.powerCardDisabled,
                ]}
                onPress={() => handlePowerCardPress(player.id, powerCard)}
                disabled={!canUsePowerCard(player.id, powerCard.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.powerCardEmoji}>{powerCard.emoji}</Text>
                <Text style={styles.powerCardName}>{powerCard.name}</Text>
                <Text style={styles.powerCardUsage}>
                  {powerCard.usageLimit - powerCard.currentUses} uso
                  {powerCard.usageLimit - powerCard.currentUses !== 1
                    ? 's'
                    : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.noPowerCardsText}>
            Sin cartas de poder disponibles
          </Text>
        )}
      </View>
    );
  };

  const renderTargetPlayer = ({ item: player }: { item: any }) => {
    if (!pendingPowerCard || player.id === pendingPowerCard.playerId)
      return null;

    const canTarget =
      pendingPowerCard.powerCard.type === 'robo'
        ? player.tokens > 0 && !player.isImmune
        : true;

    return (
      <TouchableOpacity
        style={[
          styles.targetPlayerButton,
          !canTarget && styles.targetPlayerDisabled,
        ]}
        onPress={() => handleTargetSelection(player.id)}
        disabled={!canTarget}
        activeOpacity={0.8}
      >
        <Text style={styles.targetPlayerName}>{player.name}</Text>
        <View style={styles.targetPlayerInfo}>
          <Text style={styles.targetPlayerTokens}>{player.tokens} tokens</Text>
          {player.isImmune && (
            <Text style={styles.immuneText}>🛡️ Protegido</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (showTargetSelection) {
    return (
      <Modal visible={visible} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🎯 Selecciona Objetivo</Text>
            <Text style={styles.modalSubtitle}>
              Usando: {pendingPowerCard?.powerCard.name}
            </Text>

            <FlatList
              data={players}
              keyExtractor={(item) => item.id}
              renderItem={renderTargetPlayer}
              style={styles.targetList}
            />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowTargetSelection(false);
                setPendingPowerCard(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⚡ Cartas de Poder</Text>
            <Text style={styles.modalSubtitle}>
              Usa habilidades especiales para obtener ventajas
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {powerStats.totalPowerCards}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {powerStats.availablePowerCards}
              </Text>
              <Text style={styles.statLabel}>Disponibles</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{powerStats.activePowers}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
          </View>

          {/* Power Card Types Reference */}
          <View style={styles.referenceContainer}>
            <Text style={styles.referenceTitle}>🔥 Tipos de Poderes:</Text>
            <Text style={styles.referenceText}>🥷 Ladrón: Roba 1 token</Text>
            <Text style={styles.referenceText}>🛡️ Escudo: Inmune a robos</Text>
            <Text style={styles.referenceText}>⚡ Boost: Doble puntos</Text>
            <Text style={styles.referenceText}>
              🔄 Refresh: Recupera 1 token
            </Text>
            <Text style={styles.referenceText}>
              👁️ Peek: Ve respuesta antes
            </Text>
            <Text style={styles.referenceText}>
              🎯 Precisión: +2 pts por año exacto
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  referenceContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  referenceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 6,
  },
  referenceText: {
    fontSize: 10,
    color: '#E2E8F0',
    marginBottom: 2,
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
  activeEffectsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  activeEffect: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeEffectText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  powerCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  powerCardButton: {
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
  },
  powerCardDisabled: {
    backgroundColor: '#64748B',
    opacity: 0.5,
  },
  powerCardEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  powerCardName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  powerCardUsage: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noPowerCardsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Target Selection
  targetList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  targetPlayerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  targetPlayerDisabled: {
    backgroundColor: '#64748B',
    opacity: 0.5,
  },
  targetPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  targetPlayerInfo: {
    alignItems: 'flex-end',
  },
  targetPlayerTokens: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  immuneText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#64748B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
