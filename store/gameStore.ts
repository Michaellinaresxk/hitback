// store/gameStore.ts - LIMPIO: Solo Backend Integration
import { audioService } from '@/services/audioService';
import { create } from 'zustand';
import type { CurrentCard } from '@/types/game_types';

// ðŸŽ® INTERFACES - Player se mantiene aquÃ­, Card viene de game_types
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

// âœ… Re-exportar CurrentCard como Card para compatibilidad
export type Card = CurrentCard;

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

  // Backend Connection State
  backendConnected: boolean;
  lastBackendCheck: string | null;
}

interface GameActions {
  // Core actions
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  endGame: () => void;
  createNewGame: () => void;
  nextTurn: () => void;

  // Card & Audio - Backend Integration
  scanCard: (qrCode: string, gameCard?: Card) => Promise<void>;
  setAudioFinished: (finished: boolean) => void;
  setShowQuestion: (show: boolean) => void;
  setShowAnswer: (show: boolean) => void;
  setShowGameEndModal: (show: boolean) => void;

  // Scoring
  awardPoints: (playerId: string, points?: number, answerTime?: number) => void;

  // UI States
  setScanning: (scanning: boolean) => void;
  setError: (error: string | null) => void;

  // Timer
  startTimer: (duration: number) => void;
  stopTimer: () => void;

  // Betting System
  placeBet: (playerId: string, amount: number) => void;
  clearBets: () => void;

  // Power Cards
  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => void;

  // Special Modes
  startBattleMode: (player1Id: string, player2Id: string) => void;
  startSpeedRound: () => void;
  startViralMoment: () => void;

  // Backend Integration
  checkBackendConnection: () => Promise<boolean>;
  syncWithBackend: () => Promise<void>;
}

// ðŸ”§ Helper Functions
function getBettingMultiplier(betAmount: number): number {
  if (betAmount === 1) return 2;
  if (betAmount === 2) return 3;
  if (betAmount >= 3) return 4;
  return 1;
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

  // Backend Connection State
  backendConnected: false,
  lastBackendCheck: null,

  // ðŸ‘¥ PLAYER MANAGEMENT
  addPlayer: (name: string) => {
    const { players } = get();

    if (name.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (players.length >= 8) {
      throw new Error('MÃ¡ximo 8 jugadores');
    }

    if (
      players.some((p) => p.name.toLowerCase() === name.toLowerCase().trim())
    ) {
      throw new Error('Ya existe un jugador con ese nombre');
    }

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    console.log(`âœ… Player added: ${newPlayer.name}`);
  },

  removePlayer: (id: string) => {
    set((state) => {
      const removedPlayer = state.players.find((p) => p.id === id);
      const newPlayers = state.players.filter((p) => p.id !== id);
      const currentPlayerIndex = state.players.findIndex((p) => p.id === id);

      let newCurrentTurn = state.currentTurn;
      if (currentPlayerIndex <= state.currentTurn && newPlayers.length > 0) {
        newCurrentTurn = Math.max(0, state.currentTurn - 1);
      }

      console.log(`âŒ Player removed: ${removedPlayer?.name}`);

      return {
        players: newPlayers,
        currentTurn: newCurrentTurn,
      };
    });
  },

  // ðŸŽ® GAME MANAGEMENT
  createNewGame: () => {
    console.log('ðŸŽ® Creating new game...');

    // Stop any running audio/timers
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
      showGameEndModal: false,
      backendConnected: false,
      lastBackendCheck: null,
    });

    console.log('âœ… New game created');
  },

  startGame: async () => {
    const { players } = get();

    if (players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para empezar');
    }

    try {
      console.log('ðŸŽ® Starting game...');

      // âœ… CHECK BACKEND CONNECTION FIRST
      const backendConnected = await get().checkBackendConnection();
      if (!backendConnected) {
        console.warn(
          'âš ï¸ Backend not connected - some features may not work'
        );
      }

      // Initialize audio
      await audioService.initializeAudio();

      // Setup players
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
        backendConnected,
      });

      get().startTimer(1200);
      console.log('âœ… Game started successfully');
    } catch (error) {
      console.error('âŒ Error starting game:', error);
      set({ error: 'No se pudo iniciar el juego' });
    }
  },

  endGame: async () => {
    console.log('ðŸ Ending game...');

    await audioService.stopAudio();
    get().stopTimer();

    const { players, timeLeft, round } = get();
    const winner = players.reduce((max, player) =>
      player.score > max.score ? player : max
    );

    // Log game stats (sin llamar a saveGameStats)
    console.log('ðŸ“Š Game ended!');
    console.log(`   Winner: ${winner.name} (${winner.score} pts)`);
    console.log(`   Duration: ${Math.floor((1200 - timeLeft) / 60)}min`);
    console.log(`   Rounds: ${round}`);

    set({
      isActive: false,
      currentCard: null,
      gameMode: 'normal',
      viralMomentActive: false,
      audioFinished: false,
      showQuestion: false,
      showAnswer: false,
      showGameEndModal: true,
    });

    console.log(
      `ðŸ† Game ended - Winner: ${winner.name} with ${winner.score} points`
    );
  },

  // ðŸŽ¯ CARD SCANNING - Backend Integration
  scanCard: async (qrCode: string, gameCard?: Card) => {
    try {
      console.log(`ðŸ” Scanning card: ${qrCode}`);

      set({
        isScanning: true,
        error: null,
        audioFinished: false,
        showQuestion: false,
        showAnswer: false,
      });

      let card: Card;

      if (gameCard) {
        // Use card from useGameFlow (already processed from backend)
        card = gameCard;
        console.log('âœ… Using card from backend:', card.track.title);
      } else {
        // Fallback: try to get from backend directly
        console.log(
          'âš ï¸ No gameCard provided, trying direct backend call...'
        );
        throw new Error('Card data not provided - use scanQRAndPlay first');
      }

      set({
        currentCard: card,
        isScanning: false,
        backendConnected: true,
        lastBackendCheck: new Date().toISOString(),
      });

      console.log(
        `âœ… Card ready for play: ${card.track.title} by ${card.track.artist}`
      );
    } catch (error) {
      console.error('âŒ Error in scanCard:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      set({
        isScanning: false,
        error: errorMessage,
        backendConnected: false,
      });
    }
  },

  // ðŸŽµ AUDIO STATE MANAGEMENT
  setAudioFinished: (finished: boolean) => {
    console.log(`ðŸŽµ Audio finished: ${finished}`);
    set({ audioFinished: finished });
  },

  setShowQuestion: (show: boolean) => {
    console.log(`â“ Show question: ${show}`);
    set({ showQuestion: show });
  },

  setShowAnswer: (show: boolean) => {
    console.log(`âœ… Show answer: ${show}`);
    set({ showAnswer: show });
  },

  setShowGameEndModal: (show: boolean) => {
    set({ showGameEndModal: show });
  },

  // ðŸ† SCORING SYSTEM
  awardPoints: (playerId: string, points?: number, answerTime?: number) => {
    const { currentCard, players } = get();
    const player = players.find((p) => p.id === playerId);

    if (!player || !currentCard) {
      console.error('âŒ Cannot award points: player or card not found');
      return;
    }

    // âœ… CORREGIDO: Usar currentCard.question.points
    let basePoints = points || currentCard.question.points || 0;

    // Apply betting multiplier
    if (player.currentBet > 0) {
      const multiplier = getBettingMultiplier(player.currentBet);
      basePoints = basePoints * multiplier;
      console.log(
        `ðŸ’° Betting multiplier applied: ${player.currentBet} tokens = ${multiplier}x`
      );
    }

    // Apply boost power card
    if (player.boostActive) {
      basePoints = basePoints * 2;
      console.log(`âš¡ Boost multiplier applied: 2x`);
    }

    set((state) => ({
      players: state.players.map((p) => {
        if (p.id === playerId) {
          // âœ… CORREGIDO: Usar currentCard.question.type y currentCard.scan.difficulty
          const cardType = currentCard.question.type;
          const difficulty = currentCard.scan.difficulty;

          const newPlayer = {
            ...p,
            score: p.score + basePoints,
            consecutiveWins: p.consecutiveWins + 1,
            currentBet: 0, // Clear bet after use
            boostActive: false, // Clear boost after use
            cardTypeStreaks: {
              ...p.cardTypeStreaks,
              [cardType]: (p.cardTypeStreaks[cardType] || 0) + 1,
            },
            difficultyStreaks: {
              ...p.difficultyStreaks,
              [difficulty]: (p.difficultyStreaks[difficulty] || 0) + 1,
            },
          };

          console.log(
            `ðŸ† Points awarded: ${player.name} +${basePoints} pts (total: ${newPlayer.score})`
          );
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

    // Auto advance to next turn
    get().nextTurn();
  },

  // â­ï¸ NEXT TURN
  nextTurn: () => {
    const { players, currentTurn } = get();
    const nextTurnIndex = (currentTurn + 1) % players.length;

    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === nextTurnIndex,
      isImmune: player.isImmune && Math.random() > 0.5, // 50% chance to lose immunity
      peekUsed: false, // Reset peek
    }));

    const nextPlayer = updatedPlayers[nextTurnIndex];

    set({
      players: updatedPlayers,
      currentTurn: nextTurnIndex,
      currentCard: null,
      round: get().round + 1,
      audioFinished: false,
      showQuestion: false,
      showAnswer: false,
    });

    console.log(`â­ï¸ Next turn: ${nextPlayer.name} (Round ${get().round})`);

    // Clear all bets
    get().clearBets();

    // Check win condition (15 points)
    const winner = updatedPlayers.find((p) => p.score >= 15);
    if (winner) {
      console.log(
        `ðŸ† Winner found: ${winner.name} with ${winner.score} points!`
      );
      get().endGame();
    }
  },

  // ðŸ’° BETTING SYSTEM
  placeBet: (playerId: string, amount: number) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);

      if (!player) {
        console.error('âŒ Player not found for betting');
        return { ...state, error: 'Jugador no encontrado' };
      }

      if (player.tokens < amount) {
        console.error('âŒ Not enough tokens for bet');
        return { ...state, error: 'No tienes suficientes tokens' };
      }

      if (amount < 1 || amount > 3) {
        console.error('âŒ Invalid bet amount');
        return { ...state, error: 'Apuesta debe ser entre 1 y 3 tokens' };
      }

      console.log(`ðŸ’° Player ${player.name} bet ${amount} tokens`);

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
    console.log('ðŸ§¹ All bets cleared');
  },

  // âš¡ POWER CARDS
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

      // Apply power card effects
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
      }

      console.log(`âš¡ Power card used: ${powerCard.name} by ${player.name}`);

      return {
        ...state,
        players: newPlayers,
        error: null,
      };
    });
  },

  // ðŸŽ¯ SPECIAL GAME MODES
  startBattleMode: (player1Id: string, player2Id: string) => {
    const player1 = get().players.find((p) => p.id === player1Id);
    const player2 = get().players.find((p) => p.id === player2Id);

    console.log(
      `âš”ï¸ Starting Battle Mode: ${player1?.name} vs ${player2?.name}`
    );

    set({
      gameMode: 'battle',
      battleModeActive: true,
      selectedBattlePlayers: { player1Id, player2Id },
      battleRound: { player1Id, player2Id, active: true },
    });
  },

  startSpeedRound: () => {
    console.log('âš¡ Starting Speed Round');
    set({
      gameMode: 'speed',
      speedRoundActive: true,
      speedRoundTimeLeft: 30,
      speedRoundAnswers: {},
      currentSpeedRoundIndex: 0,
    });
  },

  startViralMoment: () => {
    console.log('ðŸ”¥ Starting Viral Moment');
    set({
      gameMode: 'viral',
      viralMomentActive: true,
    });
  },

  // â° TIMER MANAGEMENT
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
          console.log('â° Game time expired');
          get().endGame();
        }
        return;
      }

      set((state) => ({ timeLeft: state.timeLeft - 1 }));
    }, 1000);

    set({ timerInterval: newInterval });
    console.log(`â° Timer started: ${duration} seconds`);
  },

  stopTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
      set({ timerInterval: null });
      console.log('â° Timer stopped');
    }
  },

  // ðŸŒ BACKEND INTEGRATION
  checkBackendConnection: async (): Promise<boolean> => {
    try {
      console.log('ðŸ”— Checking backend connection...');

      const isConnected = await audioService.testConnection();
      const timestamp = new Date().toISOString();

      set({
        backendConnected: isConnected,
        lastBackendCheck: timestamp,
      });

      console.log(`ðŸ”— Backend connection: ${isConnected ? 'OK' : 'FAILED'}`);
      return isConnected;
    } catch (error) {
      console.error('âŒ Backend connection check failed:', error);

      set({
        backendConnected: false,
        lastBackendCheck: new Date().toISOString(),
        error: 'No se puede conectar al servidor',
      });

      return false;
    }
  },

  syncWithBackend: async () => {
    try {
      console.log('ðŸ”„ Syncing with backend...');

      const [connectionInfo, tracks] = await Promise.all([
        audioService.getConnectionInfo(),
        audioService.getAllTracks(),
      ]);

      console.log(
        `âœ… Backend sync complete: ${tracks.length} tracks available`
      );

      set({
        backendConnected: connectionInfo.backendConnected,
        lastBackendCheck: new Date().toISOString(),
      });
    } catch (error) {
      console.error('âŒ Backend sync failed:', error);
      set({
        backendConnected: false,
        error: 'Error sincronizando con servidor',
      });
    }
  },

  // ðŸ”§ UI STATES
  setScanning: (scanning: boolean) => {
    set({ isScanning: scanning });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));

// Exportar helper para uso externo
export { getBettingMultiplier };
