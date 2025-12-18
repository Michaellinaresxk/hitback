// components/game/PlayerScoreboard.tsx - HITBACK Player Scoreboard
// ✅ Muestra puntos, tokens y estado de jugadores
// ✅ Se actualiza automáticamente cuando cambia el gameStore

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function PlayerScoreboard({
  players,
  showDetailedStats = false,
  highlightWinner = false,
  compact = false,
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
        {sortedPlayers.map((player, index) => (
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
              <Text style={styles.positionText}>{getPositionIcon(index)}</Text>
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
                      <IconSymbol name='dice.fill' size={12} color='#EF4444' />
                      <Text style={styles.statText}>
                        Apuesta: {player.currentBet}
                      </Text>
                    </View>
                  )}
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
                <Text style={styles.tokensValue}>{player.tokens}</Text>
              </View>
            </View>
          </View>
        ))}
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
    marginLeft: 8,
  },
  turnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
});
