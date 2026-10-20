import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CurrentTurnProps {
  round: number;
  currentPhase: string;
}

export const CurrentTurn: React.FC<CurrentTurnProps> = ({ round }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.turnLabel}>Ronda</Text>
      <Text style={styles.currentTurnName}>{round}</Text>
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
