import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface GamePotProps {
  tokens: number;
}

export const GamePot: React.FC<GamePotProps> = ({ tokens }) => {
  if (tokens <= 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>POT DEL JUEGO</Text>
      <View style={styles.value}>
        <IconSymbol name='bitcoinsign.circle.fill' size={20} color='#F59E0B' />
        <Text style={styles.count}>{tokens} tokens</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 8,
  },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
});
