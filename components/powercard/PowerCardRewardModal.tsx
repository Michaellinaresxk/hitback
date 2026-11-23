import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ComboCardAwarded } from '@/hooks/useComboFlow';

interface PowerCardRewardModalProps {
  visible: boolean;
  onConfirm: () => void;
  playerName: string;
  card: ComboCardAwarded | null;
}

/** Carta obtenida por combo en modo Streaming: sin cámara, solo lectura y confirmación. */
export function PowerCardRewardModal({
  visible,
  onConfirm,
  playerName,
  card,
}: PowerCardRewardModalProps) {
  const { t } = useTranslation();

  if (!card) return null;

  const scoreChange = card.effectOnDraw?.scoreChange ?? 0;
  const isImmediate = scoreChange !== 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.emoji}>{card.emoji}</Text>
          <Text style={styles.title}>{t('powerCardReward.title')}</Text>
          <Text style={styles.player}>{t('powerCardReward.awardedTo', { player: playerName })}</Text>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.description}>{card.description}</Text>

          <View style={styles.effectBox}>
            <Text style={styles.effectTitle}>{t('powerCardReward.effectTitle')}</Text>
            <Text style={styles.effectText}>
              {isImmediate
                ? t('powerCardReward.immediateEffect', { points: scoreChange })
                : t('powerCardReward.storedEffect')}
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={onConfirm} accessibilityRole="button">
            <Text style={styles.buttonText}>{t('powerCardReward.confirm')}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1f1b2e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd166',
  },
  emoji: { fontSize: 72, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#ffd166', textAlign: 'center' },
  player: { fontSize: 15, color: '#cbd5e1', marginTop: 6, textAlign: 'center' },
  cardName: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16, textAlign: 'center' },
  description: { fontSize: 15, color: '#e2e8f0', marginTop: 8, textAlign: 'center' },
  effectBox: {
    width: '100%',
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2d2742',
  },
  effectTitle: { fontSize: 13, fontWeight: '700', color: '#a78bfa', textAlign: 'center' },
  effectText: { fontSize: 15, color: '#fff', marginTop: 6, textAlign: 'center' },
  button: {
    marginTop: 22,
    backgroundColor: '#ffd166',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: { fontSize: 16, fontWeight: '800', color: '#1f1b2e' },
});
