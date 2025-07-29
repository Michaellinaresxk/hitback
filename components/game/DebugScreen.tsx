// screens/DebugScreen.tsx - PANTALLA DE DEBUG PARA ESCANEAR QRS

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CardDisplay from '../../components/game/CardDisplay';
import { audioService, type FrontendCard } from '../../services/audioService';

// 🎯 QRS DE PRUEBA PREDEFINIDOS
const TEST_QRS = [
  {
    code: 'HITBACK_001_SONG_EASY',
    name: '🎵 Despacito - Song',
    description: 'Luis Fonsi ft. Daddy Yankee',
    category: 'song',
    difficulty: 'easy',
  },
  {
    code: 'HITBACK_001_ARTIST_EASY',
    name: '🎤 Despacito - Artist',
    description: 'Pregunta sobre el artista',
    category: 'artist',
    difficulty: 'easy',
  },
  {
    code: 'HITBACK_002_SONG_EASY',
    name: '🎸 Bohemian Rhapsody - Song',
    description: 'Queen',
    category: 'song',
    difficulty: 'easy',
  },
  {
    code: 'HITBACK_002_ARTIST_EASY',
    name: '👑 Bohemian Rhapsody - Artist',
    description: 'Pregunta sobre Queen',
    category: 'artist',
    difficulty: 'easy',
  },
  {
    code: 'HITBACK_004_SONG_EASY',
    name: '🕺 Uptown Funk - Song',
    description: 'Mark Ronson ft. Bruno Mars',
    category: 'song',
    difficulty: 'easy',
  },
  {
    code: 'HITBACK_004_ARTIST_EASY',
    name: '🎺 Uptown Funk - Artist',
    description: 'Pregunta sobre el artista',
    category: 'artist',
    difficulty: 'easy',
  },
];

// 🧪 DEBUG SCREEN COMPONENT
const DebugScreen: React.FC = () => {
  // 📊 STATE
  const [isScanning, setIsScanning] = useState(false);
  const [currentCard, setCurrentCard] = useState<FrontendCard | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [customQR, setCustomQR] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    lastChecked: Date | null;
  }>({
    isConnected: false,
    lastChecked: null,
  });
  const [scanHistory, setScanHistory] = useState<string[]>([]);

  // 🔄 CHECK CONNECTION
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await audioService.testConnection();
        setConnectionStatus({
          isConnected,
          lastChecked: new Date(),
        });
      } catch (error) {
        console.error('Connection check failed:', error);
        setConnectionStatus({
          isConnected: false,
          lastChecked: new Date(),
        });
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  // 🎯 SCAN QR HANDLER
  const handleScanQR = useCallback(
    async (qrCode: string) => {
      if (isScanning) {
        console.log('⚠️ Scan already in progress');
        return;
      }

      setIsScanning(true);
      setCurrentCard(null);
      setShowQuestion(false);
      setShowAnswer(false);

      try {
        console.log(`🧪 Debug scanning: ${qrCode}`);

        // Add to history
        setScanHistory((prev) => [qrCode, ...prev.slice(0, 9)]); // Keep last 10

        const result = await audioService.scanQRAndPlay(qrCode);

        if (result.success && result.card) {
          console.log('✅ Debug scan successful:', result.card.track.title);

          setCurrentCard(result.card);
          setShowQuestion(true);

          // Auto-reveal answer after 5 seconds
          setTimeout(() => {
            setShowAnswer(true);
          }, 5000);

          // Success feedback
          Alert.alert(
            '🎉 QR Scan Success!',
            `${result.card.track.title}\nby ${result.card.track.artist}\n\n${result.card.question}`,
            [{ text: 'OK' }]
          );
        } else {
          throw new Error('Invalid scan result');
        }
      } catch (error) {
        console.error('❌ Debug scan failed:', error);

        Alert.alert('❌ Scan Error', `QR: ${qrCode}\nError: ${error.message}`, [
          { text: 'Retry', onPress: () => handleScanQR(qrCode) },
          { text: 'OK', style: 'cancel' },
        ]);
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning]
  );

  // 🎯 SCAN CUSTOM QR
  const handleScanCustomQR = useCallback(() => {
    if (!customQR.trim()) {
      Alert.alert('Error', 'Enter a QR code to scan');
      return;
    }
    handleScanQR(customQR.trim());
  }, [customQR, handleScanQR]);

  // 🔍 REVEAL ANSWER
  const handleRevealAnswer = useCallback(() => {
    setShowAnswer(true);
  }, []);

  // 🔄 RESET
  const handleReset = useCallback(() => {
    setCurrentCard(null);
    setShowQuestion(false);
    setShowAnswer(false);
    setCustomQR('');
  }, []);

  // 🎵 STOP AUDIO
  const handleStopAudio = useCallback(async () => {
    try {
      await audioService.stopAudio();
      console.log('⏹️ Audio stopped');
    } catch (error) {
      console.error('❌ Failed to stop audio:', error);
    }
  }, []);

  // 🎨 RENDER CONNECTION STATUS
  const renderConnectionStatus = () => (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>🌐 Server Status</Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Connection:</Text>
        <Text
          style={[
            styles.statusValue,
            { color: connectionStatus.isConnected ? '#10B981' : '#EF4444' },
          ]}
        >
          {connectionStatus.isConnected ? '✅ Connected' : '❌ Disconnected'}
        </Text>
      </View>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Server:</Text>
        <Text style={styles.statusValue}>{audioService.getServerUrl()}</Text>
      </View>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Last Check:</Text>
        <Text style={styles.statusValue}>
          {connectionStatus.lastChecked?.toLocaleTimeString() || 'Never'}
        </Text>
      </View>
    </View>
  );

  // 🎯 RENDER QR BUTTONS
  const renderQRButtons = () => (
    <View style={styles.qrSection}>
      <Text style={styles.sectionTitle}>🎯 Test QR Codes</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.qrScroll}
      >
        {TEST_QRS.map((qr, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.qrButton,
              { backgroundColor: getCategoryColor(qr.category) },
              isScanning && styles.qrButtonDisabled,
            ]}
            onPress={() => handleScanQR(qr.code)}
            disabled={isScanning}
          >
            <Text style={styles.qrButtonTitle}>{qr.name}</Text>
            <Text style={styles.qrButtonDesc}>{qr.description}</Text>
            <Text style={styles.qrButtonCode}>{qr.code.split('_').pop()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // 🔧 RENDER CUSTOM QR INPUT
  const renderCustomQR = () => (
    <View style={styles.customSection}>
      <Text style={styles.sectionTitle}>🔧 Custom QR Code</Text>

      <View style={styles.customInputRow}>
        <TextInput
          style={styles.customInput}
          value={customQR}
          onChangeText={setCustomQR}
          placeholder='Enter QR code (e.g., HITBACK_001_SONG_EASY)'
          placeholderTextColor='#9CA3AF'
          autoCapitalize='characters'
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={handleScanCustomQR}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color='#fff' size='small' />
          ) : (
            <Text style={styles.scanButtonText}>Scan</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // 📊 RENDER SCAN HISTORY
  const renderScanHistory = () => {
    if (scanHistory.length === 0) return null;

    return (
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>📊 Recent Scans</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {scanHistory.map((qr, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyItem}
              onPress={() => handleScanQR(qr)}
              disabled={isScanning}
            >
              <Text style={styles.historyText}>
                {qr.split('_').slice(1).join(' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // 🎮 RENDER CONTROLS
  const renderControls = () => (
    <View style={styles.controlsSection}>
      <Text style={styles.sectionTitle}>🎮 Controls</Text>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
          <Text style={styles.controlButtonText}>🔄 Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleStopAudio}
        >
          <Text style={styles.controlButtonText}>⏹️ Stop Audio</Text>
        </TouchableOpacity>

        {currentCard && showQuestion && !showAnswer && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleRevealAnswer}
          >
            <Text style={styles.controlButtonText}>🔍 Reveal</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // 🎨 GET CATEGORY COLOR
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'song':
        return '#10B981';
      case 'artist':
        return '#3B82F6';
      case 'decade':
        return '#F59E0B';
      case 'lyrics':
        return '#8B5CF6';
      case 'challenge':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // 🎨 MAIN RENDER
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 🎯 HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>🧪 HITBACK Debug</Text>
          <Text style={styles.subtitle}>QR Scanner Testing Tool</Text>
        </View>

        {renderConnectionStatus()}
        {renderQRButtons()}
        {renderCustomQR()}
        {renderScanHistory()}
        {renderControls()}

        {/* 📱 CARD DISPLAY */}
        {currentCard && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>🎵 Current Card</Text>
            <CardDisplay
              card={currentCard}
              showQuestion={showQuestion}
              showAnswer={showAnswer}
              onRevealAnswer={handleRevealAnswer}
            />
          </View>
        )}

        {/* 🔧 DEBUG INFO */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>🔧 Debug Info</Text>
          <View style={styles.debugGrid}>
            <Text style={styles.debugText}>
              Scanning: {isScanning ? '🔄' : '⏸️'}
            </Text>
            <Text style={styles.debugText}>
              Card: {currentCard ? '🎯' : '❌'}
            </Text>
            <Text style={styles.debugText}>
              Question: {showQuestion ? '❓' : '⏸️'}
            </Text>
            <Text style={styles.debugText}>
              Answer: {showAnswer ? '💡' : '⏸️'}
            </Text>
            <Text style={styles.debugText}>
              Audio: {audioService.isPlaying() ? '🎵' : '⏸️'}
            </Text>
            <Text style={styles.debugText}>
              History: {scanHistory.length} scans
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  statusCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  qrSection: {
    marginBottom: 20,
  },
  qrScroll: {
    flexDirection: 'row',
  },
  qrButton: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  qrButtonDisabled: {
    opacity: 0.5,
  },
  qrButtonTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  qrButtonDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  qrButtonCode: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  customSection: {
    marginBottom: 20,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#E2E8F0',
    fontSize: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scanButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  scanButtonDisabled: {
    backgroundColor: '#64748B',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  historySection: {
    marginBottom: 20,
  },
  historyItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  historyText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  controlsSection: {
    marginBottom: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  cardSection: {
    marginBottom: 20,
  },
  debugSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  debugGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  debugText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

export default DebugScreen;
