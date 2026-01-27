import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isClosing, setIsClosing] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));

  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Reset state when visibility changes
  useEffect(() => {
    if (visible && !isClosing) {
      console.log('📱 PowerCardScanModal: Opening');
      isProcessingRef.current = false;
      setShowScanner(false);

      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else if (!visible) {
      console.log('📱 PowerCardScanModal: Closing');
      scaleAnim.setValue(0);
      setShowScanner(false);
      setIsClosing(false);
      isProcessingRef.current = false;
    }
  }, [visible, isClosing, scaleAnim]);

  const handleScanPress = useCallback(() => {
    if (isProcessingRef.current || isClosing) return;

    console.log('📷 Opening QR Scanner');
    isProcessingRef.current = false;
    setShowScanner(true);
  }, [isClosing]);

  const handleScanSuccess = useCallback(
    (qrCode: string) => {
      // ✅ Prevent multiple callbacks
      if (isProcessingRef.current || isClosing) {
        console.log('⏳ Already processing scan, ignoring duplicate');
        return;
      }

      isProcessingRef.current = true;
      setIsClosing(true);
      console.log('🔍 Power card scanned (single):', qrCode);

      // ✅ Close scanner FIRST
      setShowScanner(false);

      // ✅ Delay para asegurar que el scanner se cerró completamente
      closeTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('📤 Calling onCardScanned');
          onCardScanned(qrCode);
        }
      }, 150);
    },
    [isClosing, onCardScanned],
  );

  const handleSkip = useCallback(() => {
    console.log('⭕ Player skipped power card scan');

    if (isProcessingRef.current || isClosing) {
      console.log('⏳ Already processing, ignoring skip');
      return;
    }

    isProcessingRef.current = true;
    setIsClosing(true);
    setShowScanner(false);

    // ✅ Delay para asegurar cleanup completo
    closeTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        onClose();
      }
    }, 100);
  }, [isClosing, onClose]);

  const handleCloseScanner = useCallback(() => {
    console.log('❌ Scanner closed by user');
    isProcessingRef.current = false;
    setShowScanner(false);
    // NO cerrar el modal principal, solo el scanner
  }, []);

  // ✅ Don't render if closing
  if (isClosing && !showScanner) {
    return null;
  }

  // ✅ Early return if not visible AND not showing scanner
  if (!visible && !showScanner) {
    return null;
  }

  // ✅ Show QR Scanner in full screen modal
  if (showScanner) {
    return (
      <QRScanner
        isVisible={true}
        onClose={handleCloseScanner}
        onScanSuccess={handleScanSuccess}
        title='Escanear Carta de Poder'
      />
    );
  }

  // ✅ Don't render instruction modal if not visible
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible && !isClosing}
      transparent
      animationType='fade'
      onRequestClose={handleSkip}
    >
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
              {comboType === 'HOT_STREAK' || comboType === 'HOT STREAK'
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
              activeOpacity={0.8}
            >
              <IconSymbol name='camera.fill' size={20} color='#FFFFFF' />
              <Text style={styles.scanButtonText}>Escanear Carta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Ahora No</Text>
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeIcon} onPress={handleSkip}>
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
