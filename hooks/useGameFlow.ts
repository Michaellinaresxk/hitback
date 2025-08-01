// hooks/useGameFlow.ts - CORREGIDO para trabajar con la estructura real del backend
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
}

export const useGameFlow = () => {
  const [flowState, setFlowState] = useState<GameFlowState>({
    isScanning: false,
    audioPlaying: false,
    questionPhase: false,
    showAnswerRevealed: false,
    currentError: null,
    lastWinnerId: null,
  });

  const {
    scanCard,
    setShowQuestion,
    setAudioFinished,
    setShowAnswer,
    currentCard,
    nextTurn,
  } = useGameStore();

  // 🎯 CORREGIDO: QR Scanning que funciona con la estructura real
  const handleQRScan = useCallback(
    async (qrCode: string): Promise<boolean> => {
      try {
        setFlowState((prev) => ({
          ...prev,
          isScanning: true,
          currentError: null,
          lastWinnerId: null,
        }));

        console.log(`🔍 useGameFlow: Scanning QR: ${qrCode}`);

        // ✅ CORREGIDO: Use audioService que ahora procesa correctamente
        const scanResult = await audioService.scanQRAndPlay(qrCode);

        if (scanResult.success && scanResult.card) {
          console.log('✅ Scan successful, creating game card...');

          // ✅ CORREGIDO: Transform to game store format
          const gameCard = {
            id: scanResult.card.trackId,
            qrCode: scanResult.card.qrCode,
            cardType: scanResult.card.cardType,
            track: {
              title: scanResult.card.track.title,
              artist: scanResult.card.track.artist,
              year: scanResult.card.track.year,
              genre: scanResult.card.track.genre,
              album: scanResult.card.track.album,
              decade: `${Math.floor(scanResult.card.track.year / 10) * 10}s`,
              previewUrl: scanResult.card.audio.url, // ✅ CORREGIDO: URL ya construida
              qrCode: scanResult.card.qrCode,
            },
            question: scanResult.card.question,
            answer: scanResult.card.answer,
            points: scanResult.card.points,
            difficulty: scanResult.card.difficulty,
            hints: scanResult.card.hints,
            audioUrl: scanResult.card.audio.url,
            audioAvailable: scanResult.card.audio.hasAudio,
            duration: 5, // 5 seconds for game
          };

          console.log('🎮 Calling scanCard with:', gameCard);
          await scanCard(qrCode, gameCard);

          setFlowState((prev) => ({
            ...prev,
            isScanning: false,
            audioPlaying: true,
          }));

          return true;
        }

        throw new Error(scanResult.error?.message || 'Invalid scan result');
      } catch (error) {
        console.error('❌ QR Scan failed:', error);
        setFlowState((prev) => ({
          ...prev,
          isScanning: false,
          currentError: getErrorMessage(error),
        }));
        return false;
      }
    },
    [scanCard]
  );

  // 🎵 AUDIO FLOW MANAGEMENT (sin cambios)
  const handleAudioFinished = () => {
    console.log('🎵 Audio finished callback recibido');

    // Actualizar el gameStore directamente
    setAudioFinished(true);
    setShowQuestion(true);

    setFlowState((prev) => ({
      ...prev,
      audioPlaying: false,
      questionPhase: true,
    }));

    console.log('✅ Estados actualizados - pregunta debería aparecer');
  };

  // 🔍 REVEAL ANSWER (sin cambios)
  const revealAnswer = useCallback(() => {
    setFlowState((prev) => ({
      ...prev,
      showAnswerRevealed: true,
    }));
    setShowAnswer(true);
  }, [setShowAnswer]);

  // 🏆 AWARD POINTS AND AUTO-ADVANCE TURN (sin cambios)
  const awardPointsAndAdvance = useCallback(
    (playerId: string, playerName: string) => {
      // Set winner for correct feedback
      setFlowState((prev) => ({
        ...prev,
        lastWinnerId: playerId,
      }));

      // Award points will be handled by the calling component
      // Then automatically advance to next turn after a brief delay
      setTimeout(() => {
        nextTurn();
        resetFlow();
      }, 1500);

      return { playerId, playerName };
    },
    [nextTurn]
  );

  // 🔄 RESET FLOW STATE (sin cambios)
  const resetFlow = useCallback(() => {
    setFlowState({
      isScanning: false,
      audioPlaying: false,
      questionPhase: false,
      showAnswerRevealed: false,
      currentError: null,
      lastWinnerId: null,
    });
  }, []);

  // 🧪 CONNECTION TEST (sin cambios)
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await audioService.testConnection();
    } catch {
      return false;
    }
  }, []);

  // 📱 GET WINNER INFO FOR FEEDBACK (sin cambios)
  const getWinnerInfo = useCallback(() => {
    return {
      winnerId: flowState.lastWinnerId,
      hasWinner: !!flowState.lastWinnerId,
    };
  }, [flowState.lastWinnerId]);

  // ✅ NUEVO: Generate test QR codes for debugging
  const generateTestQRCodes = useCallback(() => {
    const testCodes = [
      'HITBACK_001_SONG_EASY',
      'HITBACK_001_ARTIST_MEDIUM',
      'HITBACK_001_DECADE_HARD',
      'HITBACK_002_SONG_EASY',
      'HITBACK_002_LYRICS_MEDIUM',
      'HITBACK_004_CHALLENGE_EXPERT',
    ];

    return testCodes.map((qrCode) => ({
      qrCode,
      description: `Test: ${qrCode}`,
      onTest: () => handleQRScan(qrCode),
    }));
  }, [handleQRScan]);

  // ✅ NUEVO: Debug current card state
  const debugCardState = useCallback(() => {
    console.log('🐛 DEBUG Card State:', {
      currentCard,
      flowState,
      gameStoreStates: {
        audioFinished: useGameStore.getState().audioFinished,
        showQuestion: useGameStore.getState().showQuestion,
        showAnswer: useGameStore.getState().showAnswer,
      },
    });
  }, [currentCard, flowState]);

  return {
    flowState,
    handleQRScan,
    handleAudioFinished,
    revealAnswer,
    awardPointsAndAdvance,
    resetFlow,
    testConnection,
    getWinnerInfo,
    generateTestQRCodes, // ✅ NUEVO: Para testing
    debugCardState, // ✅ NUEVO: Para debugging
  };
};

// ✅ CORREGIDO: Helper function for error messages
function getErrorMessage(error: any): string {
  if (error.message?.includes('HTTP 404')) {
    return 'Carta no encontrada en la base de datos';
  }
  if (error.message?.includes('HTTP 400')) {
    return 'Código QR inválido';
  }
  if (error.message?.includes('fetch') || error.message?.includes('Network')) {
    return 'Servidor local activo - usando datos locales';
  }
  if (error.message?.includes('Invalid QR code format')) {
    return 'Formato de QR inválido - usa HITBACK_XXX_TYPE_DIFFICULTY';
  }
  if (error.message?.includes('Track not found')) {
    return 'Track no encontrado - verifica el ID del track';
  }
  return error.message || 'Error desconocido';
}
