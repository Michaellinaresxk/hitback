// utils/cardTypes.ts - 🎯 HELPER PARA TIPOS DE CARTAS
export interface CardTypeConfig {
  name: string;
  emoji: string;
  color: string;
  basePoints: number;
  description: string;
  questionTemplate: string;
}

export const CARD_TYPES: Record<string, CardTypeConfig> = {
  song: {
    name: 'Canción',
    emoji: '🎵',
    color: '#F59E0B',
    basePoints: 1,
    description: 'Identifica la canción',
    questionTemplate: '¿Cuál es el título de esta canción?',
  },
  artist: {
    name: 'Artista',
    emoji: '🎤',
    color: '#EF4444',
    basePoints: 2,
    description: 'Identifica el artista',
    questionTemplate: '¿Quién interpreta esta canción?',
  },
  decade: {
    name: 'Década',
    emoji: '📅',
    color: '#3B82F6',
    basePoints: 3,
    description: 'Identifica la década',
    questionTemplate: '¿De qué década es esta canción?',
  },
  lyrics: {
    name: 'Letra',
    emoji: '📝',
    color: '#10B981',
    basePoints: 3,
    description: 'Completa la letra',
    questionTemplate: 'Completa la siguiente línea:',
  },
  challenge: {
    name: 'Challenge',
    emoji: '🔥',
    color: '#8B5CF6',
    basePoints: 5,
    description: 'Reto especial',
    questionTemplate: 'Realiza el siguiente challenge:',
  },
};

export const DIFFICULTY_CONFIG = {
  easy: {
    name: 'Fácil',
    color: '#10B981',
    multiplier: 1.0,
    powerCardChance: 0.1,
  },
  medium: {
    name: 'Medio',
    color: '#F59E0B',
    multiplier: 1.5,
    powerCardChance: 0.25,
  },
  hard: {
    name: 'Difícil',
    color: '#EF4444',
    multiplier: 2.0,
    powerCardChance: 0.45,
  },
  expert: {
    name: 'Experto',
    color: '#8B5CF6',
    multiplier: 3.0,
    powerCardChance: 0.7,
  },
};

// 🎯 HELPER FUNCTIONS
export const getCardTypeConfig = (cardType: string): CardTypeConfig => {
  return CARD_TYPES[cardType] || CARD_TYPES.song;
};

export const getDifficultyConfig = (difficulty: string) => {
  return (
    DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG] ||
    DIFFICULTY_CONFIG.easy
  );
};

export const calculateCardPoints = (
  cardType: string,
  difficulty: string
): number => {
  const typeConfig = getCardTypeConfig(cardType);
  const difficultyConfig = getDifficultyConfig(difficulty);

  return Math.round(typeConfig.basePoints * difficultyConfig.multiplier);
};

export const getCardDisplayInfo = (cardType: string, difficulty: string) => {
  const typeConfig = getCardTypeConfig(cardType);
  const difficultyConfig = getDifficultyConfig(difficulty);

  return {
    emoji: typeConfig.emoji,
    name: typeConfig.name,
    color: typeConfig.color,
    points: calculateCardPoints(cardType, difficulty),
    difficulty: difficultyConfig.name,
    difficultyColor: difficultyConfig.color,
  };
};

export const isValidCardType = (cardType: string): boolean => {
  return cardType in CARD_TYPES;
};

export const isValidDifficulty = (difficulty: string): boolean => {
  return difficulty in DIFFICULTY_CONFIG;
};

export const getAllCardTypes = () => {
  return Object.keys(CARD_TYPES);
};

export const getAllDifficulties = () => {
  return Object.keys(DIFFICULTY_CONFIG);
};
