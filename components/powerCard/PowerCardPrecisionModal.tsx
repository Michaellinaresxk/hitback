// components/powerCards/PrecisionModal.tsx
// Modal para la carta PRECISION - 3 preguntas rápidas

import { PrecisionAnswer, PrecisionQuestion } from '@/types/powerCard.types';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const { width } = Dimensions.get('window');

interface PrecisionModalProps {
  visible: boolean;
  questions: PrecisionQuestion[];
  timeLimit: number;
  playerName: string;
  onSubmit: (answers: PrecisionAnswer[]) => void;
  onTimeout: () => void;
}

export default function PowerCardPrecisionModal({
  visible,
  questions,
  timeLimit,
  playerName,
  onSubmit,
  onTimeout,
}: PrecisionModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [inputValue, setInputValue] = useState('');

  const progressAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Timer countdown
  useEffect(() => {
    if (!visible) return;

    setCurrentIndex(0);
    setAnswers([]);
    setTimeLeft(timeLimit);
    setInputValue('');
    progressAnim.setValue(1);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Animación de la barra de progreso
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: timeLimit * 1000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(timer);
  }, [visible, timeLimit]);

  // Focus input cuando cambia la pregunta
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentIndex, visible]);

  const handleTimeUp = () => {
    // Completar respuestas faltantes con vacío
    const finalAnswers: PrecisionAnswer[] = questions.map((q, i) => ({
      questionId: q.id,
      answer: answers[i] || '',
      isCorrect: false, // El backend determinará si es correcto
    }));
    onTimeout();
    onSubmit(finalAnswers);
  };

  const handleSubmitAnswer = () => {
    const newAnswers = [...answers, inputValue.trim()];
    setAnswers(newAnswers);
    setInputValue('');

    if (currentIndex < questions.length - 1) {
      // Siguiente pregunta
      setCurrentIndex(currentIndex + 1);
    } else {
      // Todas las preguntas respondidas
      const finalAnswers: PrecisionAnswer[] = questions.map((q, i) => ({
        questionId: q.id,
        answer: newAnswers[i] || '',
        isCorrect: false, // El backend determinará si es correcto
      }));
      onSubmit(finalAnswers);
    }
  };

  const handleSkip = () => {
    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    handleSubmitAnswer();
  };

  if (!visible || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const isUrgent = timeLeft <= 5;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Animated.View
          style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>🎯</Text>
            </View>
            <Text style={styles.title}>PRECISIÓN TOTAL</Text>
            <Text style={styles.subtitle}>{playerName}</Text>
          </View>

          {/* Timer */}
          <View style={[styles.timerContainer, isUrgent && styles.timerUrgent]}>
            <Text
              style={[styles.timerText, isUrgent && styles.timerTextUrgent]}
            >
              ⏱️ {timeLeft}s
            </Text>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { width: progressWidth },
                  isUrgent && styles.progressBarUrgent,
                ]}
              />
            </View>
          </View>

          {/* Indicador de progreso */}
          <View style={styles.questionProgress}>
            {questions.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index < currentIndex && styles.progressDotCompleted,
                  index === currentIndex && styles.progressDotCurrent,
                ]}
              >
                <Text style={styles.progressDotText}>
                  {index < currentIndex ? '✓' : index + 1}
                </Text>
              </View>
            ))}
          </View>

          {/* Pregunta actual */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionNumber}>
              Pregunta {currentIndex + 1} de {questions.length}
            </Text>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          {/* Input de respuesta */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder='Escribe tu respuesta...'
              placeholderTextColor='#64748B'
              autoCapitalize='none'
              autoCorrect={false}
              returnKeyType='done'
              onSubmitEditing={handleSubmitAnswer}
            />
          </View>

          {/* Botones */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Saltar →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !inputValue.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitAnswer}
              disabled={!inputValue.trim()}
            >
              <Text style={styles.submitButtonText}>
                {currentIndex < questions.length - 1 ? 'Siguiente' : 'Terminar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Puntos posibles */}
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsText}>
              💡 Cada respuesta correcta = +1 punto (máx +3)
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
    borderColor: '#8B5CF6',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Timer
  timerContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  timerUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 8,
  },
  timerTextUrgent: {
    color: '#EF4444',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  progressBarUrgent: {
    backgroundColor: '#EF4444',
  },

  // Question progress
  questionProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#475569',
  },
  progressDotCurrent: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderColor: '#8B5CF6',
  },
  progressDotCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderColor: '#10B981',
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },

  // Question
  questionContainer: {
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: 26,
  },

  // Input
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#475569',
  },

  // Buttons
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#475569',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Points info
  pointsInfo: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    color: '#64748B',
  },
});
