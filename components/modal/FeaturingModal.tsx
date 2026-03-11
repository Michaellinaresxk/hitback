import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';

interface FeaturingModalProps {
  visible: boolean;
  portadorName: string;
  portadorId: string;
  players: { id: string; name: string }[];
  /** IDs ya comprometidos en un featuring activo — no pueden ser elegidos */
  committedPlayerIds?: string[];
  onSelectPartner: (partnerId: string) => void;
  onClose: () => void;
}

export default function FeaturingModal({
  visible,
  portadorName,
  portadorId,
  players,
  committedPlayerIds = [],
  onSelectPartner,
  onClose,
}: FeaturingModalProps) {
  const candidates = players.filter((p) => p.id !== portadorId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>🎤</Text>
          <Text style={styles.title}>FEATURING</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.portadorName}>{portadorName}</Text> elige su
            compañero
          </Text>

          <View style={styles.ruleBox}>
            <Text style={styles.ruleText}>
              Si cualquiera de los dos acierta, ¡ambos ganan los puntos!
            </Text>
          </View>

          <FlatList
            data={candidates}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const isCommitted = committedPlayerIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={[
                    styles.playerButton,
                    isCommitted && styles.playerButtonDisabled,
                  ]}
                  onPress={() => !isCommitted && onSelectPartner(item.id)}
                  activeOpacity={isCommitted ? 1 : 0.8}
                  disabled={isCommitted}
                >
                  <Text
                    style={[
                      styles.playerButtonText,
                      isCommitted && styles.playerButtonTextDisabled,
                    ]}
                  >
                    🎵 {item.name}
                  </Text>
                  {isCommitted && (
                    <Text style={styles.committedLabel}>🎤 En featuring</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

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
    borderColor: 'rgba(168, 85, 247, 0.4)',
    maxHeight: '80%',
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#A855F7',
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
  portadorName: { color: '#F8FAFC', fontWeight: '700' },
  ruleBox: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    width: '100%',
  },
  ruleText: {
    fontSize: 13,
    color: '#C084FC',
    textAlign: 'center',
    fontWeight: '600',
  },
  list: { width: '100%' },
  playerButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    gap: 4,
  },
  playerButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.07)',
    opacity: 0.5,
  },
  playerButtonText: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  playerButtonTextDisabled: { color: '#475569' },
  committedLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
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
