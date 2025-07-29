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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
      Alert.alert('Error', 'Enter a valid name');
      return;
    }

    if (
      players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())
    ) {
      Alert.alert('Error', 'Player with this name already exists');
      return;
    }

    if (players.length >= 8) {
      Alert.alert('Error', 'Maximum 8 players allowed');
      return;
    }

    addPlayer(playerName.trim());
    setPlayerName('');
  };

  const handleStartGame = () => {
    if (players.length < 2) {
      Alert.alert('Error', 'At least 2 players needed to start');
      return;
    }

    try {
      startGame();
      router.replace('/game');
    } catch (error) {
      Alert.alert('Error', 'Could not start the game');
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

      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        <View style={styles.playerStartingItems}>
          <View style={styles.startingItem}>
            <IconSymbol
              name='bitcoinsign.circle.fill'
              size={14}
              color='#F59E0B'
            />
            <Text style={styles.itemCount}>5</Text>
          </View>
          <View style={styles.startingItem}>
            <IconSymbol name='sparkles' size={14} color='#8B5CF6' />
            <Text style={styles.itemCount}>3</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removePlayer(player.id)}
        activeOpacity={0.7}
      >
        <IconSymbol name='trash' size={18} color='#EF4444' />
      </TouchableOpacity>
    </View>
  );

  const renderGameSetting = (
    title: string,
    value: number | boolean,
    onPress: () => void,
    unit?: string,
    icon?: string
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.settingLeft}>
        {icon && <IconSymbol name={icon} size={20} color='#64748B' />}
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <View style={styles.settingValue}>
        <Text style={styles.settingValueText}>
          {typeof value === 'boolean'
            ? value
              ? 'ON'
              : 'OFF'
            : `${value}${unit || ''}`}
        </Text>
        <IconSymbol name='chevron.right' size={16} color='#94A3B8' />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>HITBACK</Text>
        <Text style={styles.subtitle}>Game Setup</Text>
      </View>

      <KeyboardAwareScrollView>
        {/* Game Master Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name='person.badge.key' size={20} color='#3B82F6' />
            <Text style={styles.sectionTitle}>GAME MASTER</Text>
          </View>
          <View style={styles.gameMasterCard}>
            <IconSymbol name='crown.fill' size={32} color='#3B82F6' />
            <View style={styles.gameMasterInfo}>
              <Text style={styles.gameMasterTitle}>
                You are the Game Master
              </Text>
              <Text style={styles.gameMasterDescription}>
                Control the game, scan cards and decide winners
              </Text>
            </View>
          </View>
        </View>

        {/* Players Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name='person.3' size={20} color='#10B981' />
            <Text style={styles.sectionTitle}>
              PLAYERS ({players.length}/8)
            </Text>
          </View>

          <View style={styles.addPlayerContainer}>
            <TextInput
              style={styles.playerInput}
              placeholder='Player name'
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
                Add players to get started
              </Text>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Game Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol name='gear' size={20} color='#8B5CF6' />
          <Text style={styles.sectionTitle}>SETTINGS</Text>
        </View>

        {renderGameSetting(
          'Game Duration',
          gameSettings.timeLimit,
          () => {
            Alert.alert('Game Duration', 'Select duration', [
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
              { text: 'Cancel', style: 'cancel' },
            ]);
          },
          ' min',
          'clock'
        )}

        {renderGameSetting(
          'Points to Win',
          gameSettings.winCondition,
          () => {
            Alert.alert('Points to Win', 'Select required points', [
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
              { text: 'Cancel', style: 'cancel' },
            ]);
          },
          ' pts',
          'trophy'
        )}

        {renderGameSetting(
          'Power Cards',
          gameSettings.enablePowerCards,
          () =>
            setGameSettings((s) => ({
              ...s,
              enablePowerCards: !s.enablePowerCards,
            })),
          undefined,
          'sparkles'
        )}

        {renderGameSetting(
          'Betting System',
          gameSettings.enableBetting,
          () =>
            setGameSettings((s) => ({
              ...s,
              enableBetting: !s.enableBetting,
            })),
          undefined,
          'dice.fill'
        )}

        {renderGameSetting(
          'Combo System',
          gameSettings.enableCombos,
          () =>
            setGameSettings((s) => ({ ...s, enableCombos: !s.enableCombos })),
          undefined,
          'flame.fill'
        )}
      </View>

      {/* Game Rules Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol name='list.clipboard' size={20} color='#F59E0B' />
          <Text style={styles.sectionTitle}>HOW TO PLAY</Text>
        </View>
        <View style={styles.rulesCard}>
          <View style={styles.ruleItem}>
            <View style={styles.ruleIcon}>
              <IconSymbol
                name='bitcoinsign.circle.fill'
                size={16}
                color='#F59E0B'
              />
            </View>
            <Text style={styles.ruleText}>
              Each player starts with 5 tokens and 3 power cards
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleIcon}>
              <IconSymbol name='qrcode.viewfinder' size={16} color='#3B82F6' />
            </View>
            <Text style={styles.ruleText}>
              Game Master scans QR music cards
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleIcon}>
              <IconSymbol name='speaker.wave.3' size={16} color='#10B981' />
            </View>
            <Text style={styles.ruleText}>
              Audio plays for 5 seconds, then question appears
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleIcon}>
              <IconSymbol name='person.3' size={16} color='#8B5CF6' />
            </View>
            <Text style={styles.ruleText}>
              Players compete by shouting the answer
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <View style={styles.ruleIcon}>
              <IconSymbol name='trophy' size={16} color='#EF4444' />
            </View>
            <Text style={styles.ruleText}>
              First player to reach {gameSettings.winCondition} points wins!
            </Text>
          </View>
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
          <Text style={styles.startGameText}>START GAME</Text>
        </TouchableOpacity>

        {players.length < 2 && (
          <Text style={styles.minPlayersText}>You need at least 2 players</Text>
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

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },

  // Sections
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
    textTransform: 'uppercase',
  },

  // Game Master
  gameMasterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  gameMasterInfo: {
    marginLeft: 16,
    flex: 1,
  },
  gameMasterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  gameMasterDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },

  // Players
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
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  playerStartingItems: {
    flexDirection: 'row',
    gap: 12,
  },
  startingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    marginLeft: 4,
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

  // Settings
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F8FAFC',
    marginLeft: 12,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginRight: 8,
  },

  // Rules
  rulesCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ruleText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    flex: 1,
  },

  // Start Game
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
