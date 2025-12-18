// components/game/PlayerScoreboard.tsx
// ✅ Muestra puntos desde el backend (gameSessionService)
// ✅ Se actualiza después de cada revealAnswer

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  gameSessionService,
  SessionPlayer,
} from '@/services/GameSessionService';

interface PlayerScoreboardProps {
  // Opcionalmente recibir jugadores locales
  localPlayers?: any[];
  // O usar los del backend
  useBackendPlayers?: boolean;
  // Resaltar al jugador actual
  currentPlayerId?: string;
  // Callback cuando se actualizan los jugadores
  onPlayersUpdated?: (players: SessionPlayer[]) => void;
}

export default function PlayerScoreboard({
  localPlayers,
  useBackendPlayers = true,
  currentPlayerId,
  onPlayersUpdated,
}: PlayerScoreboardProps) {
  const [backendPlayers, setBackendPlayers] = useState<SessionPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar jugadores del backend
  const fetchPlayers = async () => {
    if (!useBackendPlayers) return;

    try {
      setLoading(true);
      const status = await gameSessionService.getStatus();

      if (status.success && status.session?.players) {
        const sortedPlayers = [...status.session.players].sort(
          (a, b) => b.score - a.score
        );
        setBackendPlayers(sortedPlayers);
        onPlayersUpdated?.(sortedPlayers);
      }
    } catch (error) {
      console.error('Failed to fetch players:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar
  useEffect(() => {
    if (useBackendPlayers) {
      fetchPlayers();
    }
  }, [useBackendPlayers]);

  // Usar jugadores del backend o locales
  const players = useBackendPlayers ? backendPlayers : localPlayers || [];

  // Ordenar por puntaje
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getMedalEmoji = (index: number): string => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${index + 1}.`;
    }
  };

  const getPositionColor = (index: number): string => {
    switch (index) {
      case 0:
        return '#FFD700'; // Gold
      case 1:
        return '#C0C0C0'; // Silver
      case 2:
        return '#CD7F32'; // Bronze
      default:
        return '#64748B';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🏆 LEADERBOARD</Text>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (players.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🏆 LEADERBOARD</Text>
        <Text style={styles.emptyText}>No hay jugadores</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 LEADERBOARD</Text>
        {useBackendPlayers && (
          <Text style={styles.refreshHint} onPress={fetchPlayers}>
            🔄
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.playersList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {sortedPlayers.map((player, index) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const isWinning = index === 0 && player.score > 0;

          return (
            <View
              key={player.id}
              style={[
                styles.playerRow,
                isCurrentPlayer && styles.currentPlayerRow,
                isWinning && styles.winningPlayerRow,
              ]}
            >
              {/* Posición */}
              <Text
                style={[styles.position, { color: getPositionColor(index) }]}
              >
                {getMedalEmoji(index)}
              </Text>

              {/* Info del jugador */}
              <View style={styles.playerInfo}>
                <Text
                  style={[
                    styles.playerName,
                    isCurrentPlayer && styles.currentPlayerName,
                  ]}
                >
                  {player.name}
                  {isCurrentPlayer && ' 👈'}
                </Text>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <Text style={styles.tokenCount}>🪙 {player.tokens}</Text>
                  {player.stats && (
                    <Text style={styles.correctCount}>
                      ✓ {player.stats.correctAnswers || 0}
                    </Text>
                  )}
                </View>
              </View>

              {/* Puntuación */}
              <View style={styles.scoreContainer}>
                <Text style={[styles.score, isWinning && styles.winningScore]}>
                  {player.score}
                </Text>
                <Text style={styles.scoreLabel}>pts</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Meta del juego */}
      <View style={styles.goalContainer}>
        <IconSymbol name='flag.fill' size={14} color='#10B981' />
        <Text style={styles.goalText}>Meta: 15 puntos</Text>
      </View>
    </View>
  );
}

// Función para refrescar manualmente desde fuera
export const refreshScoreboard = async (): Promise<SessionPlayer[]> => {
  try {
    const status = await gameSessionService.getStatus();
    if (status.success && status.session?.players) {
      return status.session.players;
    }
  } catch (error) {
    console.error('Failed to refresh scoreboard:', error);
  }
  return [];
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  refreshHint: {
    fontSize: 16,
    padding: 4,
  },
  loadingText: {
    color: '#94A3B8',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    padding: 20,
  },
  playersList: {
    maxHeight: 200,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  currentPlayerRow: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  winningPlayerRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  position: {
    fontSize: 18,
    fontWeight: '700',
    width: 32,
    textAlign: 'center',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  currentPlayerName: {
    color: '#60A5FA',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tokenCount: {
    fontSize: 12,
    color: '#F59E0B',
  },
  correctCount: {
    fontSize: 12,
    color: '#10B981',
  },
  scoreContainer: {
    alignItems: 'center',
    minWidth: 50,
  },
  score: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  winningScore: {
    color: '#10B981',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  goalText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
});
