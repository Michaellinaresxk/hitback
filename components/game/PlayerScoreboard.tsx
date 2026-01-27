// components/game/PlayerScoreboard.tsx - HITBACK Player Scoreboard
// ✅ Muestra puntos, tokens y estado de jugadores
// ✅ Se actualiza automáticamente cuando cambia el gameStore
// ✅ ACTUALIZADO: Muestra PowerCards del inventario con opción de usar

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SCORE_TO_WIN } from '@/constants/Points';
import type { Player } from '@/store/gameStore';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface PlayerScoreboardProps {
  players: Player[];
  showDetailedStats?: boolean;
  highlightWinner?: boolean;
  compact?: boolean;
  // ✅ NUEVAS PROPS para PowerCards
  onUsePowerCard?: (playerId: string, cardId: string) => void;
  canUsePowerCards?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function PlayerScoreboard({
  players,
  showDetailedStats = false,
  highlightWinner = false,
  compact = false,
  onUsePowerCard,
  canUsePowerCards = true,
}: PlayerScoreboardProps) {
  // Ordenar jugadores por puntuación (mayor a menor)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Determinar el líder
  const leader = sortedPlayers[0];
  const isGameWon = leader && leader.score >= SCORE_TO_WIN;

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getPositionStyle = (index: number) => {
    switch (index) {
      case 0:
        return styles.firstPlace;
      case 1:
        return styles.secondPlace;
      case 2:
        return styles.thirdPlace;
      default:
        return styles.otherPlace;
    }
  };

  const getPositionIcon = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${index + 1}`;
    }
  };

  const getProgressPercentage = (score: number) => {
    return Math.min((score / SCORE_TO_WIN) * 100, 100);
  };

  // ✅ NUEVO: Helper para obtener PowerCards disponibles
  const getAvailablePowerCards = (player: Player) => {
    if (!player.powerCards || player.powerCards.length === 0) return [];
    return player.powerCards.filter(
      (card) => card.currentUses < card.usageLimit,
    );
  };

  // ✅ NUEVO: Handler para usar PowerCard
  const handleUsePowerCard = (playerId: string, cardId: string) => {
    if (onUsePowerCard && canUsePowerCards) {
      onUsePowerCard(playerId, cardId);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Modo Compacto
  // ═══════════════════════════════════════════════════════════════════════════

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sortedPlayers.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.compactCard,
                player.isCurrentTurn && styles.compactCardActive,
                index === 0 && styles.compactCardLeader,
              ]}
            >
              <Text style={styles.compactPosition}>
                {getPositionIcon(index)}
              </Text>
              <Text style={styles.compactName} numberOfLines={1}>
                {player.name}
              </Text>
              <Text style={styles.compactScore}>{player.score}</Text>
              {/* ✅ NUEVO: Indicador de PowerCards en modo compacto */}
              {getAvailablePowerCards(player).length > 0 && (
                <Text style={styles.compactPowerCard}>
                  ⚡{getAvailablePowerCards(player).length}
                </Text>
              )}
              {/* ✅ NUEVO: Indicador de boost activo */}
              {player.boostActive && (
                <View style={styles.compactBoostBadge}>
                  <Text style={styles.compactBoostText}>x2</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Modo Normal
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Puntuaciones</Text>
        <Text style={styles.headerSubtitle}>Meta: {SCORE_TO_WIN} puntos</Text>
      </View>

      {/* Lista de Jugadores */}
      <View style={styles.playersList}>
        {sortedPlayers.map((player, index) => {
          const availablePowerCards = getAvailablePowerCards(player);
          const hasPowerCards = availablePowerCards.length > 0;

          return (
            <View
              key={player.id}
              style={[
                styles.playerCard,
                getPositionStyle(index),
                player.isCurrentTurn && styles.playerCardActive,
                highlightWinner &&
                  isGameWon &&
                  index === 0 &&
                  styles.playerCardWinner,
              ]}
            >
              {/* Posición */}
              <View style={styles.positionContainer}>
                <Text style={styles.positionText}>
                  {getPositionIcon(index)}
                </Text>
              </View>

              {/* Info del Jugador */}
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <Text
                    style={[
                      styles.playerName,
                      player.isCurrentTurn && styles.playerNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {player.name}
                  </Text>
                  {player.isCurrentTurn && (
                    <View style={styles.turnIndicator}>
                      <Text style={styles.turnText}>TURNO</Text>
                    </View>
                  )}
                  {/* ✅ NUEVO: Badge de boost activo */}
                  {player.boostActive && (
                    <View style={styles.boostBadge}>
                      <Text style={styles.boostBadgeText}>⚡x2</Text>
                    </View>
                  )}
                </View>

                {/* Barra de Progreso */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${getProgressPercentage(player.score)}%` },
                      index === 0 && styles.progressBarLeader,
                    ]}
                  />
                </View>

                {/* Stats Detallados */}
                {showDetailedStats && (
                  <View style={styles.detailedStats}>
                    <View style={styles.statItem}>
                      <IconSymbol name='flame.fill' size={12} color='#F59E0B' />
                      <Text style={styles.statText}>
                        {player.consecutiveWins || 0} racha
                      </Text>
                    </View>
                    {player.currentBet > 0 && (
                      <View style={styles.statItem}>
                        <IconSymbol
                          name='dice.fill'
                          size={12}
                          color='#EF4444'
                        />
                        <Text style={styles.statText}>
                          Apuesta: {player.currentBet}
                        </Text>
                      </View>
                    )}
                    {/* ✅ NUEVO: Indicador de PowerCards disponibles */}
                    {hasPowerCards && (
                      <View style={styles.statItem}>
                        <Text style={styles.statText}>
                          ⚡ {availablePowerCards.length} carta
                          {availablePowerCards.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* ✅ NUEVO: PowerCards Section */}
                {hasPowerCards && (
                  <View style={styles.powerCardsSection}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.powerCardsList}
                    >
                      {availablePowerCards.map((card) => (
                        <TouchableOpacity
                          key={card.id}
                          style={[
                            styles.powerCardMini,
                            card.isActive && styles.powerCardActive,
                            !canUsePowerCards && styles.powerCardDisabled,
                          ]}
                          onPress={() => handleUsePowerCard(player.id, card.id)}
                          disabled={!canUsePowerCards || card.isActive}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.powerCardEmoji}>
                            {card.emoji || card.icon || '⚡'}
                          </Text>
                          <Text style={styles.powerCardName} numberOfLines={1}>
                            {card.name}
                          </Text>
                          {card.isActive && (
                            <View style={styles.activeIndicator}>
                              <Text style={styles.activeText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Score y Tokens */}
              <View style={styles.scoreContainer}>
                {/* Puntuación */}
                <View style={styles.scoreBox}>
                  <Text
                    style={[
                      styles.scoreValue,
                      index === 0 && styles.scoreValueLeader,
                    ]}
                  >
                    {player.score}
                  </Text>
                  <Text style={styles.scoreLabel}>pts</Text>
                </View>

                {/* Tokens */}
                <View style={styles.tokensBox}>
                  <IconSymbol
                    name='bitcoinsign.circle.fill'
                    size={16}
                    color='#F59E0B'
                  />
                  <Text style={styles.tokensValue}>
                    {player.availableTokens?.length || player.tokens || 0}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Footer con info del ganador */}
      {highlightWinner && isGameWon && (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerText}>
            🎉 ¡{leader.name} GANA LA PARTIDA! 🎉
          </Text>
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Container
  container: {
    margin: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Players List
  playersList: {
    gap: 10,
  },

  // Player Card
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  playerCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  playerCardWinner: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },

  // Position Styles
  firstPlace: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  secondPlace: {
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
  },
  thirdPlace: {
    borderColor: 'rgba(180, 83, 9, 0.3)',
    backgroundColor: 'rgba(180, 83, 9, 0.05)',
  },
  otherPlace: {},

  // Position Container
  positionContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 16,
  },

  // Player Info
  playerInfo: {
    flex: 1,
    marginRight: 12,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  playerNameActive: {
    color: '#60A5FA',
  },
  turnIndicator: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  turnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ✅ NUEVO: Boost Badge
  boostBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  boostBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },

  // Progress Bar
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressBarLeader: {
    backgroundColor: '#F59E0B',
  },

  // Detailed Stats
  detailedStats: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // ✅ NUEVO: PowerCards Section
  powerCardsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  powerCardsList: {
    flexDirection: 'row',
  },
  powerCardMini: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  powerCardActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: '#00FF88',
  },
  powerCardDisabled: {
    opacity: 0.5,
  },
  powerCardEmoji: {
    fontSize: 14,
  },
  powerCardName: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
    maxWidth: 60,
  },
  activeIndicator: {
    backgroundColor: '#00FF88',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  activeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },

  // Score Container
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  scoreValueLeader: {
    color: '#F59E0B',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 2,
    fontWeight: '500',
  },
  tokensBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tokensValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },

  // Winner Banner
  winnerBanner: {
    marginTop: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  winnerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    textAlign: 'center',
  },

  // Compact Mode
  compactContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  compactCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  compactCardLeader: {
    borderColor: '#F59E0B',
  },
  compactPosition: {
    fontSize: 14,
  },
  compactName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    maxWidth: 80,
  },
  compactScore: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F59E0B',
  },
  // ✅ NUEVO: Compact PowerCard indicator
  compactPowerCard: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  compactBoostBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactBoostText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
});
