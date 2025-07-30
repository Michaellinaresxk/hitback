// hooks/useGameFlow.ts - FIXED Turn Management & Feedback
import { audioService } from '@/services/audioService';
import { useGameStore } from '@/store/gameStore';
import { useCallback, useState } from 'react';

export interface GameFlowState {
  isScanning: boolean;
  audioPlaying: boolean;
  questionPhase: boolean;
  showAnswerRevealed: boolean;
  currentError: string | null;
  lastWinnerId: string | null; // 🔧 FIXED: Track who won for correct feedback
}

export const useGameFlow = () => {
  const [flowState, setFlowState] = useState<GameFlowState>({
    isScanning: false,
    audioPlaying: false,
    questionPhase: false,
    showAnswerRevealed: false,
    currentError: null,
    lastWinnerId: null, // 🔧 FIXED: Initialize winner tracking
  });

  const {
    scanCard,
    setShowQuestion,
    setAudioFinished,
    setShowAnswer,
    currentCard,
    nextTurn, // 🔧 FIXED: Import nextTurn
  } = useGameStore();

  // 🎯 CLEAN QR SCANNING - NO ALERTS
  const handleQRScan = useCallback(
    async (qrCode: string): Promise<boolean> => {
      try {
        setFlowState((prev) => ({
          ...prev,
          isScanning: true,
          currentError: null,
          lastWinnerId: null, // Reset winner tracking
        }));

        const scanResult = await audioService.scanQRAndPlay(qrCode);

        if (scanResult.success && scanResult.card) {
          // Convert backend response to game card format
          const gameCard = {
            id: scanResult.card.track.id,
            qrCode: qrCode,
            cardType: scanResult.card.type.toLowerCase(),
            track: {
              title: scanResult.card.track.title,
              artist: scanResult.card.track.artist,
              year: scanResult.card.track.year,
              genre: scanResult.card.track.genre,
              album: scanResult.card.track.album || '',
              decade: `${Math.floor(scanResult.card.track.year / 10) * 10}s`,
              previewUrl: scanResult.card.audio?.url || '',
            },
            question: scanResult.card.question,
            answer: scanResult.card.answer,
            points: scanResult.card.points,
            difficulty: scanResult.card.difficulty.toLowerCase(),
            hints: scanResult.card.hints || [],
            audioUrl: scanResult.card.audio?.url || '',
            audioAvailable: scanResult.card.audio?.hasAudio || false,
            duration: Math.min(scanResult.card.audio?.duration || 5, 5), // 🔧 FIXED: 5 seconds max
          };

          await scanCard(qrCode, gameCard);

          setFlowState((prev) => ({
            ...prev,
            isScanning: false,
            audioPlaying: true,
          }));

          return true;
        }

        throw new Error('Invalid scan result');
      } catch (error) {
        console.error('QR Scan failed:', error);
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

  // 🎵 AUDIO FLOW MANAGEMENT
  const handleAudioFinished = useCallback(() => {
    setFlowState((prev) => ({
      ...prev,
      audioPlaying: false,
      questionPhase: true,
    }));

    setAudioFinished(true);
    setShowQuestion(true);
  }, [setAudioFinished, setShowQuestion]);

  // 🔍 REVEAL ANSWER
  const revealAnswer = useCallback(() => {
    setFlowState((prev) => ({
      ...prev,
      showAnswerRevealed: true,
    }));
    setShowAnswer(true);
  }, [setShowAnswer]);

  // 🏆 AWARD POINTS AND AUTO-ADVANCE TURN
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
        nextTurn(); // 🔧 FIXED: Auto advance to next player
        resetFlow(); // Reset flow state for next round
      }, 1500); // Small delay to show feedback

      return { playerId, playerName }; // Return for feedback
    },
    [nextTurn]
  );

  // 🔄 RESET FLOW STATE
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

  // 🧪 CONNECTION TEST
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await audioService.testConnection();
    } catch {
      return false;
    }
  }, []);

  // 📱 GET WINNER INFO FOR FEEDBACK
  const getWinnerInfo = useCallback(() => {
    return {
      winnerId: flowState.lastWinnerId,
      hasWinner: !!flowState.lastWinnerId,
    };
  }, [flowState.lastWinnerId]);

  return {
    flowState,
    handleQRScan,
    handleAudioFinished,
    revealAnswer,
    awardPointsAndAdvance, // 🔧 FIXED: New method that handles points + turn advance
    resetFlow,
    testConnection,
    getWinnerInfo, // 🔧 FIXED: Method to get winner info for correct feedback
  };
};

// Helper function for error messages
function getErrorMessage(error: any): string {
  if (error.message?.includes('HTTP 404')) {
    return 'Carta no encontrada en la base de datos';
  }
  if (error.message?.includes('HTTP 400')) {
    return 'Código QR inválido';
  }
  if (error.message?.includes('fetch') || error.message?.includes('Network')) {
    return 'Sin conexión al servidor';
  }
  return error.message || 'Error desconocido';
}
