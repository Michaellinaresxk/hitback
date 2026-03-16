// app/(tabs)/setup-game.tsx - HITBACK Game Setup V2
// ✅ Selección de géneros y décadas
// ✅ Crea sesión en el backend
// ✅ Sin QR - control desde la app

import { IconSymbol } from '@/components/ui/IconSymbol';
import { GAME_DURATION } from '@/constants/Game';
import { gameSessionService } from '@/services/GameSessionService';
import { useGameStore } from '@/store/gameStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

// 🎵 Géneros disponibles
const AVAILABLE_GENRES = [
  { id: 'ROCK', label: 'Rock', emoji: '🎸' },
  { id: 'POP', label: 'Pop', emoji: '🎤' },
  { id: 'LATIN', label: 'Latin', emoji: '💃' },
  { id: 'HIP_HOP', label: 'Hip Hop', emoji: '🎧' },
  { id: 'ELECTRONIC', label: 'Electronic', emoji: '🎹' },
  { id: 'R&B', label: 'R&B', emoji: '🎷' },
  { id: 'COUNTRY', label: 'Country', emoji: '🤠' },
  { id: 'JAZZ', label: 'Jazz', emoji: '🎺' },
];

// 📅 Décadas disponibles
const AVAILABLE_DECADES = [
  { id: '1970s', label: '70s', emoji: '🕺' },
  { id: '1980s', label: '80s', emoji: '📼' },
  { id: '1990s', label: '90s', emoji: '💿' },
  { id: '2000s', label: '2000s', emoji: '📀' },
  { id: '2010s', label: '2010s', emoji: '📱' },
  { id: '2020s', label: '2020s', emoji: '🔥' },
];

export default function GameSetupScreen() {
  const { players, addPlayer, removePlayer, startGame } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedDecades, setSelectedDecades] = useState<string[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const { t } = useTranslation();

  const { gameDurationMinutes } = useGameStore();

  const handleAddPlayer = () => {
    if (playerName.trim().length === 0) {
      Alert.alert('Error', 'Ingresa un nombre válido');
      return;
    }

    try {
      addPlayer(playerName.trim());
      setPlayerName('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((g) => g !== genreId)
        : [...prev, genreId],
    );
  };

  const toggleDecade = (decadeId: string) => {
    setSelectedDecades((prev) =>
      prev.includes(decadeId)
        ? prev.filter((d) => d !== decadeId)
        : [...prev, decadeId],
    );
  };

  const handleStartGame = async () => {
    if (players.length < 2) {
      Alert.alert('Error', 'Se necesitan al menos 2 jugadores');
      return;
    }

    // Si no seleccionaron nada, usar ANY
    const genres = selectedGenres.length > 0 ? selectedGenres : ['ANY'];
    const decades = selectedDecades.length > 0 ? selectedDecades : ['ANY'];

    setIsCreatingSession(true);

    try {
      // 1. Crear sesión en el backend
      const result = await gameSessionService.createSession({
        players: players.map((p) => p.name),
        genres,
        decades,
        difficulty: 'ANY',
        targetScore: 15,
        timeLimit: gameDurationMinutes * 60,
        tokensPerPlayer: 5,
        powerCardsPerPlayer: 3,
      });

      if (!result.success) {
        throw new Error('No se pudo crear la sesión');
      }

      console.log(`✅ Session created: ${result.session.id}`);

      // 2. Iniciar el juego en el backend
      await gameSessionService.startGame();

      // 3. Iniciar juego local
      startGame();

      // 4. Navegar a la pantalla de juego
      router.replace('/game');
    } catch (error: any) {
      console.error('❌ Error creating session:', error);
      Alert.alert(
        'Error de Conexión',
        'No se pudo conectar al servidor. ¿Está el backend corriendo?\n\n' +
          error.message,
      );
    } finally {
      setIsCreatingSession(false);
    }
  };

  const renderPlayer = ({
    item: player,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <View style={styles.playerItem}>
      <View style={styles.playerNumber}>
        <Text style={styles.playerNumberText}>{index + 1}</Text>
      </View>

      <Text style={styles.playerName}>{player.name}</Text>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removePlayer(player.id)}
        activeOpacity={0.7}
      >
        <IconSymbol name='trash' size={18} color='#EF4444' />
      </TouchableOpacity>
    </View>
  );

  const renderGenreItem = ({
    item,
  }: {
    item: { id: string; label: string; emoji: string };
  }) => {
    const isSelected = selectedGenres.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.filterItem, isSelected && styles.filterItemSelected]}
        onPress={() => toggleGenre(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.filterEmoji}>{item.emoji}</Text>
        <Text
          style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDecadeItem = ({
    item,
  }: {
    item: { id: string; label: string; emoji: string };
  }) => {
    const isSelected = selectedDecades.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.filterItem, isSelected && styles.filterItemSelected]}
        onPress={() => toggleDecade(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.filterEmoji}>{item.emoji}</Text>
        <Text
          style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎵 HITBACK</Text>
        <Text style={styles.subtitle}>{t('setupGame.config_game')}</Text>
      </View>

      {/* Players Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol name='person.3' size={20} color='#10B981' />
          <Text style={styles.sectionTitle}>
            {t('setupGame.players_count')} ({players.length}/8)
          </Text>
        </View>

        <View style={styles.addPlayerContainer}>
          <TextInput
            style={styles.playerInput}
            placeholder={t('setupGame.player_placeholder')}
            placeholderTextColor='#64748B'
            value={playerName}
            onChangeText={setPlayerName}
            onSubmitEditing={handleAddPlayer}
            maxLength={15}
          />
          <TouchableOpacity
            style={styles.addPlayerButton}
            onPress={handleAddPlayer}
            activeOpacity={0.8}
          >
            <IconSymbol name='plus' size={20} color='#FFFFFF' />
          </TouchableOpacity>
        </View>

        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayer}
          style={styles.playersList}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />

        {players.length === 0 && (
          <View style={styles.emptyPlayersContainer}>
            <IconSymbol name='person.3' size={48} color='#475569' />
            <Text style={styles.emptyPlayersText}>
              {t('setupGame.empty_players')}
            </Text>
          </View>
        )}
      </View>

      {/* 🎵 Genres Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol name='music.note.list' size={20} color='#8B5CF6' />
          <Text style={styles.sectionTitle}>
            Géneros Musicales{' '}
            {selectedGenres.length > 0 && `(${selectedGenres.length})`}
          </Text>
        </View>

        <Text style={styles.sectionSubtitle}>
          Selecciona los géneros que quieres escuchar (o deja vacío para todos)
        </Text>

        <FlatList
          data={AVAILABLE_GENRES}
          keyExtractor={(item) => item.id}
          renderItem={renderGenreItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* 📅 Decades Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol name='calendar' size={20} color='#F59E0B' />
          <Text style={styles.sectionTitle}>
            Décadas{' '}
            {selectedDecades.length > 0 && `(${selectedDecades.length})`}
          </Text>
        </View>

        <Text style={styles.sectionSubtitle}>
          Selecciona las décadas que prefieres (o deja vacío para todas)
        </Text>

        <FlatList
          data={AVAILABLE_DECADES}
          keyExtractor={(item) => item.id}
          renderItem={renderDecadeItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Selected Filters Summary */}
      {(selectedGenres.length > 0 || selectedDecades.length > 0) && (
        <View style={styles.filtersSummary}>
          <Text style={styles.filtersSummaryTitle}>Tu selección:</Text>
          <Text style={styles.filtersSummaryText}>
            {selectedGenres.length > 0
              ? selectedGenres.join(', ')
              : 'Todos los géneros'}
            {' • '}
            {selectedDecades.length > 0
              ? selectedDecades.join(', ')
              : 'Todas las décadas'}
          </Text>
        </View>
      )}

      {/* Simple Rules */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol name='info.circle' size={20} color='#F59E0B' />
          <Text style={styles.sectionTitle}>{t('setupGame.how_to_play')}</Text>
        </View>

        <View style={styles.rulesContainer}>
          <Text style={styles.ruleText}>
            • Presiona "Siguiente Canción" para empezar cada ronda
          </Text>
          <Text style={styles.ruleText}>
            • Escucha el audio y apuesta tokens si crees saber la respuesta
          </Text>
          <Text style={styles.ruleText}>
            • El Game Master selecciona quién respondió correctamente
          </Text>
          <Text style={styles.ruleText}>
            • ¡El primero en llegar a 15 puntos gana! 🏆
          </Text>
        </View>
      </View>

      {/* Start Game Button */}
      <View style={styles.startGameContainer}>
        <TouchableOpacity
          style={[
            styles.startGameButton,
            (players.length < 2 || isCreatingSession) &&
              styles.disabledStartButton,
          ]}
          onPress={handleStartGame}
          disabled={players.length < 2 || isCreatingSession}
          activeOpacity={0.9}
        >
          {isCreatingSession ? (
            <>
              <ActivityIndicator size='small' color='#FFFFFF' />
              <Text style={styles.startGameText}>Conectando...</Text>
            </>
          ) : (
            <>
              <IconSymbol name='play.circle.fill' size={28} color='#FFFFFF' />
              <Text style={styles.startGameText}>
                {t('setupGame.start_game')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {players.length < 2 && (
          <Text style={styles.minPlayersText}>
            {t('setupGame.min_players_warning')}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },

  section: {
    margin: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },

  // Player input
  addPlayerContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  playerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#F8FAFC',
  },
  addPlayerButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },

  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },

  emptyPlayersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPlayersText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '500',
  },

  // Filter items (genres/decades)
  filterList: {
    paddingVertical: 8,
  },
  filterItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  filterItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  filterEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterLabelSelected: {
    color: '#3B82F6',
  },

  // Filters summary
  filtersSummary: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  filtersSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  filtersSummaryText: {
    fontSize: 14,
    color: '#CBD5E1',
  },

  // Rules
  rulesContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  ruleText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
    marginBottom: 8,
  },

  // Start game
  startGameContainer: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 100, // Space for tab bar
  },
  startGameButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    gap: 12,
  },
  disabledStartButton: {
    backgroundColor: '#475569',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  startGameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  minPlayersText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
  },
  testConnectionButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  testConnectionText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '600',
  },
});
