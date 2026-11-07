import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import type { CardType, Difficulty, QuestionData } from '@/types/game.types';
import { cardService, type Track } from '@/services/cardService';

interface ManagedTrack extends Track {
  qrCode?: string;
  lyrics?: string;
  cardTypes?: Partial<Record<CardType, QuestionData>>;
}

export default function MusicManager() {
  const [tracks, setTracks] = useState<ManagedTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<ManagedTrack | null>(null);
  const [filteredTracks, setFilteredTracks] = useState<ManagedTrack[]>([]);

  // New track form state
  const [newTrack, setNewTrack] = useState({
    title: '',
    artist: '',
    year: new Date().getFullYear(),
    genre: '',
    previewUrl: '',
    lyrics: '',
    difficulty: 'medium' as Difficulty,
  });

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    let active = true;
    const updateFilteredTracks = async () => {
      if (searchQuery.trim() === '') {
        setFilteredTracks(tracks);
        return;
      }
      const results = await cardService.searchTracks(searchQuery);
      if (active) setFilteredTracks(results);
    };
    void updateFilteredTracks();
    return () => {
      active = false;
    };
  }, [searchQuery, tracks]);

  const loadTracks = async () => {
    try {
      const allTracks = await cardService.getAllTracks();
      setTracks(allTracks);
      setFilteredTracks(allTracks);
    } catch (error) {
      console.error('Unable to load tracks:', error);
    }
  };

  const handleAddTrack = () => {
    if (!newTrack.title || !newTrack.artist) {
      Alert.alert('Error', 'Título y artista son obligatorios');
      return;
    }

    // Generate new track with QR codes
    const trackId = (tracks.length + 1).toString().padStart(3, '0');

    const track: ManagedTrack = {
      id: trackId,
      qrCode: `HITBACK_${trackId}`,
      title: newTrack.title,
      artist: newTrack.artist,
      year: newTrack.year,
      decade: `${Math.floor(newTrack.year / 10) * 10}s`,
      genre: newTrack.genre,
      previewUrl: newTrack.previewUrl,
      duration: 30,
      lyrics: newTrack.lyrics,
      difficulty: newTrack.difficulty,
      cardTypes: {
        song: {
          question: '¿Cuál es la canción?',
          answer: newTrack.title,
          points: 1,
        },
        artist: {
          question: '¿Quién la canta?',
          answer: newTrack.artist,
          points: 2,
        },
        decade: {
          question: '¿De qué década es?',
          answer: `${Math.floor(newTrack.year / 10) * 10}s`,
          points: 3,
        },
        lyrics: {
          question: `Completa: '${newTrack.lyrics
            .split(' ')
            .slice(0, 4)
            .join(' ')}...'`,
          answer: newTrack.lyrics.split(' ').slice(4, 8).join(' '),
          points: 3,
        },
        challenge: {
          question: `${getChallengeByGenre(newTrack.genre)} - ${
            newTrack.title
          }`,
          answer: `Completar challenge de ${newTrack.genre}`,
          points: 5,
          challengeType: getChallengeTypeByGenre(newTrack.genre),
        },
      },
    };

    // This would normally save to a database or file
    console.log('New track created:', track);

    // Reset form
    setNewTrack({
      title: '',
      artist: '',
      year: new Date().getFullYear(),
      genre: '',
      previewUrl: '',
      lyrics: '',
      difficulty: 'medium',
    });

    setShowAddModal(false);
    Alert.alert('Éxito', 'Track agregado correctamente');
  };

  const getChallengeByGenre = (genre: string): string => {
    const challenges = {
      Rock: 'Toca guitarra invisible',
      Pop: 'Canta el coro',
      Reggaeton: 'Baila reggaeton',
      'Hip Hop': 'Rapea el verso',
      Electronic: 'Baila electrónico',
      Salsa: 'Baila salsa',
      Ballad: 'Canta emotivamente',
    };
    return challenges[genre as keyof typeof challenges] || 'Imita al artista';
  };

  const getChallengeTypeByGenre = (
    genre: string
  ): NonNullable<QuestionData['challengeType']> => {
    const types: Record<string, NonNullable<QuestionData['challengeType']>> = {
      Rock: 'performance',
      Pop: 'sing',
      Reggaeton: 'dance',
      'Hip Hop': 'performance',
      Electronic: 'dance',
      Salsa: 'dance',
      Ballad: 'sing',
    };
    return types[genre] || 'imitate';
  };

  const renderTrack = ({ item: track }: { item: ManagedTrack }) => (
    <TouchableOpacity
      style={styles.trackItem}
      onPress={() => setSelectedTrack(track)}
    >
      <View style={styles.trackHeader}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        <View
          style={[
            styles.difficultyBadge,
            {
              backgroundColor: getDifficultyColor(
                (track.difficulty as Difficulty | undefined) ?? 'medium',
              ),
            },
          ]}
        >
          <Text style={styles.difficultyText}>
            {(track.difficulty ?? 'medium').toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.trackArtist}>{track.artist}</Text>
      <Text style={styles.trackInfo}>
        {track.year} • {track.genre}
      </Text>

      <View style={styles.trackFooter}>
        <Text style={styles.trackQR}>{track.qrCode ?? track.id}</Text>
        <View style={styles.cardTypesIndicator}>
          <Text style={styles.cardTypeEmoji}>🎵🎤📅📝🔥</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getDifficultyColor = (difficulty: Difficulty): string => {
    const colors = {
      easy: '#27AE60',
      medium: '#F39C12',
      hard: '#E74C3C',
      expert: '#9B59B6',
    };
    return colors[difficulty];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎵 Gestor de Música</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol name='plus' size={24} color='#FFFFFF' />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconSymbol name='magnifyingglass' size={20} color='#666666' />
          <TextInput
            style={styles.searchInput}
            placeholder='Buscar canciones, artistas, géneros...'
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tracks.length}</Text>
          <Text style={styles.statLabel}>Tracks</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tracks.length * 5}</Text>
          <Text style={styles.statLabel}>Cartas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {tracks.filter((t) => t.difficulty === 'expert').length}
          </Text>
          <Text style={styles.statLabel}>Experto</Text>
        </View>
      </View>

      {/* Tracks List */}
      <FlatList
        data={filteredTracks}
        keyExtractor={(item) => item.id}
        renderItem={renderTrack}
        style={styles.tracksList}
        contentContainerStyle={styles.tracksListContent}
      />

      {/* Add Track Modal */}
      <Modal visible={showAddModal} animationType='slide'>
        <View style={styles.addModalContainer}>
          <View style={styles.addModalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <IconSymbol name='xmark' size={24} color='#666666' />
            </TouchableOpacity>
            <Text style={styles.addModalTitle}>Agregar Track</Text>
            <TouchableOpacity onPress={handleAddTrack}>
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.addModalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Título *</Text>
              <TextInput
                style={styles.formInput}
                value={newTrack.title}
                onChangeText={(text) =>
                  setNewTrack((s) => ({ ...s, title: text }))
                }
                placeholder='Nombre de la canción'
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Artista *</Text>
              <TextInput
                style={styles.formInput}
                value={newTrack.artist}
                onChangeText={(text) =>
                  setNewTrack((s) => ({ ...s, artist: text }))
                }
                placeholder='Nombre del artista'
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Año</Text>
                <TextInput
                  style={styles.formInput}
                  value={newTrack.year.toString()}
                  onChangeText={(text) =>
                    setNewTrack((s) => ({
                      ...s,
                      year: parseInt(text) || s.year,
                    }))
                  }
                  placeholder='2024'
                  keyboardType='numeric'
                />
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Género</Text>
                <TextInput
                  style={styles.formInput}
                  value={newTrack.genre}
                  onChangeText={(text) =>
                    setNewTrack((s) => ({ ...s, genre: text }))
                  }
                  placeholder='Pop, Rock, etc.'
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>URL de Preview</Text>
              <TextInput
                style={styles.formInput}
                value={newTrack.previewUrl}
                onChangeText={(text) =>
                  setNewTrack((s) => ({ ...s, previewUrl: text }))
                }
                placeholder='https://...'
                keyboardType='url'
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Letra (primeras líneas)</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={newTrack.lyrics}
                onChangeText={(text) =>
                  setNewTrack((s) => ({ ...s, lyrics: text }))
                }
                placeholder='Primeras líneas de la canción...'
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Dificultad</Text>
              <View style={styles.difficultySelector}>
                {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(
                  (diff) => (
                    <TouchableOpacity
                      key={diff}
                      style={[
                        styles.difficultyOption,
                        { backgroundColor: getDifficultyColor(diff) },
                        newTrack.difficulty === diff &&
                          styles.selectedDifficulty,
                      ]}
                      onPress={() =>
                        setNewTrack((s) => ({ ...s, difficulty: diff }))
                      }
                    >
                      <Text style={styles.difficultyOptionText}>
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Track Detail Modal */}
      <Modal visible={!!selectedTrack} transparent animationType='fade'>
        {selectedTrack && (
          <View style={styles.detailOverlay}>
            <View style={styles.detailModal}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selectedTrack.title}</Text>
                <TouchableOpacity onPress={() => setSelectedTrack(null)}>
                  <IconSymbol name='xmark' size={24} color='#666666' />
                </TouchableOpacity>
              </View>

              <Text style={styles.detailArtist}>{selectedTrack.artist}</Text>
              <Text style={styles.detailInfo}>
                {selectedTrack.year} • {selectedTrack.genre}
              </Text>

              <View style={styles.cardTypesGrid}>
                {(
                  Object.entries(selectedTrack.cardTypes ?? {}) as [
                    CardType,
                    QuestionData,
                  ][]
                ).map(
                  ([type, details]) => (
                    <View key={type} style={styles.cardTypeCard}>
                      <Text style={styles.cardTypeHeader}>
                        {cardService.getCardTypeEmoji(type as CardType)}{' '}
                        {type.toUpperCase()}
                      </Text>
                      <Text style={styles.cardTypeQuestion}>
                        {details.question}
                      </Text>
                      <Text style={styles.cardTypeAnswer}>
                        ✅ {details.answer}
                      </Text>
                      <Text style={styles.cardTypePoints}>
                        {details.points} pts
                      </Text>
                    </View>
                  )
                )}
              </View>

              <View style={styles.qrCodesSection}>
                <Text style={styles.qrSectionTitle}>Códigos QR Generados:</Text>
                {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(
                  (difficulty) => (
                    <View key={difficulty} style={styles.qrCodeItem}>
                      <Text style={styles.qrCodeDifficulty}>
                        {difficulty.toUpperCase()}:
                      </Text>
                      <Text style={styles.qrCodeValue}>
                        {selectedTrack.qrCode ?? 'No song QR; rounds use the game API'}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1A1A2E',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  tracksList: {
    flex: 1,
  },
  tracksListContent: {
    paddingHorizontal: 15,
  },
  trackItem: {
    backgroundColor: '#FFFFFF',
    marginVertical: 5,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackArtist: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 3,
  },
  trackInfo: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
  },
  trackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackQR: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#4ECDC4',
    fontWeight: '600',
  },
  cardTypesIndicator: {},
  cardTypeEmoji: {
    fontSize: 14,
  },
  // Add Modal Styles
  addModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  addModalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroupHalf: {
    flex: 1,
    marginHorizontal: 5,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  difficultySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedDifficulty: {
    borderWidth: 3,
    borderColor: '#1A1A2E',
  },
  difficultyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Detail Modal Styles
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModal: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 25,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },
  detailArtist: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 5,
  },
  detailInfo: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 20,
  },
  cardTypesGrid: {
    marginBottom: 20,
  },
  cardTypeCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTypeHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 5,
  },
  cardTypeQuestion: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 3,
  },
  cardTypeAnswer: {
    fontSize: 13,
    color: '#27AE60',
    fontWeight: '600',
    marginBottom: 3,
  },
  cardTypePoints: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  qrCodesSection: {
    backgroundColor: '#F0F9FF',
    padding: 15,
    borderRadius: 12,
  },
  qrSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  qrCodeItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  qrCodeDifficulty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    width: 70,
  },
  qrCodeValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#4ECDC4',
    flex: 1,
  },
});
