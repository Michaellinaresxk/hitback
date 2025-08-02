import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HelpScreen() {
  const router = useRouter();

  const cardTypes = [
    {
      emoji: '🎵',
      name: 'SONG CARDS',
      color: '#F59E0B',
      points: '1 punto',
      description: 'Escuchas 5 segundos → "¿Cuál es la canción?"',
    },
    {
      emoji: '🎤',
      name: 'ARTIST CARDS',
      color: '#EF4444',
      points: '2 puntos',
      description: 'Escuchas 5 segundos → "¿Quién la canta?"',
    },
    {
      emoji: '📅',
      name: 'DECADE CARDS',
      color: '#3B82F6',
      points: '3 puntos',
      description: 'Escuchas 5 segundos → "¿De qué década es?"',
    },
    {
      emoji: '📝',
      name: 'LYRICS CARDS',
      color: '#10B981',
      points: '3 puntos',
      description: 'Escuchas 5 segundos → "Completa la siguiente línea"',
    },
    {
      emoji: '🔥',
      name: 'CHALLENGE CARDS',
      color: '#8B5CF6',
      points: '5 puntos',
      description: 'Canta, baila o imita al artista',
    },
  ];

  const specialModes = [
    {
      icon: '⚔️',
      name: 'BATTLE MODE',
      description:
        'Game Master selecciona 2 jugadores específicos para competir cara a cara',
    },
    {
      icon: '⚡',
      name: 'SPEED ROUND',
      description: 'Game Master escanea 5 cartas seguidas en 30 segundos',
    },
    {
      icon: '🔥',
      name: 'VIRAL MOMENT',
      description: 'Challenge Cards activadas con performance grabado',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <IconSymbol name='chevron.left' size={24} color='#F8FAFC' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reglas del Juego</Text>
        <View style={styles.headerSpacer} />
      </View> */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Game Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 OBJETIVO</Text>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewText}>
              Ser el primer jugador en alcanzar{' '}
              <Text style={styles.highlight}>15 puntos</Text> o tener la mayor
              puntuación después de{' '}
              <Text style={styles.highlight}>20 minutos</Text> de juego.
            </Text>
          </View>
        </View>

        {/* Setup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 CONFIGURACIÓN</Text>
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                Game Master abre la app y crea nueva partida
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                Agrega jugadores manualmente (2-8 personas)
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                Distribuye 5 cartas físicas a cada jugador
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>¡Inicia el juego!</Text>
            </View>
          </View>
        </View>

        {/* Game Flow */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ FLUJO DE JUEGO</Text>
          <View style={styles.flowCard}>
            <View style={styles.flowStep}>
              <Text style={styles.flowTitle}>Ronda Normal:</Text>
              <Text style={styles.flowText}>
                • Jugador escanea su carta QR{'\n'}• Audio reproduce en
                dispositivo del Game Master (5 segundos){'\n'}• Pregunta aparece
                en pantalla del Game Master{'\n'}• Todos compiten gritando la
                respuesta{'\n'}• Game Master selecciona al ganador{'\n'}• Puntos
                se suman automáticamente
              </Text>
            </View>

            <View style={styles.flowStep}>
              <Text style={styles.flowTitle}>Rotación:</Text>
              <Text style={styles.flowText}>
                • El ganador se convierte en el próximo DJ{'\n'}• Si hay empate,
                el Game Master decide quién sigue
              </Text>
            </View>
          </View>
        </View>

        {/* Card Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🃏 TIPOS DE CARTAS</Text>
          {cardTypes.map((card, index) => (
            <View
              key={index}
              style={[styles.cardTypeItem, { borderLeftColor: card.color }]}
            >
              <View style={styles.cardTypeHeader}>
                <Text style={styles.cardTypeEmoji}>{card.emoji}</Text>
                <View style={styles.cardTypeInfo}>
                  <Text style={styles.cardTypeName}>{card.name}</Text>
                  <Text style={[styles.cardTypePoints, { color: card.color }]}>
                    {card.points}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardTypeDescription}>{card.description}</Text>
            </View>
          ))}
        </View>

        {/* Special Modes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 MODOS ESPECIALES</Text>
          {specialModes.map((mode, index) => (
            <View key={index} style={styles.specialModeItem}>
              <Text style={styles.specialModeIcon}>{mode.icon}</Text>
              <View style={styles.specialModeInfo}>
                <Text style={styles.specialModeName}>{mode.name}</Text>
                <Text style={styles.specialModeDescription}>
                  {mode.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 CONSEJOS</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tipText}>
              • Mantén el volumen alto para que todos escuchen{'\n'}• Como Game
              Master, sé justo pero rápido en las decisiones{'\n'}• ¡La
              diversión es más importante que ganar!{'\n'}• Si hay dudas, el
              Game Master tiene la palabra final
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  backButton: {
    padding: 8,
  },

  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },

  headerSpacer: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  section: {
    marginVertical: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },

  // Overview
  overviewCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  overviewText: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 24,
    textAlign: 'center',
  },

  highlight: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  // Steps
  stepsList: {
    gap: 12,
  },

  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  stepNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#10B981',
    borderRadius: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 16,
  },

  stepText: {
    fontSize: 15,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 22,
  },

  // Flow
  flowCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  flowStep: {
    marginBottom: 16,
  },

  flowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },

  flowText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },

  // Card Types
  cardTypeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  cardTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  cardTypeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },

  cardTypeInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTypeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },

  cardTypePoints: {
    fontSize: 12,
    fontWeight: '700',
  },

  cardTypeDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },

  // Special Modes
  specialModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  specialModeIcon: {
    fontSize: 24,
    marginRight: 16,
  },

  specialModeInfo: {
    flex: 1,
  },

  specialModeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },

  specialModeDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },

  // Tips
  tipsCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },

  tipText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
  },
});
