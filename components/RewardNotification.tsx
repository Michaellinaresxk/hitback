import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Difficulty, ComboReward, PowerCard } from '@/types/game.types';

const { width, height } = Dimensions.get('window');

interface RewardNotificationProps {
  visible: boolean;
  onClose: () => void;
  playerName: string;
  difficulty: Difficulty;
  powerCardWon?: PowerCard;
  bonusTokens: number;
  combosAchieved: ComboReward[];
}

export default function RewardNotification({
  visible,
  onClose,
  playerName,
  difficulty,
  powerCardWon,
  bonusTokens,
  combosAchieved,
}: RewardNotificationProps) {
  const [animatedValue] = useState(new Animated.Value(0));
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowDetails(false);
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(animatedValue, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowDetails(true);
      });
    } else {
      animatedValue.setValue(0);
    }
  }, [visible]);

  const getDifficultyConfig = (difficulty: Difficulty) => {
    const configs = {
      easy: {
        emoji: '🌟',
        color: '#27AE60',
        title: 'Buen trabajo!',
        message: 'Respuesta correcta!',
      },
      medium: {
        emoji: '💫',
        color: '#F39C12',
        title: '¡Excelente!',
        message: 'Pregunta de dificultad media!',
      },
      hard: {
        emoji: '🔥',
        color: '#E74C3C',
        title: '¡Increíble!',
        message: 'Pregunta difícil dominada!',
      },
      expert: {
        emoji: '👑',
        color: '#9B59B6',
        title: '¡LEGENDARY!',
        message: 'Nivel experto desbloqueado!',
      },
    };
    return configs[difficulty];
  };

  const config = getDifficultyConfig(difficulty);
  const hasRewards =
    powerCardWon || bonusTokens > 0 || combosAchieved.length > 0;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: animatedValue }],
              backgroundColor: config.color,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>{config.emoji}</Text>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.playerName}>{playerName}</Text>
            <Text style={styles.message}>{config.message}</Text>
          </View>

          {/* Rewards Section */}
          {hasRewards && showDetails && (
            <View style={styles.rewardsContainer}>
              <Text style={styles.rewardsTitle}>🎁 PREMIOS GANADOS</Text>

              {/* Bonus Tokens */}
              {bonusTokens > 0 && (
                <View style={styles.rewardItem}>
                  <View style={styles.rewardIcon}>
                    <Text style={styles.rewardEmoji}>🪙</Text>
                  </View>
                  <View style={styles.rewardText}>
                    <Text style={styles.rewardTitle}>Tokens Bonus</Text>
                    <Text style={styles.rewardDescription}>
                      +{bonusTokens} token{bonusTokens > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* Power Card */}
              {powerCardWon && (
                <View style={styles.rewardItem}>
                  <View style={styles.rewardIcon}>
                    <Text style={styles.rewardEmoji}>{powerCardWon.emoji}</Text>
                  </View>
                  <View style={styles.rewardText}>
                    <Text style={styles.rewardTitle}>Carta de Poder</Text>
                    <Text style={styles.rewardDescription}>
                      {powerCardWon.name}
                    </Text>
                    <Text style={styles.rewardSubtext}>
                      {powerCardWon.description}
                    </Text>
                  </View>
                </View>
              )}

              {/* Combos */}
              {combosAchieved.map((combo, index) => (
                <View key={index} style={styles.rewardItem}>
                  <View style={styles.rewardIcon}>
                    <Text style={styles.rewardEmoji}>🔥</Text>
                  </View>
                  <View style={styles.rewardText}>
                    <Text style={styles.rewardTitle}>¡COMBO!</Text>
                    <Text style={styles.rewardDescription}>
                      {combo.type === 'tokens' && `+${combo.amount} tokens`}
                      {combo.type === 'points' && `+${combo.amount} puntos`}
                      {combo.type === 'power_card' && 'Carta de poder extra'}
                      {combo.type === 'multiplier' &&
                        `${combo.amount}x próxima ronda`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <IconSymbol
              name='checkmark.circle.fill'
              size={24}
              color='#FFFFFF'
            />
            <Text style={styles.continueText}>Continuar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Combo Achievement Notification Component
interface ComboNotificationProps {
  visible: boolean;
  onClose: () => void;
  comboName: string;
  comboEmoji: string;
  comboDescription: string;
  playerName: string;
}

export function ComboNotification({
  visible,
  onClose,
  comboName,
  comboEmoji,
  comboDescription,
  playerName,
}: ComboNotificationProps) {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      );
      pulse.start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.comboOverlay}>
        <Animated.View
          style={[styles.comboContainer, { transform: [{ scale: pulseAnim }] }]}
        >
          <Text style={styles.comboEmoji}>{comboEmoji}</Text>
          <Text style={styles.comboTitle}>¡COMBO!</Text>
          <Text style={styles.comboName}>{comboName}</Text>
          <Text style={styles.comboPlayer}>{playerName}</Text>
          <Text style={styles.comboDescription}>{comboDescription}</Text>

          <TouchableOpacity style={styles.comboCloseButton} onPress={onClose}>
            <Text style={styles.comboCloseText}>🎉 ¡Genial!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  playerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  rewardsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rewardEmoji: {
    fontSize: 24,
  },
  rewardText: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  rewardSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  continueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  // Combo notification styles
  comboOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comboContainer: {
    backgroundColor: '#FFD700',
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  comboEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  comboTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
    marginBottom: 5,
  },
  comboName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  comboPlayer: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 10,
  },
  comboDescription: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  comboCloseButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  comboCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
