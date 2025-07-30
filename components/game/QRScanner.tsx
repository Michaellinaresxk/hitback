// components/QRScanner.tsx - 📱 QR SCANNER INDEPENDIENTE
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface QRScannerProps {
  isVisible: boolean;
  onScanSuccess: (qrCode: string) => void;
  onClose: () => void;
}

export default function RealQRScanner({
  isVisible,
  onScanSuccess,
  onClose,
}: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Reset scanned state when modal opens
  useEffect(() => {
    if (isVisible) {
      setScanned(false);
      setShowManualInput(false);
      setManualCode('');
    }
  }, [isVisible]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <IconSymbol name='camera.fill' size={48} color='#64748B' />
          <Text style={styles.permissionTitle}>Acceso a Cámara Requerido</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a la cámara para escanear códigos QR
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Permitir Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setShowManualInput(true)}
          >
            <Text style={styles.manualButtonText}>
              Ingresar Código Manualmente
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;

    setScanned(true);
    console.log(`📱 QR Scanned: ${data}`);

    // Validate QR format
    if (isValidHitbackQR(data)) {
      onScanSuccess(data);
    } else {
      Alert.alert(
        'Código QR Inválido',
        'Este no es un código QR válido de HITBACK.\nFormato esperado: HITBACK_XXX_TYPE_DIFFICULTY',
        [
          { text: 'Escanear Otro', onPress: () => setScanned(false) },
          { text: 'Cerrar', onPress: onClose },
        ]
      );
    }
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim().toUpperCase();

    if (!code) {
      Alert.alert('Error', 'Ingresa un código QR');
      return;
    }

    if (isValidHitbackQR(code)) {
      onScanSuccess(code);
    } else {
      Alert.alert(
        'Código Inválido',
        'Formato correcto: HITBACK_001_SONG_EASY\n\nEjemplos:\n• HITBACK_001_SONG_EASY\n• HITBACK_002_ARTIST_MEDIUM\n• HITBACK_003_DECADE_HARD'
      );
    }
  };

  const isValidHitbackQR = (code: string): boolean => {
    if (!code.startsWith('HITBACK_')) return false;

    const parts = code.split('_');
    if (parts.length !== 4) return false;

    const [prefix, trackId, cardType, difficulty] = parts;

    if (prefix !== 'HITBACK') return false;
    if (!/^\d{3}$/.test(trackId)) return false;
    if (!['SONG', 'ARTIST', 'DECADE', 'LYRICS', 'CHALLENGE'].includes(cardType))
      return false;
    if (!['EASY', 'MEDIUM', 'HARD', 'EXPERT'].includes(difficulty))
      return false;

    return true;
  };

  if (showManualInput) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.manualInputContainer}>
          <Text style={styles.manualTitle}>Ingresar Código QR</Text>
          <Text style={styles.manualSubtitle}>
            Formato: HITBACK_XXX_TYPE_DIFFICULTY
          </Text>

          <TextInput
            style={styles.manualInput}
            placeholder='HITBACK_001_SONG_EASY'
            placeholderTextColor='#64748B'
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize='characters'
            autoCorrect={false}
          />

          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>Ejemplos válidos:</Text>
            <Text style={styles.exampleText}>• HITBACK_001_SONG_EASY</Text>
            <Text style={styles.exampleText}>• HITBACK_002_ARTIST_MEDIUM</Text>
            <Text style={styles.exampleText}>• HITBACK_003_DECADE_HARD</Text>
            <Text style={styles.exampleText}>• HITBACK_004_LYRICS_EXPERT</Text>
            <Text style={styles.exampleText}>
              • HITBACK_005_CHALLENGE_MEDIUM
            </Text>
          </View>

          <View style={styles.manualActions}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleManualSubmit}
            >
              <IconSymbol
                name='checkmark.circle.fill'
                size={20}
                color='#FFFFFF'
              />
              <Text style={styles.submitButtonText}>Enviar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowManualInput(false)}
            >
              <IconSymbol name='camera.fill' size={20} color='#FFFFFF' />
              <Text style={styles.backButtonText}>Usar Cámara</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <IconSymbol name='xmark' size={24} color='#FFFFFF' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear Carta QR</Text>
        <TouchableOpacity
          style={styles.manualInputButton}
          onPress={() => setShowManualInput(true)}
        >
          <IconSymbol name='keyboard' size={20} color='#FFFFFF' />
        </TouchableOpacity>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing='back'
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>
          {scanned ? 'Procesando...' : 'Apunta la cámara al código QR'}
        </Text>
        <Text style={styles.instructionText}>
          Asegúrate de que el código QR esté bien iluminado
        </Text>

        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <IconSymbol name='arrow.clockwise' size={16} color='#3B82F6' />
            <Text style={styles.rescanText}>Escanear Otro</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  manualInputButton: {
    padding: 8,
  },

  // Camera
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },

  // Instructions
  instructions: {
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rescanText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 8,
  },

  // Permission
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  manualButton: {
    backgroundColor: '#64748B',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Manual Input
  manualInputContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  manualTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  manualSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
  },
  manualInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#F8FAFC',
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  examplesContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  manualActions: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
