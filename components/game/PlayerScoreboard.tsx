import { IconSymbol } from '@/components/ui/IconSymbol';
import { Player } from '@/types/game.types';
import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PlayerScoreboardProps {
  players: Player[];
  currentTurn?: number;
  onPlayerSelect?: (playerId: string) => void;
  showDetailedStats?: boolean;
  highlightWinner?: boolean;
}

export default function PlayerScoreboard({
  players,
  currentTurn = 0,
  onPlayerSelect,
  showDetailedStats = true,
  highlightWinner = false,
}: PlayerScoreboardProps) {
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = highlightWinner ? sortedPlayers[0] : null;

  const renderPlayer = ({
    item: player,
    index,
  }: {
    item: Player;
    index: number;
  }) => {
    const isCurrentTurn = player.isCurrentTurn;
    const isWinner =
      highlightWinner && player.id === winner?.id && player.score >= 15;
    const position = index + 1;

    const getPositionEmoji = (pos: number) => {
      if (pos === 1) return '🥇';
      if (pos === 2) return '🥈';
      if (pos === 3) return '🥉';
      return `${pos}°`;
    };

    const getPositionColor = (pos: number) => {
      if (pos === 1) return '#F59E0B';
      if (pos === 2) return '#94A3B8';
      if (pos === 3) return '#CD7F32';
      return '#64748B';
    };

    return (
      <TouchableOpacity
        style={[
          styles.playerCard,
          isCurrentTurn && styles.currentTurnCard,
          isWinner && styles.winnerCard,
        ]}
        onPress={() => onPlayerSelect?.(player.id)}
        activeOpacity={onPlayerSelect ? 0.8 : 1}
        disabled={!onPlayerSelect}
      >
        {/* Position & Status */}
        <View style={styles.playerLeft}>
          <View
            style={[
              styles.positionBadge,
              { backgroundColor: getPositionColor(position) },
            ]}
          >
            <Text style={styles.positionText}>
              {typeof getPositionEmoji(position) === 'string' &&
              getPositionEmoji(position).length === 2
                ? getPositionEmoji(position)
                : position}
            </Text>
          </View>

          {isCurrentTurn && (
            <View style={styles.turnIndicator}>
              <IconSymbol name='play.fill' size={12} color='#10B981' />
            </View>
          )}
        </View>

        {/* Player Info */}
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, isWinner && styles.winnerName]}>
            {player.name}
            {isWinner && ' 👑'}
          </Text>

          <View style={styles.playerStats}>
            <View style={styles.statItem}>
              <IconSymbol name='trophy.fill' size={14} color='#F59E0B' />
              <Text style={styles.statText}>{player.score} pts</Text>
            </View>

            {showDetailedStats && (
              <>
                <View style={styles.statItem}>
                  <IconSymbol
                    name='bitcoinsign.circle.fill'
                    size={14}
                    color='#F59E0B'
                  />
                  <Text style={styles.statText}>{player.tokens || 0}</Text>
                </View>

                <View style={styles.statItem}>
                  <IconSymbol name='sparkles' size={14} color='#8B5CF6' />
                  <Text style={styles.statText}>
                    {player.powerCards?.length || 0}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Status Indicators */}
          {showDetailedStats && (
            <View style={styles.statusIndicators}>
              {player.currentBet && player.currentBet > 0 && (
                <View style={styles.statusBadge}>
                  <IconSymbol name='dice.fill' size={10} color='#EF4444' />
                  <Text style={styles.statusText}>
                    Bet: {player.currentBet}
                  </Text>
                </View>
              )}

              {player.isImmune && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
                  ]}
                >
                  <IconSymbol name='shield.fill' size={10} color='#F59E0B' />
                  <Text style={styles.statusText}>Shield</Text>
                </View>
              )}

              {player.boostActive && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: 'rgba(139, 92, 246, 0.2)' },
                  ]}
                >
                  <IconSymbol name='bolt.fill' size={10} color='#8B5CF6' />
                  <Text style={styles.statusText}>Boost</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Score Display */}
        <View style={styles.scoreDisplay}>
          <Text style={[styles.scoreText, isWinner && styles.winnerScore]}>
            {player.score}
          </Text>
          <Text style={styles.scoreLabel}>pts</Text>

          {player.score >= 15 && (
            <View style={styles.winBadge}>
              <IconSymbol name='crown.fill' size={12} color='#F59E0B' />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>🏆 LEADERBOARD</Text>
      <Text style={styles.headerSubtitle}>
        {players.length} jugador{players.length !== 1 ? 'es' : ''}
        {highlightWinner &&
          winner &&
          winner.score >= 15 &&
          ' • JUEGO TERMINADO'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!showDetailedStats) return null;

    const totalTokens = players.reduce((sum, p) => sum + (p.tokens || 0), 0);
    const totalPowerCards = players.reduce(
      (sum, p) => sum + (p.powerCards?.length || 0),
      0
    );
    const currentPlayer = players.find((p) => p.isCurrentTurn);

    return (
      <View style={styles.footer}>
        <View style={styles.gameStats}>
          <View style={styles.statItem}>
            <IconSymbol
              name='bitcoinsign.circle.fill'
              size={16}
              color='#F59E0B'
            />
            <Text style={styles.footerStatText}>
              Total: {totalTokens} tokens
            </Text>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name='sparkles' size={16} color='#8B5CF6' />
            <Text style={styles.footerStatText}>
              Total: {totalPowerCards} poderes
            </Text>
          </View>
        </View>

        {currentPlayer && (
          <View style={styles.currentTurnInfo}>
            <Text style={styles.currentTurnText}>
              🎯 Turno de:{' '}
              <Text style={styles.currentPlayerName}>{currentPlayer.name}</Text>
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (players.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name='person.3' size={48} color='#64748B' />
        <Text style={styles.emptyText}>No hay jugadores</Text>
        <Text style={styles.emptySubtext}>Agrega jugadores para empezar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedPlayers}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentTurnCard: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  winnerCard: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  turnIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  winnerName: {
    color: '#F59E0B',
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginLeft: 4,
  },
  statusIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#E2E8F0',
    marginLeft: 2,
  },
  scoreDisplay: {
    alignItems: 'center',
    position: 'relative',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6',
  },
  winnerScore: {
    color: '#F59E0B',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  winBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F59E0B',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  footerStatText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
    marginLeft: 6,
  },
  currentTurnInfo: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },
  currentTurnText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  currentPlayerName: {
    color: '#10B981',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    opacity: 0.8,
  },
});
