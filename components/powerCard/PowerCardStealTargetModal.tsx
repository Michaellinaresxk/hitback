// components/powerCards/StealTargetModal.tsx
// Modal para seleccionar la víctima del robo (STEAL card)

import { StealTarget } from '@/types/powerCard.types';
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface StealTargetModalProps {
  visible: boolean;
  targets: StealTarget[];
  attackerName: string;
  onSelectTarget: (targetId: string) => void;
  onCancel: () => void;
}

export default function StealTargetModal({
  visible,
  targets,
  attackerName,
  onSelectTarget,
  onCancel,
}: StealTargetModalProps) {
  const renderTarget = ({ item: target }: { item: StealTarget }) => {
    const hasDefense = target.hasShield || target.hasCounter;

    return (
      <TouchableOpacity
        style={[styles.targetItem, hasDefense && styles.targetWithDefense]}
        onPress={() => onSelectTarget(target.id)}
        activeOpacity={0.7}
      >
        <View style={styles.targetInfo}>
          {/* Avatar/Icon */}
          <View style={styles.targetAvatar}>
            <Text style={styles.targetAvatarText}>
              {target.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Nombre y cartas */}
          <View style={styles.targetDetails}>
            <Text style={styles.targetName}>{target.name}</Text>
            <Text style={styles.targetCards}>
              🎴 {target.cardsCount} carta{target.cardsCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Indicadores de defensa */}
        <View style={styles.defenseIndicators}>
          {target.hasShield && (
            <View style={styles.defenseBadge}>
              <Text style={styles.defenseIcon}>🛡️</Text>
              <Text style={styles.defenseText}>Shield</Text>
            </View>
          )}
          {target.hasCounter && (
            <View style={[styles.defenseBadge, styles.counterBadge]}>
              <Text style={styles.defenseIcon}>⚔️</Text>
              <Text style={styles.defenseText}>Counter</Text>
            </View>
          )}
          {!hasDefense && (
            <View style={styles.vulnerableBadge}>
              <Text style={styles.vulnerableText}>Vulnerable</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>🥷</Text>
            </View>
            <Text style={styles.title}>SELECCIONA VÍCTIMA</Text>
            <Text style={styles.subtitle}>
              {attackerName} va a robar una carta
            </Text>
          </View>

          {/* Warning */}
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Robarás una carta ALEATORIA del jugador seleccionado. ¡Cuidado con
              los escudos y contraataques!
            </Text>
          </View>

          {/* Lista de targets */}
          {targets.length > 0 ? (
            <FlatList
              data={targets}
              keyExtractor={(item) => item.id}
              renderItem={renderTarget}
              style={styles.targetsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>😕</Text>
              <Text style={styles.emptyText}>
                No hay jugadores con cartas para robar
              </Text>
            </View>
          )}

          {/* Leyenda */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>DEFENSAS:</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <Text style={styles.legendIcon}>🛡️</Text>
                <Text style={styles.legendText}>Shield: Bloquea el robo</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={styles.legendIcon}>⚔️</Text>
                <Text style={styles.legendText}>Counter: ¡Te roba a TI!</Text>
              </View>
            </View>
          </View>

          {/* Botón cancelar */}
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar Robo</Text>
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
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },

  // Warning
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#F59E0B',
    lineHeight: 18,
  },

  // Targets list
  targetsList: {
    maxHeight: 280,
    marginBottom: 16,
  },
  targetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  targetWithDefense: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  targetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  targetAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  targetDetails: {
    flex: 1,
  },
  targetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  targetCards: {
    fontSize: 13,
    color: '#94A3B8',
  },

  // Defense indicators
  defenseIndicators: {
    alignItems: 'flex-end',
  },
  defenseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  counterBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  defenseIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  defenseText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  vulnerableBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vulnerableText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },

  // Legend
  legend: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // Cancel button
  cancelButton: {
    backgroundColor: '#475569',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
