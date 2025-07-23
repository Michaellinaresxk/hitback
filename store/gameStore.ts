import { create } from 'zustand';
import {
  Player,
  Card,
  GameState,
  GameMode,
  SpeedRoundAnswer,
  BattleRound,
  CardType,
} from '@/types/game.types';
import { cardService } from '@/services/cardService';
import { audioService } from '@/services/audioService';

interface GameStore extends GameState {
  // Card & Audio
  scanCard: (qrCode: string) => Promise<void>;
  playCardAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;

  // Player Management
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;

  // Game Flow
  startGame: () => void;
  endGame: () => void;
  createNewGame: () => void;
  nextTurn: () => void;

  // Scoring
  awardPoints: (playerId: string, points?: number) => void;

  // Game Modes
  startBattleMode: (player1Id: string, player2Id: string) => void;
  endBattleMode: () => void;
  startSpeedRound: () => void;
  endSpeedRound: () => void;
  startViralMoment: () => void;
  resetGameMode: () => void;

  // Battle Mode
  battleRound: BattleRound | null;
  processBattleAnswer: (playerId: string, isCorrect: boolean) => void;

  // Speed Round
  addSpeedRoundAnswer: (playerId: string, isCorrect: boolean) => void;
  currentSpeedRoundIndex: number;
  speedRoundTimeLeft: number;

  // Timer Management
  startTimer: (duration: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;

  // UI States
  setScanning: (scanning: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Statistics
  getGameStats: () => GameStats;
  getPlayerStats: (playerId: string) => PlayerStats;
}

interface GameStats {
  totalRounds: number;
  totalCardsPlayed: number;
  averageScorePerRound: number;
  mostActivePlayer: string;
  gameTimeElapsed: number;
}

interface PlayerStats {
  correctAnswers: number;
  totalAnswers: number;
  averageResponseTime: number;
  favoriteCardType: CardType;
  pointsPerCardType: Record<CardType, number>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial State
  id: '',
  players: [],
  currentTurn: 0,
  gameMode: 'normal',
  timeLeft: 0,
  isActive: false,
  round: 1,
  currentCard: null,
  isScanning: false,
  speedRoundCards: [],
  speedRoundAnswers: [],
  battleRound: null,
  currentSpeedRoundIndex: 0,
  speedRoundTimeLeft: 30,
  error: null,

  // Player Management
  addPlayer: (name: string) => {
    const { players } = get();

    // Validations
    if (name.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (players.length >= 8) {
      throw new Error('Máximo 8 jugadores');
    }

    if (
      players.some((p) => p.name.toLowerCase() === name.toLowerCase().trim())
    ) {
      throw new Error('Ya existe un jugador con ese nombre');
    }

    const newPlayer: Player = {
      id: `player_${Date.now()}`,
      name: name.trim(),
      score: 0,
      isCurrentTurn: false,
    };

    set((state) => ({
      players: [...state.players, newPlayer],
      error: null,
    }));
  },

  removePlayer: (id: string) => {
    set((state) => {
      const newPlayers = state.players.filter((p) => p.id !== id);
      const currentPlayerIndex = state.players.findIndex((p) => p.id === id);

      // Adjust current turn if necessary
      let newCurrentTurn = state.currentTurn;
      if (currentPlayerIndex <= state.currentTurn && newPlayers.length > 0) {
        newCurrentTurn = Math.max(0, state.currentTurn - 1);
      }

      return {
        players: newPlayers,
        currentTurn: newCurrentTurn,
      };
    });
  },

  // Game Flow
  createNewGame: () => {
    // Stop any playing audio
    audioService.stopAudio();

    set({
      id: `game_${Date.now()}`,
      players: [],
      currentTurn: 0,
      gameMode: 'normal',
      timeLeft: 0,
      isActive: false,
      round: 1,
      currentCard: null,
      isScanning: false,
      speedRoundCards: [],
      speedRoundAnswers: [],
      battleRound: null,
      currentSpeedRoundIndex: 0,
      speedRoundTimeLeft: 30,
      error: null,
    });
  },

  startGame: () => {
    const { players } = get();

    if (players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para empezar');
    }

    // Initialize audio service
    audioService.initializeAudio();

    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === 0,
      score: 0,
    }));

    set({
      players: updatedPlayers,
      isActive: true,
      currentTurn: 0,
      timeLeft: 1200, // 20 minutes
      gameMode: 'normal',
      round: 1,
      error: null,
    });

    // Start game timer
    get().startTimer(1200);
  },

  endGame: () => {
    audioService.stopAudio();
    get().stopTimer();

    set({
      isActive: false,
      currentCard: null,
      gameMode: 'normal',
      battleRound: null,
    });
  },

  // Card & Audio System
  scanCard: async (qrCode: string) => {
    try {
      set({ isScanning: true, error: null });

      const card = await cardService.getCardByQR(qrCode);
      if (!card) {
        throw new Error('Carta no encontrada o código QR inválido');
      }

      set({
        currentCard: card,
        isScanning: false,
      });

      // Auto-play audio after scan
      await get().playCardAudio();
    } catch (error) {
      console.error('Error scanning card:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      set({
        isScanning: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  playCardAudio: async () => {
    const { currentCard } = get();
    if (!currentCard?.track.previewUrl) {
      set({ error: 'No hay URL de audio disponible' });
      return;
    }

    try {
      await audioService.playTrackPreview(
        currentCard.track.previewUrl,
        5000, // 5 seconds
        () => {
          // Audio finished callback
          console.log('Audio preview finished');
        }
      );
    } catch (error) {
      console.error('Error playing audio:', error);
      set({ error: 'No se pudo reproducir el audio' });
    }
  },

  stopAudio: async () => {
    await audioService.stopAudio();
  },

  // Scoring System
  awardPoints: (playerId: string, points?: number) => {
    const { currentCard, gameMode } = get();
    const basePoints = points || currentCard?.points || 0;

    // Apply game mode multipliers
    let finalPoints = basePoints;
    if (gameMode === 'viral') {
      finalPoints = basePoints * 2; // Double points for viral moments
    }

    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId
          ? { ...player, score: player.score + finalPoints }
          : player
      ),
    }));

    // Check win condition (15 points)
    const { players } = get();
    const winner = players.find((p) => p.score >= 15);
    if (winner) {
      setTimeout(() => {
        get().endGame();
        // TODO: Show winner celebration
      }, 1000);
    }
  },

  nextTurn: () => {
    set((state) => {
      const nextTurnIndex = (state.currentTurn + 1) % state.players.length;

      return {
        currentTurn: nextTurnIndex,
        players: state.players.map((player, index) => ({
          ...player,
          isCurrentTurn: index === nextTurnIndex,
        })),
        currentCard: null,
        gameMode: 'normal', // Reset to normal after each turn
        battleRound: null,
        error: null,
      };
    });
  },

  // Battle Mode
  startBattleMode: (player1Id: string, player2Id: string) => {
    const { currentCard } = get();
    if (!currentCard) return;

    // Create battle cards with different questions for same track
    const battleCards = cardService.createBattleCards(currentCard.track.id);
    if (!battleCards) return;

    const battleRound: BattleRound = {
      player1: {
        id: player1Id,
        cardType: battleCards[0].type,
        hasAnswered: false,
        isCorrect: false,
      },
      player2: {
        id: player2Id,
        cardType: battleCards[1].type,
        hasAnswered: false,
        isCorrect: false,
      },
      track: currentCard.track,
    };

    set({
      gameMode: 'battle',
      battleRound,
    });
  },

  processBattleAnswer: (playerId: string, isCorrect: boolean) => {
    set((state) => {
      if (!state.battleRound) return state;

      const updatedBattleRound = { ...state.battleRound };

      if (updatedBattleRound.player1.id === playerId) {
        updatedBattleRound.player1.hasAnswered = true;
        updatedBattleRound.player1.isCorrect = isCorrect;
      } else if (updatedBattleRound.player2.id === playerId) {
        updatedBattleRound.player2.hasAnswered = true;
        updatedBattleRound.player2.isCorrect = isCorrect;
      }

      return { battleRound: updatedBattleRound };
    });

    // Check if both players have answered
    const { battleRound } = get();
    if (battleRound?.player1.hasAnswered && battleRound?.player2.hasAnswered) {
      // Award points to correct answers
      if (battleRound.player1.isCorrect) {
        get().awardPoints(battleRound.player1.id, 2);
      }
      if (battleRound.player2.isCorrect) {
        get().awardPoints(battleRound.player2.id, 2);
      }

      // End battle mode
      setTimeout(() => {
        get().endBattleMode();
      }, 2000);
    }
  },

  endBattleMode: () => {
    set({
      gameMode: 'normal',
      battleRound: null,
    });
    get().nextTurn();
  },

  // Speed Round
  startSpeedRound: () => {
    const speedCards = cardService.generateSpeedRoundCards();
    const { players } = get();

    set({
      gameMode: 'speed',
      speedRoundCards: speedCards,
      speedRoundAnswers: players.map((p) => ({ playerId: p.id, correct: 0 })),
      currentSpeedRoundIndex: 0,
      speedRoundTimeLeft: 30,
    });

    // Start 30-second timer
    get().startTimer(30);

    // Play sequential audio previews
    const audioUrls = speedCards.map((card) => card.track.previewUrl);
    audioService.playSequentialPreviews(
      audioUrls,
      6000, // 6 seconds per track
      (index) => {
        set({ currentSpeedRoundIndex: index });
      },
      () => {
        get().endSpeedRound();
      }
    );
  },

  addSpeedRoundAnswer: (playerId: string, isCorrect: boolean) => {
    set((state) => ({
      speedRoundAnswers: state.speedRoundAnswers.map((answer) =>
        answer.playerId === playerId
          ? { ...answer, correct: answer.correct + (isCorrect ? 1 : 0) }
          : answer
      ),
    }));
  },

  endSpeedRound: () => {
    const { speedRoundAnswers, speedRoundCards } = get();

    // Find winners (most correct answers)
    const maxCorrect = Math.max(...speedRoundAnswers.map((a) => a.correct));
    const winners = speedRoundAnswers.filter((a) => a.correct === maxCorrect);

    // Award points
    const totalPoints = speedRoundCards.reduce(
      (sum, card) => sum + card.points,
      0
    );
    const pointsPerWinner = Math.floor(totalPoints / winners.length);

    winners.forEach((winner) => {
      get().awardPoints(winner.playerId, pointsPerWinner);
    });

    // Reset
    set({
      gameMode: 'normal',
      speedRoundCards: [],
      speedRoundAnswers: [],
      currentSpeedRoundIndex: 0,
    });
  },

  // Viral Moments
  startViralMoment: () => {
    set({ gameMode: 'viral' });
  },

  resetGameMode: () => {
    set({
      gameMode: 'normal',
      battleRound: null,
      speedRoundCards: [],
      speedRoundAnswers: [],
    });
  },

  // Timer Management
  startTimer: (duration: number) => {
    set({ timeLeft: duration });

    const interval = setInterval(() => {
      const { timeLeft, isActive } = get();

      if (!isActive || timeLeft <= 0) {
        clearInterval(interval);
        if (timeLeft <= 0) {
          get().endGame();
        }
        return;
      }

      set((state) => ({ timeLeft: state.timeLeft - 1 }));
    }, 1000);
  },

  pauseTimer: () => {
    // Timer pause logic would go here
  },

  resumeTimer: () => {
    // Timer resume logic would go here
  },

  stopTimer: () => {
    // Timer stop logic would go here
  },

  // UI States
  setScanning: (scanning: boolean) => {
    set({ isScanning: scanning });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Statistics
  getGameStats: (): GameStats => {
    const { players, round, timeLeft, isActive } = get();
    const totalScore = players.reduce((sum, p) => sum + p.score, 0);
    const gameTimeElapsed = isActive ? 1200 - timeLeft : 0;

    return {
      totalRounds: round,
      totalCardsPlayed: round, // Simplified
      averageScorePerRound: totalScore / Math.max(round, 1),
      mostActivePlayer:
        players.reduce((max, p) => (p.score > max.score ? p : max), players[0])
          ?.name || '',
      gameTimeElapsed,
    };
  },

  getPlayerStats: (playerId: string): PlayerStats => {
    // This would require tracking more detailed stats during gameplay
    return {
      correctAnswers: 0,
      totalAnswers: 0,
      averageResponseTime: 0,
      favoriteCardType: 'song',
      pointsPerCardType: {
        song: 0,
        artist: 0,
        decade: 0,
        lyrics: 0,
        challenge: 0,
      },
    };
  },
}));
