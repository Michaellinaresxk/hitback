// components/powerCards/ResurrectModal.tsx
// Modal para la carta RESURRECT - Seleccionar carta a recuperar

import { POWER_CARD_CONFIG } from '@/constants/PowerCard';
import { getCategoryColor } from '@/helpers/powerCard.helpers';
import { PowerCardInstance } from '@/types/powerCard.types';
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

interface ResurrectModalProps {
  visible: boolean;
  availableCards: PowerCardInstance[];
  playerName: string;
  onSelectCard: (cardId: string) => void;
  onCancel: () => void;
}

export default function PowerCardResurrectModal({
  visible,
  availableCards,
  playerName,
  onSelectCard,
  onCancel,
}: ResurrectModalProps) {
  const renderCard = ({ item: card }: { item: PowerCardInstance }) => {
    const config = POWER_CARD_CONFIG[card.type];
    const categoryColor = getCategoryColor(config.category);

    const usedDate = card.usedAt
      ? new Date(card.usedAt).toLocaleTimeString('es', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <TouchableOpacity
        style={[styles.cardItem, { borderColor: categoryColor }]}
        onPress={() => onSelectCard(card.id)}
        activeOpacity={0.7}
      >
        {/* Icono */}
        <View
          style={[styles.cardIcon, { backgroundColor: `${categoryColor}20` }]}
        >
          <Text style={styles.cardIconText}>{card.icon}</Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {card.description}
          </Text>
          <Text style={styles.cardUsedAt}>Usada: {usedDate}</Text>
        </View>

        {/* Indicador de selección */}
        <View
          style={[styles.selectIndicator, { backgroundColor: categoryColor }]}
        >
          <Text style={styles.selectText}>↺</Text>
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
              <Text style={styles.headerIconText}>🔄</Text>
            </View>
            <Text style={styles.title}>RESURRECCIÓN</Text>
            <Text style={styles.subtitle}>
              {playerName}, selecciona una carta para recuperar
            </Text>
          </View>

          {/* Explicación */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              Recupera una carta que ya hayas usado. La carta volverá a tu
              inventario lista para usar de nuevo.
            </Text>
          </View>

          {/* Lista de cartas */}
          {availableCards.length > 0 ? (
            <FlatList
              data={availableCards}
              keyExtractor={(item) => item.id}
              renderItem={renderCard}
              style={styles.cardsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cardsListContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>Sin cartas usadas</Text>
              <Text style={styles.emptyText}>
                No tienes cartas usadas que puedas recuperar
              </Text>
            </View>
          )}

          {/* Cantidad disponible */}
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              📜 {availableCards.length} carta
              {availableCards.length !== 1 ? 's' : ''} disponible
              {availableCards.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Botón cancelar */}
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
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
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
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
    color: '#10B981',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },

  // Cards list
  cardsList: {
    maxHeight: 320,
    marginBottom: 16,
  },
  cardsListContent: {
    paddingBottom: 8,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardIconText: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 4,
  },
  cardUsedAt: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  selectIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  selectText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },

  // Count
  countContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  countText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
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
