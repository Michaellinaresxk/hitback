// components/game/GameFeedback.tsx - Visual Feedback System
import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

interface FeedbackMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface GameFeedbackProps {
  messages: FeedbackMessage[];
  onMessageDismiss: (id: string) => void;
}

export default function GameFeedback({
  messages,
  onMessageDismiss,
}: GameFeedbackProps) {
  return (
    <View style={styles.container}>
      {messages.map((msg) => (
        <FeedbackToast
          key={msg.id}
          message={msg}
          onDismiss={() => onMessageDismiss(msg.id)}
        />
      ))}
    </View>
  );
}

// Individual Toast Component
interface FeedbackToastProps {
  message: FeedbackMessage;
  onDismiss: () => void;
}

function FeedbackToast({ message, onDismiss }: FeedbackToastProps) {
  const [slideAnim] = useState(new Animated.Value(-width));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      handleDismiss();
    }, message.duration || 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getStyleForType = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          borderColor: '#10B981',
          icon: 'checkmark.circle.fill' as const,
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.9)',
          borderColor: '#EF4444',
          icon: 'xmark.circle.fill' as const,
          iconColor: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.9)',
          borderColor: '#F59E0B',
          icon: 'exclamationmark.triangle.fill' as const,
          iconColor: '#FFFFFF',
        };
      case 'info':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          borderColor: '#3B82F6',
          icon: 'info.circle.fill' as const,
          iconColor: '#FFFFFF',
        };
    }
  };

  const typeStyle = getStyleForType(message.type);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: typeStyle.backgroundColor,
          borderColor: typeStyle.borderColor,
          transform: [{ translateX: slideAnim }],
          opacity: opacity,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <IconSymbol
          name={typeStyle.icon}
          size={24}
          color={typeStyle.iconColor}
        />
        <View style={styles.textContainer}>
          <Text style={styles.toastTitle}>{message.title}</Text>
          {message.message && (
            <Text style={styles.toastMessage}>{message.message}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// Hook for managing feedback messages
export const useFeedback = () => {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  const showFeedback = (
    type: FeedbackMessage['type'],
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = `feedback_${Date.now()}_${Math.random()}`;
    const newMessage: FeedbackMessage = {
      id,
      type,
      title,
      message,
      duration,
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const dismissFeedback = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const clearAllFeedback = () => {
    setMessages([]);
  };

  // Convenience methods
  const showSuccess = (title: string, message?: string) =>
    showFeedback('success', title, message, 2000);

  const showError = (title: string, message?: string) =>
    showFeedback('error', title, message, 4000);

  const showInfo = (title: string, message?: string) =>
    showFeedback('info', title, message, 3000);

  const showWarning = (title: string, message?: string) =>
    showFeedback('warning', title, message, 3500);

  return {
    messages,
    showFeedback,
    dismissFeedback,
    clearAllFeedback,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  toast: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
});
