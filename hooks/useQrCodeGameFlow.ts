// hooks/useQRGameFlow.ts - 🎮 Hook de Flujo de Juego
import { useGameStore } from '@/store/gameStore';
import { useCallback, useState } from 'react';
import { useAudioPlayback } from './useAudioPlayback';

type GamePhase = 'idle' | 'scanning' | 'audio' | 'question' | 'answered';

interface GameCard {
  id: string;
  qrCode: string;
  cardType: string;
  track: {
    title: string;
    artist: string;
    year: number;
    previewUrl: string;
  };
  question: string;
  answer: string;
  points: number;
  difficulty: string;
}

export const useQRGameFlow = () => {
  const { currentCard, awardPoints, nextTurn } = useGameStore();
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // 🎵 Audio Hook
  const { isPlaying, playAudio, stopAudio, cleanup } = useAudioPlayback({
    onAudioFinished: () => {
      setPhase('question');
    },
    duration: 5000,
  });

  // 🔍 Mock QR Scanner - Simula backend response
  const mockScanQR = useCallback((qrCode: string): GameCard | null => {
    // Parse QR: HITBACK_001_SONG_EASY
    const parts = qrCode.split('_');
    if (parts.length !== 4 || parts[0] !== 'HITBACK') {
      return null;
    }

    const [, trackId, cardType, difficulty] = parts;

    // Mock track data - En producción vendría del backend
    const mockTracks: Record<string, any> = {
      '001': {
        title: 'Despacito',
        artist: 'Luis Fonsi ft. Daddy Yankee',
        year: 2017,
        previewUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // URL de prueba
      },
      '002': {
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        year: 1975,
        previewUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      },
      '003': {
        title: 'Uptown Funk',
        artist: 'Mark Ronson ft. Bruno Mars',
        year: 2014,
        previewUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      },
    };

    const track = mockTracks[trackId];
    if (!track) return null;

    // Generate questions based on card type
    const questions: Record<
      string,
      { question: string; answer: string; points: number }
    > = {
      SONG: {
        question: '¿Cuál es la canción?',
        answer: track.title,
        points: 1,
      },
      ARTIST: {
        question: '¿Quién la canta?',
        answer: track.artist,
        points: 2,
      },
      DECADE: {
        question: '¿De qué década es?',
        answer: `${Math.floor(track.year / 10) * 10}s`,
        points: 3,
      },
      LYRICS: {
        question: 'Completa la letra...',
        answer: 'Primera línea de la canción',
        points: 3,
      },
      CHALLENGE: {
        question: `Baila o canta ${track.title}`,
        answer: 'Completar challenge',
        points: 5,
      },
    };

    const questionData = questions[cardType.toUpperCase()] || questions.SONG;

    return {
      id: `${trackId}_${cardType}_${difficulty}`,
      qrCode,
      cardType: cardType.toLowerCase(),
      track,
      ...questionData,
      difficulty: difficulty.toLowerCase(),
    };
  }, []);

  // 🎯 Main QR Scan Handler
  const handleQRScan = useCallback(
    async (qrCode: string) => {
      try {
        setError(null);
        setShowAnswer(false);
        setPhase('scanning');

        // Simulate scanning delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get card data (mock)
        const card = mockScanQR(qrCode);
        if (!card) {
          throw new Error('Código QR inválido');
        }

        // Update game store
        useGameStore.getState().scanCard(qrCode, card as any);

        // Start audio phase
        setPhase('audio');

        // Play audio if available
        if (card.track.previewUrl) {
          const success = await playAudio(card.track.previewUrl);
          if (!success) {
            // If audio fails, go directly to question
            setPhase('question');
          }
        } else {
          // No audio, go directly to question
          setPhase('question');
        }

        return true;
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Error al escanear QR'
        );
        setPhase('idle');
        return false;
      }
    },
    [mockScanQR, playAudio]
  );

  // 👁️ Reveal Answer
  const revealAnswer = useCallback(() => {
    setShowAnswer(true);
  }, []);

  // 🏆 Award Points and Continue
  const handleAwardPoints = useCallback(
    (playerId: string) => {
      if (!currentCard) return;

      awardPoints(playerId, currentCard.points);
      setPhase('answered');

      // Auto-advance after showing feedback
      setTimeout(() => {
        nextTurn();
        setPhase('idle');
        setShowAnswer(false);
        cleanup();
      }, 2000);
    },
    [currentCard, awardPoints, nextTurn, cleanup]
  );

  // ❌ No Winner
  const handleNoWinner = useCallback(() => {
    setPhase('idle');
    setShowAnswer(false);
    nextTurn();
    cleanup();
  }, [nextTurn, cleanup]);

  // 🔄 Reset Flow
  const resetFlow = useCallback(() => {
    setPhase('idle');
    setError(null);
    setShowAnswer(false);
    stopAudio();
  }, [stopAudio]);

  return {
    // State
    phase,
    error,
    showAnswer,
    currentCard,
    isAudioPlaying: isPlaying,

    // Actions
    handleQRScan,
    revealAnswer,
    handleAwardPoints,
    handleNoWinner,
    resetFlow,

    // Derived state for UI
    isScanning: phase === 'scanning',
    showQuestion: phase === 'question' || phase === 'answered',
    canAwardPoints: phase === 'question' || phase === 'answered',
  };
};
