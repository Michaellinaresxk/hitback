// components/GameEndModal.tsx - 🏁 MODAL DE FINAL DE JUEGO
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface GameEndModalProps {
  visible: boolean;
  players: any[];
  gameTimeElapsed: number;
  totalRounds: number;
  onNewGame: () => void;
  onBackToMenu: () => void;
}

export default function GameEndModal({
  visible,
  players,
  gameTimeElapsed,
  totalRounds,
  onNewGame,
  onBackToMenu,
}: GameEndModalProps) {
  const winner = players.length > 0 ? players[0] : null;
  const topThree = players.slice(0, 3);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

    return (
      <View
        style={[
          styles.playerItem,
          { borderLeftColor: getPositionColor(position) },
        ]}
      >
        <View style={styles.positionContainer}>
          <Text style={styles.positionEmoji}>{getPositionEmoji(position)}</Text>
          <Text
            style={[styles.positionText, { color: getPositionColor(position) }]}
          >
            {position}°
          </Text>
        </View>

        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <View style={styles.playerStats}>
            <Text style={styles.playerScore}>{player.score} puntos</Text>
            <Text style={styles.playerTokens}>{player.tokens} tokens</Text>
            <Text style={styles.playerPowers}>
              {player.powerCards?.length || 0} poderes
            </Text>
          </View>
        </View>

        {position === 1 && (
          <View style={styles.winnerBadge}>
            <IconSymbol name='crown.fill' size={24} color='#F59E0B' />
          </View>
        )}
      </View>
    );
  };

  const gameStats = {
    mostTokens: players.reduce((max, p) => (p.tokens > max.tokens ? p : max), {
      tokens: 0,
    }),
    mostPowerCards: players.reduce(
      (max, p) =>
        (p.powerCards?.length || 0) > (max.powerCards?.length || 0) ? p : max,
      { powerCards: [] }
    ),
    highestStreak: players.reduce(
      (max, p) => (p.consecutiveWins > max.consecutiveWins ? p : max),
      { consecutiveWins: 0 }
    ),
  };

  return (
    <Modal visible={visible} animationType='fade' transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🏁 ¡JUEGO TERMINADO!</Text>
            {winner && (
              <Text style={styles.winnerText}>
                🎉 ¡{winner.name} es el ganador!
              </Text>
            )}
          </View>

          {/* Game Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <IconSymbol name='clock' size={16} color='#3B82F6' />
              <Text style={styles.summaryText}>
                {formatTime(gameTimeElapsed)} jugados
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <IconSymbol
                name='arrow.triangle.2.circlepath'
                size={16}
                color='#10B981'
              />
              <Text style={styles.summaryText}>{totalRounds} rondas</Text>
            </View>
            <View style={styles.summaryItem}>
              <IconSymbol name='person.3' size={16} color='#8B5CF6' />
              <Text style={styles.summaryText}>{players.length} jugadores</Text>
            </View>
          </View>

          {/* Top 3 Podium */}
          {topThree.length >= 3 && (
            <View style={styles.podiumContainer}>
              <View style={styles.podiumTitle}>
                <Text style={styles.podiumTitleText}>🏆 PODIUM</Text>
              </View>
              <View style={styles.podium}>
                {/* 2nd Place */}
                <View style={[styles.podiumPlace, styles.secondPlace]}>
                  <Text style={styles.podiumEmoji}>🥈</Text>
                  <Text style={styles.podiumName}>{topThree[1]?.name}</Text>
                  <Text style={styles.podiumScore}>{topThree[1]?.score}</Text>
                </View>

                {/* 1st Place */}
                <View style={[styles.podiumPlace, styles.firstPlace]}>
                  <Text style={styles.podiumEmoji}>🥇</Text>
                  <Text style={styles.podiumName}>{topThree[0]?.name}</Text>
                  <Text style={styles.podiumScore}>{topThree[0]?.score}</Text>
                </View>

                {/* 3rd Place */}
                <View style={[styles.podiumPlace, styles.thirdPlace]}>
                  <Text style={styles.podiumEmoji}>🥉</Text>
                  <Text style={styles.podiumName}>{topThree[2]?.name}</Text>
                  <Text style={styles.podiumScore}>{topThree[2]?.score}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Final Rankings */}
          <View style={styles.rankingsContainer}>
            <Text style={styles.rankingsTitle}>📊 CLASIFICACIÓN FINAL</Text>
            <FlatList
              data={players}
              keyExtractor={(item) => item.id}
              renderItem={renderPlayer}
              style={styles.rankingsList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Awards */}
          <View style={styles.awardsContainer}>
            <Text style={styles.awardsTitle}>🏅 RECONOCIMIENTOS</Text>
            <View style={styles.awardsGrid}>
              <View style={styles.awardItem}>
                <Text style={styles.awardEmoji}>👑</Text>
                <Text style={styles.awardLabel}>Campeón</Text>
                <Text style={styles.awardValue}>{winner?.name}</Text>
              </View>
              <View style={styles.awardItem}>
                <Text style={styles.awardEmoji}>💰</Text>
                <Text style={styles.awardLabel}>Rey de Tokens</Text>
                <Text style={styles.awardValue}>
                  {gameStats.mostTokens.name}
                </Text>
              </View>
              <View style={styles.awardItem}>
                <Text style={styles.awardEmoji}>⚡</Text>
                <Text style={styles.awardLabel}>Maestro de Poderes</Text>
                <Text style={styles.awardValue}>
                  {gameStats.mostPowerCards.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.newGameButton}
              onPress={onNewGame}
              activeOpacity={0.8}
            >
              <IconSymbol name='play.circle.fill' size={20} color='#FFFFFF' />
              <Text style={styles.newGameText}>Nueva Partida</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={onBackToMenu}
              activeOpacity={0.8}
            >
              <IconSymbol name='house' size={20} color='#FFFFFF' />
              <Text style={styles.menuText}>Menú Principal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1E293B',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    maxHeight: '90%',
    width: '95%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  winnerText: {
    fontSize: 18,
    color: '#F59E0B',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 4,
    fontWeight: '600',
  },
  podiumContainer: {
    marginBottom: 24,
  },
  podiumTitle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  podiumTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 120,
  },
  podiumPlace: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  firstPlace: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    height: 100,
    justifyContent: 'flex-end',
  },
  secondPlace: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    height: 80,
    justifyContent: 'flex-end',
  },
  thirdPlace: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    height: 60,
    justifyContent: 'flex-end',
  },
  podiumEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  rankingsContainer: {
    marginBottom: 20,
  },
  rankingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
  },
  rankingsList: {
    maxHeight: 200,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  positionContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  positionEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  positionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  playerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  playerScore: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  playerTokens: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  playerPowers: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  winnerBadge: {
    marginLeft: 12,
  },
  awardsContainer: {
    marginBottom: 24,
  },
  awardsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
  },
  awardsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  awardItem: {
    alignItems: 'center',
    flex: 1,
  },
  awardEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  awardLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
    textAlign: 'center',
  },
  awardValue: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  newGameButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  newGameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  menuButton: {
    flex: 1,
    backgroundColor: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
