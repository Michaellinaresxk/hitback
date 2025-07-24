import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#1a1a2e' />

      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.musicNote, styles.note1]}>
          <Text style={styles.noteText}>♪</Text>
        </View>
        <View style={[styles.musicNote, styles.note2]}>
          <Text style={styles.noteText}>♫</Text>
        </View>
        <View style={[styles.musicNote, styles.note3]}>
          <Text style={styles.noteText}>♩</Text>
        </View>
      </View>

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>HITBACK</Text>
          <View style={styles.titleUnderline} />
          <Text style={styles.subtitle}>Game Master Edition</Text>
        </View>

        <View style={styles.statsPreview}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Partidas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Jugadores</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.primaryButton, styles.newGameButton]}
          onPress={() => router.push('/setup-game')}
          activeOpacity={0.8}
        >
          <View style={styles.buttonIcon}>
            <IconSymbol name='plus.circle.fill' size={28} color='#FFFFFF' />
          </View>
          <View style={styles.buttonContent}>
            <Text style={styles.primaryButtonTitle}>Nueva Partida</Text>
            <Text style={styles.primaryButtonSubtitle}>
              Crear juego para 2-8 jugadores
            </Text>
          </View>
          <View style={styles.buttonArrow}>
            <IconSymbol name='chevron.right' size={20} color='#FFFFFF' />
          </View>
        </TouchableOpacity>

        <View style={styles.secondaryButtonsRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: '#ff6b6b' }]}
            activeOpacity={0.8}
          >
            <IconSymbol name='clock.fill' size={24} color='#FFFFFF' />
            <Text style={styles.secondaryButtonText}>Continuar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: '#4ecdc4' }]}
            activeOpacity={0.8}
          >
            <IconSymbol name='chart.bar.fill' size={24} color='#FFFFFF' />
            <Text style={styles.secondaryButtonText}>Estadísticas</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access Cards */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Acceso Rápido</Text>
          <View style={styles.quickAccessCards}>
            <TouchableOpacity style={styles.quickCard}>
              <IconSymbol name='music.note' size={20} color='#007AFF' />
              <Text style={styles.quickCardText}>Biblioteca</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard}>
              <IconSymbol name='gear' size={20} color='#007AFF' />
              <Text style={styles.quickCardText}>Configurar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard}>
              <IconSymbol
                name='questionmark.circle'
                size={20}
                color='#007AFF'
              />
              <Text style={styles.quickCardText}>Ayuda</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🎵 Prepárate para la mejor experiencia musical
        </Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  musicNote: {
    position: 'absolute',
    opacity: 0.1,
  },
  note1: {
    top: height * 0.15,
    right: width * 0.1,
    transform: [{ rotate: '15deg' }],
  },
  note2: {
    top: height * 0.4,
    left: width * 0.05,
    transform: [{ rotate: '-10deg' }],
  },
  note3: {
    bottom: height * 0.25,
    right: width * 0.15,
    transform: [{ rotate: '25deg' }],
  },
  noteText: {
    fontSize: 60,
    color: '#16213e',
    fontWeight: 'bold',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 80 : 40,
    paddingHorizontal: 24,
    paddingBottom: 30,
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#ff6b6b',
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: '500',
    letterSpacing: 1,
  },
  statsPreview: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
  actionSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    zIndex: 1,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  newGameButton: {
    backgroundColor: 'linear-gradient(135deg, #007AFF 0%, #0056CC 100%)',
  },
  buttonIcon: {
    marginRight: 16,
  },
  buttonContent: {
    flex: 1,
  },
  primaryButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  primaryButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttonArrow: {
    marginLeft: 12,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  secondaryButton: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  quickAccessSection: {
    marginTop: 90,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  quickAccessCards: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickCardText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    zIndex: 1,
  },
  footerText: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
