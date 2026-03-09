import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getPhaseLabel, getPhaseStyle } from '@/utils/game/phaseStyler';
import { formatTime } from '@/utils/timeFormatter';

interface GameHeaderProps {
  timeLeft: number;
  currentPhase: string;
  onOpenAlliances: () => void; // ← nuevo prop
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  timeLeft,
  currentPhase,
  onOpenAlliances,
}) => {
  const phaseStyle = getPhaseStyle(currentPhase);
  const phaseLabel = getPhaseLabel(currentPhase);

  return (
    <View style={styles.header}>
      <View style={styles.gameInfo}>
        <Text style={styles.gameTitle}>HITBACK</Text>
        <View style={[styles.gameModeIndicator, phaseStyle]}>
          <Text style={styles.gameModeText}>{phaseLabel}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Botón alianzas */}
        <TouchableOpacity
          style={styles.allianceButton}
          onPress={onOpenAlliances}
          activeOpacity={0.75}
        >
          <Text style={styles.allianceEmoji}>🤝</Text>
        </TouchableOpacity>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <IconSymbol name='clock' size={16} color='#F8FAFC' />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  gameModeIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  gameModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  allianceButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allianceEmoji: {
    fontSize: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timerText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
});
