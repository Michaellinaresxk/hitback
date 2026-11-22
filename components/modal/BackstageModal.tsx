import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { REACTION_CARDS } from '@/constants/ReactionCard';
import type { BackstageCard } from '@/types/backstage.types';

interface Props {
  visible: boolean;
  card: BackstageCard | null;
  cityName?: string;
  onUse: () => void;
  onDiscard: () => void;
}

export default function BackstageModal({
  visible,
  card,
  cityName,
  onUse,
  onDiscard,
}: Props) {
  const { t } = useTranslation();
  if (!card) return null;

  const def = REACTION_CARDS.find((item) => item.type === card.cardType);
  const emoji = def?.emoji ?? '🎟️';
  const label = def?.label ?? card.cardType;
  const scene = t(`backstage.scenes.${card.cardType}`, {
    defaultValue: def?.description ?? '',
  });

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onDiscard}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.kicker}>🎟️ {t('backstage.title')}</Text>
          <Text style={styles.scenario}>{t('backstage.tourScenario')}</Text>
          <Text style={styles.city}>{cityName || t('backstage.atCity', { city: `#${card.position}` })}</Text>

          <View style={styles.sceneBox}>
            <Text style={styles.sceneText}>{scene}</Text>
          </View>

          <View style={styles.rewardBox}>
            <Text style={styles.rewardEmoji}>{emoji}</Text>
            <Text style={styles.rewardLabel}>{label}</Text>
            <Text style={styles.rewardObtained}>
              {t('backstage.obtained', { card: label })}
            </Text>
          </View>

          <TouchableOpacity style={styles.useButton} onPress={onUse} activeOpacity={0.85}>
            <Text style={styles.useButtonText}>{t('backstage.useCard')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.discardButton} onPress={onDiscard} activeOpacity={0.75}>
            <Text style={styles.discardText}>{t('backstage.discard')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.35)',
  },
  kicker: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  scenario: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  city: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  sceneBox: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
  },
  sceneText: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  rewardBox: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  rewardEmoji: { fontSize: 42 },
  rewardLabel: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
  },
  rewardObtained: {
    color: '#FDE68A',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  useButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  discardButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  discardText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});
