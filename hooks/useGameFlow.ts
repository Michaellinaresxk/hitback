// hooks/useGameFlow.ts - HITBACK Game Flow Hook
// ✅ Usa cardService para escanear QR (siempre API)
// ✅ Maneja fases: scanning → audio → betting → question → answer
// ✅ NO reproduce audio - eso lo hace AudioPlayer.tsx

import { useCallback, useEffect, useRef, useState } from 'react';
import { cardService, GameCard } from '@/services/cardService';
import { useGameStore } from '@/store/gameStore';
import { BETTING_TIME_LIMIT } from '@/constants/Betting';

// 📋 TIPOS
export interface GameFlowState {
  // Fases del juego
  isScanning: boolean;
  audioPlaying: boolean;
  questionPhase: boolean;
  showAnswerRevealed: boolean;

  // Betting
  bettingPhase: boolean;
  bettingTimeLeft: number;
  bettingStarted: boolean;

  // Estado general
  currentError: string | null;
  lastWinnerId: string | null;
  isLoading: boolean;
}

type GamePhase =
  | 'idle'
  | 'scanning'
  | 'audio'
  | 'betting'
  | 'question'
  | 'answer';

// 🎮 HOOK PRINCIPAL
export const useGameFlow = () => {
  // Estado del flujo
  const [flowState, setFlowState] = useState<GameFlowState>({
    isScanning: false,
    audioPlaying: false,
    questionPhase: false,
    showAnswerRevealed: false,
    bettingPhase: false,
    bettingTimeLeft: BETTING_TIME_LIMIT,
    bettingStarted: false,
    currentError: null,
    lastWinnerId: null,
    isLoading: false,
  });

  // Refs para timers
  const bettingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Store del juego
  const {
    scanCard,
    setShowQuestion,
    setAudioFinished,
    setShowAnswer,
    currentCard,
    nextTurn,
  } = useGameStore();

  // 🎯 ESCANEAR QR CODE
  // ✅ Solo obtiene datos y actualiza estado
  // ✅ NO reproduce audio - AudioPlayer.tsx se encarga
  const handleQRScan = useCallback(
    async (qrCode: string): Promise<boolean> => {
      console.log(`\n🔍 useGameFlow.handleQRScan`);
      console.log(`   QR: ${qrCode}`);

      try {
        // Actualizar estado: escaneando
        setFlowState((prev) => ({
          ...prev,
          isScanning: true,
          isLoading: true,
          currentError: null,
          lastWinnerId: null,
          // Reset betting
          bettingPhase: false,
          bettingStarted: false,
          bettingTimeLeft: BETTING_TIME_LIMIT,
          // Reset audio/question states
          audioPlaying: false,
          questionPhase: false,
          showAnswerRevealed: false,
        }));

        // 🎯 Llamar al cardService (siempre usa la API)
        const gameCard = await cardService.getCardByQR(qrCode);

        if (!gameCard) {
          throw new Error('No se pudo obtener la carta');
        }

        console.log(`✅ Card received: ${gameCard.track.title}`);
        console.log(`   Audio: ${gameCard.audio.hasAudio ? '✅' : '❌'}`);

        // Actualizar store del juego
        await scanCard(qrCode, gameCard);

        // Actualizar estado: listo para audio
        // ✅ AudioPlayer.tsx detectará currentCard y reproducirá
        setFlowState((prev) => ({
          ...prev,
          isScanning: false,
          isLoading: false,
          audioPlaying: true, // Indica que estamos en fase de audio
        }));

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ QR Scan failed: ${errorMessage}`);

        setFlowState((prev) => ({
          ...prev,
          isScanning: false,
          isLoading: false,
          currentError: errorMessage,
        }));

        return false;
      }
    },
    [scanCard]
  );

  // 🎵 AUDIO TERMINADO
  // ✅ Llamado por AudioPlayer.tsx cuando termina el audio
  const handleAudioFinished = useCallback(() => {
    console.log(`🎵 handleAudioFinished called`);

    // Actualizar store
    setAudioFinished(true);
    setShowQuestion(true);

    // Iniciar fase de apuestas
    setFlowState((prev) => ({
      ...prev,
      audioPlaying: false,
      questionPhase: true,
      bettingPhase: true,
      bettingStarted: true,
      bettingTimeLeft: BETTING_TIME_LIMIT,
    }));

    // Iniciar timer de apuestas
    startBettingTimer();

    console.log(`✅ Betting phase started`);
  }, [setAudioFinished, setShowQuestion]);

  // ⏱️ TIMER DE APUESTAS
  const startBettingTimer = useCallback(() => {
    // Limpiar timer anterior
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
    }

    let timeLeft = BETTING_TIME_LIMIT;

    bettingTimerRef.current = setInterval(() => {
      timeLeft -= 1;

      setFlowState((prev) => ({
        ...prev,
        bettingTimeLeft: timeLeft,
      }));

      if (timeLeft <= 0) {
        console.log(`⏰ Betting time expired`);
        endBettingPhase();
      }
    }, 1000);
  }, []);

  // 🛑 TERMINAR FASE DE APUESTAS
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

    console.log(`🎲 Betting phase ended`);
  }, []);

  // 👁️ REVELAR RESPUESTA
  const revealAnswer = useCallback(() => {
    console.log(`👁️ Revealing answer`);

    // Terminar apuestas si aún están activas
    endBettingPhase();

    setFlowState((prev) => ({
      ...prev,
      showAnswerRevealed: true,
    }));

    setShowAnswer(true);
  }, [setShowAnswer, endBettingPhase]);

  // 🏆 OTORGAR PUNTOS Y AVANZAR
  const awardPointsAndAdvance = useCallback(
    (playerId: string, playerName: string) => {
      console.log(`🏆 Awarding points to: ${playerName}`);

      setFlowState((prev) => ({
        ...prev,
        lastWinnerId: playerId,
      }));

      // Esperar un momento y avanzar al siguiente turno
      setTimeout(() => {
        nextTurn();
        resetFlow();
      }, 1500);

      return { playerId, playerName };
    },
    [nextTurn]
  );

  // 🔄 REINICIAR FLUJO
  const resetFlow = useCallback(() => {
    console.log(`🔄 Resetting game flow`);

    // Limpiar timers
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
      bettingTimerRef.current = null;
    }

    // Reset estado
    setFlowState({
      isScanning: false,
      audioPlaying: false,
      questionPhase: false,
      showAnswerRevealed: false,
      bettingPhase: false,
      bettingTimeLeft: BETTING_TIME_LIMIT,
      bettingStarted: false,
      currentError: null,
      lastWinnerId: null,
      isLoading: false,
    });
  }, []);

  // 🧪 TEST DE CONEXIÓN
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await cardService.testConnection();
    } catch {
      return false;
    }
  }, []);

  // 📊 HELPERS
  const getWinnerInfo = useCallback(() => {
    return {
      winnerId: flowState.lastWinnerId,
      hasWinner: !!flowState.lastWinnerId,
    };
  }, [flowState.lastWinnerId]);

  const getBettingStatus = useCallback(() => {
    return {
      isActive: flowState.bettingPhase,
      timeLeft: flowState.bettingTimeLeft,
      hasStarted: flowState.bettingStarted,
      canBet: flowState.bettingPhase && flowState.bettingTimeLeft > 0,
      urgentTime: flowState.bettingTimeLeft <= 10,
    };
  }, [flowState]);

  const getCurrentPhase = useCallback((): GamePhase => {
    if (flowState.isScanning || flowState.isLoading) return 'scanning';
    if (flowState.audioPlaying) return 'audio';
    if (flowState.bettingPhase) return 'betting';
    if (flowState.questionPhase && !flowState.showAnswerRevealed)
      return 'question';
    if (flowState.showAnswerRevealed) return 'answer';
    return 'idle';
  }, [flowState]);

  // 🧹 CLEANUP
  useEffect(() => {
    return () => {
      if (bettingTimerRef.current) {
        clearInterval(bettingTimerRef.current);
      }
    };
  }, []);

  // 📤 RETURN
  return {
    // Estado
    flowState,

    // Acciones principales
    handleQRScan,
    handleAudioFinished,
    revealAnswer,
    awardPointsAndAdvance,
    resetFlow,

    // Betting
    endBettingPhase,
    getBettingStatus,

    // Utils
    testConnection,
    getWinnerInfo,
    getCurrentPhase,
  };
};

export type { GamePhase };
