// store/gameStore.ts - HITBACK Game Store
// ✅ FIX: Sistema de tokens únicos
// - Cada jugador tiene 3 tokens ÚNICOS: +1, +2, +3
// - Al apostar: el token se DESHABILITA (no se puede usar de nuevo)
// - Si acierta: puntos base + valor del token
// - Si falla: 0 puntos, pero el token ya está usado

import { audioService } from '@/services/audioService';
import { create } from 'zustand';
import type { CurrentCard } from '@/types/game_types';
import { SCORE_TO_WIN } from '@/constants/Points';
import {
  CURRENT_SPEED_ROUND_INDEX,
  SPEED_ROUND_TIME_LIMIT,
} from '@/constants/SpeedRound';

// 🎮 INTERFACES
export interface Player {
  id: string;
  name: string;
  score: number;
  isCurrentTurn: boolean;
  // ✅ NUEVO: Array de tokens disponibles [1, 2, 3] -> se remueven al usarse
  availableTokens: number[];
  powerCards: any[];
  currentBet: number; // Valor del token apostado (0 si no apostó)
  isImmune: boolean;
  boostActive: boolean;
  peekUsed: boolean;
  consecutiveWins: number;
  cardTypeStreaks: Record<string, number>;
  difficultyStreaks: Record<string, number>;
}

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
  gamePot: { tokens: number; powerCards: any[] };
  viralMomentActive: boolean;
  speedRoundCards: Card[];
  speedRoundAnswers: Record<string, number>;
  battleRound: any;
  currentSpeedRoundIndex: number;
  speedRoundTimeLeft: number;
  audioFinished: boolean;
  showQuestion: boolean;
  showAnswer: boolean;
  showGameEndModal: boolean;
  battleModeActive: boolean;
  speedRoundActive: boolean;
  selectedBattlePlayers: { player1Id: string; player2Id: string } | null;
  backendConnected: boolean;
  lastBackendCheck: string | null;
}

interface GameActions {
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  endGame: () => void;
  createNewGame: () => void;
  nextTurn: () => void;
  scanCard: (qrCode: string, gameCard?: Card) => Promise<void>;
  setAudioFinished: (finished: boolean) => void;
  setShowQuestion: (show: boolean) => void;
  setShowAnswer: (show: boolean) => void;
  setShowGameEndModal: (show: boolean) => void;
  awardPoints: (playerId: string, points?: number, answerTime?: number) => void;
  setScanning: (scanning: boolean) => void;
  setError: (error: string | null) => void;
  startTimer: (duration: number) => void;
  stopTimer: () => void;
  placeBet: (playerId: string, tokenValue: number) => void;
  clearBets: () => void;
  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string
  ) => void;
  startBattleMode: (player1Id: string, player2Id: string) => void;
  startSpeedRound: () => void;
  startViralMoment: () => void;
  checkBackendConnection: () => Promise<boolean>;
  syncWithBackend: () => Promise<void>;
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
  gamePot: { tokens: 0, powerCards: [] },
  viralMomentActive: false,
  speedRoundCards: [],
  speedRoundAnswers: {},
  battleRound: null,
  currentSpeedRoundIndex: CURRENT_SPEED_ROUND_INDEX,
  speedRoundTimeLeft: SPEED_ROUND_TIME_LIMIT,
  audioFinished: false,
  showQuestion: false,
  showAnswer: false,
  showGameEndModal: false,
  battleModeActive: false,
  speedRoundActive: false,
  selectedBattlePlayers: null,
  backendConnected: false,
  lastBackendCheck: null,

  // 👥 PLAYER MANAGEMENT
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
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      score: 0,
      isCurrentTurn: false,
      availableTokens: [1, 2, 3], // ✅ 3 tokens únicos: +1, +2, +3
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

    console.log(`✅ Player added: ${newPlayer.name} with tokens [1, 2, 3]`);
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

      console.log(`❌ Player removed: ${removedPlayer?.name}`);

      return {
        players: newPlayers,
        currentTurn: newCurrentTurn,
      };
    });
  },

  // 🎮 GAME MANAGEMENT
  createNewGame: () => {
    console.log('🎮 Creating new game...');

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

    console.log('✅ New game created');
  },

  startGame: async () => {
    const { players } = get();

    if (players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para empezar');
    }

    try {
      console.log('🎮 Starting game...');

      const backendConnected = await get().checkBackendConnection();
      if (!backendConnected) {
        console.warn('⚠️ Backend not connected');
      }

      await audioService.initializeAudio();

      // ✅ Reset: cada jugador empieza con tokens [1, 2, 3]
      const updatedPlayers = players.map((player, index) => ({
        ...player,
        isCurrentTurn: index === 0,
        score: 0,
        availableTokens: [1, 2, 3], // ✅ Tokens únicos
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
        timeLeft: 1200,
        gameMode: 'normal',
        round: 1,
        error: null,
        backendConnected,
      });

      get().startTimer(1200);
      console.log('✅ Game started - Each player has tokens: [+1, +2, +3]');
    } catch (error) {
      console.error('❌ Error starting game:', error);
      set({ error: 'No se pudo iniciar el juego' });
    }
  },

  endGame: async () => {
    console.log('🏁 Ending game...');

    await audioService.stopAudio();
    get().stopTimer();

    const { players } = get();
    const winner = players.reduce((max, player) =>
      player.score > max.score ? player : max
    );

    console.log(`🏆 Winner: ${winner.name} (${winner.score} pts)`);

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
  },

  // 🎯 CARD SCANNING
  scanCard: async (qrCode: string, gameCard?: Card) => {
    try {
      console.log(`📱 Scanning card: ${qrCode}`);

      set({
        isScanning: true,
        error: null,
        audioFinished: false,
        showQuestion: false,
        showAnswer: false,
      });

      if (gameCard) {
        set({
          currentCard: gameCard,
          isScanning: false,
          backendConnected: true,
          lastBackendCheck: new Date().toISOString(),
        });
      } else {
        throw new Error('Card data not provided');
      }
    } catch (error) {
      console.error('❌ Error in scanCard:', error);
      set({
        isScanning: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        backendConnected: false,
      });
    }
  },

  // 🎵 AUDIO STATE
  setAudioFinished: (finished: boolean) => set({ audioFinished: finished }),
  setShowQuestion: (show: boolean) => set({ showQuestion: show }),
  setShowAnswer: (show: boolean) => set({ showAnswer: show }),
  setShowGameEndModal: (show: boolean) => set({ showGameEndModal: show }),

  // 🏆 SCORING - Puntos = base + valor del token (si acertó)
  awardPoints: (playerId: string, points?: number, answerTime?: number) => {
    const { currentCard, players } = get();
    const player = players.find((p) => p.id === playerId);

    if (!player || !currentCard) {
      console.error('❌ Cannot award points: player or card not found');
      return;
    }

    let basePoints = points || currentCard.question.points || 0;

    // ✅ Token SUMA puntos extra
    let tokenBonus = player.currentBet; // currentBet = valor del token usado

    // Boost power card (multiplica x2)
    if (player.boostActive) {
      basePoints = basePoints * 2;
      console.log(`⚡ Boost: 2x`);
    }

    const totalPoints = basePoints + tokenBonus;

    console.log(
      `🏆 ${player.name}: base=${basePoints} + token=${tokenBonus} = ${totalPoints} pts`
    );

    set((state) => ({
      players: state.players.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            score: p.score + totalPoints,
            consecutiveWins: p.consecutiveWins + 1,
            currentBet: 0, // Limpiar apuesta
            boostActive: false,
            cardTypeStreaks: {
              ...p.cardTypeStreaks,
              [currentCard.question.type]:
                (p.cardTypeStreaks[currentCard.question.type] || 0) + 1,
            },
            difficultyStreaks: {
              ...p.difficultyStreaks,
              [currentCard.scan.difficulty]:
                (p.difficultyStreaks[currentCard.scan.difficulty] || 0) + 1,
            },
          };
        } else {
          // Los demás pierden su racha y se limpia su apuesta
          return {
            ...p,
            consecutiveWins: 0,
            currentBet: 0,
            cardTypeStreaks: {},
            difficultyStreaks: {},
          };
        }
      }),
    }));

    get().nextTurn();
  },

  // ➡️ NEXT TURN
  nextTurn: () => {
    const { players, currentTurn } = get();
    const nextTurnIndex = (currentTurn + 1) % players.length;

    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === nextTurnIndex,
      isImmune: player.isImmune && Math.random() > 0.5,
      peekUsed: false,
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

    console.log(`➡️ Next turn: ${updatedPlayers[nextTurnIndex].name}`);

    get().clearBets();

    const winner = updatedPlayers.find((p) => p.score >= SCORE_TO_WIN);
    if (winner) {
      console.log(`🏆 Winner: ${winner.name} with ${winner.score} points!`);
      get().endGame();
    }
  },

  // 💰 BETTING SYSTEM - Token Único
  // ✅ FIX: El token se DESHABILITA al usarlo (se remueve del array)
  placeBet: (playerId: string, tokenValue: number) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);

      if (!player) {
        console.error('❌ Player not found');
        return { ...state, error: 'Jugador no encontrado' };
      }

      // ✅ Verificar que el token específico está disponible
      if (!player.availableTokens.includes(tokenValue)) {
        console.error(`❌ Token +${tokenValue} not available`);
        return { ...state, error: `Token +${tokenValue} ya fue usado` };
      }

      console.log(`🪙 ${player.name} usa token +${tokenValue}`);
      console.log(`   Tokens antes: [${player.availableTokens.join(', ')}]`);

      // ✅ Remover el token del array (ya no estará disponible)
      const newAvailableTokens = player.availableTokens.filter(
        (t) => t !== tokenValue
      );

      console.log(`   Tokens después: [${newAvailableTokens.join(', ')}]`);

      return {
        ...state,
        players: state.players.map((p) =>
          p.id === playerId
            ? {
                ...p,
                availableTokens: newAvailableTokens, // ✅ Token removido
                currentBet: tokenValue, // ✅ Valor del token usado
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

  // ⚡ POWER CARDS
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

      switch (powerCard.type) {
        case 'robo':
          if (targetPlayerId) {
            newPlayers = newPlayers.map((p) => {
              if (p.id === targetPlayerId && p.availableTokens.length > 0) {
                // Robar el token más alto disponible
                const stolenToken = Math.max(...p.availableTokens);
                return {
                  ...p,
                  availableTokens: p.availableTokens.filter(
                    (t) => t !== stolenToken
                  ),
                };
              }
              if (p.id === playerId) {
                // TODO: Agregar el token robado
                return {
                  ...p,
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

        case 'escudo':
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

        case 'boost':
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

        case 'peek':
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
          set({ showAnswer: true });
          break;
      }

      console.log(`⚡ Power card: ${powerCard.name} by ${player.name}`);

      return { ...state, players: newPlayers, error: null };
    });
  },

  // 🎯 SPECIAL GAME MODES
  startBattleMode: (player1Id: string, player2Id: string) => {
    set({
      gameMode: 'battle',
      battleModeActive: true,
      selectedBattlePlayers: { player1Id, player2Id },
      battleRound: { player1Id, player2Id, active: true },
    });
  },

  startSpeedRound: () => {
    set({
      gameMode: 'speed',
      speedRoundActive: true,
      speedRoundTimeLeft: SPEED_ROUND_TIME_LIMIT,
      speedRoundAnswers: {},
      currentSpeedRoundIndex: 0,
    });
  },

  startViralMoment: () => {
    set({
      gameMode: 'viral',
      viralMomentActive: true,
    });
  },

  // ⏰ TIMER
  startTimer: (duration: number) => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);

    set({ timeLeft: duration });

    const newInterval = setInterval(() => {
      const { timeLeft, isActive } = get();
      if (!isActive || timeLeft <= 0) {
        get().stopTimer();
        if (timeLeft <= 0) get().endGame();
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

  // 🔌 BACKEND
  checkBackendConnection: async (): Promise<boolean> => {
    try {
      const isConnected = await audioService.testConnection();
      set({
        backendConnected: isConnected,
        lastBackendCheck: new Date().toISOString(),
      });
      return isConnected;
    } catch (error) {
      set({
        backendConnected: false,
        lastBackendCheck: new Date().toISOString(),
      });
      return false;
    }
  },

  syncWithBackend: async () => {
    try {
      const [connectionInfo] = await Promise.all([
        audioService.getConnectionInfo(),
      ]);
      set({
        backendConnected: connectionInfo.backendConnected,
        lastBackendCheck: new Date().toISOString(),
      });
    } catch (error) {
      set({ backendConnected: false });
    }
  },

  setScanning: (scanning: boolean) => set({ isScanning: scanning }),
  setError: (error: string | null) => set({ error }),
}));

// ✅ Helper para verificar tokens disponibles
export function getAvailableTokens(player: Player): number[] {
  return player.availableTokens || [];
}

// ✅ Helper para verificar si un token específico está disponible
export function isTokenAvailable(player: Player, tokenValue: number): boolean {
  return player.availableTokens?.includes(tokenValue) || false;
}

// Compatibilidad con código antiguo (tokens como número)
export function getPlayerTokenCount(player: Player): number {
  return player.availableTokens?.length || 0;
}
