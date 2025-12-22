import { useCallback, useState } from 'react';
import { gameSessionService } from '@/services/GameSessionService';
import { useGameStore } from '@/store/gameStore';

export interface GameFlow {
  phase: 'idle' | 'audio' | 'question' | 'answer' | 'loading' | 'betting';
  isLoading: boolean;
  currentRound: any;
  audioPlaying: boolean;
  audioUrl: string | null;
  questionVisible: boolean;
  showBettingButton: boolean;
  hasPlacedBet: boolean;
  roundNumber: number;
}

const initialState: GameFlow = {
  phase: 'idle',
  isLoading: false,
  currentRound: null,
  audioPlaying: false,
  audioUrl: null,
  questionVisible: false,
  showBettingButton: false,
  hasPlacedBet: false,
  roundNumber: 0,
};

export const useGameFlow = () => {
  const [flowState, setFlowState] = useState<GameFlow>(initialState);
  const { clearBets, syncPlayersFromBackend } = useGameStore();

  // SIGUIENTE RONDA - VERSIÓN SIMPLE QUE FUNCIONA
  const nextRound = useCallback(async (): Promise<boolean> => {
    console.log('🎵 Getting next round...');

    try {
      setFlowState((prev) => ({ ...prev, isLoading: true, phase: 'loading' }));

      const result = await gameSessionService.nextRound();

      if (!result.success) {
        console.error('❌ Error getting next round:', result.error);
        setFlowState((prev) => ({ ...prev, isLoading: false, phase: 'idle' }));
        return false;
      }

      // Limpiar apuestas de la ronda anterior
      clearBets();

      const roundNumber = result.round?.number || 0;
      console.log(`✅ Round ${roundNumber} received`);

      if (roundNumber === 1) {
        // RONDA 1: Audio directo (sin apuestas)
        setFlowState({
          phase: 'audio',
          isLoading: false,
          currentRound: result.round,
          audioPlaying: true,
          audioUrl: result.round?.track?.audioUrl || null,
          questionVisible: false,
          showBettingButton: false,
          hasPlacedBet: false,
          roundNumber: roundNumber,
        });
        console.log('🎵 Ronda 1: Audio directo');
      } else {
        // RONDA 2+: Mostrar opción de apuestas
        setFlowState({
          phase: 'betting',
          isLoading: false,
          currentRound: result.round,
          audioPlaying: false,
          audioUrl: result.round?.track?.audioUrl || null,
          questionVisible: false,
          showBettingButton: true,
          hasPlacedBet: false,
          roundNumber: roundNumber,
        });
        console.log('🎰 Ronda 2+: Fase de apuestas');
      }

      return true;
    } catch (error) {
      console.error('❌ Error in nextRound:', error);
      setFlowState((prev) => ({ ...prev, isLoading: false, phase: 'idle' }));
      return false;
    }
  }, [clearBets]);

  // MANEJAR FIN DE AUDIO
  const handleAudioFinished = useCallback(() => {
    console.log('🎵 Audio finished, showing question');
    setFlowState((prev) => ({
      ...prev,
      phase: 'question',
      audioPlaying: false,
      questionVisible: true,
    }));
  }, []);

  // REGISTRAR APUESTA
  const placeBet = useCallback(async (playerId: string, tokens: number) => {
    console.log(`🎰 Placing bet: ${playerId} -> ${tokens}`);

    try {
      const result = await gameSessionService.placeBet(playerId, tokens);

      if (result.success) {
        console.log('✅ Bet placed successfully in backend');
        return { success: true, multiplier: tokens };
      } else {
        console.error('❌ Backend bet failed:', result.error);
        return { success: false, multiplier: 1 };
      }
    } catch (error) {
      console.error('❌ Error placing bet in backend:', error);
      return { success: false, multiplier: 1 };
    }
  }, []);

  // SALTAR APUESTAS
  const skipBetting = useCallback(() => {
    console.log('⏭️ Skipping betting, starting audio');
    setFlowState((prev) => ({
      ...prev,
      hasPlacedBet: false,
      showBettingButton: false,
      phase: 'audio',
      audioPlaying: true,
    }));
  }, []);

  // REVELAR RESPUESTA Y SINCRONIZAR PUNTOS
  const revealAnswer = useCallback(
    async (winnerId: string | null) => {
      console.log(`✅ Revealing answer, winner: ${winnerId || 'none'}`);

      try {
        const result = await gameSessionService.revealAnswer(winnerId);

        if (result.success) {
          console.log('✅ Answer revealed successfully');

          // ✅ IMPORTANTE: Sincronizar jugadores desde backend
          if (result.players && Array.isArray(result.players)) {
            console.log('🔄 Syncing players data from backend...');
            syncPlayersFromBackend(result.players);
          } else if (result.results?.players) {
            console.log('🔄 Syncing players from results...');
            syncPlayersFromBackend(result.results.players);
          } else {
            console.warn('⚠️ No players data received from backend');
          }

          setFlowState((prev) => ({
            ...prev,
            phase: 'answer',
            questionVisible: false,
          }));

          return result.results;
        } else {
          console.error('❌ Error revealing answer:', result.error);
          return null;
        }
      } catch (error) {
        console.error('❌ Error revealing answer:', error);
        return null;
      }
    },
    [syncPlayersFromBackend]
  );

  // PREPARAR SIGUIENTE RONDA
  const prepareNextRound = useCallback(() => {
    console.log('🔄 Preparing for next round');
    setFlowState((prev) => ({
      ...prev,
      phase: 'idle',
      questionVisible: false,
      hasPlacedBet: false,
      showBettingButton: false,
      audioPlaying: false,
      audioUrl: null,
    }));
  }, []);

  // GETTERS
  const getBettingStatus = useCallback(() => {
    return {
      isActive: flowState.phase === 'betting',
      canBet: flowState.phase === 'betting' && !flowState.hasPlacedBet,
      timeLeft: 0,
      urgentTime: false,
    };
  }, [flowState]);

  const getCurrentPhase = useCallback(() => {
    return flowState.phase;
  }, [flowState]);

  const canStartNextRound = useCallback(() => {
    return (
      !flowState.isLoading &&
      (flowState.phase === 'answer' || flowState.phase === 'idle')
    );
  }, [flowState]);

  return {
    // Estado
    flowState,
    setFlowState,

    // Acciones principales
    nextRound,
    handleAudioFinished,
    revealAnswer,
    placeBet,
    skipBetting,
    prepareNextRound,

    // Getters
    getBettingStatus,
    getCurrentPhase,
    canStartNextRound,

    // Utils
    testConnection: () => gameSessionService.testConnection(),
  };
};
