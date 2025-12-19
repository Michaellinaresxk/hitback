// components/powerCards/ChallengeModal.tsx
// Modal para la carta CHALLENGE - Reto musical

import { ChallengeType } from '@/types/powerCard.types';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface ChallengeModalProps {
  visible: boolean;
  challengeType: ChallengeType | null;
  challengeName: string;
  challengeIcon: string;
  instruction: string;
  playerName: string;
  onComplete: (completed: boolean) => void;
  onCancel: () => void;
}

export default function PowerCardChallengeModal({
  visible,
  challengeType,
  challengeName,
  challengeIcon,
  instruction,
  playerName,
  onComplete,
  onCancel,
}: ChallengeModalProps) {
  const [phase, setPhase] = useState<'ready' | 'performing' | 'judging'>(
    'ready'
  );
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownAnim = useRef(new Animated.Value(3)).current;
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (visible) {
      setPhase('ready');
      setCountdown(3);

      // Animación de pulso constante
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [visible]);

  const handleStartChallenge = () => {
    setPhase('performing');

    // Countdown de 3 segundos
    let count = 3;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        // Después del countdown, ir a judging
        setTimeout(() => {
          setPhase('judging');
        }, 1000);
      }
    }, 1000);
  };

  if (!visible || !challengeType) return null;

  const getChallengeDetails = () => {
    switch (challengeType) {
      case 'lyrics':
        return {
          color: '#F59E0B',
          tips: ['Lee con atención', 'Piensa en la canción', 'No te apures'],
          performText: '¡COMPLETA LA LETRA!',
        };
      case 'sing':
        return {
          color: '#EF4444',
          tips: [
            'No importa si desafinas',
            'Con ganas cuenta',
            'El coro completo',
          ],
          performText: '¡CANTA EL CORO!',
        };
      case 'imitate':
        return {
          color: '#8B5CF6',
          tips: ['Exagera el estilo', 'Los gestos cuentan', 'Diviértete'],
          performText: '¡IMITA AL ARTISTA!',
        };
      default:
        return {
          color: '#3B82F6',
          tips: ['Hazlo lo mejor posible'],
          performText: '¡ACEPTA EL RETO!',
        };
    }
  };

  const details = getChallengeDetails();

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor: details.color }]}>
          {/* FASE: READY */}
          {phase === 'ready' && (
            <>
              {/* Header */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: `${details.color}20`,
                  },
                ]}
              >
                <Text style={styles.challengeIcon}>{challengeIcon}</Text>
              </Animated.View>

              <Text style={[styles.title, { color: details.color }]}>
                {challengeName.toUpperCase()}
              </Text>

              <Text style={styles.playerText}>
                🎤 {playerName} debe completar el reto
              </Text>

              {/* Instrucción */}
              <View style={styles.instructionBox}>
                <Text style={styles.instructionLabel}>TU RETO:</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>

              {/* Tips */}
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 CONSEJOS:</Text>
                {details.tips.map((tip, index) => (
                  <Text key={index} style={styles.tipText}>
                    • {tip}
                  </Text>
                ))}
              </View>

              {/* Puntos */}
              <View
                style={[
                  styles.pointsBadge,
                  { backgroundColor: `${details.color}20` },
                ]}
              >
                <Text style={[styles.pointsText, { color: details.color }]}>
                  🎯 +3 PUNTOS si lo completas
                </Text>
              </View>

              {/* Botones */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.startButton,
                    { backgroundColor: details.color },
                  ]}
                  onPress={handleStartChallenge}
                >
                  <Text style={styles.startText}>¡EMPEZAR!</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* FASE: PERFORMING */}
          {phase === 'performing' && (
            <View style={styles.performingContainer}>
              <View
                style={[styles.countdownCircle, { borderColor: details.color }]}
              >
                <Text
                  style={[styles.countdownNumber, { color: details.color }]}
                >
                  {countdown > 0 ? countdown : '🎤'}
                </Text>
              </View>

              <Text style={styles.performingTitle}>
                {countdown > 0 ? '¡PREPÁRATE!' : details.performText}
              </Text>

              <Text style={styles.performingSubtitle}>
                {countdown > 0 ? `Empieza en ${countdown}...` : playerName}
              </Text>

              {countdown === 0 && (
                <Animated.View
                  style={[
                    styles.goContainer,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Text style={styles.goText}>¡AHORA!</Text>
                </Animated.View>
              )}
            </View>
          )}

          {/* FASE: JUDGING */}
          {phase === 'judging' && (
            <View style={styles.judgingContainer}>
              <Text style={styles.judgingIcon}>⚖️</Text>
              <Text style={styles.judgingTitle}>VEREDICTO DEL GAME MASTER</Text>
              <Text style={styles.judgingSubtitle}>
                ¿{playerName} completó el reto?
              </Text>

              <View style={styles.judgingButtons}>
                <TouchableOpacity
                  style={styles.failButton}
                  onPress={() => onComplete(false)}
                >
                  <Text style={styles.failIcon}>😅</Text>
                  <Text style={styles.failText}>No lo logró</Text>
                  <Text style={styles.failPoints}>0 puntos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.successButton}
                  onPress={() => onComplete(true)}
                >
                  <Text style={styles.successIcon}>🔥</Text>
                  <Text style={styles.successText}>¡Lo logró!</Text>
                  <Text style={styles.successPoints}>+3 puntos</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.judgingHint}>
                El Game Master decide si el reto fue completado correctamente
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
    borderWidth: 3,
    alignItems: 'center',
  },

  // Header
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  playerText: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 20,
  },

  // Instruction
  instructionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  instructionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#F8FAFC',
    lineHeight: 24,
    textAlign: 'center',
  },

  // Tips
  tipsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },

  // Points badge
  pointsBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Buttons
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#475569',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  startButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // Performing phase
  performingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownNumber: {
    fontSize: 56,
    fontWeight: '800',
  },
  performingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: 1,
  },
  performingSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  goContainer: {
    marginTop: 24,
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  goText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },

  // Judging phase
  judgingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  judgingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  judgingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: 1,
  },
  judgingSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  judgingButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    width: '100%',
  },
  failButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  failIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  failText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  failPoints: {
    fontSize: 12,
    color: '#94A3B8',
  },
  successButton: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  successIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  successPoints: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  judgingHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
