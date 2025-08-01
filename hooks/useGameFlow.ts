// hooks/useGameFlow.ts - LIMPIO: Solo Backend Integration
import { audioService } from '@/services/audioService';
import { useGameStore } from '@/store/gameStore';
import { useCallback, useState } from 'react';

export interface GameFlowState {
  isScanning: boolean;
  audioPlaying: boolean;
  questionPhase: boolean;
  showAnswerRevealed: boolean;
  currentError: string | null;
  lastWinnerId: string | null;
  backendConnected: boolean;
}

export const useGameFlow = () => {
  const [flowState, setFlowState] = useState<GameFlowState>({
    isScanning: false,
    audioPlaying: false,
    questionPhase: false,
    showAnswerRevealed: false,
    currentError: null,
    lastWinnerId: null,
    backendConnected: false,
  });

  const {
    scanCard,
    setShowQuestion,
    setAudioFinished,
    setShowAnswer,
    currentCard,
    nextTurn,
  } = useGameStore();

  // 🔍 QR SCANNING - Solo Backend
  const handleQRScan = useCallback(
    async (qrCode: string): Promise<boolean> => {
      try {
        setFlowState((prev) => ({
          ...prev,
          isScanning: true,
          currentError: null,
          lastWinnerId: null,
        }));

        console.log(`🔍 useGameFlow: Scanning QR via backend: ${qrCode}`);

        // ✅ ESCANEO COMPLETO VIA BACKEND
        const scanResult = await audioService.scanQRAndPlay(qrCode);

        if (scanResult.success && scanResult.data) {
          console.log('✅ Backend scan successful, creating game card...');

          // ✅ TRANSFORMAR RESPUESTA DEL BACKEND AL FORMATO DEL STORE
          const gameCard = {
            id: scanResult.data.track.id,
            qrCode: scanResult.data.scan.qrCode,
            cardType: scanResult.data.question.type,

            track: {
              title: scanResult.data.track.title,
              artist: scanResult.data.track.artist,
              year: scanResult.data.track.year,
              genre: scanResult.data.track.genre,
              album: scanResult.data.track.album,
              decade: `${Math.floor(scanResult.data.track.year / 10) * 10}s`,
              previewUrl: scanResult.data.audio.url, // ✅ URL directa del backend
              qrCode: scanResult.data.scan.qrCode,
            },

            question: scanResult.data.question.question,
            answer: scanResult.data.question.answer,
            points: scanResult.data.scan.points,
            difficulty: scanResult.data.scan.difficulty,
            hints: scanResult.data.question.hints,

            audioUrl: scanResult.data.audio.url,
            audioAvailable: scanResult.data.audio.hasAudio,
            duration: 5, // 5 seconds for game
          };

          console.log('🎮 Sending card to game store:', gameCard.track.title);

          // ✅ USAR EL STORE PARA PROCESAR LA CARTA
          await scanCard(qrCode, gameCard);

          setFlowState((prev) => ({
            ...prev,
            isScanning: false,
            audioPlaying: true,
            backendConnected: true,
          }));

          return true;
        }

        throw new Error(scanResult.error?.message || 'Backend scan failed');
      } catch (error) {
        console.error('❌ QR Scan failed:', error);

        setFlowState((prev) => ({
          ...prev,
          isScanning: false,
          currentError: getErrorMessage(error),
          backendConnected: false,
        }));

        return false;
      }
    },
    [scanCard]
  );

  // 🎵 AUDIO FLOW MANAGEMENT
  const handleAudioFinished = useCallback(() => {
    console.log('🎵 Audio finished - enabling question phase');

    // Update game store
    setAudioFinished(true);
    setShowQuestion(true);

    // Update flow state
    setFlowState((prev) => ({
      ...prev,
      audioPlaying: false,
      questionPhase: true,
    }));

    console.log('✅ Question phase enabled');
  }, [setAudioFinished, setShowQuestion]);

  // 🔍 REVEAL ANSWER
  const revealAnswer = useCallback(() => {
    console.log('👁️ Revealing answer');

    setFlowState((prev) => ({
      ...prev,
      showAnswerRevealed: true,
    }));

    setShowAnswer(true);
  }, [setShowAnswer]);

  // 🏆 AWARD POINTS AND AUTO-ADVANCE
  const awardPointsAndAdvance = useCallback(
    (playerId: string, playerName: string) => {
      console.log(`🏆 Awarding points to ${playerName} and advancing turn`);

      // Set winner for feedback
      setFlowState((prev) => ({
        ...prev,
        lastWinnerId: playerId,
      }));

      // Points will be awarded by calling component
      // Auto-advance turn after delay
      setTimeout(() => {
        nextTurn();
        resetFlow();
      }, 1500);

      return { playerId, playerName };
    },
    [nextTurn]
  );

  // 🔄 RESET FLOW STATE
  const resetFlow = useCallback(() => {
    console.log('🔄 Resetting game flow state');

    setFlowState({
      isScanning: false,
      audioPlaying: false,
      questionPhase: false,
      showAnswerRevealed: false,
      currentError: null,
      lastWinnerId: null,
      backendConnected: flowState.backendConnected, // Preserve connection status
    });
  }, [flowState.backendConnected]);

  // 🧪 CONNECTION TEST
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🧪 Testing backend connection...');

      const isConnected = await audioService.testConnection();

      setFlowState((prev) => ({
        ...prev,
        backendConnected: isConnected,
      }));

      console.log(`🔗 Backend connection: ${isConnected ? 'OK' : 'FAILED'}`);
      return isConnected;
    } catch (error) {
      console.error('❌ Connection test failed:', error);

      setFlowState((prev) => ({
        ...prev,
        backendConnected: false,
      }));

      return false;
    }
  }, []);

  // 📊 GET CONNECTION INFO
  const getConnectionInfo = useCallback(async () => {
    try {
      return await audioService.getConnectionInfo();
    } catch (error) {
      console.error('❌ Failed to get connection info:', error);
      return { error: error.message };
    }
  }, []);

  // 📱 GET WINNER INFO FOR FEEDBACK
  const getWinnerInfo = useCallback(() => {
    return {
      winnerId: flowState.lastWinnerId,
      hasWinner: !!flowState.lastWinnerId,
    };
  }, [flowState.lastWinnerId]);

  // 🧪 GENERATE TEST QR CODES (development only)
  const generateTestQRCodes = useCallback(() => {
    const testCodes = [
      'HITBACK_001_SONG_EASY',
      'HITBACK_001_ARTIST_MEDIUM',
      'HITBACK_002_SONG_EASY',
      'HITBACK_002_LYRICS_MEDIUM',
      'HITBACK_003_CHALLENGE_HARD',
      'HITBACK_004_DECADE_EXPERT',
    ];

    return testCodes.map((qrCode) => ({
      qrCode,
      description: `Test: ${qrCode.split('_').slice(1).join(' - ')}`,
      onTest: () => handleQRScan(qrCode),
    }));
  }, [handleQRScan]);

  // 🐛 DEBUG HELPERS
  const debugGameState = useCallback(() => {
    console.log('🐛 DEBUG Game Flow State:', {
      flowState,
      currentCard,
      gameStoreStates: {
        audioFinished: useGameStore.getState().audioFinished,
        showQuestion: useGameStore.getState().showQuestion,
        showAnswer: useGameStore.getState().showAnswer,
        isActive: useGameStore.getState().isActive,
      },
    });
  }, [flowState, currentCard]);

  // 🏥 BACKEND HEALTH CHECK
  const checkBackendHealth = useCallback(async () => {
    try {
      const isHealthy = await testConnection();
      const connectionInfo = await getConnectionInfo();

      return {
        isHealthy,
        connectionInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return {
        isHealthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }, [testConnection, getConnectionInfo]);

  return {
    // State
    flowState,

    // Main actions
    handleQRScan,
    handleAudioFinished,
    revealAnswer,
    awardPointsAndAdvance,
    resetFlow,

    // Connection management
    testConnection,
    getConnectionInfo,
    checkBackendHealth,

    // Helpers
    getWinnerInfo,
    generateTestQRCodes,
    debugGameState,
  };
};

// 🔧 Helper function for user-friendly error messages
function getErrorMessage(error: any): string {
  if (error.message?.includes('HTTP 404')) {
    return 'Carta no encontrada en el servidor';
  }
  if (error.message?.includes('HTTP 400')) {
    return 'Código QR inválido';
  }
  if (
    error.message?.includes('Network request failed') ||
    error.message?.includes('timeout')
  ) {
    return 'No se puede conectar al servidor - verifica la conexión';
  }
  if (error.message?.includes('Invalid QR code format')) {
    return 'Formato de QR inválido - debe ser HITBACK_XXX_TYPE_DIFFICULTY';
  }

  return error.message || 'Error de conexión con el servidor';
}
