import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
          <Text style={styles.comboTitle}>{t('rewards.combo')}</Text>
          <Text style={styles.comboName}>{comboName}</Text>
          <Text style={styles.comboPlayer}>{playerName}</Text>
          <Text style={styles.comboDescription}>{comboDescription}</Text>

          <TouchableOpacity style={styles.comboCloseButton} onPress={onClose}>
            <Text style={styles.comboCloseText}>🎉 {t('rewards.awesome')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    elevation: 10,
  },
  comboEmoji: { fontSize: 80, marginBottom: 10 },
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
  comboCloseText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
