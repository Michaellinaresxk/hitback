import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/store/gameStore';

export default function SetupGameScreen() {
  const router = useRouter();
  const { players, addPlayer, removePlayer, startGame, createNewGame } =
    useGameStore();
  const [playerName, setPlayerName] = useState('');

  React.useEffect(() => {
    // Crear nueva partida al entrar
    createNewGame();
  }, []);

  const handleAddPlayer = () => {
    if (playerName.trim().length < 2) {
      Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (
      players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())
    ) {
      Alert.alert('Error', 'Ya existe un jugador con ese nombre');
      return;
    }

    if (players.length >= 8) {
      Alert.alert('Error', 'Máximo 8 jugadores');
      return;
    }

    addPlayer(playerName);
    setPlayerName('');
  };

  const handleStartGame = () => {
    if (players.length < 2) {
      Alert.alert('Error', 'Se necesitan al menos 2 jugadores');
      return;
    }

    startGame();
    router.push('/(tabs)/game');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name='chevron.left' size={24} color='#007AFF' />
        </TouchableOpacity>
        <Text style={styles.title}>Nueva Partida</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.addPlayerSection}>
        <ThemedText style={styles.sectionTitle}>Agregar Jugadores</ThemedText>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder='Nombre del jugador'
            maxLength={20}
            onSubmitEditing={handleAddPlayer}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
            <IconSymbol name='plus' size={20} color='#FFFFFF' />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.playersSection}>
        <ThemedText style={styles.sectionTitle}>
          Jugadores ({players.length}/8)
        </ThemedText>

        {players.length === 0 ? (
          <Text style={styles.emptyText}>No hay jugadores agregados</Text>
        ) : (
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.playerItem}>
                <Text style={styles.playerNumber}>{index + 1}</Text>
                <Text style={styles.playerName}>{item.name}</Text>
                <TouchableOpacity
                  onPress={() => removePlayer(item.id)}
                  style={styles.removeButton}
                >
                  <IconSymbol name='trash' size={16} color='#FF3B30' />
                </TouchableOpacity>
              </View>
            )}
            style={styles.playersList}
          />
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          players.length < 2 && styles.disabledButton,
        ]}
        onPress={handleStartGame}
        disabled={players.length < 2}
      >
        <IconSymbol name='play.fill' size={24} color='#FFFFFF' />
        <Text style={styles.startButtonText}>Comenzar Juego</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addPlayerSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    width: 44,
  },
  playersSection: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginTop: 20,
  },
  playersList: {
    maxHeight: 300,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 8,
  },
  playerNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 30,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  removeButton: {
    padding: 5,
  },
  startButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
