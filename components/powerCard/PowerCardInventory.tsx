// components/powerCards/PowerCardInventory.tsx
// Componente para mostrar el inventario de Power Cards de un jugador

import { MAX_CARDS_IN_HAND } from '@/constants/PowerCard';
import { PowerCardEffects, PowerCardInstance } from '@/types/powerCard.types';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import PowerCardItem, { EmptyCardSlot } from './PowerCardItem';

const { width } = Dimensions.get('window');

interface PowerCardInventoryProps {
  playerId: string;
  playerName: string;
  cards: PowerCardInstance[];
  activeEffects: PowerCardEffects;
  usedCards?: PowerCardInstance[];
  onUseCard: (cardId: string) => void;
  compact?: boolean;
  showUsedCards?: boolean;
}

export default function PowerCardInventory({
  playerId,
  playerName,
  cards,
  activeEffects,
  usedCards = [],
  onUseCard,
  compact = false,
  showUsedCards = false,
}: PowerCardInventoryProps) {
  // Crear slots vacíos para visualizar capacidad máxima
  const emptySlots = Array.from(
    { length: Math.max(0, MAX_CARDS_IN_HAND - cards.length) },
    (_, i) => i
  );

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {/* Header compacto */}
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>
            🎴 {cards.length}/{MAX_CARDS_IN_HAND}
          </Text>
          <ActiveEffectsIndicator effects={activeEffects} compact />
        </View>

        {/* Lista horizontal de cartas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactList}
        >
          {cards.map((card) => (
            <PowerCardItem
              key={card.id}
              card={card}
              compact
              onPress={() => onUseCard(card.id)}
              isActive={isCardEffectActive(card, activeEffects)}
            />
          ))}
          {emptySlots.map((_, index) => (
            <EmptyCardSlot
              key={`empty-${index}`}
              index={cards.length + index}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🎴 Power Cards</Text>
          <Text style={styles.headerSubtitle}>
            {playerName} • {cards.length}/{MAX_CARDS_IN_HAND}
          </Text>
        </View>
        <ActiveEffectsIndicator effects={activeEffects} />
      </View>

      {/* Cartas en mano */}
      {cards.length > 0 ? (
        <ScrollView
          style={styles.cardsList}
          showsVerticalScrollIndicator={false}
        >
          {cards.map((card) => (
            <PowerCardItem
              key={card.id}
              card={card}
              onUse={() => onUseCard(card.id)}
              isActive={isCardEffectActive(card, activeEffects)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎴</Text>
          <Text style={styles.emptyTitle}>Sin Power Cards</Text>
          <Text style={styles.emptyText}>
            Completa combos para ganar cartas o escanea una del mazo
          </Text>
        </View>
      )}

      {/* Slots vacíos visuales */}
      {cards.length > 0 && cards.length < MAX_CARDS_IN_HAND && (
        <View style={styles.slotsContainer}>
          <Text style={styles.slotsTitle}>Slots disponibles</Text>
          <View style={styles.slotsRow}>
            {emptySlots.map((_, index) => (
              <View key={index} style={styles.slotIndicator} />
            ))}
          </View>
        </View>
      )}

      {/* Cartas usadas (opcional) */}
      {showUsedCards && usedCards.length > 0 && (
        <View style={styles.usedSection}>
          <Text style={styles.usedTitle}>
            📜 Cartas usadas ({usedCards.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.usedList}
          >
            {usedCards.map((card) => (
              <PowerCardItem
                key={card.id}
                card={card}
                compact
                disabled
                showUseButton={false}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// Subcomponente para mostrar efectos activos
function ActiveEffectsIndicator({
  effects,
  compact = false,
}: {
  effects: PowerCardEffects;
  compact?: boolean;
}) {
  const activeEffects = [];

  if (effects.boost)
    activeEffects.push({ icon: '⚡', name: 'Boost', color: '#EF4444' });
  if (effects.shield)
    activeEffects.push({ icon: '🛡️', name: 'Shield', color: '#3B82F6' });
  if (effects.counter)
    activeEffects.push({ icon: '⚔️', name: 'Counter', color: '#8B5CF6' });

  if (activeEffects.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <View style={styles.effectsCompact}>
        {activeEffects.map((effect, index) => (
          <Text key={index} style={styles.effectIcon}>
            {effect.icon}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.effectsContainer}>
      {activeEffects.map((effect, index) => (
        <View
          key={index}
          style={[
            styles.effectBadge,
            { backgroundColor: `${effect.color}20`, borderColor: effect.color },
          ]}
        >
          <Text style={styles.effectBadgeIcon}>{effect.icon}</Text>
          <Text style={[styles.effectBadgeText, { color: effect.color }]}>
            {effect.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Helper para verificar si el efecto de una carta está activo
function isCardEffectActive(
  card: PowerCardInstance,
  effects: PowerCardEffects
): boolean {
  switch (card.type) {
    case 'BOOST':
      return effects.boost;
    case 'SHIELD':
      return effects.shield;
    case 'COUNTER':
      return effects.counter;
    default:
      return false;
  }
}

// Componente para mostrar inventario de múltiples jugadores
export function AllPlayersInventory({
  players,
  onUseCard,
  currentPlayerId,
}: {
  players: Array<{
    id: string;
    name: string;
    cards: PowerCardInstance[];
    effects: PowerCardEffects;
  }>;
  onUseCard: (playerId: string, cardId: string) => void;
  currentPlayerId?: string;
}) {
  return (
    <ScrollView style={styles.allPlayersContainer}>
      {players.map((player) => (
        <View
          key={player.id}
          style={[
            styles.playerSection,
            player.id === currentPlayerId && styles.currentPlayerSection,
          ]}
        >
          <View style={styles.playerHeader}>
            <Text style={styles.playerName}>
              {player.id === currentPlayerId ? '👤 ' : ''}
              {player.name}
            </Text>
            <View style={styles.playerCardCount}>
              <Text style={styles.playerCardCountText}>
                🎴 {player.cards.length}
              </Text>
            </View>
          </View>

          {/* Efectos activos */}
          <ActiveEffectsIndicator effects={player.effects} />

          {/* Cartas (solo iconos para otros jugadores) */}
          {player.id === currentPlayerId ? (
            // Mostrar cartas completas para el jugador actual
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {player.cards.map((card) => (
                <PowerCardItem
                  key={card.id}
                  card={card}
                  compact
                  onPress={() => onUseCard(player.id, card.id)}
                  isActive={isCardEffectActive(card, player.effects)}
                />
              ))}
            </ScrollView>
          ) : (
            // Solo mostrar iconos para otros jugadores
            <View style={styles.otherPlayerCards}>
              {player.cards.map((card) => (
                <Text key={card.id} style={styles.otherPlayerCardIcon}>
                  {card.icon}
                </Text>
              ))}
              {player.cards.length === 0 && (
                <Text style={styles.noCardsText}>Sin cartas</Text>
              )}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Container principal
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },

  // Lista de cartas
  cardsList: {
    maxHeight: 400,
  },

  // Estado vacío
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.3,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // Slots
  slotsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  slotsTitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotIndicator: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },

  // Cartas usadas
  usedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  usedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  usedList: {
    paddingBottom: 4,
  },

  // Efectos activos
  effectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  effectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  effectBadgeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  effectBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  effectsCompact: {
    flexDirection: 'row',
    gap: 4,
  },
  effectIcon: {
    fontSize: 16,
  },

  // Compact version
  compactContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  compactList: {
    paddingRight: 12,
  },

  // Todos los jugadores
  allPlayersContainer: {
    flex: 1,
  },
  playerSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  currentPlayerSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  playerCardCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  playerCardCountText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  otherPlayerCards: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  otherPlayerCardIcon: {
    fontSize: 20,
  },
  noCardsText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
