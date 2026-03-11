import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGameStore } from '@/store/gameStore';
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
  onUsePowerCard?: (playerId: string, cardId: string) => void;
  canUsePowerCards?: boolean;
  onFreezePlayer?: (playerId: string) => void;
  onFeaturingPlayer?: (playerId: string) => void;
  onStopBlast?: (playerId: string) => void;
  stopBlastHolderId?: string | null;
  featuringPlayerId?: string | null;
  featuringTargetId?: string | null;
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
  onFreezePlayer,
  onFeaturingPlayer,
  onStopBlast,
  stopBlastHolderId,
  featuringPlayerId,
  featuringTargetId,
}: PlayerScoreboardProps) {
  const getPlayerAlliance = useGameStore((s) => s.getPlayerAlliance);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const leader = sortedPlayers[0];
  const isGameWon = leader && leader.score >= SCORE_TO_WIN;

  // Si hay un holder activo, STOP-BLAST está activo
  const stopBlastActive = !!stopBlastHolderId;

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════

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

  const getProgressPercentage = (score: number) =>
    Math.min((score / SCORE_TO_WIN) * 100, 100);

  const getAvailablePowerCards = (player: Player) => {
    if (!player.powerCards || player.powerCards.length === 0) return [];
    return player.powerCards.filter(
      (card) => card.currentUses < card.usageLimit,
    );
  };

  const handleUsePowerCard = (playerId: string, cardId: string) => {
    if (onUsePowerCard && canUsePowerCards) onUsePowerCard(playerId, cardId);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // MODO COMPACT
  // ═══════════════════════════════════════════════════════════════════════

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sortedPlayers.map((player, index) => {
            const isStopBlastHolder = stopBlastHolderId === player.id;
            const isStopBlastBlocked = stopBlastActive && !isStopBlastHolder;
            return (
              <View
                key={player.id}
                style={[
                  styles.compactCard,
                  player.isCurrentTurn && styles.compactCardActive,
                  index === 0 && styles.compactCardLeader,
                  player.isFrozen && styles.compactCardFrozen,
                  isStopBlastHolder && styles.compactCardStopBlastHolder,
                  isStopBlastBlocked && styles.compactCardFrozen,
                ]}
              >
                <Text style={styles.compactPosition}>
                  {getPositionIcon(index)}
                </Text>
                <Text style={styles.compactName} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={styles.compactScore}>{player.score}</Text>
                {getAvailablePowerCards(player).length > 0 && (
                  <Text style={styles.compactPowerCard}>
                    ⚡{getAvailablePowerCards(player).length}
                  </Text>
                )}
                {player.boostActive && (
                  <View style={styles.compactBoostBadge}>
                    <Text style={styles.compactBoostText}>x2</Text>
                  </View>
                )}
                {player.isFrozen && (
                  <Text style={styles.compactFrozenText}>⏸️</Text>
                )}
                {player.bSideActive && (
                  <Text style={styles.compactBSideText}>🎶</Text>
                )}
                {isStopBlastHolder && (
                  <Text style={styles.compactBSideText}>🛑</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MODO NORMAL
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Puntuaciones</Text>
        <Text style={styles.headerSubtitle}>Meta: {SCORE_TO_WIN} puntos</Text>
      </View>

      {/* Banner STOP-BLAST activo */}
      {stopBlastActive && (
        <View style={styles.stopBlastBanner}>
          <Text style={styles.stopBlastBannerText}>
            🛑 STOP-BLAST — solo{' '}
            <Text style={styles.stopBlastBannerName}>
              {players.find((p) => p.id === stopBlastHolderId)?.name}
            </Text>{' '}
            puede ganar esta ronda
          </Text>
        </View>
      )}

      {/* Lista de Jugadores */}
      <View style={styles.playersList}>
        {sortedPlayers.map((player, index) => {
          const availablePowerCards = getAvailablePowerCards(player);
          const hasPowerCards = availablePowerCards.length > 0;
          const isFrozen = player.isFrozen ?? false;

          // ── STOP-BLAST ────────────────────────────────────────────────
          const isStopBlastHolder = stopBlastHolderId === player.id;
          // Bloqueado = stop blast activo pero este jugador NO es el holder
          const isStopBlastBlocked = stopBlastActive && !isStopBlastHolder;

          // ── Featuring ─────────────────────────────────────────────────
          const isFeaturingHolder = featuringPlayerId === player.id;
          const isFeaturingTarget = featuringTargetId === player.id;
          const isInFeaturing = isFeaturingHolder || isFeaturingTarget;

          // ── Alliance ──────────────────────────────────────────────────
          const alliance = getPlayerAlliance(player.id);
          const isInAlliance = alliance !== null;

          const isBSide = player.bSideActive ?? false;

          // Visual bloqueado = frozen O bloqueado por stop-blast
          const isVisuallyBlocked = isFrozen || isStopBlastBlocked;

          return (
            <TouchableOpacity
              key={player.id}
              onPress={() => {
                if (!onFreezePlayer && !onFeaturingPlayer && !onStopBlast)
                  return;

                if (isInFeaturing) {
                  if (isFeaturingHolder) onFeaturingPlayer?.(player.id);
                  return;
                }

                if (isFrozen) {
                  onFreezePlayer?.(player.id);
                  return;
                }

                Alert.alert(player.name, '¿Qué hacemos con este jugador?', [
                  {
                    text: '⏸️ Pausar esta ronda',
                    style: 'destructive',
                    onPress: () => onFreezePlayer?.(player.id),
                  },
                  {
                    text: '🎤 Featuring',
                    onPress: () => onFeaturingPlayer?.(player.id),
                  },
                  {
                    text: '🛑 STOP-BLAST',
                    onPress: () => onStopBlast?.(player.id),
                  },
                  { text: 'Cancelar', style: 'cancel' },
                ]);
              }}
              activeOpacity={0.75}
              style={[
                styles.playerCard,
                getPositionStyle(index),
                player.isCurrentTurn && styles.playerCardActive,
                highlightWinner &&
                  isGameWon &&
                  index === 0 &&
                  styles.playerCardWinner,
                isFrozen && styles.playerCardFrozen,
                isInFeaturing && styles.playerCardFeaturing,
                isBSide && styles.playerCardBSide,
                // STOP-BLAST — holder destacado, resto bloqueado
                isStopBlastHolder && styles.playerCardStopBlastHolder,
                isStopBlastBlocked && styles.playerCardStopBlastBlocked,
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
                      isVisuallyBlocked && styles.playerNameFrozen,
                      isInFeaturing && styles.playerNameFeaturing,
                      isBSide && styles.playerNameBSide,
                      isStopBlastHolder && styles.playerNameStopBlastHolder,
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
                  {player.boostActive && (
                    <View style={styles.boostBadge}>
                      <Text style={styles.boostBadgeText}>⚡x2</Text>
                    </View>
                  )}
                  {isFrozen && (
                    <View style={styles.freezeBadge}>
                      <Text style={styles.freezeBadgeText}>⏸️ PAUSA</Text>
                    </View>
                  )}
                  {isInFeaturing && (
                    <View
                      style={[
                        styles.featuringBadge,
                        isFeaturingHolder && styles.featuringBadgePortador,
                      ]}
                    >
                      <Text style={styles.featuringBadgeText}>
                        {isFeaturingHolder ? '🎤 FT. HOLDER' : '🎤 FEATURING'}
                      </Text>
                    </View>
                  )}
                  {isInAlliance && alliance && (
                    <View style={styles.allianceBadge}>
                      <Text style={styles.allianceBadgeText}>
                        🤝 {alliance.roundsLeft}R
                      </Text>
                    </View>
                  )}
                  {isBSide && (
                    <View style={styles.bSideBadge}>
                      <Text style={styles.bSideBadgeText}>🎶 B-SIDE +1</Text>
                    </View>
                  )}
                  {/* ── STOP-BLAST badges ── */}
                  {isStopBlastHolder && (
                    <View style={styles.stopBlastHolderBadge}>
                      <Text style={styles.stopBlastHolderBadgeText}>
                        🛑 STOP-BLAST
                      </Text>
                    </View>
                  )}
                  {isStopBlastBlocked && (
                    <View style={styles.stopBlastBlockedBadge}>
                      <Text style={styles.stopBlastBlockedBadgeText}>
                        🔇 BLOQUEADO
                      </Text>
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
                      isVisuallyBlocked && styles.progressBarFrozen,
                      isInFeaturing && styles.progressBarFeaturing,
                      isBSide && styles.progressBarBSide,
                      isStopBlastHolder && styles.progressBarStopBlast,
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
                    {hasPowerCards && (
                      <View style={styles.statItem}>
                        <Text style={styles.statText}>
                          ⚡ {availablePowerCards.length} carta
                          {availablePowerCards.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                    {(player.lossStreak ?? 0) > 0 && !isBSide && (
                      <View style={styles.statItem}>
                        <Text style={styles.statText}>
                          📉 {player.lossStreak} sin puntuar
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* PowerCards */}
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
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleUsePowerCard(player.id, card.id);
                          }}
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
                <View style={styles.scoreBox}>
                  <Text
                    style={[
                      styles.scoreValue,
                      index === 0 && styles.scoreValueLeader,
                      isVisuallyBlocked && styles.scoreValueFrozen,
                      isInFeaturing && styles.scoreValueFeaturing,
                      isBSide && styles.scoreValueBSide,
                      isStopBlastHolder && styles.scoreValueStopBlast,
                    ]}
                  >
                    {player.score}
                  </Text>
                  <Text style={styles.scoreLabel}>pts</Text>
                </View>
                <View style={styles.tokensBox}>
                  <IconSymbol
                    name='bitcoinsign.circle.fill'
                    size={16}
                    color={isVisuallyBlocked ? '#475569' : '#F59E0B'}
                  />
                  <Text
                    style={[
                      styles.tokensValue,
                      isVisuallyBlocked && styles.tokensValueFrozen,
                    ]}
                  >
                    {player.availableTokens?.length || player.tokens || 0}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer ganador */}
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
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  // ── STOP-BLAST banner ─────────────────────────────────────────────────
  stopBlastBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  stopBlastBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F87171',
    textAlign: 'center',
  },
  stopBlastBannerName: {
    fontWeight: '800',
    color: '#FECACA',
  },

  playersList: { gap: 10 },

  // ── Player Card ───────────────────────────────────────────────────────
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
  playerCardFrozen: {
    opacity: 0.45,
    borderColor: '#334155',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  playerCardFeaturing: {
    borderColor: 'rgba(168, 85, 247, 0.5)',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  playerCardBSide: {
    borderColor: 'rgba(234, 179, 8, 0.45)',
    backgroundColor: 'rgba(234, 179, 8, 0.06)',
  },
  playerCardStopBlastHolder: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  playerCardStopBlastBlocked: {
    opacity: 0.35,
    borderColor: '#1E293B',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },

  // ── Position ──────────────────────────────────────────────────────────
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
  positionContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionText: { fontSize: 16 },

  // ── Player Info ───────────────────────────────────────────────────────
  playerInfo: { flex: 1, marginRight: 12 },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  playerName: { fontSize: 15, fontWeight: '600', color: '#F8FAFC', flex: 1 },
  playerNameActive: { color: '#60A5FA' },
  playerNameFrozen: { color: '#475569', textDecorationLine: 'line-through' },
  playerNameFeaturing: { color: '#C084FC' },
  playerNameBSide: { color: '#FCD34D' },
  playerNameStopBlastHolder: { color: '#FCA5A5' },

  // ── Badges ────────────────────────────────────────────────────────────
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
  boostBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  boostBadgeText: { fontSize: 11, fontWeight: '800', color: '#000000' },
  freezeBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  freezeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  featuringBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  featuringBadgePortador: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderColor: '#A855F7',
  },
  featuringBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A855F7',
    letterSpacing: 0.5,
  },
  allianceBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  allianceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.5,
  },
  bSideBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  bSideBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FCD34D',
    letterSpacing: 0.5,
  },
  stopBlastHolderBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  stopBlastHolderBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F87171',
    letterSpacing: 0.5,
  },
  stopBlastBlockedBadge: {
    backgroundColor: 'rgba(71, 85, 105, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#475569',
  },
  stopBlastBlockedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },

  // ── Progress Bar ──────────────────────────────────────────────────────
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 2 },
  progressBarLeader: { backgroundColor: '#F59E0B' },
  progressBarFrozen: { backgroundColor: '#334155' },
  progressBarFeaturing: { backgroundColor: '#A855F7' },
  progressBarBSide: { backgroundColor: '#EAB308' },
  progressBarStopBlast: { backgroundColor: '#EF4444' },

  // ── Detailed Stats ────────────────────────────────────────────────────
  detailedStats: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: '#94A3B8' },

  // ── PowerCards ────────────────────────────────────────────────────────
  powerCardsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  powerCardsList: { flexDirection: 'row' },
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
  powerCardDisabled: { opacity: 0.5 },
  powerCardEmoji: { fontSize: 14 },
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
  activeText: { fontSize: 10, fontWeight: 'bold', color: '#000' },

  // ── Score Container ───────────────────────────────────────────────────
  scoreContainer: { alignItems: 'flex-end' },
  scoreBox: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  scoreValue: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  scoreValueLeader: { color: '#F59E0B' },
  scoreValueFrozen: { color: '#475569' },
  scoreValueFeaturing: { color: '#C084FC' },
  scoreValueBSide: { color: '#FCD34D' },
  scoreValueStopBlast: { color: '#F87171' },
  scoreLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 2,
    fontWeight: '500',
  },
  tokensBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tokensValue: { fontSize: 13, fontWeight: '600', color: '#F59E0B' },
  tokensValueFrozen: { color: '#475569' },

  // ── Winner Banner ─────────────────────────────────────────────────────
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

  // ── Compact Mode ──────────────────────────────────────────────────────
  compactContainer: { paddingVertical: 8, paddingHorizontal: 16 },
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
  compactCardLeader: { borderColor: '#F59E0B' },
  compactCardFrozen: { opacity: 0.4, borderColor: '#334155' },
  compactCardStopBlastHolder: { borderColor: '#EF4444', borderWidth: 2 },
  compactPosition: { fontSize: 14 },
  compactName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    maxWidth: 80,
  },
  compactScore: { fontSize: 15, fontWeight: '800', color: '#F59E0B' },
  compactPowerCard: { fontSize: 12, color: '#FFD700', fontWeight: '600' },
  compactBoostBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactBoostText: { fontSize: 10, fontWeight: '800', color: '#000' },
  compactFrozenText: { fontSize: 12 },
  compactBSideText: { fontSize: 12 },
});
