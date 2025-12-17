import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RewardItemProps {
  emoji: string;
  title: string;
  description: string;
  subtext?: string;
}

export const RewardItem = ({
  emoji,
  title,
  description,
  subtext,
}: RewardItemProps) => (
  <View style={styles.rewardItem}>
    <View style={styles.rewardIcon}>
      <Text style={styles.rewardEmoji}>{emoji}</Text>
    </View>
    <View style={styles.rewardText}>
      <Text style={styles.rewardTitle}>{title}</Text>
      <Text style={styles.rewardDescription}>{description}</Text>
      {subtext && <Text style={styles.rewardSubtext}>{subtext}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
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
});
