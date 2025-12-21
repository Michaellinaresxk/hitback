import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

export const GameSetupScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <IconSymbol name='gamecontroller' size={48} color='#64748B' />
      <Text style={styles.text}>Configure el juego para empezar</Text>
      <Text style={styles.subtext}>
        Ve a la pestaña "Setup" para agregar jugadores
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  text: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
    textAlign: 'center',
  },
});
