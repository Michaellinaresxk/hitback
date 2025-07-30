// components/PlayerScoreboard.tsx - 📊 SCOREBOARD DE JUGADORES
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

interface PlayerScoreboardProps {
  players: any[];
  showDetailedStats?: boolean;
  highlightWinner?: boolean;
}

export default function PlayerScoreboard({
  players,
  showDetailedStats = false,
  highlightWinner = false,
}: PlayerScoreboardProps) {
  const getPositionEmoji = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${position}°`;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return '#F59E0B';
      case 2:
        return '#94A3B8';
      case 3:
        return '#CD7F32';
      default:
        return '#64748B';
    }
  };

  const renderPlayer = ({
    item: player,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const position = index + 1;
    const isWinner = highlightWinner && position === 1 && player.score >= 15;
    const isCurrentTurn = player.isCurrentTurn;

    return (
      <View
        style={[
          styles.playerCard,
          isCurrentTurn && styles.currentTurnCard,
          isWinner && styles.winnerCard,
          { borderLeftColor: getPositionColor(position) },
        ]}
      >
        {/* Position */}
        <View style={styles.positionContainer}>
          <Text style={styles.positionEmoji}>{getPositionEmoji(position)}</Text>
        </View>

        {/* Player Info */}
        <View style={styles.playerInfo}>
          <View style={styles.playerHeader}>
            <Text
              style={[
                styles.playerName,
                isCurrentTurn && styles.currentTurnName,
                isWinner && styles.winnerName,
              ]}
            >
              {player.name}
            </Text>
            {isCurrentTurn && (
              <View style={styles.currentTurnBadge}>
                <Text style={styles.currentTurnText}>Tu turno</Text>
              </View>
            )}
            {isWinner && (
              <View style={styles.winnerBadge}>
                <IconSymbol name='crown.fill' size={16} color='#F59E0B' />
              </View>
            )}
          </View>

          {/* Score */}
          <Text
            style={[styles.playerScore, { color: getPositionColor(position) }]}
          >
            {player.score} punto{player.score !== 1 ? 's' : ''}
          </Text>

          {/* Detailed Stats */}
          {showDetailedStats && (
            <View style={styles.detailedStats}>
              <View style={styles.statItem}>
                <IconSymbol
                  name='bitcoinsign.circle.fill'
                  size={12}
                  color='#F59E0B'
                />
                <Text style={styles.statText}>{player.tokens}</Text>
              </View>

              <View style={styles.statItem}>
                <IconSymbol name='sparkles' size={12} color='#8B5CF6' />
                <Text style={styles.statText}>
                  {player.powerCards?.filter(
                    (pc: any) => pc.currentUses < pc.usageLimit
                  )?.length || 0}
                </Text>
              </View>

              {player.consecutiveWins > 0 && (
                <View style={styles.statItem}>
                  <IconSymbol name='flame.fill' size={12} color='#EF4444' />
                  <Text style={styles.statText}>{player.consecutiveWins}</Text>
                </View>
              )}

              {player.currentBet > 0 && (
                <View style={styles.betBadge}>
                  <IconSymbol name='dice.fill' size={10} color='#FFFFFF' />
                  <Text style={styles.betText}>{player.currentBet}</Text>
                </View>
              )}
            </View>
          )}

          {/* Active Effects */}
          <View style={styles.activeEffects}>
            {player.isImmune && (
              <View style={styles.effectBadge}>
                <Text style={styles.effectText}>🛡️</Text>
              </View>
            )}
            {player.boostActive && (
              <View style={styles.effectBadge}>
                <Text style={styles.effectText}>⚡</Text>
              </View>
            )}
            {player.peekUsed && (
              <View style={styles.effectBadge}>
                <Text style={styles.effectText}>👁️</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress to Victory */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((player.score / 15) * 100, 100)}%`,
                  backgroundColor: getPositionColor(position),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.max(15 - player.score, 0)} pts restantes
          </Text>
        </View>
      </View>
    );
  };

  if (players.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name='person.3' size={32} color='#64748B' />
        <Text style={styles.emptyText}>No hay jugadores</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Clasificación</Text>
        <Text style={styles.subtitle}>
          {players.length} jugador{players.length !== 1 ? 'es' : ''}
        </Text>
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        style={styles.playersList}
        showsVerticalScrollIndicator={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  playersList: {
    maxHeight: 300,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    borderLeftWidth: 4,
  },
  currentTurnCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderLeftColor: '#10B981',
  },
  winnerCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftColor: '#F59E0B',
  },
  positionContainer: {
    marginRight: 16,
    alignItems: 'center',
    minWidth: 32,
  },
  positionEmoji: {
    fontSize: 20,
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  currentTurnName: {
    color: '#10B981',
    fontWeight: '700',
  },
  winnerName: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  currentTurnBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  currentTurnText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  winnerBadge: {
    marginLeft: 8,
  },
  playerScore: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailedStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statText: {
    fontSize: 10,
    color: '#E2E8F0',
    marginLeft: 2,
    fontWeight: '600',
  },
  betBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  betText: {
    fontSize: 8,
    color: '#FFFFFF',
    marginLeft: 2,
    fontWeight: '700',
  },
  activeEffects: {
    flexDirection: 'row',
    gap: 4,
  },
  effectBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  effectText: {
    fontSize: 8,
  },
  progressContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 8,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
});
