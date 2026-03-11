import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface DuelModalProps {
  visible: boolean;
  challengerName: string;
  challengerId: string;
  players: { id: string; name: string }[];
  onSelectOpponent: (opponentId: string) => void;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export default function DuelModal({
  visible,
  challengerName,
  challengerId,
  players,
  onSelectOpponent,
  onClose,
}: DuelModalProps) {
  const candidates = players.filter((p) => p.id !== challengerId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>⚔️</Text>
          <Text style={styles.title}>DUEL</Text>

          <Text style={styles.subtitle}>
            <Text style={styles.challengerName}>{challengerName}</Text>
            {'\n'}elige a su rival
          </Text>

          <View style={styles.ruleBox}>
            <Text style={styles.ruleText}>
              Solo los dos duelistas podrán responder esta ronda
            </Text>
          </View>

          <FlatList
            data={candidates}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.playerButton}
                onPress={() => onSelectOpponent(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.playerButtonText}>⚔️ {item.name}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1E293B',
    width: '88%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    maxHeight: '80%',
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FB923C',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  challengerName: { color: '#F8FAFC', fontWeight: '700' },
  ruleBox: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    width: '100%',
  },
  ruleText: {
    fontSize: 13,
    color: '#FB923C',
    textAlign: 'center',
    fontWeight: '600',
  },
  list: { width: '100%' },
  playerButton: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  playerButtonText: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  cancelButton: {
    marginTop: 8,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cancelText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
});
