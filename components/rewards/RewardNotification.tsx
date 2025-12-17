import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Difficulty, ComboReward, PowerCard } from '@/types/game.types';
import {
  DIFFICULTY_VISUAL_CONFIG,
  getComboDescription,
} from '@/helpers/gameUI.helpers';
import { RewardItem } from './RewardItem';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface RewardNotificationProps {
  visible: boolean;
  onClose: () => void;
  playerName: string;
  difficulty: Difficulty;
  powerCardWon?: PowerCard;
  bonusTokens: number;
  combosAchieved: ComboReward[];
}

export default function RewardNotification({
  visible,
  onClose,
  playerName,
  difficulty,
  powerCardWon,
  bonusTokens,
  combosAchieved,
}: RewardNotificationProps) {
  const [animatedValue] = useState(new Animated.Value(0));
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();
  useEffect(() => {
    if (visible) {
      setShowDetails(false);
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(animatedValue, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowDetails(true);
      });
    } else {
      animatedValue.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const visual = DIFFICULTY_VISUAL_CONFIG[difficulty];
  const hasRewards =
    powerCardWon || bonusTokens > 0 || combosAchieved.length > 0;

  return (
    <Modal visible={visible} transparent animationType='none'>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: animatedValue }],
              backgroundColor: visual.color,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.emoji}>{visual.emoji}</Text>
            <Text style={styles.title}>
              {t(`difficulty.${difficulty}.title`)}
            </Text>
            <Text style={styles.playerName}>{playerName}</Text>
            <Text style={styles.message}>
              {t(`difficulty.${difficulty}.message`)}
            </Text>
          </View>

          {hasRewards && showDetails && (
            <View style={styles.rewardsContainer}>
              <Text style={styles.rewardsTitle}>
                🎁 {t('rewards.title_main')}
              </Text>

              {bonusTokens > 0 && (
                <RewardItem
                  emoji='🪙'
                  title={t('rewards.tokens_bonus')}
                  description={`+${bonusTokens} ${t(
                    bonusTokens > 1
                      ? 'rewards.token_unit_plural'
                      : 'rewards.token_unit'
                  )}`}
                />
              )}

              {powerCardWon && (
                <RewardItem
                  emoji={powerCardWon.emoji}
                  title={t('rewards.power_card')}
                  description={powerCardWon.name}
                  subtext={powerCardWon.description}
                />
              )}

              {combosAchieved.map((combo, i) => (
                <RewardItem
                  key={i}
                  emoji='🔥'
                  title={t('rewards.combo')}
                  description={getComboDescription(combo, t)}
                />
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <IconSymbol
              name='checkmark.circle.fill'
              size={24}
              color='#FFFFFF'
            />
            <Text style={styles.continueText}>{t('rewards.continue')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  playerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  rewardsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rewardEmoji: {
    fontSize: 24,
  },
  rewardText: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  rewardSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  continueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
