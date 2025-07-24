import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  StatusBar,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGameStore } from '@/store/gameStore';
import { router } from 'expo-router';

export default function GameSetupScreen() {
  const { players, addPlayer, removePlayer, startGame } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [gameSettings, setGameSettings] = useState({
    timeLimit: 20, // minutes
    winCondition: 15, // points to win
    enablePowerCards: true,
    enableBetting: true,
    enableCombos: true,
  });

  const handleAddPlayer = () => {
    if (playerName.trim().length === 0) {
      Alert.alert('Error', 'Ingresa un nombre válido');
      return;
    }

    if (
      players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())
    ) {
      Alert.alert('Error', 'Ya existe un jugador con ese nombre');
      return;
    }

    if (players.length >= 6) {
      Alert.alert('Error', 'Máximo 6 jugadores permitidos');
      return;
    }

    addPlayer(playerName.trim());
    setPlayerName('');
  };

  const handleStartGame = () => {
    if (players.length < 2) {
      Alert.alert('Error', 'Se necesitan al menos 2 jugadores para empezar');
      return;
    }

    try {
      startGame();
      router.replace('/game');
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el juego');
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
      <View style={styles.playerInfo}>
        <Text style={styles.playerNumber}>{index + 1}</Text>
        <Text style={styles.playerName}>{player.name}</Text>
        <View style={styles.playerStartingItems}>
          <View style={styles.startingItem}>
            <Text style={styles.itemEmoji}>🪙</Text>
            <Text style={styles.itemCount}>5</Text>
          </View>
          <View style={styles.startingItem}>
            <Text style={styles.itemEmoji}>⚡</Text>
            <Text style={styles.itemCount}>3</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removePlayer(player.id)}
      >
        <IconSymbol name='trash' size={20} color='#E74C3C' />
      </TouchableOpacity>
    </View>
  );

  const renderGameSetting = (
    title: string,
    value: number | boolean,
    onPress: () => void,
    unit?: string
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <Text style={styles.settingTitle}>{title}</Text>
      <View style={styles.settingValue}>
        <Text style={styles.settingValueText}>
          {typeof value === 'boolean'
            ? value
              ? 'ON'
              : 'OFF'
            : `${value}${unit || ''}`}
        </Text>
        <IconSymbol name='chevron.right' size={16} color='#666666' />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#F8F9FA' />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎵 HITBACK</Text>
        <Text style={styles.subtitle}>Configuración del Juego</Text>
      </View>

      {/* Game Master Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎮 GAME MASTER</Text>
        <View style={styles.gameMasterCard}>
          <IconSymbol name='person.badge.key' size={32} color='#4ECDC4' />
          <View style={styles.gameMasterInfo}>
            <Text style={styles.gameMasterTitle}>Tú eres el Game Master</Text>
            <Text style={styles.gameMasterDescription}>
              Controlas el juego, escaneas cartas y decides ganadores
            </Text>
          </View>
        </View>
      </View>

      {/* Players Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          👥 JUGADORES ({players.length}/6)
        </Text>

        <View style={styles.addPlayerContainer}>
          <TextInput
            style={styles.playerInput}
            placeholder='Nombre del jugador'
            value={playerName}
            onChangeText={setPlayerName}
            onSubmitEditing={handleAddPlayer}
            maxLength={15}
          />
          <TouchableOpacity
            style={styles.addPlayerButton}
            onPress={handleAddPlayer}
          >
            <IconSymbol name='plus' size={24} color='#FFFFFF' />
          </TouchableOpacity>
        </View>

        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayer}
          style={styles.playersList}
          scrollEnabled={false}
        />

        {players.length === 0 && (
          <View style={styles.emptyPlayersContainer}>
            <IconSymbol name='person.3' size={48} color='#CCCCCC' />
            <Text style={styles.emptyPlayersText}>
              Agrega jugadores para empezar
            </Text>
          </View>
        )}
      </View>

      {/* Game Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ CONFIGURACIÓN</Text>

        {renderGameSetting(
          'Tiempo de juego',
          gameSettings.timeLimit,
          () => {
            Alert.alert('Tiempo de juego', 'Selecciona la duración', [
              {
                text: '15 min',
                onPress: () =>
                  setGameSettings((s) => ({ ...s, timeLimit: 15 })),
              },
              {
                text: '20 min',
                onPress: () =>
                  setGameSettings((s) => ({ ...s, timeLimit: 20 })),
              },
              {
                text: '30 min',
                onPress: () =>
                  setGameSettings((s) => ({ ...s, timeLimit: 30 })),
              },
              { text: 'Cancelar', style: 'cancel' },
            ]);
          },
          ' min'
        )}

        {renderGameSetting(
          'Puntos para ganar',
          gameSettings.winCondition,
          () => {
            Alert.alert(
              'Puntos para ganar',
              'Selecciona los puntos necesarios',
              [
                {
                  text: '10 pts',
                  onPress: () =>
                    setGameSettings((s) => ({ ...s, winCondition: 10 })),
                },
                {
                  text: '15 pts',
                  onPress: () =>
                    setGameSettings((s) => ({ ...s, winCondition: 15 })),
                },
                {
                  text: '20 pts',
                  onPress: () =>
                    setGameSettings((s) => ({ ...s, winCondition: 20 })),
                },
                { text: 'Cancelar', style: 'cancel' },
              ]
            );
          },
          ' pts'
        )}

        {renderGameSetting(
          'Cartas de Poder',
          gameSettings.enablePowerCards,
          () =>
            setGameSettings((s) => ({
              ...s,
              enablePowerCards: !s.enablePowerCards,
            }))
        )}

        {renderGameSetting(
          'Sistema de Apuestas',
          gameSettings.enableBetting,
          () =>
            setGameSettings((s) => ({ ...s, enableBetting: !s.enableBetting }))
        )}

        {renderGameSetting('Combos', gameSettings.enableCombos, () =>
          setGameSettings((s) => ({ ...s, enableCombos: !s.enableCombos }))
        )}
      </View>

      {/* Game Rules Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 RESUMEN</Text>
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>¿Cómo jugar?</Text>
          <Text style={styles.rulesText}>
            • Cada jugador empieza con 5 tokens 🪙 y 3 cartas de poder ⚡{'\n'}•
            Game Master escanea cartas QR musicales{'\n'}• Suena audio por 5
            segundos, luego aparece pregunta{'\n'}• Los jugadores compiten
            gritando la respuesta{'\n'}• Gana puntos: 🎵 Canción (1pt), 🎤
            Artista (2pts), 📅 Década (3pts){'\n'}• Puedes apostar tokens para
            multiplicar puntos{'\n'}• ¡Primer jugador en{' '}
            {gameSettings.winCondition} puntos gana!
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
        >
          <IconSymbol name='play.circle.fill' size={32} color='#FFFFFF' />
          <Text style={styles.startGameText}>INICIAR JUEGO</Text>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1A1A2E',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  section: {
    margin: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 15,
  },
  gameMasterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 15,
    borderRadius: 12,
  },
  gameMasterInfo: {
    marginLeft: 15,
    flex: 1,
  },
  gameMasterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 3,
  },
  gameMasterDescription: {
    fontSize: 14,
    color: '#666666',
  },
  addPlayerContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  playerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  addPlayerButton: {
    backgroundColor: '#4ECDC4',
    marginLeft: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playersList: {
    maxHeight: 300,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4ECDC4',
    marginRight: 15,
    minWidth: 25,
    textAlign: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  playerStartingItems: {
    flexDirection: 'row',
  },
  startingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  itemEmoji: {
    fontSize: 16,
    marginRight: 3,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  removeButton: {
    padding: 5,
  },
  emptyPlayersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPlayersText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
    marginRight: 5,
  },
  rulesCard: {
    backgroundColor: '#F0F9FF',
    padding: 15,
    borderRadius: 12,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  rulesText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  startGameContainer: {
    padding: 20,
    alignItems: 'center',
  },
  startGameButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    marginBottom: 10,
  },
  disabledStartButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  startGameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  minPlayersText: {
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
  },
});
