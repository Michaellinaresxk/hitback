// utils/game/bettingUtils.ts
import { Player } from '@/store/gameStore';

/**
 * Determina si se puede apostar en la ronda actual
 */
export const canBetInCurrentRound = (
  roundNumber: number,
  phase: string,
  hasPlacedBet: boolean
): boolean => {
  // Solo se puede apostar:
  // 1. En rondas 2+ (ronda 1 no tiene apuestas)
  // 2. En fase 'idle' (antes del audio)
  // 3. Si no se ha apostado ya
  return roundNumber > 1 && phase === 'idle' && !hasPlacedBet;
};

/**
 * Valida si un jugador puede usar un token específico
 */
export const validateTokenUsage = (
  player: Player | undefined,
  tokenValue: number
): { valid: boolean; error?: string } => {
  if (!player) {
    return { valid: false, error: 'Jugador no encontrado' };
  }

  if (!player.availableTokens.includes(tokenValue)) {
    return {
      valid: false,
      error: `Token +${tokenValue} ya fue usado o no disponible`,
    };
  }

  return { valid: true };
};

/**
 * Calcula los puntos totales (base + token)
 */
export const calculateTotalPoints = (
  basePoints: number,
  tokenValue: number,
  hasBoost: boolean = false
): number => {
  let total = basePoints + tokenValue;
  if (hasBoost) {
    total *= 2;
  }
  return total;
};
