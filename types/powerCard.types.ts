/**
 * Definición de una carta de poder (configuración)
 */
export interface PowerCardDefinition {
  type: PowerCardType;
  name: string;
  icon: string;
  description: string;
  quantity: number;
  effectType: PowerCardEffectType;
  category: PowerCardCategory;
}

/**
 * Instancia de una carta específica (en el mazo o inventario)
 */
export interface PowerCardInstance {
  id: string; // "HITBACK_PWR_BOOST_001"
  type: PowerCardType;
  name: string;
  icon: string;
  description: string;
  effectType: PowerCardEffectType;
  obtainedAt: string | null;
  isUsed: boolean;
  usedAt: string | null;
}

/**
 * Efectos activos de un jugador
 */
export interface PowerCardEffects {
  boost: boolean; // Próxima victoria x2
  shield: boolean; // Protegido contra robo
  counter: boolean; // Contraataque activo
}

/**
 * Estado de Power Cards de un jugador
 */
export interface PlayerPowerCardState {
  inventory: PowerCardInstance[]; // Cartas en mano (máx 5)
  activeEffects: PowerCardEffects; // Efectos activos
  usedCards: PowerCardInstance[]; // Historial de cartas usadas
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS PARA PRECISION
// ═══════════════════════════════════════════════════════════════════════════

export interface PrecisionQuestion {
  id: string;
  question: string;
  number: number;
}

export interface PrecisionAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export interface PrecisionState {
  isActive: boolean;
  playerId: string | null;
  questions: PrecisionQuestion[];
  answers: PrecisionAnswer[];
  timeLeft: number;
  startedAt: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS PARA CHALLENGE
// ═══════════════════════════════════════════════════════════════════════════

export type ChallengeType = 'lyrics' | 'sing' | 'imitate';

export interface ChallengeDefinition {
  id: ChallengeType;
  name: string;
  icon: string;
  description: string;
}

export interface ChallengeState {
  isActive: boolean;
  playerId: string | null;
  type: ChallengeType | null;
  name: string;
  icon: string;
  instruction: string;
  startedAt: string | null;
  completed: boolean | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS PARA STEAL
// ═══════════════════════════════════════════════════════════════════════════

export interface StealTarget {
  id: string;
  name: string;
  cardsCount: number;
  hasShield: boolean;
  hasCounter: boolean;
}

export interface StealState {
  isSelectingTarget: boolean;
  attackerId: string | null;
  cardId: string | null;
  validTargets: StealTarget[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS PARA RESURRECT
// ═══════════════════════════════════════════════════════════════════════════

export interface ResurrectState {
  isSelectingCard: boolean;
  playerId: string | null;
  availableCards: PowerCardInstance[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS PARA RESPUESTAS DE API
// ═══════════════════════════════════════════════════════════════════════════

export interface ScanCardResponse {
  success: boolean;
  error?: string;
  card?: {
    id: string;
    type: PowerCardType;
    name: string;
    icon: string;
    description: string;
    effectType: PowerCardEffectType;
  };
  player?: {
    id: string;
    name: string;
    cardsInHand: number;
  };
  message?: string;
}

export interface UseCardResponse {
  success: boolean;
  error?: string;
  effect?: string;
  message?: string;

  // Para efectos persistentes
  playerEffects?: PowerCardEffects;

  // Para STEAL
  requiresTarget?: boolean;
  validTargets?: StealTarget[];
  blocked?: boolean;
  counterAttack?: boolean;
  stolenCard?: PowerCardInstance;
  victim?: {
    id: string;
    name: string;
    remainingCards: number;
  };

  // Para PRECISION
  questions?: PrecisionQuestion[];
  timeLimit?: number;

  // Para CHALLENGE
  challenge?: {
    type: ChallengeType;
    name: string;
    icon: string;
    instruction: string;
  };
  pointsIfCompleted?: number;

  // Para RESURRECT
  requiresSelection?: boolean;
  availableCards?: PowerCardInstance[];
  resurrectedCard?: PowerCardInstance;
}

export interface InventoryResponse {
  success: boolean;
  playerId: string;
  playerName: string;
  cards: PowerCardInstance[];
  cardsCount: number;
  maxCards: number;
  activeEffects: PowerCardEffects;
  usedCards: PowerCardInstance[];
}

export interface DeckStatusResponse {
  success: boolean;
  totalCards: number;
  inDeck: number;
  distributed: number;
  byType: Record<
    PowerCardType,
    {
      total: number;
      inDeck: number;
    }
  >;
}

export interface ConfigResponse {
  success: boolean;
  cards: PowerCardDefinition[];
  maxCardsInHand: number;
}

export type PowerCardType =
  | 'BOOST' // ⚡ Doble puntos en próxima victoria
  | 'STEAL' // 🥷 Roba carta de otro jugador
  | 'SHIELD' // 🛡️ Bloquea próximo robo
  | 'COUNTER' // ⚔️ Contraataque si te roban
  | 'PRECISION' // 🎯 3 preguntas extra
  | 'CHALLENGE' // 🔥 Reto musical
  | 'RESURRECT'; // 🔄 Recupera carta usada

export type PowerCardEffectType = 'instant' | 'persistent';

export type PowerCardCategory =
  | 'offensive'
  | 'defensive'
  | 'special'
  | 'utility';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES PRINCIPALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Definición de una carta de poder (configuración)
 */
export interface PowerCardDefinition {
  type: PowerCardType;
  name: string;
  icon: string;
  description: string;
  quantity: number;
  effectType: PowerCardEffectType;
  category: PowerCardCategory;
}

/**
 * Instancia de una carta específica (en el mazo o inventario)
 */
export interface PowerCardInstance {
  id: string; // "HITBACK_PWR_BOOST_001"
  type: PowerCardType;
  name: string;
  icon: string;
  description: string;
  effectType: PowerCardEffectType;
  obtainedAt: string | null;
  isUsed: boolean;
  usedAt: string | null;
}

/**
 * Efectos activos de un jugador
 */
export interface PowerCardEffects {
  boost: boolean; // Próxima victoria x2
  shield: boolean; // Protegido contra robo
  counter: boolean; // Contraataque activo
}

/**
 * Estado de Power Cards de un jugador
 */
export interface PlayerPowerCardState {
  inventory: PowerCardInstance[]; // Cartas en mano (máx 5)
  activeEffects: PowerCardEffects; // Efectos activos
  usedCards: PowerCardInstance[]; // Historial de cartas usadas
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS PARA PRECISION
// ═══════════════════════════════════════════════════════════════════════════

export interface PrecisionQuestion {
  id: string;
  question: string;
  number: number;
}

export interface PrecisionAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export interface PrecisionState {
  isActive: boolean;
  playerId: string | null;
  questions: PrecisionQuestion[];
  answers: PrecisionAnswer[];
  timeLeft: number;
  startedAt: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS PARA CHALLENGE
// ═══════════════════════════════════════════════════════════════════════════

export interface ChallengeDefinition {
  id: ChallengeType;
  name: string;
  icon: string;
  description: string;
}

export interface ChallengeState {
  isActive: boolean;
  playerId: string | null;
  type: ChallengeType | null;
  name: string;
  icon: string;
  instruction: string;
  startedAt: string | null;
  completed: boolean | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS PARA STEAL
// ═══════════════════════════════════════════════════════════════════════════

export interface StealTarget {
  id: string;
  name: string;
  cardsCount: number;
  hasShield: boolean;
  hasCounter: boolean;
}

export interface StealState {
  isSelectingTarget: boolean;
  attackerId: string | null;
  cardId: string | null;
  validTargets: StealTarget[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS PARA RESURRECT
// ═══════════════════════════════════════════════════════════════════════════

export interface ResurrectState {
  isSelectingCard: boolean;
  playerId: string | null;
  availableCards: PowerCardInstance[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS PARA RESPUESTAS DE API
// ═══════════════════════════════════════════════════════════════════════════

export interface ScanCardResponse {
  success: boolean;
  error?: string;
  card?: {
    id: string;
    type: PowerCardType;
    name: string;
    icon: string;
    description: string;
    effectType: PowerCardEffectType;
  };
  player?: {
    id: string;
    name: string;
    cardsInHand: number;
  };
  message?: string;
}

export interface UseCardResponse {
  success: boolean;
  error?: string;
  effect?: string;
  message?: string;

  // Para efectos persistentes
  playerEffects?: PowerCardEffects;

  // Para STEAL
  requiresTarget?: boolean;
  validTargets?: StealTarget[];
  blocked?: boolean;
  counterAttack?: boolean;
  stolenCard?: PowerCardInstance;
  victim?: {
    id: string;
    name: string;
    remainingCards: number;
  };

  // Para PRECISION
  questions?: PrecisionQuestion[];
  timeLimit?: number;

  // Para CHALLENGE
  challenge?: {
    type: ChallengeType;
    name: string;
    icon: string;
    instruction: string;
  };
  pointsIfCompleted?: number;

  // Para RESURRECT
  requiresSelection?: boolean;
  availableCards?: PowerCardInstance[];
  resurrectedCard?: PowerCardInstance;
}

export interface InventoryResponse {
  success: boolean;
  playerId: string;
  playerName: string;
  cards: PowerCardInstance[];
  cardsCount: number;
  maxCards: number;
  activeEffects: PowerCardEffects;
  usedCards: PowerCardInstance[];
}

export interface DeckStatusResponse {
  success: boolean;
  totalCards: number;
  inDeck: number;
  distributed: number;
  byType: Record<
    PowerCardType,
    {
      total: number;
      inDeck: number;
    }
  >;
}

export interface ConfigResponse {
  success: boolean;
  cards: PowerCardDefinition[];
  maxCardsInHand: number;
}
