// components/powerCards/PowerCardItem.tsx
// Componente para mostrar una Power Card individual

import { POWER_CARD_CONFIG } from '@/constants/PowerCard';
import { getCategoryColor } from '@/helpers/powerCard.helpers';
import { PowerCardInstance } from '@/types/powerCard.types';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

interface PowerCardItemProps {
  card: PowerCardInstance;
  onPress?: () => void;
  onUse?: () => void;
  disabled?: boolean;
  compact?: boolean;
  showUseButton?: boolean;
  isActive?: boolean;
}

export default function PowerCardItem({
  card,
  onPress,
  onUse,
  disabled = false,
  compact = false,
  showUseButton = true,
  isActive = false,
}: PowerCardItemProps) {
  const config = POWER_CARD_CONFIG[card.type];
  const categoryColor = getCategoryColor(config.category);

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          { borderColor: categoryColor },
          disabled && styles.disabled,
          isActive && styles.activeCard,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.compactIcon}>{card.icon}</Text>
        <Text style={styles.compactName} numberOfLines={1}>
          {card.name}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderColor: categoryColor },
        disabled && styles.disabled,
        isActive && styles.activeCard,
      ]}
      onPress={onPress}
      disabled={disabled && !onUse}
      activeOpacity={0.8}
    >
      {/* Header con icono y tipo */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${categoryColor}20` },
          ]}
        >
          <Text style={styles.icon}>{card.icon}</Text>
        </View>
        <View
          style={[styles.typeBadge, { backgroundColor: `${categoryColor}30` }]}
        >
          <Text style={[styles.typeText, { color: categoryColor }]}>
            {config.effectType === 'persistent' ? '⏳ Dura' : '⚡ Inmediato'}
          </Text>
        </View>
      </View>

      {/* Nombre y descripción */}
      <Text style={styles.name}>{card.name}</Text>
      <Text style={styles.description}>{card.description}</Text>

      {/* Indicador de activo */}
      {isActive && (
        <View style={styles.activeIndicator}>
          <Text style={styles.activeText}>✓ ACTIVO</Text>
        </View>
      )}

      {/* Botón de usar */}
      {showUseButton && onUse && !isActive && (
        <TouchableOpacity
          style={[styles.useButton, { backgroundColor: categoryColor }]}
          onPress={onUse}
          disabled={disabled}
        >
          <Text style={styles.useButtonText}>USAR</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// Componente para mostrar carta vacía (slot disponible)
export function EmptyCardSlot({ index }: { index: number }) {
  return (
    <View style={styles.emptySlot}>
      <Text style={styles.emptyIcon}>🎴</Text>
      <Text style={styles.emptyText}>Slot {index + 1}</Text>
    </View>
  );
}

// Componente para mostrar carta con efecto especial (nueva/robada)
export function PowerCardHighlight({
  card,
  type,
  onDismiss,
}: {
  card: PowerCardInstance;
  type: 'new' | 'stolen' | 'lost';
  onDismiss: () => void;
}) {
  const config = POWER_CARD_CONFIG[card.type];
  const categoryColor = getCategoryColor(config.category);

  const typeConfig = {
    new: { title: '¡NUEVA CARTA!', color: '#10B981', icon: '🎉' },
    stolen: { title: '¡CARTA ROBADA!', color: '#F59E0B', icon: '🥷' },
    lost: { title: 'CARTA PERDIDA', color: '#EF4444', icon: '😢' },
  };

  const { title, color, icon } = typeConfig[type];

  return (
    <TouchableOpacity
      style={[styles.highlightContainer, { borderColor: color }]}
      onPress={onDismiss}
      activeOpacity={0.9}
    >
      <Text style={styles.highlightType}>
        {icon} {title}
      </Text>

      <View style={[styles.highlightCard, { borderColor: categoryColor }]}>
        <Text style={styles.highlightIcon}>{card.icon}</Text>
        <Text style={styles.highlightName}>{card.name}</Text>
        <Text style={styles.highlightDescription}>{card.description}</Text>
      </View>

      <Text style={styles.highlightHint}>Toca para cerrar</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Card normal
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  activeCard: {
    borderWidth: 3,
    shadowOpacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 12,
  },
  activeIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  activeText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
  },
  useButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Compact version
  compactContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    alignItems: 'center',
    width: 80,
    marginRight: 10,
  },
  compactIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  compactName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
  },

  // Empty slot
  emptySlot: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    width: 80,
    marginRight: 10,
  },
  emptyIcon: {
    fontSize: 24,
    opacity: 0.3,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },

  // Highlight (new/stolen/lost)
  highlightContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 3,
    alignItems: 'center',
  },
  highlightType: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 20,
    letterSpacing: 1,
  },
  highlightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  highlightIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  highlightName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  highlightDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  highlightHint: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
