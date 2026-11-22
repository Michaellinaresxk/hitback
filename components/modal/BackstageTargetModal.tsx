import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Player } from '@/store/types/gameStoreTypes';

interface Props {
  visible: boolean;
  cardLabel: string;
  cardEmoji: string;
  sourcePlayerId: string;
  players: Player[];
  onSelectTarget: (targetPlayerId: string) => void;
  onClose: () => void;
}

export default function BackstageTargetModal({
  visible,
  cardLabel,
  cardEmoji,
  sourcePlayerId,
  players,
  onSelectTarget,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const candidates = players.filter((p) => p.id !== sourcePlayerId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>{cardEmoji}</Text>
          <Text style={styles.title}>{cardLabel}</Text>
          <Text style={styles.subtitle}>{t('backstage.selectTarget')}</Text>

          <FlatList
            data={candidates}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.playerButton}
                onPress={() => onSelectTarget(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.playerButtonText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>
              {t('bettingModal.buttons.cancel')}
            </Text>
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
    borderColor: 'rgba(245, 158, 11, 0.4)',
    maxHeight: '80%',
  },
  emoji: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: '#F8FAFC', marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: { width: '100%', maxHeight: 280 },
  playerButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  playerButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
});
