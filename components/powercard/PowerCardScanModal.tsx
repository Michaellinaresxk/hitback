import React, { useState } from 'react';
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
import QRScanner from '@/components/game/QRScanner';

const { width, height } = Dimensions.get('window');

interface PowerCardScanModalProps {
  visible: boolean;
  onClose: () => void;
  onCardScanned: (qrCode: string) => void;
  playerName: string;
  comboType: string;
}

export function PowerCardScanModal({
  visible,
  onClose,
  onCardScanned,
  playerName,
  comboType,
}: PowerCardScanModalProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handleScanPress = () => {
    setShowScanner(true);
  };

  const handleScanSuccess = (qrCode: string) => {
    console.log('🔍 Power card scanned:', qrCode);
    setShowScanner(false);
    onCardScanned(qrCode);
  };

  const handleSkip = () => {
    console.log('⏭️ Player skipped power card scan');
    onClose();
  };

  if (!visible && !showScanner) return null;

  // Show QR Scanner if active (full screen, not in modal)
  if (showScanner) {
    return (
      <QRScanner
        isVisible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
        title='Escanear Carta de Poder'
      />
    );
  }

  // Show instruction modal only when not scanning
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <IconSymbol name='qrcode' size={64} color='#4ECDC4' />
          </View>

          {/* Title */}
          <Text style={styles.title}>¡Power Card Ganada!</Text>

          {/* Player & Combo Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.playerName}>{playerName}</Text>
            <Text style={styles.comboInfo}>
              {comboType === 'HOT_STREAK'
                ? '🔥 HIT MASTER - 3 Respuestas Correctas'
                : `🔥 ${comboType.replace('_', ' ')}`}
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>📋 Instrucciones:</Text>
            <Text style={styles.instructionText}>
              1. Toma una carta de poder del mazo
            </Text>
            <Text style={styles.instructionText}>
              2. Escanea el código QR de la carta
            </Text>
            <Text style={styles.instructionText}>
              3. La carta será añadida a tu inventario
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanPress}
            >
              <IconSymbol name='camera.fill' size={20} color='#FFFFFF' />
              <Text style={styles.scanButtonText}>Escanear Carta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Ahora No</Text>
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <IconSymbol name='xmark' size={20} color='rgba(255,255,255,0.6)' />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    width: '100%',
  },
  playerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4ECDC4',
    textAlign: 'center',
    marginBottom: 5,
  },
  comboInfo: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonsContainer: {
    width: '100%',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 12,
    gap: 10,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.7,
  },
  closeIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
