import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import { Camera, CameraType, BarcodeScanningResult } from 'expo-camera';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { cardService } from '@/services/cardService';

const { width, height } = Dimensions.get('window');

interface QRScannerProps {
  onScanSuccess: (qrData: string) => void;
  onClose: () => void;
  isVisible: boolean;
  title?: string;
  subtitle?: string;
}

export default function QRScanner({
  onScanSuccess,
  onClose,
  isVisible,
  title = 'Escanear Carta QR',
  subtitle = 'Apunta la cámara al código QR de la carta',
}: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Reset scanner state when becoming visible
      setScanned(false);
      setIsProcessing(false);
    }
  }, [isVisible]);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    try {
      // Validate QR code format
      if (!cardService.isValidQRCode(data)) {
        Alert.alert(
          'Código QR Inválido',
          'Este no es un código QR válido de HITBACK. Asegúrate de escanear una carta oficial del juego.',
          [
            {
              text: 'Intentar de nuevo',
              onPress: resetScanner,
            },
          ]
        );
        return;
      }

      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        Vibration.vibrate(100);
      } else {
        Vibration.vibrate([0, 100]);
      }

      // Success - call parent handler
      onScanSuccess(data);
    } catch (error) {
      console.error('Error processing QR scan:', error);
      Alert.alert(
        'Error',
        'No se pudo procesar el código QR. Inténtalo de nuevo.',
        [
          {
            text: 'Reintentar',
            onPress: resetScanner,
          },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setIsProcessing(false);
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  if (!isVisible) return null;

  // Permission states
  if (hasPermission === null) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <IconSymbol name='camera.fill' size={48} color='#007AFF' />
          <ThemedText style={styles.statusText}>
            Solicitando permisos de cámara...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (hasPermission === false) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <IconSymbol name='camera.fill' size={48} color='#FF3B30' />
          <ThemedText style={styles.statusText}>
            Sin acceso a la cámara
          </ThemedText>
          <ThemedText style={styles.statusSubtext}>
            Ve a Configuración para habilitar el acceso a la cámara
          </ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={requestCameraPermission}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={CameraType.back}
        flashMode={flashEnabled ? 'torch' : 'off'}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name='xmark' size={24} color='#FFFFFF' />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.title}>{title}</Text>
            </View>

            <TouchableOpacity onPress={toggleFlash} style={styles.flashButton}>
              <IconSymbol
                name={
                  flashEnabled ? 'flashlight.on.fill' : 'flashlight.off.fill'
                }
                size={24}
                color='#FFFFFF'
              />
            </TouchableOpacity>
          </View>

          {/* Scanning area */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Scanning line animation could go here */}
              {!scanned && !isProcessing && <View style={styles.scanLine} />}
            </View>

            <Text style={styles.subtitle}>{subtitle}</Text>

            {/* Status indicators */}
            {isProcessing && (
              <View style={styles.processingIndicator}>
                <IconSymbol
                  name='checkmark.circle.fill'
                  size={32}
                  color='#34C759'
                />
                <Text style={styles.processingText}>Procesando...</Text>
              </View>
            )}

            {scanned && !isProcessing && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetScanner}
              >
                <IconSymbol name='arrow.clockwise' size={20} color='#007AFF' />
                <Text style={styles.resetButtonText}>Escanear otra carta</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer instructions */}
          <View style={styles.footer}>
            <View style={styles.instructionRow}>
              <IconSymbol name='camera.fill' size={16} color='#FFFFFF' />
              <Text style={styles.instructionText}>
                Mantén la carta dentro del marco
              </Text>
            </View>

            <View style={styles.instructionRow}>
              <IconSymbol
                name='flashlight.off.fill'
                size={16}
                color='#FFFFFF'
              />
              <Text style={styles.instructionText}>
                Toca la linterna si hay poca luz
              </Text>
            </View>
          </View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    marginBottom: 30,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00FF00',
    opacity: 0.8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  processingIndicator: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,122,255,0.8)',
    borderRadius: 8,
    gap: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  statusText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  statusSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.7,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
