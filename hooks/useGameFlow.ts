// hooks/useGameFlow.ts - FIXED: Using YOUR original QR scanning logic + betting phase
import { audioService } from '@/services/audioService';
import { cardService } from '@/services/cardService';
import { useGameStore } from '@/store/gameStore';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface GameFlowState {
  isScanning: boolean;
  audioPlaying: boolean;
  questionPhase: boolean;
  showAnswerRevealed: boolean;
  currentError: string | null;
  lastWinnerId: string | null;

  // ✅ NEW: Only betting phase additions
  bettingPhase: boolean;
  bettingTimeLeft: number;
  bettingStarted: boolean;
}

export const useGameFlow = () => {
  const [flowState, setFlowState] = useState<GameFlowState>({
    isScanning: false,
    audioPlaying: false,
    questionPhase: false,
    showAnswerRevealed: false,
    currentError: null,
    lastWinnerId: null,

    // ✅ NEW: Betting phase state
    bettingPhase: false,
    bettingTimeLeft: 30,
    bettingStarted: false,
  });

  // ✅ NEW: Betting timer ref
  const bettingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    scanCard,
    setShowQuestion,
    setAudioFinished,
    setShowAnswer,
    currentCard,
    nextTurn,
  } = useGameStore();

  // ✅ USING YOUR ORIGINAL QR SCANNING - DON'T CHANGE THIS!
  const handleQRScan = useCallback(
    async (qrCode: string): Promise<boolean> => {
      try {
        setFlowState((prev) => ({
          ...prev,
          isScanning: true,
          currentError: null,
          lastWinnerId: null,
          // ✅ Reset betting phase on new scan
          bettingPhase: false,
          bettingStarted: false,
          bettingTimeLeft: 30,
        }));

        console.log(`🔍 useGameFlow: Scanning QR: ${qrCode}`);

        // ✅ USE YOUR ORIGINAL cardService method - NOT audioService
        const gameCard = await cardService.getCardByQR(qrCode);

        if (!gameCard) {
          throw new Error('Carta no encontrada o código QR inválido');
        }

        console.log('🎮 Calling scanCard with:', gameCard);
        await scanCard(qrCode, gameCard);

        setFlowState((prev) => ({
          ...prev,
          isScanning: false,
          audioPlaying: true,
        }));

        console.log('✅ Card scanned successfully:', gameCard.track.title);
        return true;
      } catch (error) {
        console.error('❌ QR Scan failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        setFlowState((prev) => ({
          ...prev,
          isScanning: false,
          currentError: errorMessage,
        }));
        return false;
      }
    },
    [scanCard]
  );

  // ✅ ENHANCED: Audio finished + start betting phase
  const handleAudioFinished = () => {
    console.log('🎵 Audio finished callback recibido');

    // ✅ YOUR ORIGINAL game store updates
    setAudioFinished(true);
    setShowQuestion(true);

    // ✅ NEW: Start betting phase after audio
    setFlowState((prev) => ({
      ...prev,
      audioPlaying: false,
      questionPhase: true,
      bettingPhase: true, // ✅ Start betting
      bettingStarted: true,
      bettingTimeLeft: 30,
    }));

    // ✅ NEW: Start betting countdown
    startBettingTimer();

    console.log('✅ Estados actualizados - pregunta + betting phase activo');
  };

  // ✅ NEW: Betting timer function
  const startBettingTimer = useCallback(() => {
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
    }

    let timeLeft = 30;

    bettingTimerRef.current = setInterval(() => {
      timeLeft -= 1;

      setFlowState((prev) => ({
        ...prev,
        bettingTimeLeft: timeLeft,
      }));

      if (timeLeft <= 0) {
        console.log('⏰ Betting time finished automatically');
        endBettingPhase();
      }
    }, 1000);
  }, []);

  // ✅ NEW: End betting phase
  const endBettingPhase = useCallback(() => {
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
      bettingTimerRef.current = null;
    }

    setFlowState((prev) => ({
      ...prev,
      bettingPhase: false,
      bettingTimeLeft: 0,
    }));

    console.log('🎲 Betting phase ended');
  }, []);

  // ✅ ORIGINAL: Your working reveal answer
  const revealAnswer = useCallback(() => {
    setFlowState((prev) => ({
      ...prev,
      showAnswerRevealed: true,
    }));
    setShowAnswer(true);
  }, [setShowAnswer]);

  // ✅ ORIGINAL: Your working award points
  const awardPointsAndAdvance = useCallback(
    (playerId: string, playerName: string) => {
      setFlowState((prev) => ({
        ...prev,
        lastWinnerId: playerId,
      }));

      setTimeout(() => {
        nextTurn();
        resetFlow();
      }, 1500);

      return { playerId, playerName };
    },
    [nextTurn]
  );

  // ✅ ENHANCED: Reset flow with betting cleanup
  const resetFlow = useCallback(() => {
    // ✅ NEW: Cleanup betting timer
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
      bettingTimerRef.current = null;
    }

    setFlowState({
      isScanning: false,
      audioPlaying: false,
      questionPhase: false,
      showAnswerRevealed: false,
      currentError: null,
      lastWinnerId: null,

      // ✅ NEW: Reset betting state
      bettingPhase: false,
      bettingTimeLeft: 30,
      bettingStarted: false,
    });
  }, []);

  // ✅ ORIGINAL: Your working connection test
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await audioService.testConnection();
    } catch {
      return false;
    }
  }, []);

  // ✅ ORIGINAL: Your working winner info
  const getWinnerInfo = useCallback(() => {
    return {
      winnerId: flowState.lastWinnerId,
      hasWinner: !!flowState.lastWinnerId,
    };
  }, [flowState.lastWinnerId]);

  // ✅ NEW: Betting status helper
  const getBettingStatus = useCallback(() => {
    return {
      isActive: flowState.bettingPhase,
      timeLeft: flowState.bettingTimeLeft,
      hasStarted: flowState.bettingStarted,
      canBet: flowState.bettingPhase && flowState.bettingTimeLeft > 0,
      urgentTime: flowState.bettingTimeLeft <= 10,
    };
  }, [flowState]);

  // ✅ NEW: Current phase helper
  const getCurrentPhase = useCallback(() => {
    if (flowState.isScanning) return 'scanning';
    if (flowState.audioPlaying) return 'audio';
    if (flowState.bettingPhase) return 'betting';
    if (flowState.questionPhase && !flowState.showAnswerRevealed)
      return 'question';
    if (flowState.showAnswerRevealed) return 'answer';
    return 'idle';
  }, [flowState]);

  // ✅ CLEANUP on unmount
  useEffect(() => {
    return () => {
      if (bettingTimerRef.current) {
        clearInterval(bettingTimerRef.current);
      }
    };
  }, []);

  // ✅ ORIGINAL: Your working methods + new betting methods
  return {
    flowState,
    handleQRScan,
    handleAudioFinished,
    revealAnswer,
    awardPointsAndAdvance,
    resetFlow,
    testConnection,
    getWinnerInfo,

    // ✅ NEW: Betting phase methods
    endBettingPhase,
    getBettingStatus,
    getCurrentPhase,
  };
};
