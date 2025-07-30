// app/(tabs)/game.tsx - 🎮 PANTALLA PRINCIPAL DEL JUEGO CORREGIDA
import GameBoard from '@/components/game/GameBoard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGameStore } from '@/store/gameStore';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function GameScreen() {
  const { isActive } = useGameStore();

  // Si el juego no está activo, mostrar mensaje de setup
  if (!isActive) {
    return (
      <View style={styles.setupContainer}>
        <IconSymbol name='gamecontroller' size={48} color='#64748B' />
        <Text style={styles.setupText}>
          Configure el juego en "Setup Game" para empezar
        </Text>
        <Text style={styles.setupSubtext}>
          Necesitas al menos 2 jugadores para comenzar
        </Text>
      </View>
    );
  }

  // Render del juego activo
  return <GameBoard />;
}

const styles = StyleSheet.create({
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  setupText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  setupSubtext: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
    textAlign: 'center',
  },
});
