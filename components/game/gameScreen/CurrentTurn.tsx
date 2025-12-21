import { getPhaseLabel } from '@/utils/game/phaseStyler';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CurrentTurnProps {
  currentPlayerName: string;
  round: number;
  currentPhase: string;
}

export const CurrentTurn: React.FC<CurrentTurnProps> = ({
  currentPlayerName,
  round,
  currentPhase,
}) => {
  const phaseLabel = getPhaseLabel(currentPhase);

  return (
    <View style={styles.container}>
      <Text style={styles.turnLabel}>Turno Actual</Text>
      <Text style={styles.currentTurnName}>
        {currentPlayerName || 'Nadie'} - Ronda {round}
      </Text>
      <Text style={styles.phaseInfo}>Fase: {phaseLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  turnLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  currentTurnName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  phaseInfo: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
});
