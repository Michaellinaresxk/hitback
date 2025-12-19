// store/powerCardStore.ts - HITBACK Power Cards Store
// Store de Zustand para gestionar el estado de Power Cards en el frontend

import { create } from 'zustand';
import { powerCardService } from '@/services/PowerCardService';
import {
  ChallengeState,
  PowerCardEffects,
  PowerCardInstance,
  PrecisionAnswer,
  PrecisionState,
  ResurrectState,
  StealState,
} from '@/types/powerCard.types';
import { MAX_CARDS_IN_HAND } from '@/constants/PowerCard';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES DEL STORE
// ═══════════════════════════════════════════════════════════════════════════

interface PlayerInventory {
  playerId: string;
  playerName: string;
  cards: PowerCardInstance[];
  activeEffects: PowerCardEffects;
  usedCards: PowerCardInstance[];
}

interface PowerCardState {
  // Estado general
  isLoading: boolean;
  error: string | null;

  // Inventarios por jugador (mapa playerId -> inventario)
  inventories: Record<string, PlayerInventory>;

  // Estado del mazo
  deckStatus: {
    totalCards: number;
    inDeck: number;
    distributed: number;
  } | null;

  // Estados de acciones especiales
  precision: PrecisionState;
  challenge: ChallengeState;
  steal: StealState;
  resurrect: ResurrectState;

  // Modal de obtención de carta
  newCardModal: {
    visible: boolean;
    card: PowerCardInstance | null;
    playerName: string;
  };

  // Modal de uso de carta
  useCardModal: {
    visible: boolean;
    card: PowerCardInstance | null;
    playerId: string | null;
  };

  // Resultado de última acción
  lastActionResult: {
    success: boolean;
    message: string;
    effect?: string;
  } | null;
}

interface PowerCardActions {
  // Acciones básicas
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Escanear carta del mazo
  scanCard: (
    qrCode: string,
    playerId: string,
    sessionId: string
  ) => Promise<boolean>;

  // Usar carta
  useCard: (
    cardId: string,
    playerId: string,
    sessionId: string
  ) => Promise<boolean>;

  // Acciones específicas por tipo de carta
  useBoost: (
    cardId: string,
    playerId: string,
    sessionId: string
  ) => Promise<boolean>;
  useSteal: (
    cardId: string,
    playerId: string,
    sessionId: string,
    targetPlayerId?: string
  ) => Promise<boolean>;
  useShield: (
    cardId: string,
    playerId: string,
    sessionId: string
  ) => Promise<boolean>;
  useCounter: (
    cardId: string,
    playerId: string,
    sessionId: string
  ) => Promise<boolean>;
  usePrecision: (
    cardId: string,
    playerId: string,
    sessionId: string
  ) => Promise<boolean>;
  useChallenge: (
    cardId: string,
    playerId: string,
    sessionId: string
  ) => Promise<boolean>;
  useResurrect: (
    cardId: string,
    playerId: string,
    sessionId: string,
    cardToResurrect?: string
  ) => Promise<boolean>;

  // Resolver PRECISION y CHALLENGE
  submitPrecisionAnswers: (
    sessionId: string,
    answers: PrecisionAnswer[]
  ) => Promise<boolean>;
  submitChallengeResult: (
    sessionId: string,
    completed: boolean
  ) => Promise<boolean>;

  // Obtener inventario
  fetchInventory: (sessionId: string, playerId: string) => Promise<void>;

  // Obtener estado del mazo
  fetchDeckStatus: () => Promise<void>;

  // Reset
  resetDeck: () => Promise<boolean>;
  resetStore: () => void;

  // Modales
  showNewCardModal: (card: PowerCardInstance, playerName: string) => void;
  hideNewCardModal: () => void;
  showUseCardModal: (card: PowerCardInstance, playerId: string) => void;
  hideUseCardModal: () => void;

  // Helpers
  getPlayerInventory: (playerId: string) => PlayerInventory | null;
  getPlayerActiveEffects: (playerId: string) => PowerCardEffects;
  hasCard: (playerId: string, cardId: string) => boolean;
  canUseCard: (playerId: string) => boolean;

  // Actualizar efectos localmente (para sincronización)
  updatePlayerEffects: (
    playerId: string,
    effects: Partial<PowerCardEffects>
  ) => void;
  addCardToInventory: (playerId: string, card: PowerCardInstance) => void;
  removeCardFromInventory: (playerId: string, cardId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTADO INICIAL
// ═══════════════════════════════════════════════════════════════════════════

const initialPrecisionState: PrecisionState = {
  isActive: false,
  playerId: null,
  questions: [],
  answers: [],
  timeLeft: 15,
  startedAt: null,
};

const initialChallengeState: ChallengeState = {
  isActive: false,
  playerId: null,
  type: null,
  name: '',
  icon: '',
  instruction: '',
  startedAt: null,
  completed: null,
};

const initialStealState: StealState = {
  isSelectingTarget: false,
  attackerId: null,
  cardId: null,
  validTargets: [],
};

const initialResurrectState: ResurrectState = {
  isSelectingCard: false,
  playerId: null,
  availableCards: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const usePowerCardStore = create<PowerCardState & PowerCardActions>(
  (set, get) => ({
    // Estado inicial
    isLoading: false,
    error: null,
    inventories: {},
    deckStatus: null,
    precision: initialPrecisionState,
    challenge: initialChallengeState,
    steal: initialStealState,
    resurrect: initialResurrectState,
    newCardModal: {
      visible: false,
      card: null,
      playerName: '',
    },
    useCardModal: {
      visible: false,
      card: null,
      playerId: null,
    },
    lastActionResult: null,

    // ═══════════════════════════════════════════════════════════════════════════
    // ACCIONES BÁSICAS
    // ═══════════════════════════════════════════════════════════════════════════

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    clearError: () => set({ error: null }),

    // ═══════════════════════════════════════════════════════════════════════════
    // ESCANEAR CARTA DEL MAZO
    // ═══════════════════════════════════════════════════════════════════════════

    scanCard: async (qrCode, playerId, sessionId) => {
      console.log(`\n🎴 ═══ SCAN POWER CARD ═══`);
      console.log(`   QR: ${qrCode}`);
      console.log(`   Player: ${playerId}`);

      set({ isLoading: true, error: null });

      try {
        const result = await powerCardService.scanCard(
          qrCode,
          playerId,
          sessionId
        );

        if (!result.success) {
          set({
            isLoading: false,
            error: result.error || 'Error al escanear carta',
            lastActionResult: {
              success: false,
              message: result.error || 'Error al escanear carta',
            },
          });
          return false;
        }

        // Agregar carta al inventario local
        if (result.card && result.player) {
          const cardInstance: PowerCardInstance = {
            id: result.card.id,
            type: result.card.type,
            name: result.card.name,
            icon: result.card.icon,
            description: result.card.description,
            effectType: result.card.effectType,
            obtainedAt: new Date().toISOString(),
            isUsed: false,
            usedAt: null,
          };

          get().addCardToInventory(playerId, cardInstance);

          // Mostrar modal de nueva carta
          get().showNewCardModal(cardInstance, result.player.name);

          set({
            lastActionResult: {
              success: true,
              message:
                result.message ||
                `¡Obtuviste ${result.card.icon} ${result.card.name}!`,
            },
          });
        }

        set({ isLoading: false });
        console.log(`✅ Card scanned successfully`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Scan failed:`, errorMessage);

        set({
          isLoading: false,
          error: errorMessage,
          lastActionResult: {
            success: false,
            message: errorMessage,
          },
        });
        return false;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // USAR CARTA (GENÉRICO)
    // ═══════════════════════════════════════════════════════════════════════════

    useCard: async (cardId, playerId, sessionId) => {
      // Determinar el tipo de carta y llamar a la función específica
      const inventory = get().getPlayerInventory(playerId);
      const card = inventory?.cards.find((c) => c.id === cardId);

      if (!card) {
        set({ error: 'Carta no encontrada en el inventario' });
        return false;
      }

      switch (card.type) {
        case 'BOOST':
          return get().useBoost(cardId, playerId, sessionId);
        case 'STEAL':
          return get().useSteal(cardId, playerId, sessionId);
        case 'SHIELD':
          return get().useShield(cardId, playerId, sessionId);
        case 'COUNTER':
          return get().useCounter(cardId, playerId, sessionId);
        case 'PRECISION':
          return get().usePrecision(cardId, playerId, sessionId);
        case 'CHALLENGE':
          return get().useChallenge(cardId, playerId, sessionId);
        case 'RESURRECT':
          return get().useResurrect(cardId, playerId, sessionId);
        default:
          set({ error: `Tipo de carta desconocido: ${card.type}` });
          return false;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // USAR BOOST ⚡
    // ═══════════════════════════════════════════════════════════════════════════

    useBoost: async (cardId, playerId, sessionId) => {
      console.log(`\n⚡ ═══ USE BOOST ═══`);

      set({ isLoading: true, error: null });

      try {
        const result = await powerCardService.useBoost(
          cardId,
          playerId,
          sessionId
        );

        if (!result.success) {
          set({
            isLoading: false,
            error: result.error || 'Error al usar BOOST',
          });
          return false;
        }

        // Actualizar efectos localmente
        get().updatePlayerEffects(playerId, { boost: true });

        // Remover carta del inventario
        get().removeCardFromInventory(playerId, cardId);

        set({
          isLoading: false,
          lastActionResult: {
            success: true,
            message:
              result.message ||
              '⚡ ¡BOOST activado! Tu próxima victoria vale DOBLE',
            effect: 'boost_activated',
          },
        });

        console.log(`✅ BOOST activated`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        set({ isLoading: false, error: errorMessage });
        return false;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // USAR STEAL 🥷
    // ═══════════════════════════════════════════════════════════════════════════

    useSteal: async (cardId, playerId, sessionId, targetPlayerId) => {
      console.log(`\n🥷 ═══ USE STEAL ═══`);

      set({ isLoading: true, error: null });

      try {
        // Si no hay target, obtener lista de targets válidos
        if (!targetPlayerId) {
          const result = await powerCardService.getStealTargets(
            cardId,
            playerId,
            sessionId
          );

          if (result.requiresTarget && result.validTargets) {
            set({
              isLoading: false,
              steal: {
                isSelectingTarget: true,
                attackerId: playerId,
                cardId: cardId,
                validTargets: result.validTargets,
              },
            });
            return true; // Esperando selección de target
          }

          if (!result.success) {
            set({
              isLoading: false,
              error: result.error || 'No hay jugadores para robar',
            });
            return false;
          }
        }

        // Ejecutar robo
        const result = await powerCardService.executeSteal(
          cardId,
          playerId,
          sessionId,
          targetPlayerId!
        );

        // Limpiar estado de steal
        set({ steal: initialStealState });

        if (!result.success && !result.blocked && !result.counterAttack) {
          set({ isLoading: false, error: result.error || 'Error al robar' });
          return false;
        }

        // Remover carta STEAL del inventario del atacante
        get().removeCardFromInventory(playerId, cardId);

        // Manejar diferentes resultados
        if (result.blocked) {
          // Bloqueado por SHIELD
          set({
            isLoading: false,
            lastActionResult: {
              success: true,
              message: result.message || '🛡️ ¡Robo bloqueado por ESCUDO!',
              effect: 'shield_blocked',
            },
          });
        } else if (result.counterAttack) {
          // Contraatacado por COUNTER
          set({
            isLoading: false,
            lastActionResult: {
              success: true,
              message: result.message || '⚔️ ¡CONTRAATAQUE! Te robaron a ti',
              effect: 'counter_triggered',
            },
          });
        } else if (result.stolenCard) {
          // Robo exitoso - agregar carta robada al inventario
          get().addCardToInventory(playerId, result.stolenCard);

          set({
            isLoading: false,
            lastActionResult: {
              success: true,
              message:
                result.message ||
                `🥷 ¡Robaste ${result.stolenCard.icon} ${result.stolenCard.name}!`,
              effect: 'steal_success',
            },
          });
        }

        console.log(`✅ STEAL completed`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        set({
          isLoading: false,
          error: errorMessage,
          steal: initialStealState,
        });
        return false;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // USAR SHIELD 🛡️
    // ═══════════════════════════════════════════════════════════════════════════

    useShield: async (cardId, playerId, sessionId) => {
      console.log(`\n🛡️ ═══ USE SHIELD ═══`);

      set({ isLoading: true, error: null });

      try {
        const result = await powerCardService.useShield(
          cardId,
          playerId,
          sessionId
        );

        if (!result.success) {
          set({
            isLoading: false,
            error: result.error || 'Error al usar SHIELD',
          });
          return false;
        }

        // Actualizar efectos localmente
        get().updatePlayerEffects(playerId, { shield: true });

        set({
          isLoading: false,
          lastActionResult: {
            success: true,
            message:
              result.message ||
              '🛡️ ¡ESCUDO activado! Protegido contra el próximo robo',
            effect: 'shield_activated',
          },
        });

        console.log(`✅ SHIELD activated`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        set({ isLoading: false, error: errorMessage });
        return false;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // USAR COUNTER ⚔️
    // ═══════════════════════════════════════════════════════════════════════════

    useCounter: async (cardId, playerId, sessionId) => {
      console.log(`\n⚔️ ═══ USE COUNTER ═══`);

      set({ isLoading: true, error: null });

      try {
        const result = await powerCardService.useCounter(
          cardId,
          playerId,
          sessionId
        );

        if (!result.success) {
          set({
            isLoading: false,
            error: result.error || 'Error al usar COUNTER',
          });
          return false;
        }

        // Actualizar efectos localmente
        get().updatePlayerEffects(playerId, { counter: true });

        set({
          isLoading: false,
          lastActionResult: {
            success: true,
            message:
              result.message ||
              '⚔️ ¡CONTRAATAQUE activado! Si te roban, tú robas a ellos',
            effect: 'counter_activated',
          },
        });

        console.log(`✅ COUNTER activated`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        set({ isLoading: false, error: errorMessage });
        return false;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // USAR PRECISION 🎯
    // ═══════════════════════════════════════════════════════════════════════════

    usePrecision: async (cardId, playerId, sessionId) => {
      console.log(`\n🎯 ═══ USE PRECISION ═══`);

      set({ isLoading: true, error: null });

      try {
        const result = await powerCardService.usePrecision(
          cardId,
          playerId,
          sessionId
        );

        if (!result.success) {
          set({
            isLoading: false,
            error: result.error || 'Error al usar PRECISION',
          });
          return false;
        }

        if (result.questions) {
          // Iniciar estado de PRECISION
          set({
            isLoading: false,
            precision: {
              isActive: true,
              playerId: playerId,
              questions: result.questions,
              answers: [],
              timeLeft: result.timeLimit || 15,
              startedAt: new Date().toISOString(),
            },
            lastActionResult: {
              success: true,
              message:
                result.message ||
                '🎯 ¡PRECISIÓN activada! Responde 3 preguntas',
              effect: 'precision_started',
            },
          });

          // Remover carta del inventario
          get().removeCardFromInventory(playerId, cardId);
        }

        console.log(`✅ PRECISION started`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        set({ isLoading: false, error: errorMessage });
        return false;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // USAR CHALLENGE 🔥
    // ═══════════════════════════════════════════════════════════════════════════

    useChallenge: async (cardId, playerId, sessionId) => {
      console.log(`\n🔥 ═══ USE CHALLENGE ═══`);

      set({ isLoading: true, error: null });

      try {
        const result = await powerCardService.useChallenge(
          cardId,
          playerId,
          sessionId
        );

        if (!result.success) {
          set({
            isLoading: false,
            error: result.error || 'Error al usar CHALLENGE',
          });
          return false;
        }

        if (result.challenge) {
          // Iniciar estado de CHALLENGE
          set({
            isLoading: false,
            challenge: {
              isActive: true,
              playerId: playerId,
              type: result.challenge.type,
              name: result.challenge.name,
              icon: result.challenge.icon,
              instruction: result.challenge.instruction,
              startedAt: new Date().toISOString(),
              completed: null,
            },
            lastActionResult: {
              success: true,
              message:
                result.message || `🔥 ¡RETO activado! ${result.challenge.name}`,
              effect: 'challenge_started',
            },
          });

          // Remover carta del inventario
          get().removeCardFromInventory(playerId, cardId);
        }

        console.log(`✅ CHALLENGE started`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        set({ isLoading: false, error: errorMessage });
        return false;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // USAR RESURRECT 🔄
    // ═══════════════════════════════════════════════════════════════════════════

    useResurrect: async (cardId, playerId, sessionId, cardToResurrect) => {
      console.log(`\n🔄 ═══ USE RESURRECT ═══`);

      set({ isLoading: true, error: null });

      try {
        // Si no hay carta seleccionada, obtener opciones
        if (!cardToResurrect) {
          const result = await powerCardService.getResurrectOptions(
            cardId,
            playerId,
            sessionId
          );

          if (result.requiresSelection && result.availableCards) {
            set({
              isLoading: false,
              resurrect: {
                isSelectingCard: true,
                playerId: playerId,
                availableCards: result.availableCards,
              },
            });
            return true; // Esperando selección
          }

          if (!result.success) {
            set({
              isLoading: false,
              error: result.error || 'No hay cartas para recuperar',
            });
            return false;
          }
        }

        // Ejecutar resurrección
        const result = await powerCardService.executeResurrect(
          cardId,
          playerId,
          sessionId,
          cardToResurrect!
        );

        // Limpiar estado
        set({ resurrect: initialResurrectState });

        if (!result.success) {
          set({
            isLoading: false,
            error: result.error || 'Error al recuperar carta',
          });
          return false;
        }

        // Agregar carta resucitada al inventario
        if (result.resurrectedCard) {
          get().addCardToInventory(playerId, {
            ...result.resurrectedCard,
            isUsed: false,
            usedAt: null,
          });
        }

        // Remover carta RESURRECT del inventario
        get().removeCardFromInventory(playerId, cardId);

        set({
          isLoading: false,
          lastActionResult: {
            success: true,
            message:
              result.message ||
              `🔄 ¡Recuperaste ${result.resurrectedCard?.icon} ${result.resurrectedCard?.name}!`,
            effect: 'resurrect_success',
          },
        });

        console.log(`✅ RESURRECT completed`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        set({
          isLoading: false,
          error: errorMessage,
          resurrect: initialResurrectState,
        });
        return false;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // RESOLVER PRECISION Y CHALLENGE
    // ═══════════════════════════════════════════════════════════════════════════

    submitPrecisionAnswers: async (sessionId, answers) => {
      console.log(`\n🎯 ═══ SUBMIT PRECISION ANSWERS ═══`);

      set({ isLoading: true });

      try {
        const result = await powerCardService.resolvePrecision(
          sessionId,
          answers
        );

        set({
          isLoading: false,
          precision: initialPrecisionState,
          lastActionResult: {
            success: true,
            message:
              result.message ||
              `🎯 Acertaste ${result.correctAnswers}/3 = +${result.pointsEarned} puntos`,
          },
        });

        return result.success;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        set({
          isLoading: false,
          error: errorMessage,
          precision: initialPrecisionState,
        });
        return false;
      }
    },

    submitChallengeResult: async (sessionId, completed) => {
      console.log(`\n🔥 ═══ SUBMIT CHALLENGE RESULT ═══`);

      set({ isLoading: true });

      try {
        const result = await powerCardService.resolveChallenge(
          sessionId,
          completed
        );

        set({
          isLoading: false,
          challenge: initialChallengeState,
          lastActionResult: {
            success: true,
            message:
              result.message ||
              (completed
                ? '🔥 ¡Reto completado! +3 puntos'
                : '😅 Reto no completado'),
          },
        });

        return result.success;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        set({
          isLoading: false,
          error: errorMessage,
          challenge: initialChallengeState,
        });
        return false;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // OBTENER DATOS
    // ═══════════════════════════════════════════════════════════════════════════

    fetchInventory: async (sessionId, playerId) => {
      try {
        const result = await powerCardService.getInventory(sessionId, playerId);

        if (result.success) {
          set((state) => ({
            inventories: {
              ...state.inventories,
              [playerId]: {
                playerId: result.playerId,
                playerName: result.playerName,
                cards: result.cards,
                activeEffects: result.activeEffects,
                usedCards: result.usedCards,
              },
            },
          }));
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    },

    fetchDeckStatus: async () => {
      try {
        const result = await powerCardService.getDeckStatus();

        if (result.success) {
          set({
            deckStatus: {
              totalCards: result.totalCards,
              inDeck: result.inDeck,
              distributed: result.distributed,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching deck status:', error);
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // RESET
    // ═══════════════════════════════════════════════════════════════════════════

    resetDeck: async () => {
      try {
        const result = await powerCardService.resetDeck();

        if (result.success) {
          set({
            inventories: {},
            deckStatus: {
              totalCards: result.totalCards,
              inDeck: result.totalCards,
              distributed: 0,
            },
          });
        }

        return result.success;
      } catch (error) {
        console.error('Error resetting deck:', error);
        return false;
      }
    },

    resetStore: () => {
      set({
        isLoading: false,
        error: null,
        inventories: {},
        deckStatus: null,
        precision: initialPrecisionState,
        challenge: initialChallengeState,
        steal: initialStealState,
        resurrect: initialResurrectState,
        newCardModal: { visible: false, card: null, playerName: '' },
        useCardModal: { visible: false, card: null, playerId: null },
        lastActionResult: null,
      });
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MODALES
    // ═══════════════════════════════════════════════════════════════════════════

    showNewCardModal: (card, playerName) => {
      set({
        newCardModal: { visible: true, card, playerName },
      });
    },

    hideNewCardModal: () => {
      set({
        newCardModal: { visible: false, card: null, playerName: '' },
      });
    },

    showUseCardModal: (card, playerId) => {
      set({
        useCardModal: { visible: true, card, playerId },
      });
    },

    hideUseCardModal: () => {
      set({
        useCardModal: { visible: false, card: null, playerId: null },
      });
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    getPlayerInventory: (playerId) => {
      return get().inventories[playerId] || null;
    },

    getPlayerActiveEffects: (playerId) => {
      const inventory = get().inventories[playerId];
      return (
        inventory?.activeEffects || {
          boost: false,
          shield: false,
          counter: false,
        }
      );
    },

    hasCard: (playerId, cardId) => {
      const inventory = get().inventories[playerId];
      return inventory?.cards.some((c) => c.id === cardId) || false;
    },

    canUseCard: (playerId) => {
      const inventory = get().inventories[playerId];
      return (inventory?.cards.length || 0) > 0;
    },

    updatePlayerEffects: (playerId, effects) => {
      set((state) => {
        const inventory = state.inventories[playerId];
        if (!inventory) return state;

        return {
          inventories: {
            ...state.inventories,
            [playerId]: {
              ...inventory,
              activeEffects: {
                ...inventory.activeEffects,
                ...effects,
              },
            },
          },
        };
      });
    },

    addCardToInventory: (playerId, card) => {
      set((state) => {
        const inventory = state.inventories[playerId] || {
          playerId,
          playerName: '',
          cards: [],
          activeEffects: { boost: false, shield: false, counter: false },
          usedCards: [],
        };

        // Verificar límite
        if (inventory.cards.length >= MAX_CARDS_IN_HAND) {
          console.warn(`Cannot add card: ${playerId} already has max cards`);
          return state;
        }

        return {
          inventories: {
            ...state.inventories,
            [playerId]: {
              ...inventory,
              cards: [...inventory.cards, card],
            },
          },
        };
      });
    },

    removeCardFromInventory: (playerId, cardId) => {
      set((state) => {
        const inventory = state.inventories[playerId];
        if (!inventory) return state;

        const cardToRemove = inventory.cards.find((c) => c.id === cardId);

        return {
          inventories: {
            ...state.inventories,
            [playerId]: {
              ...inventory,
              cards: inventory.cards.filter((c) => c.id !== cardId),
              usedCards: cardToRemove
                ? [
                    ...inventory.usedCards,
                    {
                      ...cardToRemove,
                      isUsed: true,
                      usedAt: new Date().toISOString(),
                    },
                  ]
                : inventory.usedCards,
            },
          },
        };
      });
    },
  })
);

// ═══════════════════════════════════════════════════════════════════════════
// SELECTORES
// ═══════════════════════════════════════════════════════════════════════════

export const selectPlayerCards =
  (playerId: string) => (state: PowerCardState) =>
    state.inventories[playerId]?.cards || [];

export const selectPlayerEffects =
  (playerId: string) => (state: PowerCardState) =>
    state.inventories[playerId]?.activeEffects || {
      boost: false,
      shield: false,
      counter: false,
    };

export const selectIsPrecisionActive = (state: PowerCardState) =>
  state.precision.isActive;

export const selectIsChallengeActive = (state: PowerCardState) =>
  state.challenge.isActive;

export const selectIsStealSelectingTarget = (state: PowerCardState) =>
  state.steal.isSelectingTarget;

export const selectIsResurrectSelectingCard = (state: PowerCardState) =>
  state.resurrect.isSelectingCard;
