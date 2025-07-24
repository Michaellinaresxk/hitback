import { create } from 'zustand';
import { cardService } from '@/services/cardService';
import { audioService } from '@/services/audioService';

// Tipos básicos actualizados - manteniendo compatibilidad
export interface Player {
  id: string;
  name: string;
  score: number;
  isCurrentTurn: boolean;
  // ✅ Agregando propiedades mínimas para evitar errores
  tokens?: number;
  powerCards?: any[];
  currentBet?: number;
  isImmune?: boolean;
  boostActive?: boolean;
}

export interface Card {
  id: string;
  qrCode: string;
  type: string;
  track: {
    title: string;
    artist: string;
    year: number;
    previewUrl: string;
  };
  question: string;
  answer: string;
  points: number;
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

  // ✅ Agregando propiedades para evitar errores
  gamePot?: { tokens: number };
  viralMomentActive?: boolean;
  speedRoundCards?: Card[];
  speedRoundAnswers?: any[];
  battleRound?: any;
  currentSpeedRoundIndex?: number;
  speedRoundTimeLeft?: number;
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
  scanCard: (qrCode: string) => Promise<void>;
  playCardAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;

  // Scoring
  awardPoints: (playerId: string, points?: number) => void;

  // UI States
  setScanning: (scanning: boolean) => void;
  setError: (error: string | null) => void;

  // Timer
  startTimer: (duration: number) => void;
  stopTimer: () => void;

  // ✅ Agregando funciones stub para evitar errores
  placeBet?: (playerId: string, amount: number) => void;
  usePowerCard?: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => void;
  startBattleMode?: (player1Id: string, player2Id: string) => void;
  startSpeedRound?: () => void;
  startViralMoment?: () => void;
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

  // ✅ Valores por defecto para evitar errores
  gamePot: { tokens: 0 },
  viralMomentActive: false,
  speedRoundCards: [],
  speedRoundAnswers: [],
  battleRound: null,
  currentSpeedRoundIndex: 0,
  speedRoundTimeLeft: 30,

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
      // ✅ Agregando propiedades por defecto
      tokens: 5,
      powerCards: [],
      currentBet: 0,
      isImmune: false,
      boostActive: false,
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
      gamePot: { tokens: 0 },
      viralMomentActive: false,
    });
  },

  startGame: () => {
    const { players } = get();

    if (players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para empezar');
    }

    try {
      // Initialize audio service (async, but don't wait)
      audioService.initializeAudio().catch(console.error);

      const updatedPlayers = players.map((player, index) => ({
        ...player,
        isCurrentTurn: index === 0,
        score: 0,
        tokens: 5, // ✅ Ensure tokens are set
        powerCards: [],
        currentBet: 0,
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

      console.log('✅ Game started successfully');
    } catch (error) {
      console.error('❌ Error starting game:', error);
      set({ error: 'No se pudo iniciar el juego' });
    }
  },

  endGame: () => {
    audioService.stopAudio();
    get().stopTimer();

    set({
      isActive: false,
      currentCard: null,
      gameMode: 'normal',
      viralMomentActive: false,
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

      await get().playCardAudio();
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
        () => console.log('Audio preview finished')
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

    let finalPoints = basePoints;
    if (gameMode === 'viral') {
      finalPoints = basePoints * 2;
    }

    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId
          ? { ...player, score: player.score + finalPoints }
          : player
      ),
    }));

    get().nextTurn();
  },

  nextTurn: () => {
    const { players, currentTurn } = get();
    const nextTurnIndex = (currentTurn + 1) % players.length;

    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === nextTurnIndex,
    }));

    set({
      players: updatedPlayers,
      currentTurn: nextTurnIndex,
      currentCard: null,
      round: get().round + 1,
    });

    // Check win condition (15 points)
    const winner = updatedPlayers.find((p) => p.score >= 15);
    if (winner) {
      get().endGame();
    }
  },

  // Timer Management - ✅ FIXED
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

  // ✅ Funciones stub para evitar errores (implementar después)
  placeBet: (playerId: string, amount: number) => {
    console.log(
      `Betting ${amount} tokens for player ${playerId} (not implemented yet)`
    );
  },

  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => {
    console.log(`Using power card ${powerCardId} (not implemented yet)`);
  },

  startBattleMode: (player1Id: string, player2Id: string) => {
    console.log(
      `Starting battle mode: ${player1Id} vs ${player2Id} (not implemented yet)`
    );
    set({ gameMode: 'battle' });
  },

  startSpeedRound: () => {
    console.log('Starting speed round (not implemented yet)');
    set({ gameMode: 'speed' });
  },

  startViralMoment: () => {
    console.log('Starting viral moment (not implemented yet)');
    set({ gameMode: 'viral', viralMomentActive: true });
  },
}));
