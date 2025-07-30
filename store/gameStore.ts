// store/SimplifiedGameStore.ts - 🎮 Store Optimizado y Estable
import {
  calculateFinalPoints,
  generateInitialPowerCards,
} from '@/utils/gameHelpers';
import { create } from 'zustand';

export interface PowerCard {
  id: string;
  type: 'robo' | 'escudo' | 'boost' | 'refresh' | 'peek' | 'precision';
  name: string;
  description: string;
  emoji: string;
  usageLimit: number;
  currentUses: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isCurrentTurn: boolean;
  tokens: number;
  powerCards: PowerCard[];
  currentBet: number;
  isImmune: boolean;
  boostActive: boolean;
  peekUsed: boolean;
  consecutiveWins: number;
  cardTypeStreaks: Record<string, number>;
}

export interface Card {
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

interface GameState {
  // Core State
  id: string;
  players: Player[];
  currentTurn: number;
  timeLeft: number;
  isActive: boolean;
  round: number;
  currentCard: Card | null;
  error: string | null;

  // Timer
  timerInterval: NodeJS.Timeout | null;
}

interface GameActions {
  // Player Management
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;

  // Game Lifecycle
  startGame: () => void;
  endGame: () => void;
  nextTurn: () => void;
  resetGame: () => void;

  // Card Management
  scanCard: (qrCode: string, card: Card) => void;

  // Points System
  awardPoints: (playerId: string, points?: number) => void;

  // Betting System
  placeBet: (playerId: string, amount: number) => void;
  clearBets: () => void;

  // Power Cards
  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => void;
  addPowerCardToPlayer: (playerId: string, powerCard: PowerCard) => void;

  // Utilities
  setError: (error: string | null) => void;
  startTimer: (duration: number) => void;
  stopTimer: () => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  // 🎮 Initial State
  id: '',
  players: [],
  currentTurn: 0,
  timeLeft: 0,
  isActive: false,
  round: 1,
  currentCard: null,
  error: null,
  timerInterval: null,

  // 👥 PLAYER MANAGEMENT
  addPlayer: (name: string) => {
    const { players } = get();

    // Validation
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

    // Create new player
    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      score: 0,
      isCurrentTurn: players.length === 0,
      tokens: 5,
      powerCards: [],
      currentBet: 0,
      isImmune: false,
      boostActive: false,
      peekUsed: false,
      consecutiveWins: 0,
      cardTypeStreaks: {},
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

      let newCurrentTurn = state.currentTurn;
      if (currentPlayerIndex <= state.currentTurn && newPlayers.length > 0) {
        newCurrentTurn = Math.max(0, state.currentTurn - 1);
      }

      // Update turn indicators
      const updatedPlayers = newPlayers.map((player, index) => ({
        ...player,
        isCurrentTurn: index === newCurrentTurn,
      }));

      return {
        players: updatedPlayers,
        currentTurn: newCurrentTurn,
      };
    });
  },

  // 🎮 GAME LIFECYCLE
  startGame: () => {
    const { players } = get();

    if (players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para empezar');
    }

    // Initialize players for game
    const gameReadyPlayers = players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === 0,
      score: 0,
      tokens: 5,
      powerCards: generateInitialPowerCards(),
      currentBet: 0,
      consecutiveWins: 0,
      cardTypeStreaks: {},
      isImmune: false,
      boostActive: false,
      peekUsed: false,
    }));

    set({
      players: gameReadyPlayers,
      isActive: true,
      currentTurn: 0,
      timeLeft: 1200, // 20 minutes
      round: 1,
      error: null,
      currentCard: null,
    });

    // Start game timer
    get().startTimer(1200);
  },

  endGame: () => {
    get().stopTimer();
    set({
      isActive: false,
      currentCard: null,
    });
  },

  nextTurn: () => {
    set((state) => {
      const nextTurnIndex = (state.currentTurn + 1) % state.players.length;

      const updatedPlayers = state.players.map((player, index) => ({
        ...player,
        isCurrentTurn: index === nextTurnIndex,
        peekUsed: false, // Reset peek power
        // Gradually reduce immunity
        isImmune: player.isImmune && Math.random() > 0.5,
      }));

      return {
        players: updatedPlayers,
        currentTurn: nextTurnIndex,
        currentCard: null,
        round: state.round + 1,
      };
    });

    // Clear all bets for new round
    get().clearBets();
  },

  resetGame: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    set({
      id: `game_${Date.now()}`,
      players: [],
      currentTurn: 0,
      timeLeft: 0,
      isActive: false,
      round: 1,
      currentCard: null,
      error: null,
      timerInterval: null,
    });
  },

  // 🎯 CARD MANAGEMENT
  scanCard: (qrCode: string, card: Card) => {
    set({
      currentCard: card,
      error: null,
    });
  },

  // 🏆 POINTS SYSTEM
  awardPoints: (playerId: string, points?: number) => {
    const { currentCard, players } = get();
    const player = players.find((p) => p.id === playerId);

    if (!player || !currentCard) {
      console.warn('Cannot award points: player or card not found');
      return;
    }

    const basePoints = points || currentCard.points || 1;
    const finalPoints = calculateFinalPoints(basePoints, player, currentCard);

    set((state) => ({
      players: state.players.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            score: p.score + finalPoints,
            consecutiveWins: p.consecutiveWins + 1,
            currentBet: 0, // Clear bet after awarding
            boostActive: false, // Clear boost after use
            cardTypeStreaks: {
              ...p.cardTypeStreaks,
              [currentCard.cardType]:
                (p.cardTypeStreaks[currentCard.cardType] || 0) + 1,
            },
          };
        } else {
          // Reset other players' streaks
          return {
            ...p,
            consecutiveWins: 0,
            cardTypeStreaks: {},
          };
        }
      }),
    }));
  },

  // 🎰 BETTING SYSTEM
  placeBet: (playerId: string, amount: number) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);

      if (!player || player.tokens < amount || amount < 1 || amount > 3) {
        return {
          ...state,
          error: 'Apuesta inválida: tokens insuficientes o cantidad incorrecta',
        };
      }

      if (player.currentBet > 0) {
        return {
          ...state,
          error: 'Ya tienes una apuesta activa',
        };
      }

      return {
        ...state,
        players: state.players.map((p) =>
          p.id === playerId
            ? {
                ...p,
                tokens: p.tokens - amount,
                currentBet: amount,
              }
            : p
        ),
        error: null,
      };
    });
  },

  clearBets: () => {
    set((state) => ({
      players: state.players.map((p) => ({ ...p, currentBet: 0 })),
    }));
  },

  // ⚡ POWER CARDS SYSTEM
  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      const powerCard = player?.powerCards.find((pc) => pc.id === powerCardId);

      if (
        !player ||
        !powerCard ||
        powerCard.currentUses >= powerCard.usageLimit
      ) {
        return {
          ...state,
          error: 'No se puede usar esta carta de poder',
        };
      }

      const updatedPlayers = state.players.map((p) => {
        if (p.id === playerId) {
          // Update power card usage
          const updatedPowerCards = p.powerCards.map((pc) =>
            pc.id === powerCardId
              ? { ...pc, currentUses: pc.currentUses + 1 }
              : pc
          );

          // Apply power card effects
          let playerUpdates: Partial<Player> = {
            powerCards: updatedPowerCards,
          };

          switch (powerCard.type) {
            case 'escudo':
              playerUpdates.isImmune = true;
              break;
            case 'boost':
              playerUpdates.boostActive = true;
              break;
            case 'refresh':
              playerUpdates.tokens = Math.min((p.tokens || 0) + 1, 5);
              break;
            case 'peek':
              playerUpdates.peekUsed = true;
              break;
          }

          return { ...p, ...playerUpdates };
        }

        // Handle target effects (robo)
        if (
          targetPlayerId &&
          p.id === targetPlayerId &&
          powerCard.type === 'robo' &&
          !p.isImmune
        ) {
          return {
            ...p,
            tokens: Math.max((p.tokens || 0) - 1, 0),
          };
        }

        return p;
      });

      // Add stolen token to user if robo was successful
      if (powerCard.type === 'robo' && targetPlayerId) {
        const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
        if (targetPlayer && !targetPlayer.isImmune) {
          const userIndex = updatedPlayers.findIndex((p) => p.id === playerId);
          if (userIndex !== -1) {
            updatedPlayers[userIndex] = {
              ...updatedPlayers[userIndex],
              tokens: (updatedPlayers[userIndex].tokens || 0) + 1,
            };
          }
        }
      }

      return {
        ...state,
        players: updatedPlayers,
        error: null,
      };
    });
  },

  addPowerCardToPlayer: (playerId: string, powerCard: PowerCard) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              powerCards: [...(p.powerCards || []), powerCard],
            }
          : p
      ),
    }));
  },

  // 🛠️ UTILITIES
  setError: (error: string | null) => {
    set({ error });
  },

  // ⏰ TIMER MANAGEMENT
  startTimer: (duration: number) => {
    const { timerInterval } = get();

    // Clear existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    set({ timeLeft: duration });

    const newInterval = setInterval(() => {
      const { timeLeft, isActive } = get();

      if (!isActive || timeLeft <= 0) {
        get().stopTimer();
        if (timeLeft <= 0) {
          get().endGame();
        }
        return;
      }

      set((state) => ({ timeLeft: state.timeLeft - 1 }));
    }, 1000);

    set({ timerInterval: newInterval });
  },

  stopTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
      set({ timerInterval: null });
    }
  },
}));
