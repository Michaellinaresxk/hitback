// gameFlow/phaseHandlers.ts
import { gameSessionService } from '@/services/GameSessionService';
import type { GameFlow, PlayerSyncData } from './types';
import {
  getLoadingState,
  getAudioState,
  getBettingState,
  getAnswerState,
  getResetState,
} from './state';

export const createPhaseHandlers = (
  setFlowState: React.Dispatch<React.SetStateAction<GameFlow>>,
  dependencies: {
    endGame: () => void;
    setShowGameEndModal: (show: boolean) => void;
    syncPlayersWithStore: (players: PlayerSyncData[]) => void;
    endBettingPhase: () => void;
  },
) => {
  const handleAudioFinished = () => {
    console.log(`🎵 Audio finished, starting betting phase`);
    setFlowState((prev) => ({ ...prev, ...getBettingState() }));
    dependencies.endBettingPhase();
  };

  const prepareNextRound = () => {
    console.log(`🔄 Preparing for next round`);
    dependencies.endBettingPhase();
    setFlowState((prev) => ({ ...prev, ...getResetState() }));
  };

  const revealAnswer = async (winnerId: string | null) => {
    console.log(`\n✅ ═══ REVEAL ANSWER START ═══`);
    console.log(`✅ Winner ID: ${winnerId || 'none'}`);

    dependencies.endBettingPhase();

    try {
      const result = await gameSessionService.revealAnswer(winnerId);
      console.log(`✅ Backend response:`, JSON.stringify(result, null, 2));

      if (!result.success) {
        throw new Error(result.error || 'Error revelando respuesta');
      }

      const roundResult = result.results;

      const showReward = roundResult.pointsAwarded > 0 && Boolean(winnerId);
      const rewardData = showReward
        ? {
            type: 'tokens' as const,
            amount: roundResult.pointsAwarded,
            name: 'Puntos Ganados',
            description: `¡Has ganado ${roundResult.pointsAwarded} puntos!`,
            icon: '🏆',
          }
        : null;

      setFlowState((prev) => ({
        ...prev,
        ...getAnswerState(roundResult, showReward, rewardData),
      }));

      if (result.players && Array.isArray(result.players)) {
        console.log(`✅ Syncing ${result.players.length} players...`);
        dependencies.syncPlayersWithStore(result.players);
      } else {
        console.warn(`⚠️ No players array in response!`);
      }

      if (roundResult.gameOver && roundResult.gameWinner) {
        console.log(
          `🏆 Game Over detected! Winner: ${roundResult.gameWinner.name}`,
        );
        dependencies.endGame();
        dependencies.setShowGameEndModal(true);
      }

      console.log(`✅ ═══ REVEAL ANSWER END ═══\n`);
      return roundResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ revealAnswer failed: ${errorMessage}`);

      setFlowState((prev) => ({
        ...prev,
        currentError: errorMessage,
      }));

      return null;
    }
  };

  const placeBet = async (playerId: string, tokens: number) => {
    console.log(`🎰 Placing bet: ${playerId} -> ${tokens} tokens`);

    try {
      const result = await gameSessionService.placeBet(playerId, tokens);

      if (!result.success) {
        throw new Error(result.error || 'Error registrando apuesta');
      }

      console.log(`   Multiplier: ${result.bet.multiplier}x`);
      return {
        success: true,
        multiplier: result.bet.multiplier,
      };
    } catch (error) {
      console.error(`❌ placeBet failed:`, error);
      return { success: false, multiplier: 1 };
    }
  };

  return {
    handleAudioFinished,
    prepareNextRound,
    revealAnswer,
    placeBet,
  };
};
