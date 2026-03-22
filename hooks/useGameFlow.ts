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
  correctAnswer?: string | null;
  trackInfo?: {
    title: string;
    artist: string;
  } | null;
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

  // SIGUIENTE RONDA
  const nextRound = useCallback(async (): Promise<boolean> => {
    console.log('🎵 Getting next round...');

    try {
      setFlowState((prev) => ({ ...prev, isLoading: true, phase: 'loading' }));

      const result = await gameSessionService.nextRound();
      console.log('🔍 Backend response round:', result.round);
      console.log(
        '🔍 GameMasterAnswer in round:',
        result.round?.gameMasterAnswer,
      );
      console.log(
        '🔍 Correct answer:',
        result.round?.gameMasterAnswer?.correct,
      );

      if (!result.success) {
        console.error('❌ Error getting next round:', result.error);
        setFlowState((prev) => ({ ...prev, isLoading: false, phase: 'idle' }));
        return false;
      }

      clearBets();

      const roundNumber = result.round?.number || 0;
      console.log(`✅ Round ${roundNumber} received`);

      const audioUrl = result.round?.track?.audioUrl || null;

      if (roundNumber === 1) {
        // Sin audio → saltar directo a pregunta para no congelar el juego
        const hasAudio = !!audioUrl;
        if (!hasAudio) {
          console.warn('⚠️ Ronda 1 sin audio — saltando directo a pregunta');
        }
        setFlowState({
          phase: hasAudio ? 'audio' : 'question',
          isLoading: false,
          currentRound: result.round,
          audioPlaying: hasAudio,
          audioUrl,
          questionVisible: !hasAudio,
          showBettingButton: false,
          hasPlacedBet: false,
          roundNumber: roundNumber,
          correctAnswer: result.round?.gameMasterAnswer?.correct || null,
          trackInfo: result.round?.gameMasterAnswer
            ? {
                title: result.round.gameMasterAnswer.trackTitle,
                artist: result.round.gameMasterAnswer.trackArtist,
              }
            : null,
        });
        console.log(hasAudio ? '🎵 Ronda 1: Audio directo' : '🎵 Ronda 1: Sin audio, mostrando pregunta');
      } else {
        setFlowState({
          phase: 'betting',
          isLoading: false,
          currentRound: result.round,
          audioPlaying: false,
          audioUrl,
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
    setFlowState((prev) => {
      const hasAudio = !!prev.audioUrl;
      if (!hasAudio) {
        console.warn('⚠️ skipBetting: sin audio — saltando directo a pregunta');
      }
      return {
        ...prev,
        hasPlacedBet: false,
        showBettingButton: false,
        phase: hasAudio ? 'audio' : 'question',
        audioPlaying: hasAudio,
        questionVisible: !hasAudio,
      };
    });
  }, []);

  // REVELAR RESPUESTA
  // ⚠️ El winnerId aquí es el ID del BACKEND, no el del frontend.
  // Por eso awardAllianceBonus NO va aquí — se llama desde handleAwardPoints
  // en game.tsx donde tenemos el playerId correcto del frontend.
  const revealAnswer = useCallback(
    async (winnerId: string | null) => {
      console.log(`✅ Revealing answer, winner: ${winnerId || 'none'}`);

      try {
        const result = await gameSessionService.revealAnswer(winnerId);

        if (result.success) {
          console.log('✅ Answer revealed successfully');

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
    [syncPlayersFromBackend],
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

  const confirmBetsAndContinue = useCallback(() => {
    console.log('✅ Confirmando apuestas y continuando...');
    setFlowState((prev) => {
      const hasAudio = !!prev.audioUrl;
      if (!hasAudio) {
        console.warn('⚠️ confirmBetsAndContinue: sin audio — saltando directo a pregunta');
      }
      return {
        ...prev,
        phase: hasAudio ? 'audio' : 'question',
        audioPlaying: hasAudio,
        questionVisible: !hasAudio,
        showBettingButton: false,
      };
    });
    console.log('🎵 Iniciando audio después de confirmar apuestas');
  }, []);

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
    flowState,
    setFlowState,
    nextRound,
    handleAudioFinished,
    revealAnswer,
    placeBet,
    skipBetting,
    prepareNextRound,
    confirmBetsAndContinue,
    getBettingStatus,
    getCurrentPhase,
    canStartNextRound,
    testConnection: () => gameSessionService.testConnection(),
  };
};
