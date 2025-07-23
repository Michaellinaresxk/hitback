// app/(tabs)/index.tsx - VERSIÓN CORREGIDA
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎵 HITBACK</Text>
        <ThemedText style={styles.subtitle}>Game Master Edition</ThemedText>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push('/setup-game')}
        >
          <IconSymbol name='plus.circle.fill' size={24} color='#007AFF' />
          <ThemedText style={styles.buttonText}>Nueva Partida</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <IconSymbol name='clock.fill' size={24} color='#007AFF' />
          <ThemedText style={styles.buttonText}>Continuar Partida</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <IconSymbol name='chart.bar.fill' size={24} color='#007AFF' />
          <ThemedText style={styles.buttonText}>Estadísticas</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginTop: 10,
    opacity: 0.7,
  },
  menu: {
    gap: 20,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    gap: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
