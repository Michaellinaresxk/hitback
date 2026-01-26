// components/PowerCardInventory.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { PowerCard } from '@/types/game.types';

interface PowerCardInventoryProps {
  playerId: string;
  playerName: string;
  powerCards: PowerCard[];
  onUseCard?: (cardId: string) => void;
  canUseCards?: boolean;
}

/**
 * 🎒 POWER CARD INVENTORY
 *
 * Muestra las PowerCards que tiene un jugador
 * - Grid de cartas con emoji, nombre y usos disponibles
 * - Botón para usar cada carta
 * - Estado visual (disponible/usada)
 *
 * ✅ CLEAN COMPONENT: Props tipadas, funcionalidad clara
 */
export const PowerCardInventory: React.FC<PowerCardInventoryProps> = ({
  playerId,
  playerName,
  powerCards,
  onUseCard,
  canUseCards = true,
}) => {
  // Si no tiene cartas, mostrar mensaje
  if (!powerCards || powerCards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🎴</Text>
        <Text style={styles.emptyText}>Sin Power Cards</Text>
        <Text style={styles.emptySubtext}>
          ¡Logra 3 respuestas seguidas para obtener una!
        </Text>
      </View>
    );
  }

  const handleUseCard = (cardId: string) => {
    if (canUseCards && onUseCard) {
      onUseCard(cardId);
    }
  };

  const isCardAvailable = (card: PowerCard) => {
    return card.currentUses < card.usageLimit;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Power Cards</Text>
        <Text style={styles.subtitle}>{playerName}</Text>
      </View>

      {/* Cards Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
      >
        {powerCards.map((card) => {
          const available = isCardAvailable(card);
          const usesLeft = card.usageLimit - card.currentUses;

          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                !available && styles.cardUsed,
                card.isActive && styles.cardActive,
              ]}
              onPress={() => handleUseCard(card.id)}
              disabled={!canUseCards || !available}
              activeOpacity={0.7}
            >
              {/* Emoji */}
              <Text style={styles.cardEmoji}>{card.icon}</Text>

              {/* Name */}
              <Text style={styles.cardName} numberOfLines={2}>
                {card.name}
              </Text>

              {/* Uses Left */}
              <View style={styles.usesContainer}>
                <Text
                  style={[styles.usesText, !available && styles.usesTextUsed]}
                >
                  {available ? `${usesLeft}/${card.usageLimit} usos` : 'USADA'}
                </Text>
              </View>

              {/* Active Indicator */}
              {card.isActive && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeText}>ACTIVA</Text>
                </View>
              )}

              {/* Description (tooltip) */}
              {available && (
                <Text style={styles.cardDescription} numberOfLines={3}>
                  {card.description}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          📊 {powerCards.length} cartas |{' '}
          {powerCards.filter(isCardAvailable).length} disponibles
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  cardsContainer: {
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 140,
    minHeight: 180,
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardUsed: {
    backgroundColor: '#1a1a2e',
    borderColor: '#444',
    opacity: 0.5,
  },
  cardActive: {
    backgroundColor: '#4a4a6a',
    borderColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  cardEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 4,
  },
  usesContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    padding: 6,
    marginTop: 8,
  },
  usesText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  usesTextUsed: {
    color: '#888',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00ff88',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  stats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  emptyContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
