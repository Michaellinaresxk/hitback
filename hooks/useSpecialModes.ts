// hooks/useSpecialModes.ts
import { useGameStore } from '@/store/gameStore';
import { useCallback, useState } from 'react';

export const useSpecialModes = () => {
  const {
    players,
    currentCard,
    gameMode,
    startBattleMode,
    startSpeedRound,
    startViralMoment,
    awardPoints,
    nextTurn,
  } = useGameStore();

  const [battlePlayers, setBattlePlayers] = useState<{
    player1Id: string;
    player2Id: string;
  } | null>(null);

  const [speedRoundActive, setSpeedRoundActive] = useState(false);
  const [speedRoundAnswers, setSpeedRoundAnswers] = useState<
    Record<string, number>
  >({});

  // ⚔️ BATTLE MODE
  const initiateBattleMode = useCallback(() => {
    if (players.length < 2) {
      return {
        success: false,
        error: 'Se necesitan al menos 2 jugadores para Battle Mode',
      };
    }

    if (!currentCard) {
      return {
        success: false,
        error: 'Necesitas una carta activa para Battle Mode',
      };
    }

    return { success: true };
  }, [players.length, currentCard]);

  const handleBattlePlayerSelection = useCallback(
    (player1Id: string, player2Id: string) => {
      setBattlePlayers({ player1Id, player2Id });
      startBattleMode(player1Id, player2Id);
    },
    [startBattleMode]
  );

  const resolveBattleMode = useCallback(
    (player1Won: boolean, player2Won: boolean) => {
      if (!battlePlayers || !currentCard) return;

      const bonusPoints = 1; // Battle mode bonus

      if (player1Won && player2Won) {
        // Both win - normal points
        awardPoints(battlePlayers.player1Id, currentCard.points, 2000);
        setTimeout(() => {
          awardPoints(battlePlayers.player2Id, currentCard.points, 2000);
        }, 100);
      } else if (player1Won) {
        // Player 1 wins - bonus points
        awardPoints(
          battlePlayers.player1Id,
          currentCard.points + bonusPoints,
          2000
        );
      } else if (player2Won) {
        // Player 2 wins - bonus points
        awardPoints(
          battlePlayers.player2Id,
          currentCard.points + bonusPoints,
          2000
        );
      } else {
        // No one wins - just next turn
        nextTurn();
      }

      setBattlePlayers(null);
    },
    [battlePlayers, currentCard, awardPoints, nextTurn]
  );

  // ⚡ SPEED ROUND
  const initiateSpeedRound = useCallback(() => {
    if (!currentCard) {
      return {
        success: false,
        error: 'Necesitas una carta activa para Speed Round',
      };
    }

    setSpeedRoundActive(true);
    setSpeedRoundAnswers({});
    startSpeedRound();

    // Auto-end after 30 seconds
    setTimeout(() => {
      if (speedRoundActive) {
        resolveSpeedRound();
      }
    }, 30000);

    return { success: true };
  }, [currentCard, speedRoundActive, startSpeedRound]);

  const addSpeedRoundAnswer = useCallback((playerId: string) => {
    setSpeedRoundAnswers((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + 1,
    }));
  }, []);

  const resolveSpeedRound = useCallback(() => {
    if (Object.keys(speedRoundAnswers).length === 0) {
      nextTurn();
      setSpeedRoundActive(false);
      return;
    }

    // Find winner(s)
    const maxAnswers = Math.max(...Object.values(speedRoundAnswers));
    const winners = Object.entries(speedRoundAnswers)
      .filter(([_, count]) => count === maxAnswers)
      .map(([playerId]) => playerId);

    // Award points
    winners.forEach((playerId) => {
      const answerCount = speedRoundAnswers[playerId];
      const speedBonusPoints = answerCount * 2; // 2 points per correct answer
      awardPoints(playerId, speedBonusPoints, 1500);
    });

    // Award participation points
    Object.entries(speedRoundAnswers).forEach(([playerId, answerCount]) => {
      if (!winners.includes(playerId) && answerCount > 0) {
        awardPoints(playerId, answerCount, 3000);
      }
    });

    setSpeedRoundActive(false);
    setSpeedRoundAnswers({});
  }, [speedRoundAnswers, awardPoints, nextTurn]);

  // 🔥 VIRAL MOMENT
  const initiateViralMoment = useCallback(() => {
    if (!currentCard) {
      return {
        success: false,
        error: 'Necesitas una carta activa para Viral Moment',
      };
    }

    if (currentCard.cardType !== 'challenge') {
      return {
        success: false,
        error: 'Viral Moment solo funciona con Challenge Cards',
      };
    }

    startViralMoment();
    return { success: true };
  }, [currentCard, startViralMoment]);

  const resolveViralMoment = useCallback(
    (playerId: string, wasSuccessful: boolean) => {
      if (!currentCard) return;

      if (wasSuccessful) {
        // Viral success: Triple points + bonus
        const viralPoints = currentCard.points * 3 + 2;
        awardPoints(playerId, viralPoints, 1000);
      } else {
        // Failed viral: Just next turn, no penalty
        nextTurn();
      }
    },
    [currentCard, awardPoints, nextTurn]
  );

  // 🎮 Mode availability checks
  const canUseBattleMode = players.length >= 2 && !!currentCard;
  const canUseSpeedRound = !!currentCard;
  const canUseViralMoment =
    !!currentCard && currentCard.cardType === 'challenge';

  return {
    // Battle Mode
    battlePlayers,
    initiateBattleMode,
    handleBattlePlayerSelection,
    resolveBattleMode,

    // Speed Round
    speedRoundActive,
    speedRoundAnswers,
    initiateSpeedRound,
    addSpeedRoundAnswer,
    resolveSpeedRound,

    // Viral Moment
    initiateViralMoment,
    resolveViralMoment,

    // Availability
    canUseBattleMode,
    canUseSpeedRound,
    canUseViralMoment,

    // Current mode
    currentMode: gameMode,
  };
};
