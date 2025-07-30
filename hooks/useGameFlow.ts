// hooks/useGameFlow.ts - 🎮 ARREGLAR crashes y race conditions
import { audioService } from '@/services/audioService';
import { useGameStore } from '@/store/gameStore';
import { useCallback, useEffect, useRef, useState } from 'react';

type GamePhase = 'idle' | 'scanning' | 'audio' | 'question' | 'answered';

interface GameFlowState {
  phase: GamePhase;
  isLoading: boolean;
  error: string | null;
  showAnswer: boolean;
  canAwardPoints: boolean;
}

export const useGameFlow = () => {
  const { scanCard, currentCard } = useGameStore();

  const [flowState, setFlowState] = useState<GameFlowState>({
    phase: 'idle',
    isLoading: false,
    error: null,
    showAnswer: false,
    canAwardPoints: false,
  });

  // 🔧 ARREGLO: Refs para prevenir crashes
  const audioTimeoutRef = useRef<NodeJS.Timeout>();
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);
  const callbackExecutedRef = useRef(false);

  // 🔧 ARREGLO: Cleanup en unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeouts();
      audioService.stopAudio();
      isProcessingRef.current = false;
    };
  }, []);

  // 🔄 Clear timeouts - MEJORADO
  const clearTimeouts = useCallback(() => {
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
      audioTimeoutRef.current = undefined;
    }
    callbackExecutedRef.current = false;
  }, []);

  // 🔧 ARREGLO: Safe state update
  const safeSetState = useCallback((newState: Partial<GameFlowState>) => {
    if (isMountedRef.current) {
      setFlowState((prev) => ({ ...prev, ...newState }));
    }
  }, []);

  // 🎯 Main QR scan handler - ARREGLOS para evitar crashes
  const handleQRScan = useCallback(
    async (qrCode: string): Promise<boolean> => {
      // 🔧 ARREGLO: Prevenir múltiples scans
      if (isProcessingRef.current || !isMountedRef.current) {
        return false;
      }

      try {
        isProcessingRef.current = true;
        callbackExecutedRef.current = false;
        clearTimeouts();

        safeSetState({
          phase: 'scanning',
          isLoading: true,
          error: null,
          showAnswer: false,
          canAwardPoints: false,
        });

        // Get card data
        const result = await audioService.scanQRAndPlay(qrCode);

        if (!isMountedRef.current) {
          return false;
        }

        if (!result.success || !result.card) {
          throw new Error(result.error?.message || 'Failed to scan QR');
        }

        // Store card in game state
        await scanCard(qrCode, result.card);

        if (!isMountedRef.current) {
          return false;
        }

        // Start audio phase
        safeSetState({ phase: 'audio' });

        // 🔧 ARREGLO: Audio con callback seguro
        if (result.card.track.previewUrl) {
          await audioService.playTrackPreview(
            result.card.track.previewUrl,
            5000,
            () => {
              // 🔧 ARREGLO: Callback seguro que solo se ejecuta una vez
              if (!callbackExecutedRef.current && isMountedRef.current) {
                callbackExecutedRef.current = true;
                safeSetState({
                  phase: 'question',
                  isLoading: false,
                  error: null,
                  showAnswer: false,
                  canAwardPoints: true,
                });
              }
            }
          );
        } else {
          // 🔧 ARREGLO: Sin audio, timeout seguro
          audioTimeoutRef.current = setTimeout(() => {
            if (!callbackExecutedRef.current && isMountedRef.current) {
              callbackExecutedRef.current = true;
              safeSetState({
                phase: 'question',
                isLoading: false,
                error: null,
                showAnswer: false,
                canAwardPoints: true,
              });
            }
          }, 1000);
        }

        return true;
      } catch (error) {
        if (isMountedRef.current) {
          safeSetState({
            phase: 'idle',
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            showAnswer: false,
            canAwardPoints: false,
          });
        }
        return false;
      } finally {
        isProcessingRef.current = false;
      }
    },
    [scanCard, clearTimeouts, safeSetState]
  );

  // 👁️ Reveal answer - SEGURO
  const revealAnswer = useCallback(() => {
    if (isMountedRef.current) {
      safeSetState({ showAnswer: true });
    }
  }, [safeSetState]);

  // 🏆 Award points and advance - MEJORADO
  const awardPointsAndAdvance = useCallback(
    (playerId: string) => {
      if (!isMountedRef.current) return;

      safeSetState({
        phase: 'answered',
        isLoading: false,
        error: null,
        showAnswer: true,
        canAwardPoints: false,
      });

      // 🔧 ARREGLO: Auto-reset seguro
      audioTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          resetFlow();
        }
      }, 2000);
    },
    [safeSetState]
  );

  // ➡️ No winner advance - SEGURO
  const noWinnerAdvance = useCallback(() => {
    if (isMountedRef.current) {
      resetFlow();
    }
  }, []);

  // 🔄 Reset flow - MEJORADO con cleanup completo
  const resetFlow = useCallback(() => {
    clearTimeouts();
    audioService.stopAudio();
    isProcessingRef.current = false;
    callbackExecutedRef.current = false;

    if (isMountedRef.current) {
      safeSetState({
        phase: 'idle',
        isLoading: false,
        error: null,
        showAnswer: false,
        canAwardPoints: false,
      });
    }
  }, [clearTimeouts, safeSetState]);

  // 🧹 Cleanup - MEJORADO
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    clearTimeouts();
    audioService.stopAudio();
    isProcessingRef.current = false;
    callbackExecutedRef.current = false;
  }, [clearTimeouts]);

  return {
    // State - MANTENER INTERFACE ORIGINAL
    flowState,
    currentCard,

    // Actions - MANTENER NOMBRES ORIGINALES
    handleQRScan,
    revealAnswer,
    awardPointsAndAdvance,
    noWinnerAdvance,
    resetFlow,
    cleanup,

    // Derived state for UI - COMO ESTABA ANTES
    isScanning: flowState.phase === 'scanning',
    isAudioPlaying: flowState.phase === 'audio',
    showQuestion:
      flowState.phase === 'question' || flowState.phase === 'answered',
    showAnswer: flowState.showAnswer,
    canAwardPoints: flowState.canAwardPoints,
  };
};
