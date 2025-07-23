// app/(tabs)/game.tsx - REEMPLAZAR TODO
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function GameScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎮 Game Master</Text>
        <ThemedText style={styles.subtitle}>Controla la partida</ThemedText>
      </View>

      <View style={styles.gameArea}>
        <TouchableOpacity style={styles.scanButton}>
          <IconSymbol name='camera.fill' size={32} color='#FFFFFF' />
          <ThemedText style={styles.scanText}>Escanear Carta</ThemedText>
        </TouchableOpacity>

        <View style={styles.playersSection}>
          <ThemedText style={styles.sectionTitle}>Jugadores</ThemedText>
          <ThemedText>No hay jugadores agregados</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.7,
  },
  gameArea: {
    flex: 1,
    gap: 30,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  playersSection: {
    backgroundColor: '#F0F0F0',
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
