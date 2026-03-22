// components/PowerCardItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PowerCard } from '@/types/game.types';

interface PowerCardItemProps {
  card: PowerCard;
  onUse?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * 🎴 POWER CARD ITEM
 *
 * Componente para mostrar una PowerCard individual
 * - Versión compacta para listas
 * - Versión detallada para modales
 * - Estados visuales (disponible/usada/activa)
 *
 * ✅ CLEAN COMPONENT: Reutilizable, estados claros
 */
export const PowerCardItem: React.FC<PowerCardItemProps> = ({
  card,
  onUse,
  showDetails = true,
  compact = false,
}) => {
  const isAvailable = card.currentUses < card.usageLimit;
  const usesLeft = card.usageLimit - card.currentUses;

  // Mapeo de tipos a colores
  const getCardColor = (type: string) => {
    const colors = {
      BOOST: '#ffe66d', // Amarillo - Replay x2
      FESTIVAL: '#ff9f43', // Naranja fiesta - Festival
    };
    return colors[type as keyof typeof colors] || '#FFD700';
  };

  const cardColor = getCardColor(card.type);

  if (compact) {
    return (
      <View
        style={[styles.compactCard, !isAvailable && styles.compactCardUsed]}
      >
        <Text style={styles.compactEmoji}>{card.icon}</Text>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>
            {card.name}
          </Text>
          <Text
            style={[styles.compactUses, !isAvailable && styles.compactUsesUsed]}
          >
            {isAvailable ? `${usesLeft} left` : 'USED'}
          </Text>
        </View>
        {card.isActive && (
          <View style={styles.compactActive}>
            <Text style={styles.compactActiveText}>●</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: cardColor },
        !isAvailable && styles.cardUsed,
        card.isActive && styles.cardActive,
      ]}
      onPress={onUse}
      disabled={!isAvailable || !onUse}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{card.icon}</Text>
        {card.isActive && (
          <View style={[styles.badge, { backgroundColor: cardColor }]}>
            <Text style={styles.badgeText}>ACTIVA</Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={styles.cardName}>{card.name}</Text>

      {/* Type */}
      <View
        style={[styles.typeContainer, { backgroundColor: `${cardColor}20` }]}
      >
        <Text style={[styles.typeText, { color: cardColor }]}>{card.type}</Text>
      </View>

      {/* Description */}
      {showDetails && (
        <Text style={styles.description}>{card.description}</Text>
      )}

      {/* Uses */}
      <View style={styles.footer}>
        <View
          style={[
            styles.usesContainer,
            !isAvailable && styles.usesContainerUsed,
          ]}
        >
          <Text
            style={[styles.usesLabel, !isAvailable && styles.usesLabelUsed]}
          >
            {isAvailable ? 'USOS:' : 'AGOTADA'}
          </Text>
          {isAvailable && (
            <Text style={styles.usesValue}>
              {usesLeft}/{card.usageLimit}
            </Text>
          )}
        </View>
      </View>

      {/* Use Button */}
      {isAvailable && onUse && (
        <TouchableOpacity
          style={[styles.useButton, { backgroundColor: cardColor }]}
          onPress={onUse}
          activeOpacity={0.8}
        >
          <Text style={styles.useButtonText}>USAR CARTA</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Full Card Styles
  card: {
    backgroundColor: '#2d2d44',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 3,
    minHeight: 200,
    position: 'relative',
  },
  cardUsed: {
    backgroundColor: '#1a1a2e',
    borderColor: '#444',
    opacity: 0.6,
  },
  cardActive: {
    backgroundColor: '#3d3d54',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 48,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  cardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  typeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    marginTop: 'auto',
  },
  usesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  usesContainerUsed: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
  },
  usesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  usesLabelUsed: {
    color: '#888',
  },
  usesValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  useButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },

  // Compact Card Styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  compactCardUsed: {
    backgroundColor: '#1a1a2e',
    borderColor: '#444',
    opacity: 0.5,
  },
  compactEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  compactUses: {
    fontSize: 12,
    color: '#FFD700',
  },
  compactUsesUsed: {
    color: '#888',
  },
  compactActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff88',
    marginLeft: 8,
  },
  compactActiveText: {
    fontSize: 10,
    color: '#00ff88',
    textAlign: 'center',
  },
});
