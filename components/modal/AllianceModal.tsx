import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { Alliance } from '@/types/game.types';

const { width } = Dimensions.get('window');

interface PlayerOption {
  id: string;
  name: string;
}

interface AllianceModalProps {
  visible: boolean;
  onClose: () => void;
}

type ActiveTab = 'declare' | 'active';

export default function AllianceModal({
  visible,
  onClose,
}: AllianceModalProps) {
  const players = useGameStore((s) => s.players);
  const alliances = useGameStore((s) => s.alliances);
  const declareAlliance = useGameStore((s) => s.declareAlliance);
  const dissolveAlliance = useGameStore((s) => s.dissolveAlliance);
  const getPlayerAlliance = useGameStore((s) => s.getPlayerAlliance);

  const [activeTab, setActiveTab] = useState<ActiveTab>('declare');
  const [selectedPlayer1, setSelectedPlayer1] = useState<string | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<string | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /** True if this player already has an active alliance */
  const isInAlliance = useCallback(
    (playerId: string): boolean => getPlayerAlliance(playerId) !== null,
    [getPlayerAlliance],
  );

  const getPlayerName = useCallback(
    (id: string) => players.find((p) => p.id === id)?.name ?? id,
    [players],
  );

  // ─── Declare logic ───────────────────────────────────────────────────────

  const handleSelectPlayer = useCallback(
    (playerId: string) => {
      if (!selectedPlayer1) {
        setSelectedPlayer1(playerId);
        return;
      }
      if (playerId === selectedPlayer1) {
        // Deselect
        setSelectedPlayer1(null);
        return;
      }
      setSelectedPlayer2(playerId);
    },
    [selectedPlayer1],
  );

  const handleDeclare = useCallback(() => {
    if (!selectedPlayer1 || !selectedPlayer2) return;
    declareAlliance(selectedPlayer1, selectedPlayer2);
    setSelectedPlayer1(null);
    setSelectedPlayer2(null);
    setActiveTab('active');
  }, [selectedPlayer1, selectedPlayer2, declareAlliance]);

  const handleClose = useCallback(() => {
    setSelectedPlayer1(null);
    setSelectedPlayer2(null);
    onClose();
  }, [onClose]);

  // ─── Render: player row for declare tab ──────────────────────────────────

  const renderPlayerOption = ({ item }: { item: PlayerOption }) => {
    const inAlliance = isInAlliance(item.id);
    const isSelected1 = selectedPlayer1 === item.id;
    const isSelected2 = selectedPlayer2 === item.id;
    const isSelected = isSelected1 || isSelected2;
    const isDisabled = inAlliance && !isSelected;

    return (
      <TouchableOpacity
        style={[
          styles.playerRow,
          isSelected1 && styles.playerRowSelected1,
          isSelected2 && styles.playerRowSelected2,
          isDisabled && styles.playerRowDisabled,
        ]}
        onPress={() => !isDisabled && handleSelectPlayer(item.id)}
        activeOpacity={isDisabled ? 1 : 0.75}
      >
        <View style={styles.playerRowContent}>
          <Text
            style={[
              styles.playerRowName,
              isDisabled && styles.playerRowNameDisabled,
            ]}
          >
            {item.name}
          </Text>

          {inAlliance && (
            <View style={styles.alreadyAllianceBadge}>
              <Text style={styles.alreadyAllianceText}>🤝 En alianza</Text>
            </View>
          )}

          {isSelected1 && (
            <View style={styles.selectedBadge1}>
              <Text style={styles.selectedBadgeText}>Jugador 1</Text>
            </View>
          )}

          {isSelected2 && (
            <View style={styles.selectedBadge2}>
              <Text style={styles.selectedBadgeText}>Jugador 2</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render: active alliance row ─────────────────────────────────────────

  const renderAlliance = ({ item }: { item: Alliance }) => {
    const p1Name = getPlayerName(item.player1Id);
    const p2Name = getPlayerName(item.player2Id);
    const roundsColor =
      item.roundsLeft === 1
        ? '#EF4444'
        : item.roundsLeft === 2
          ? '#F59E0B'
          : '#10B981';

    return (
      <View style={styles.allianceRow}>
        <View style={styles.allianceInfo}>
          <Text style={styles.allianceNames}>
            {p1Name} <Text style={styles.handshake}>🤝</Text> {p2Name}
          </Text>
          <Text style={[styles.allianceRounds, { color: roundsColor }]}>
            {item.roundsLeft} {item.roundsLeft === 1 ? 'ronda' : 'rondas'}{' '}
            restantes
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dissolveButton}
          onPress={() => dissolveAlliance(item.id)}
          activeOpacity={0.75}
        >
          <Text style={styles.dissolveText}>Disolver</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Derived state ───────────────────────────────────────────────────────

  const canDeclare =
    selectedPlayer1 !== null &&
    selectedPlayer2 !== null &&
    selectedPlayer1 !== selectedPlayer2;

  const selectionPrompt = !selectedPlayer1
    ? 'Selecciona el primer jugador'
    : !selectedPlayer2
      ? 'Selecciona el segundo jugador'
      : `${getPlayerName(selectedPlayer1)} 🤝 ${getPlayerName(selectedPlayer2)}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🤝</Text>
            <Text style={styles.headerTitle}>FEATURING</Text>
            <Text style={styles.headerSubtitle}>Alianzas temporales</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Tabs ── */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'declare' && styles.tabActive]}
              onPress={() => setActiveTab('declare')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'declare' && styles.tabTextActive,
                ]}
              >
                Declarar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'active' && styles.tabActive]}
              onPress={() => setActiveTab('active')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'active' && styles.tabTextActive,
                ]}
              >
                Activas
                {alliances.length > 0 && (
                  <Text style={styles.tabBadge}> {alliances.length}</Text>
                )}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Tab: Declare ── */}
          {activeTab === 'declare' && (
            <View style={styles.tabContent}>
              {/* Info box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Si tu aliado responde correctamente,{' '}
                  <Text style={styles.infoHighlight}>
                    recibes el 50% de sus puntos
                  </Text>
                  . La alianza dura{' '}
                  <Text style={styles.infoHighlight}>3 rondas</Text>.
                </Text>
              </View>

              {/* Selection prompt */}
              <View style={styles.promptContainer}>
                <Text style={styles.promptText}>{selectionPrompt}</Text>
              </View>

              {/* Player list */}
              <FlatList
                data={players}
                keyExtractor={(item) => item.id}
                renderItem={renderPlayerOption}
                style={styles.playerList}
                scrollEnabled={players.length > 4}
              />

              {/* Declare button */}
              <TouchableOpacity
                style={[
                  styles.declareButton,
                  !canDeclare && styles.declareButtonDisabled,
                ]}
                onPress={handleDeclare}
                disabled={!canDeclare}
                activeOpacity={0.8}
              >
                <Text style={styles.declareButtonText}>
                  {canDeclare
                    ? '🤝 Declarar Alianza'
                    : 'Selecciona 2 jugadores'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Tab: Active ── */}
          {activeTab === 'active' && (
            <View style={styles.tabContent}>
              {alliances.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🤷</Text>
                  <Text style={styles.emptyText}>No hay alianzas activas</Text>
                  <TouchableOpacity
                    onPress={() => setActiveTab('declare')}
                    style={styles.emptyAction}
                  >
                    <Text style={styles.emptyActionText}>Declarar una →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={alliances}
                  keyExtractor={(item) => item.id}
                  renderItem={renderAlliance}
                  style={styles.allianceList}
                  scrollEnabled={alliances.length > 3}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const ALLIANCE_PURPLE = '#8B5CF6';
const ALLIANCE_PURPLE_DIM = 'rgba(139, 92, 246, 0.15)';
const ALLIANCE_PURPLE_BORDER = 'rgba(139, 92, 246, 0.4)';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.92,
    maxHeight: '85%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ALLIANCE_PURPLE_BORDER,
    overflow: 'hidden',
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },

  // ── Tabs ──
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: ALLIANCE_PURPLE,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    color: '#F59E0B',
    fontWeight: '800',
  },

  // ── Tab content ──
  tabContent: {
    padding: 16,
  },

  // ── Info box ──
  infoBox: {
    backgroundColor: ALLIANCE_PURPLE_DIM,
    borderWidth: 1,
    borderColor: ALLIANCE_PURPLE_BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  infoText: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoHighlight: {
    color: ALLIANCE_PURPLE,
    fontWeight: '700',
  },

  // ── Selection prompt ──
  promptContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  promptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },

  // ── Player list ──
  playerList: {
    maxHeight: 240,
    marginBottom: 14,
  },
  playerRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  playerRowSelected1: {
    borderColor: ALLIANCE_PURPLE,
    backgroundColor: ALLIANCE_PURPLE_DIM,
  },
  playerRowSelected2: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  playerRowDisabled: {
    opacity: 0.4,
  },
  playerRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  playerRowNameDisabled: {
    color: '#64748B',
  },

  // ── Player badges ──
  alreadyAllianceBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  alreadyAllianceText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  selectedBadge1: {
    backgroundColor: ALLIANCE_PURPLE,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  selectedBadge2: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  selectedBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Declare button ──
  declareButton: {
    backgroundColor: ALLIANCE_PURPLE,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: ALLIANCE_PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  declareButtonDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  declareButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Active alliances ──
  allianceList: {
    maxHeight: 300,
  },
  allianceRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: ALLIANCE_PURPLE_BORDER,
  },
  allianceInfo: {
    flex: 1,
    marginRight: 12,
  },
  allianceNames: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  handshake: {
    fontSize: 14,
  },
  allianceRounds: {
    fontSize: 12,
    fontWeight: '600',
  },
  dissolveButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  dissolveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyAction: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: ALLIANCE_PURPLE_DIM,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ALLIANCE_PURPLE_BORDER,
  },
  emptyActionText: {
    fontSize: 14,
    color: ALLIANCE_PURPLE,
    fontWeight: '700',
  },
});
