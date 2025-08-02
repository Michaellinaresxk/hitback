import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGameStore } from '@/store/gameStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
} from 'react-native';

export default function GameSetupScreen() {
  const { players, addPlayer, removePlayer, startGame } = useGameStore();
  const [playerName, setPlayerName] = useState('');

  const handleAddPlayer = () => {
    if (playerName.trim().length === 0) {
      Alert.alert('Error', 'Ingresa un nombre válido');
      return;
    }

    try {
      addPlayer(playerName.trim());
      setPlayerName('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleStartGame = () => {
    try {
      startGame();
      router.replace('/game');
    } catch (error) {
      Alert.alert('Error', error.message);
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

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎵 HITBACK</Text>
        <Text style={styles.subtitle}>Configura tu partida</Text>
      </View>

      {/* Players Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol name='person.3' size={20} color='#10B981' />
          <Text style={styles.sectionTitle}>
            JUGADORES ({players.length}/8)
          </Text>
        </View>

        <View style={styles.addPlayerContainer}>
          <TextInput
            style={styles.playerInput}
            placeholder='Nombre del jugador'
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
              Agrega jugadores para empezar
            </Text>
          </View>
        )}
      </View>

      {/* Simple Rules */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol name='info.circle' size={20} color='#F59E0B' />
          <Text style={styles.sectionTitle}>CÓMO JUGAR</Text>
        </View>

        <View style={styles.rulesContainer}>
          <Text style={styles.ruleText}>
            • Escanea cartas QR para reproducir audio
          </Text>
          <Text style={styles.ruleText}>• Compite gritando las respuestas</Text>
          <Text style={styles.ruleText}>
            • Primer jugador en llegar a 15 puntos gana
          </Text>
          <Text style={styles.ruleText}>
            • Cada partida dura 20 minutos máximo
          </Text>
        </View>
      </View>

      {/* Start Game Button */}
      <View style={styles.startGameContainer}>
        <TouchableOpacity
          style={[
            styles.startGameButton,
            players.length < 2 && styles.disabledStartButton,
          ]}
          onPress={handleStartGame}
          disabled={players.length < 2}
          activeOpacity={0.9}
        >
          <IconSymbol name='play.circle.fill' size={28} color='#FFFFFF' />
          <Text style={styles.startGameText}>EMPEZAR JUEGO</Text>
        </TouchableOpacity>

        {players.length < 2 && (
          <Text style={styles.minPlayersText}>
            Necesitas al menos 2 jugadores
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginLeft: 8,
    letterSpacing: 0.5,
  },

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

  playersList: {
    maxHeight: 300,
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

  startGameContainer: {
    padding: 24,
    alignItems: 'center',
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
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  minPlayersText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
});
