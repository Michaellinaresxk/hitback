import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width, height } = Dimensions.get('window');

interface RealQRScannerProps {
  onScanSuccess: (qrData: string) => void;
  onClose: () => void;
  isVisible: boolean;
  title?: string;
}

export default function QRScanner({
  onScanSuccess,
  onClose,
  isVisible,
  title = 'Escanear Carta QR',
}: RealQRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  // ✅ CRITICAL: Estado para controlar si la cámara debe estar activa
  const [cameraActive, setCameraActive] = useState(false);

  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isProcessingRef.current = false;
      // ✅ Limpiar timeout al desmontar
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Controlar activación de cámara basado en visibilidad
  useEffect(() => {
    if (isVisible) {
      // Activar cámara con pequeño delay para asegurar que el modal está visible
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setCameraActive(true);
          setScanned(false);
          isProcessingRef.current = false;
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // ✅ CRITICAL: Desactivar cámara PRIMERO
      setCameraActive(false);
      setScanned(false);
      isProcessingRef.current = false;
    }
  }, [isVisible]);

  // ✅ Request camera permissions
  useEffect(() => {
    if (isVisible && !permission?.granted) {
      requestPermission();
    }
  }, [isVisible, permission?.granted, requestPermission]);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      // ✅ Prevent multiple scans
      if (scanned || isProcessingRef.current || !cameraActive) {
        return;
      }

      console.log('📷 QR Code scanned:', data);
      setScanned(true);
      isProcessingRef.current = true;

      // ✅ CRITICAL: Desactivar cámara INMEDIATAMENTE después de escanear
      setCameraActive(false);

      // Validate QR format (HITBACK_XXX)
      if (data.startsWith('HITBACK_')) {
        console.log('✅ Valid HITBACK QR code');

        // ✅ Delay para asegurar que la cámara se detuvo
        closeTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            onScanSuccess(data);
          }
        }, 100);
      } else {
        console.log('❌ Invalid QR code format');
        Alert.alert('QR Inválido', 'Este QR no pertenece al juego HITBACK', [
          {
            text: 'OK',
            onPress: () => {
              if (isMountedRef.current) {
                setScanned(false);
                isProcessingRef.current = false;
                setCameraActive(true); // Reactivar cámara
              }
            },
          },
        ]);
      }
    },
    [scanned, cameraActive, onScanSuccess],
  );

  const handleClose = useCallback(() => {
    console.log('❌ QRScanner: Close button pressed');

    // ✅ CRITICAL: Desactivar cámara ANTES de cerrar
    setCameraActive(false);
    isProcessingRef.current = true;
    setScanned(false);

    // ✅ Dar tiempo para que la cámara se detenga
    closeTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        onClose();
      }
    }, 50);
  }, [onClose]);

  // ✅ Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  // ✅ Show permission request screen
  if (!permission) {
    return (
      <Modal
        visible={isVisible}
        animationType='slide'
        presentationStyle='fullScreen'
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          <Text style={styles.message}>Solicitando permisos de cámara...</Text>
        </View>
      </Modal>
    );
  }

  // ✅ Show permission denied screen
  if (!permission.granted) {
    return (
      <Modal
        visible={isVisible}
        animationType='slide'
        presentationStyle='fullScreen'
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <IconSymbol name='camera' size={48} color='#4ECDC4' />
            <Text style={styles.permissionTitle}>Cámara Requerida</Text>
            <Text style={styles.permissionText}>
              Necesitamos acceso a tu cámara para escanear las cartas QR
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Permitir Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={isVisible}
      animationType='slide'
      presentationStyle='fullScreen'
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle='light-content' backgroundColor='#000000' />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <IconSymbol name='xmark' size={24} color='#FFFFFF' />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFlashEnabled(!flashEnabled)}
          >
            <IconSymbol
              name={flashEnabled ? 'flashlight.on.fill' : 'flashlight.off.fill'}
              size={24}
              color='#FFFFFF'
            />
          </TouchableOpacity>
        </View>

        {/* Camera View - ✅ SOLO RENDERIZAR SI ESTÁ ACTIVA */}
        <View style={styles.cameraContainer}>
          {cameraActive ? (
            <CameraView
              style={styles.camera}
              facing='back'
              enableTorch={flashEnabled}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
          ) : (
            <View style={[styles.camera, styles.cameraPlaceholder]}>
              <Text style={styles.cameraPlaceholderText}>
                {scanned ? 'Procesando...' : 'Iniciando cámara...'}
              </Text>
            </View>
          )}

          {/* Scanning Frame */}
          <View style={styles.scannerOverlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <Text style={styles.scanText}>
              {scanned ? 'Procesando...' : 'Apunta la cámara al código QR'}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Busca el código QR en tu carta HITBACK
          </Text>
          {scanned && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => {
                setScanned(false);
                isProcessingRef.current = false;
                setCameraActive(true);
              }}
            >
              <Text style={styles.scanAgainText}>Escanear otra carta</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    color: '#666',
    fontSize: 16,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4ECDC4',
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
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  instructions: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  scanAgainButton: {
    marginTop: 15,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scanAgainText: {
    color: '#000000',
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.7,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});
