// types/card_types.ts - HITBACK Card Types
// ✅ Re-exporta CurrentCard de game_types para compatibilidad

import { CurrentCard, Track, CardType, QuestionData } from './game.types';

// ✅ Re-exportar CurrentCard como Card para compatibilidad con código existente
export type Card = CurrentCard;

// Re-exportar tipos relacionados
export type { CurrentCard, Track, CardType, QuestionData };
