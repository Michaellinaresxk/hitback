import {
  ChallengeDefinition,
  PowerCardDefinition,
  PowerCardType,
} from '@/types/powerCard.types';

export const MAX_CARDS_IN_HAND = 5;

export const POWER_CARD_CONFIG: Record<PowerCardType, PowerCardDefinition> = {
  BOOST: {
    type: 'BOOST',
    name: 'Amplificador',
    icon: '⚡',
    description: 'Tu próxima victoria vale DOBLE puntos',
    quantity: 4,
    effectType: 'persistent',
    category: 'offensive',
  },
  STEAL: {
    type: 'STEAL',
    name: 'Ladrón Musical',
    icon: '🥷',
    description: 'Roba una Power Card de otro jugador',
    quantity: 4,
    effectType: 'instant',
    category: 'offensive',
  },
  SHIELD: {
    type: 'SHIELD',
    name: 'Escudo Sónico',
    icon: '🛡️',
    description: 'Bloquea el próximo intento de robo',
    quantity: 3,
    effectType: 'persistent',
    category: 'defensive',
  },
  COUNTER: {
    type: 'COUNTER',
    name: 'Contraataque',
    icon: '⚔️',
    description: 'Si te intentan robar, TÚ robas su carta',
    quantity: 2,
    effectType: 'persistent',
    category: 'defensive',
  },
  PRECISION: {
    type: 'PRECISION',
    name: 'Precisión Total',
    icon: '🎯',
    description: '3 preguntas rápidas = hasta +3 puntos',
    quantity: 4,
    effectType: 'instant',
    category: 'special',
  },
  CHALLENGE: {
    type: 'CHALLENGE',
    name: 'Reto Musical',
    icon: '🔥',
    description: 'Completa un reto para ganar +3 puntos',
    quantity: 4,
    effectType: 'instant',
    category: 'special',
  },
  RESURRECT: {
    type: 'RESURRECT',
    name: 'Resurrección',
    icon: '🔄',
    description: 'Recupera una Power Card ya usada',
    quantity: 3,
    effectType: 'instant',
    category: 'utility',
  },
};

export const CHALLENGE_TYPES: ChallengeDefinition[] = [
  {
    id: 'lyrics',
    name: 'Completa la Letra',
    icon: '📝',
    description: 'Completa el siguiente verso...',
  },
  {
    id: 'sing',
    name: 'Canta el Coro',
    icon: '🎤',
    description: 'Canta el coro de la canción',
  },
  {
    id: 'imitate',
    name: 'Imita al Artista',
    icon: '🎭',
    description: 'Imita el estilo del artista',
  },
];
