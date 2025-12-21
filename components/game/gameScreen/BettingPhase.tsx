import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface BettingPhaseProps {
  bettingStatus: {
    isActive: boolean;
    urgentTime: boolean;
    timeLeft: number;
  };
  onOpenBetting: () => void;
  onEndBetting: () => void;
}

export const BettingPhase: React.FC<BettingPhaseProps> = ({
  bettingStatus,
  onOpenBetting,
  onEndBetting,
}) => {
  if (!bettingStatus.isActive) return null;

  return (
    <View
      style={[
        styles.container,
        bettingStatus.urgentTime && styles.urgentContainer,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>TIEMPO DE APUESTAS</Text>
        <Text
          style={[styles.timer, bettingStatus.urgentTime && styles.timerUrgent]}
        >
          {bettingStatus.timeLeft}s
        </Text>
      </View>

      <Text style={styles.instructions}>
        Los jugadores pueden poner sus tokens en la mesa
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.registerBetsButton}
          onPress={onOpenBetting}
        >
          <IconSymbol name='dice.fill' size={18} color='#FFFFFF' />
          <Text style={styles.registerBetsText}>Registrar Apuestas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.endBettingButton}
          onPress={onEndBetting}
        >
          <IconSymbol name='checkmark.circle' size={18} color='#FFFFFF' />
          <Text style={styles.endBettingText}>Terminar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progress,
            { width: `${(bettingStatus.timeLeft / 30) * 100}%` },
            bettingStatus.urgentTime && styles.progressUrgent,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  urgentContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#DC2626',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  timer: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerUrgent: {
    backgroundColor: '#DC2626',
  },
  instructions: {
    fontSize: 14,
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  registerBetsButton: {
    flex: 2,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  registerBetsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  endBettingButton: {
    flex: 1,
    backgroundColor: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  endBettingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  progressUrgent: {
    backgroundColor: '#DC2626',
  },
});
