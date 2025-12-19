// utils/calculatePoints.ts

interface PointsCalculation {
  basePoints: number; // Puntos de la pregunta (1-5)
  tokenBonus: number; // Valor del token usado (0, 1, 2, o 3)
  boostActive: boolean; // Si tiene BOOST activo
  precisionPoints: number; // Puntos extra de PRECISION (0-3)
  challengePoints: number; // Puntos extra de CHALLENGE (0 o 3)
}

export function calculateTotalPoints(calc: PointsCalculation): number {
  // Fórmula: ((base + token) × boost) + precision + challenge

  const baseWithToken = calc.basePoints + calc.tokenBonus;
  const multiplier = calc.boostActive ? 2 : 1;
  const mainPoints = baseWithToken * multiplier;

  return mainPoints + calc.precisionPoints + calc.challengePoints;
}

// Ejemplos:
// 1. Pregunta ARTIST (2pts) + Token +3 + BOOST
//    = (2 + 3) × 2 = 10 puntos

// 2. Pregunta SONG (1pt) + sin token + sin boost
//    = (1 + 0) × 1 = 1 punto

// 3. Pregunta DECADE (2pts) + Token +2 + BOOST + PRECISION (2/3)
//    = ((2 + 2) × 2) + 2 = 8 + 2 = 10 puntos
