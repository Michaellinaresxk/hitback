import { create } from 'zustand';
import { cardService } from '@/services/cardService';
import { audioService } from '@/services/audioService';
import { rewardsService } from '@/services/RewardsService';

// Tipos básicos actualizados - manteniendo compatibilidad
export interface Player {
  id: string;
  name: string;
  score: number;
  isCurrentTurn: boolean;
  tokens: number;
  powerCards: any[];
  currentBet: number;
  isImmune: boolean;
  boostActive: boolean;
  peekUsed: boolean;
  consecutiveWins: number;
  cardTypeStreaks: Record<string, number>;
  difficultyStreaks: Record<string, number>;
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
  id: string;
  players: Player[];
  currentTurn: number;
  gameMode: 'normal' | 'battle' | 'speed' | 'viral';
  timeLeft: number;
  isActive: boolean;
  round: number;
  currentCard: Card | null;
  isScanning: boolean;
  error: string | null;
  timerInterval: NodeJS.Timeout | null;

  // Game Features
  gamePot: { tokens: number; powerCards: any[] };
  viralMomentActive: boolean;
  speedRoundCards: Card[];
  speedRoundAnswers: Record<string, number>;
  battleRound: any;
  currentSpeedRoundIndex: number;
  speedRoundTimeLeft: number;

  // Audio State
  audioFinished: boolean;
  showQuestion: boolean;
  showAnswer: boolean;
  showGameEndModal: boolean;

  // Special Modes State
  battleModeActive: boolean;
  speedRoundActive: boolean;
  selectedBattlePlayers: { player1Id: string; player2Id: string } | null;
}

interface GameActions {
  // Core actions
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  endGame: () => void;
  createNewGame: () => void;
  nextTurn: () => void;

  // Card & Audio
  scanCard: (qrCode: string, gameCard?: Card) => Promise<void>;
  playCardAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  setAudioFinished: (finished: boolean) => void;
  setShowQuestion: (show: boolean) => void;
  setShowAnswer: (show: boolean) => void;

  // Scoring
  awardPoints: (playerId: string, points?: number, answerTime?: number) => void;

  // UI States
  setScanning: (scanning: boolean) => void;
  setError: (error: string | null) => void;

  // Timer
  startTimer: (duration: number) => void;
  stopTimer: () => void;

  // Betting System - ✅ IMPLEMENTED
  placeBet: (playerId: string, amount: number) => void;
  clearBets: () => void;

  // Power Cards - ✅ IMPLEMENTED
  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => void;
  addPowerCardToPlayer: (playerId: string, powerCard: any) => void;

  // Special Modes - ✅ IMPLEMENTED
  startBattleMode: (player1Id: string, player2Id: string) => void;
  startSpeedRound: () => void;
  startViralMoment: () => void;

  // Testing Functions
  addTestingButtons: () => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
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
  error: null,
  timerInterval: null,

  // Game Features
  gamePot: { tokens: 0, powerCards: [] },
  viralMomentActive: false,
  speedRoundCards: [],
  speedRoundAnswers: {},
  battleRound: null,
  currentSpeedRoundIndex: 0,
  speedRoundTimeLeft: 30,

  // Audio State
  audioFinished: false,
  showQuestion: false,
  showAnswer: false,
  showGameEndModal: false,

  // Special Modes State
  battleModeActive: false,
  speedRoundActive: false,
  selectedBattlePlayers: null,

  // Player Management
  addPlayer: (name: string) => {
    const { players } = get();

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
      tokens: 5,
      powerCards: [],
      currentBet: 0,
      isImmune: false,
      boostActive: false,
      peekUsed: false,
      consecutiveWins: 0,
      cardTypeStreaks: {},
      difficultyStreaks: {},
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

      return {
        players: newPlayers,
        currentTurn: newCurrentTurn,
      };
    });
  },

  createNewGame: () => {
    audioService.stopAudio();
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }

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
      error: null,
      timerInterval: null,
      gamePot: { tokens: 0, powerCards: [] },
      viralMomentActive: false,
      audioFinished: false,
      showQuestion: false,
      showAnswer: false,
    });
  },

  startGame: () => {
    const { players } = get();

    if (players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para empezar');
    }

    try {
      audioService.initializeAudio().catch(console.error);

      const updatedPlayers = players.map((player, index) => ({
        ...player,
        isCurrentTurn: index === 0,
        score: 0,
        tokens: 5,
        powerCards: [],
        currentBet: 0,
        consecutiveWins: 0,
        cardTypeStreaks: {},
        difficultyStreaks: {},
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

      get().startTimer(1200);
      console.log('✅ Game started successfully');
    } catch (error) {
      console.error('❌ Error starting game:', error);
      set({ error: 'No se pudo iniciar el juego' });
    }
  },

  endGame: () => {
    audioService.stopAudio();
    get().stopTimer();

    // Save game stats to backend
    const { players, id, timeLeft } = get();
    const winner = players.reduce((max, player) =>
      player.score > max.score ? player : max
    );

    audioService
      .saveGameStats({
        gameId: id,
        players: players,
        duration: 1200 - timeLeft, // Time elapsed
        winner: winner.name,
        totalRounds: get().round,
      })
      .catch(console.error);

    set({
      isActive: false,
      currentCard: null,
      gameMode: 'normal',
      viralMomentActive: false,
      audioFinished: false,
      showQuestion: false,
      showAnswer: false,
      showGameEndModal: true, // ✅ Show end game modal
    });
  },

  // Card & Audio System
  scanCard: async (qrCode: string, gameCard?: Card) => {
    try {
      set({
        isScanning: true,
        error: null,
        audioFinished: false,
        showQuestion: false,
        showAnswer: false,
      });

      let card: Card;

      if (gameCard) {
        // Use card from backend
        card = gameCard;
      } else {
        // Fallback to local card service
        const localCard = await cardService.getCardByQR(qrCode);
        if (!localCard) {
          throw new Error('Carta no encontrada o código QR inválido');
        }
        card = localCard;
      }

      set({
        currentCard: card,
        isScanning: false,
      });

      // Audio will be handled by AudioPlayer component with autoPlay
      console.log('✅ Card scanned successfully:', card.track.title);
    } catch (error) {
      console.error('Error scanning card:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      set({
        isScanning: false,
        error: errorMessage,
      });
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
        5000,
        () => {
          set({ audioFinished: true, showQuestion: true });
          console.log('Audio preview finished');
        }
      );
    } catch (error) {
      console.error('Error playing audio:', error);
      set({
        error: 'No se pudo reproducir el audio',
        audioFinished: true,
        showQuestion: true,
      });
    }
  },

  stopAudio: async () => {
    await audioService.stopAudio();
  },

  setAudioFinished: (finished: boolean) => {
    set({ audioFinished: finished });
  },

  setShowQuestion: (show: boolean) => {
    set({ showQuestion: show });
  },

  setShowAnswer: (show: boolean) => {
    set({ showAnswer: show });
  },

  setShowGameEndModal: (show: boolean) => {
    set({ showGameEndModal: show });
  },

  // ✅ BETTING SYSTEM - FULLY IMPLEMENTED
  placeBet: (playerId: string, amount: number) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);

      if (!player) {
        console.error('Player not found');
        return state;
      }

      if (player.tokens < amount) {
        console.error('Not enough tokens');
        return { ...state, error: 'No tienes suficientes tokens' };
      }

      if (amount < 1 || amount > 3) {
        console.error('Invalid bet amount');
        return { ...state, error: 'Apuesta debe ser entre 1 y 3 tokens' };
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

    console.log(`✅ Player ${playerId} bet ${amount} tokens`);
  },

  clearBets: () => {
    set((state) => ({
      players: state.players.map((p) => ({ ...p, currentBet: 0 })),
    }));
  },

  // ✅ POWER CARDS SYSTEM - FULLY IMPLEMENTED
  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      const powerCard = player?.powerCards?.find((pc) => pc.id === powerCardId);

      if (!player || !powerCard) {
        return { ...state, error: 'Carta de poder no encontrada' };
      }

      if (powerCard.currentUses >= powerCard.usageLimit) {
        return { ...state, error: 'Carta de poder ya usada' };
      }

      let newPlayers = [...state.players];

      // Apply power card effect
      switch (powerCard.type) {
        case 'robo': // Steal 1 token
          if (targetPlayerId) {
            newPlayers = newPlayers.map((p) => {
              if (p.id === targetPlayerId && p.tokens > 0) {
                return { ...p, tokens: p.tokens - 1 };
              }
              if (p.id === playerId) {
                return {
                  ...p,
                  tokens: p.tokens + 1,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc
                  ),
                };
              }
              return p;
            });
          }
          break;

        case 'escudo': // Immunity shield
          newPlayers = newPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  isImmune: true,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc
                  ),
                }
              : p
          );
          break;

        case 'boost': // Double points next round
          newPlayers = newPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  boostActive: true,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc
                  ),
                }
              : p
          );
          break;

        case 'refresh': // Recover 1 token
          newPlayers = newPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  tokens: p.tokens + 1,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc
                  ),
                }
              : p
          );
          break;

        case 'peek': // See answer early
          newPlayers = newPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  peekUsed: true,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc
                  ),
                }
              : p
          );
          set({ showAnswer: true }); // Show answer immediately
          break;

        case 'precision': // +2 points for exact year
          newPlayers = newPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  powerCards: p.powerCards.map((pc) =>
                    pc.id === powerCardId
                      ? { ...pc, currentUses: pc.currentUses + 1 }
                      : pc
                  ),
                }
              : p
          );
          break;
      }

      return {
        ...state,
        players: newPlayers,
        error: null,
      };
    });

    console.log(`✅ Power card ${powerCardId} used by player ${playerId}`);
  },

  addPowerCardToPlayer: (playerId: string, powerCard: any) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, powerCards: [...(p.powerCards || []), powerCard] }
          : p
      ),
    }));
  },

  // Scoring System with Rewards
  awardPoints: (playerId: string, points?: number, answerTime?: number) => {
    const { currentCard, gameMode, players } = get();
    const player = players.find((p) => p.id === playerId);

    if (!player || !currentCard) return;

    let basePoints = points || currentCard.points || 0;

    // Apply betting multiplier
    if (player.currentBet > 0) {
      const multiplier = rewardsService.getBettingMultiplier(player.currentBet);
      basePoints = basePoints * multiplier;
    }

    // Apply boost power card
    if (player.boostActive) {
      basePoints = basePoints * 2;
    }

    // Apply game mode multipliers
    if (gameMode === 'viral') {
      basePoints = basePoints * 2;
    }

    // Calculate rewards
    const rewards = rewardsService.calculateRewards(
      currentCard.difficulty as any,
      answerTime || 3000,
      player.consecutiveWins,
      player.cardTypeStreaks[currentCard.cardType] || 0,
      player.difficultyStreaks[currentCard.difficulty] || 0
    );

    set((state) => ({
      players: state.players.map((p) => {
        if (p.id === playerId) {
          const newPlayer = {
            ...p,
            score: p.score + basePoints + rewards.totalPoints,
            tokens: (p.tokens || 0) + rewards.bonusTokens,
            consecutiveWins: p.consecutiveWins + 1,
            currentBet: 0, // Clear bet after use
            boostActive: false, // Clear boost after use
            cardTypeStreaks: {
              ...p.cardTypeStreaks,
              [currentCard.cardType]:
                (p.cardTypeStreaks[currentCard.cardType] || 0) + 1,
            },
            difficultyStreaks: {
              ...p.difficultyStreaks,
              [currentCard.difficulty]:
                (p.difficultyStreaks[currentCard.difficulty] || 0) + 1,
            },
          };

          // Add power card reward
          if (rewards.powerCard) {
            newPlayer.powerCards = [
              ...(newPlayer.powerCards || []),
              rewards.powerCard,
            ];
          }

          return newPlayer;
        } else {
          // Reset streaks for other players
          return {
            ...p,
            consecutiveWins: 0,
            cardTypeStreaks: {},
            difficultyStreaks: {},
          };
        }
      }),
    }));

    console.log(
      `✅ Awarded ${basePoints + rewards.totalPoints} points to ${player.name}`
    );
    get().nextTurn();
  },

  nextTurn: () => {
    const { players, currentTurn } = get();
    const nextTurnIndex = (currentTurn + 1) % players.length;

    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === nextTurnIndex,
      // Reduce immunity duration
      isImmune: player.isImmune && Math.random() > 0.5, // 50% chance to lose immunity each turn
      peekUsed: false, // Reset peek
    }));

    set({
      players: updatedPlayers,
      currentTurn: nextTurnIndex,
      currentCard: null,
      round: get().round + 1,
      audioFinished: false,
      showQuestion: false,
      showAnswer: false,
    });

    // Clear all bets
    get().clearBets();

    // Check win condition (15 points)
    const winner = updatedPlayers.find((p) => p.score >= 15);
    if (winner) {
      get().endGame();
    }
  },

  // ✅ SPECIAL GAME MODES - IMPLEMENTED
  startBattleMode: (player1Id: string, player2Id: string) => {
    console.log(`🥊 Starting Battle Mode: ${player1Id} vs ${player2Id}`);
    set({
      gameMode: 'battle',
      battleModeActive: true,
      selectedBattlePlayers: { player1Id, player2Id },
      battleRound: { player1Id, player2Id, active: true },
    });
  },

  startSpeedRound: () => {
    console.log('⚡ Starting Speed Round');
    set({
      gameMode: 'speed',
      speedRoundActive: true,
      speedRoundTimeLeft: 30,
      speedRoundAnswers: {},
      currentSpeedRoundIndex: 0,
    });
  },

  startViralMoment: () => {
    console.log('🔥 Starting Viral Moment');
    set({
      gameMode: 'viral',
      viralMomentActive: true,
    });
  },

  setBattlePlayers: (player1Id: string, player2Id: string) => {
    set({ selectedBattlePlayers: { player1Id, player2Id } });
  },

  // Timer Management
  startTimer: (duration: number) => {
    const { timerInterval } = get();
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

  // UI States
  setScanning: (scanning: boolean) => {
    set({ isScanning: scanning });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // ✅ TESTING FUNCTIONS FOR DEVELOPMENT
  addTestingButtons: () => {
    console.log('🧪 Adding testing functions to game store');
  },
}));
