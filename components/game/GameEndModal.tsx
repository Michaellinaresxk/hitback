import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Player } from '@/types/game.types';

const { width, height } = Dimensions.get('window');

interface GameEndModalProps {
  visible: boolean;
  players: Player[];
  gameTimeElapsed: number;
  totalRounds: number;
  onNewGame: () => void;
  onBackToMenu: () => void;
}

interface GameStats {
  winner: Player;
  mvpTokens: Player;
  mvpPowerCards: Player;
  fastestWin: boolean;
  perfectGame: boolean;
  highestScore: number;
  totalTokensSpent: number;
}

export default function GameEndModal({
  visible,
  players,
  gameTimeElapsed,
  totalRounds,
  onNewGame,
  onBackToMenu,
}: GameEndModalProps) {
  const [currentView, setCurrentView] = useState<
    'winner' | 'stats' | 'achievements'
  >('winner');
  const [confettiAnimation] = useState(new Animated.Value(0));

  // Calculate game statistics
  const gameStats: GameStats = {
    winner: players.reduce((max, player) =>
      player.score > max.score ? player : max
    ),
    mvpTokens: players.reduce((max, player) =>
      (player.tokens || 0) > (max.tokens || 0) ? player : max
    ),
    mvpPowerCards: players.reduce((max, player) =>
      (player.powerCards?.length || 0) > (max.powerCards?.length || 0)
        ? player
        : max
    ),
    fastestWin: gameTimeElapsed < 600, // Less than 10 minutes
    perfectGame: players.some((p) => p.score >= 15 && (p.tokens || 0) >= 5),
    highestScore: Math.max(...players.map((p) => p.score)),
    totalTokensSpent: players.reduce(
      (sum, p) => sum + (5 - (p.tokens || 0)),
      0
    ),
  };

  useEffect(() => {
    if (visible) {
      // Start confetti animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderWinnerView = () => (
    <View style={styles.winnerContainer}>
      {/* Confetti Effect */}
      <Animated.View
        style={[
          styles.confetti,
          {
            opacity: confettiAnimation,
            transform: [
              {
                translateY: confettiAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.confettiText}>🎉 🏆 🎉 👑 🎉 🏆 🎉</Text>
      </Animated.View>

      {/* Winner Crown */}
      <View style={styles.winnerCrown}>
        <Text style={styles.crownEmoji}>👑</Text>
      </View>

      {/* Winner Info */}
      <Text style={styles.winnerTitle}>¡GANADOR!</Text>
      <Text style={styles.winnerName}>{gameStats.winner.name}</Text>
      <Text style={styles.winnerScore}>{gameStats.winner.score} puntos</Text>

      {/* Winner Achievements */}
      <View style={styles.winnerAchievements}>
        {gameStats.fastestWin && (
          <View style={styles.achievementBadge}>
            <IconSymbol name='bolt.fill' size={16} color='#F59E0B' />
            <Text style={styles.achievementText}>Victoria Rápida</Text>
          </View>
        )}

        {gameStats.perfectGame && (
          <View style={styles.achievementBadge}>
            <IconSymbol name='star.fill' size={16} color='#F59E0B' />
            <Text style={styles.achievementText}>Juego Perfecto</Text>
          </View>
        )}

        {gameStats.winner.score >= 20 && (
          <View style={styles.achievementBadge}>
            <IconSymbol name='flame.fill' size={16} color='#EF4444' />
            <Text style={styles.achievementText}>Dominación</Text>
          </View>
        )}
      </View>

      {/* Game Summary */}
      <View style={styles.gameSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Duración</Text>
          <Text style={styles.summaryValue}>{formatTime(gameTimeElapsed)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Rondas</Text>
          <Text style={styles.summaryValue}>{totalRounds}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Jugadores</Text>
          <Text style={styles.summaryValue}>{players.length}</Text>
        </View>
      </View>
    </View>
  );

  const renderStatsView = () => (
    <ScrollView
      style={styles.statsContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.statsTitle}>📊 ESTADÍSTICAS FINALES</Text>

      {/* Player Rankings */}
      <View style={styles.rankingsSection}>
        <Text style={styles.sectionTitle}>🏆 RANKING FINAL</Text>
        {players
          .sort((a, b) => b.score - a.score)
          .map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.playerRankItem,
                index === 0 && styles.winnerRankItem,
              ]}
            >
              <View style={styles.rankPosition}>
                <Text style={styles.rankNumber}>
                  {index === 0
                    ? '🥇'
                    : index === 1
                    ? '🥈'
                    : index === 2
                    ? '🥉'
                    : `${index + 1}°`}
                </Text>
              </View>

              <View style={styles.rankPlayerInfo}>
                <Text
                  style={[
                    styles.rankPlayerName,
                    index === 0 && styles.winnerText,
                  ]}
                >
                  {player.name}
                </Text>
                <View style={styles.rankStats}>
                  <Text style={styles.rankStatText}>{player.score} pts</Text>
                  <Text style={styles.rankStatText}>•</Text>
                  <Text style={styles.rankStatText}>
                    {player.tokens || 0} tokens
                  </Text>
                  <Text style={styles.rankStatText}>•</Text>
                  <Text style={styles.rankStatText}>
                    {player.powerCards?.length || 0} poderes
                  </Text>
                </View>
              </View>
            </View>
          ))}
      </View>

      {/* MVP Awards */}
      <View style={styles.mvpSection}>
        <Text style={styles.sectionTitle}>🌟 MVP AWARDS</Text>

        <View style={styles.mvpItem}>
          <View style={styles.mvpIcon}>
            <IconSymbol
              name='bitcoinsign.circle.fill'
              size={24}
              color='#F59E0B'
            />
          </View>
          <View style={styles.mvpInfo}>
            <Text style={styles.mvpTitle}>Rey de los Tokens</Text>
            <Text style={styles.mvpPlayer}>
              {gameStats.mvpTokens.name} • {gameStats.mvpTokens.tokens || 0}{' '}
              tokens
            </Text>
          </View>
        </View>

        <View style={styles.mvpItem}>
          <View style={styles.mvpIcon}>
            <IconSymbol name='sparkles' size={24} color='#8B5CF6' />
          </View>
          <View style={styles.mvpInfo}>
            <Text style={styles.mvpTitle}>Maestro de Poderes</Text>
            <Text style={styles.mvpPlayer}>
              {gameStats.mvpPowerCards.name} •{' '}
              {gameStats.mvpPowerCards.powerCards?.length || 0} poderes
            </Text>
          </View>
        </View>

        <View style={styles.mvpItem}>
          <View style={styles.mvpIcon}>
            <IconSymbol name='chart.bar.fill' size={24} color='#10B981' />
          </View>
          <View style={styles.mvpInfo}>
            <Text style={styles.mvpTitle}>Puntuación Máxima</Text>
            <Text style={styles.mvpPlayer}>
              {gameStats.winner.name} • {gameStats.highestScore} puntos
            </Text>
          </View>
        </View>
      </View>

      {/* Game Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>📈 MÉTRICAS DEL JUEGO</Text>

        <View style={styles.metricGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {formatTime(gameTimeElapsed)}
            </Text>
            <Text style={styles.metricLabel}>Duración</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{totalRounds}</Text>
            <Text style={styles.metricLabel}>Rondas</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{gameStats.totalTokensSpent}</Text>
            <Text style={styles.metricLabel}>Tokens Gastados</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {Math.round((gameStats.highestScore / totalRounds) * 10) / 10}
            </Text>
            <Text style={styles.metricLabel}>Pts/Ronda</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderAchievementsView = () => {
    const achievements = [
      {
        id: 'first_win',
        name: 'Primera Victoria',
        description: '¡Tu primera partida ganada!',
        emoji: '🎉',
        unlocked: true,
      },
      {
        id: 'speed_demon',
        name: 'Demonio de Velocidad',
        description: 'Ganar en menos de 10 minutos',
        emoji: '⚡',
        unlocked: gameStats.fastestWin,
      },
      {
        id: 'perfect_game',
        name: 'Juego Perfecto',
        description: 'Ganar sin perder tokens',
        emoji: '⭐',
        unlocked: gameStats.perfectGame,
      },
      {
        id: 'domination',
        name: 'Dominación Total',
        description: 'Conseguir 20+ puntos',
        emoji: '🔥',
        unlocked: gameStats.highestScore >= 20,
      },
      {
        id: 'token_master',
        name: 'Maestro de Tokens',
        description: 'Terminar con 5+ tokens',
        emoji: '🪙',
        unlocked: gameStats.mvpTokens.tokens >= 5,
      },
      {
        id: 'power_collector',
        name: 'Coleccionista de Poderes',
        description: 'Conseguir 5+ cartas de poder',
        emoji: '✨',
        unlocked: (gameStats.mvpPowerCards.powerCards?.length || 0) >= 5,
      },
    ];

    return (
      <ScrollView
        style={styles.achievementsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.achievementsTitle}>🏅 LOGROS DESBLOQUEADOS</Text>

        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.achievementItem,
              achievement.unlocked && styles.unlockedAchievement,
            ]}
          >
            <View style={styles.achievementIcon}>
              <Text
                style={[
                  styles.achievementEmoji,
                  !achievement.unlocked && styles.lockedEmoji,
                ]}
              >
                {achievement.unlocked ? achievement.emoji : '🔒'}
              </Text>
            </View>

            <View style={styles.achievementInfo}>
              <Text
                style={[
                  styles.achievementName,
                  achievement.unlocked && styles.unlockedText,
                ]}
              >
                {achievement.name}
              </Text>
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>
            </View>

            {achievement.unlocked && (
              <View style={styles.unlockedBadge}>
                <IconSymbol
                  name='checkmark.circle.fill'
                  size={20}
                  color='#10B981'
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='fullScreen'
    >
      <View style={styles.container}>
        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, currentView === 'winner' && styles.activeTab]}
            onPress={() => setCurrentView('winner')}
          >
            <IconSymbol
              name='crown.fill'
              size={20}
              color={currentView === 'winner' ? '#F59E0B' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                currentView === 'winner' && styles.activeTabText,
              ]}
            >
              Ganador
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentView === 'stats' && styles.activeTab]}
            onPress={() => setCurrentView('stats')}
          >
            <IconSymbol
              name='chart.bar.fill'
              size={20}
              color={currentView === 'stats' ? '#F59E0B' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                currentView === 'stats' && styles.activeTabText,
              ]}
            >
              Estadísticas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              currentView === 'achievements' && styles.activeTab,
            ]}
            onPress={() => setCurrentView('achievements')}
          >
            <IconSymbol
              name='medal.fill'
              size={20}
              color={currentView === 'achievements' ? '#F59E0B' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                currentView === 'achievements' && styles.activeTabText,
              ]}
            >
              Logros
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {currentView === 'winner' && renderWinnerView()}
          {currentView === 'stats' && renderStatsView()}
          {currentView === 'achievements' && renderAchievementsView()}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.newGameButton}
            onPress={onNewGame}
            activeOpacity={0.8}
          >
            <IconSymbol name='arrow.clockwise' size={20} color='#FFFFFF' />
            <Text style={styles.newGameText}>Nueva Partida</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={onBackToMenu}
            activeOpacity={0.8}
          >
            <IconSymbol name='house.fill' size={20} color='#64748B' />
            <Text style={styles.menuText}>Menú Principal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#F59E0B',
  },
  content: {
    flex: 1,
  },

  // Winner View
  winnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confetti: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  confettiText: {
    fontSize: 32,
    letterSpacing: 4,
  },
  winnerCrown: {
    marginBottom: 20,
  },
  crownEmoji: {
    fontSize: 80,
  },
  winnerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F59E0B',
    marginBottom: 8,
    letterSpacing: 2,
  },
  winnerName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  winnerScore: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 32,
  },
  winnerAchievements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  achievementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  gameSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    color: '#F8FAFC',
    fontWeight: '700',
  },

  // Stats View
  statsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  rankingsSection: {
    marginBottom: 32,
  },
  playerRankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  winnerRankItem: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  rankPosition: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  rankPlayerInfo: {
    flex: 1,
  },
  rankPlayerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  winnerText: {
    color: '#F59E0B',
  },
  rankStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankStatText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  mvpSection: {
    marginBottom: 32,
  },
  mvpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  mvpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mvpInfo: {
    flex: 1,
  },
  mvpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  mvpPlayer: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  metricsSection: {
    marginBottom: 32,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Achievements View
  achievementsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  achievementsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginVertical: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    opacity: 0.6,
  },
  unlockedAchievement: {
    opacity: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  lockedEmoji: {
    opacity: 0.5,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  unlockedText: {
    color: '#F8FAFC',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  unlockedBadge: {
    marginLeft: 8,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  newGameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
  },
  newGameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  menuButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
});
