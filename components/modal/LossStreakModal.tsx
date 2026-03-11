import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface LossStreakModalProps {
  visible: boolean;
  playerNames: string[]; // ← array de jugadores con B-SIDE activo
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export default function LossStreakModal({
  visible,
  playerNames,
  onClose,
}: LossStreakModalProps) {
  const isMultiple = playerNames.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎶</Text>

          <Text style={styles.title}>B-SIDE ACTIVADO</Text>

          <Text style={styles.subtitle}>
            {isMultiple
              ? `${playerNames.length} jugadores llevan 4 rondas sin puntuar`
              : 'Este jugador lleva 4 rondas sin puntuar'}
          </Text>

          {/* Lista de jugadores */}
          <View style={styles.playersList}>
            {playerNames.map((name) => (
              <View key={name} style={styles.playerRow}>
                <Text style={styles.playerName}>{name}</Text>
                <View style={styles.bonusTag}>
                  <Text style={styles.bonusTagText}>+1 próximo punto</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.instruction}>
            {isMultiple
              ? `Dale una Reaction Card a cada uno 🃏`
              : `Dale una Reaction Card del mazo físico 🃏`}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {isMultiple ? `Cartas entregadas ✓` : `Carta entregada ✓`}
            </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1E293B',
    width: '88%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(234, 179, 8, 0.5)',
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Lista de jugadores ────────────────────────────────────────────────
  playersList: {
    width: '100%',
    gap: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  bonusTag: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  bonusTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCD34D',
  },

  instruction: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#EAB308',
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
});
