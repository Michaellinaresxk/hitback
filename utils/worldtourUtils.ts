// ─────────────────────────────────────────────────────────────────────────────
// WORLD TOUR UTILS — Pure functions for route & board logic
// ─────────────────────────────────────────────────────────────────────────────

import {
  ACT_ORDER,
  CITIES_PER_ACT,
  TILE_MECHANICS,
  TOTAL_TILES,
  WORLD_TOUR,
} from '@/constants/worldTour';
import {
  type TileType,
  type ActId,
  type MechanicTrigger,
  type BoardTile,
} from '@/types/worldTour.types';

// ─── Route Generation ────────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generates a route by picking and ordering 5 random cities per act.
 * The current city pools yield 7,494,864,659,627,304,960,000 ordered routes.
 * Call once in startGame().
 */
export function generateRoute(): BoardTile[] {
  const tiles: BoardTile[] = [];

  // Position 0: Start
  tiles.push({
    position: 0,
    cityId: WORLD_TOUR.startingPoint.id,
    emoji: WORLD_TOUR.startingPoint.emoji,
    tileType: WORLD_TOUR.startingPoint.tileType,
    act: 'act1_underground',
    isStart: true,
    isFinish: false,
  });

  // Positions 1-20: Shuffled cities
  let position = 1;
  for (const actId of ACT_ORDER) {
    const pool = WORLD_TOUR.acts[actId].cities;
    const selected = shuffleArray([...pool]).slice(0, CITIES_PER_ACT);

    for (const city of selected) {
      tiles.push({
        position,
        cityId: city.id,
        emoji: city.emoji,
        tileType: city.tileType,
        act: actId,
        isStart: false,
        isFinish: false,
      });
      position++;
    }
  }

  // Position 21: Finish
  tiles.push({
    position: 21,
    cityId: WORLD_TOUR.finishPoint.id,
    emoji: WORLD_TOUR.finishPoint.emoji,
    tileType: WORLD_TOUR.finishPoint.tileType,
    act: 'act4_headliner',
    isStart: false,
    isFinish: true,
  });

  return tiles;
}

// ─── Position Helpers ────────────────────────────────────────────────────────

export function getActForPosition(
  position: number,
): ActId | 'start' | 'finish' {
  if (position === 0) return 'start';
  if (position >= 21) return 'finish';
  if (position <= 5) return 'act1_underground';
  if (position <= 10) return 'act2_theBuzz';
  if (position <= 15) return 'act3_goingGlobal';
  return 'act4_headliner';
}

export function getMechanicTrigger(tileType: TileType): MechanicTrigger | null {
  return TILE_MECHANICS[tileType];
}

export function getProgressPercent(position: number): number {
  return Math.round((position / (TOTAL_TILES - 1)) * 100);
}

export function hasReachedFinish(position: number): boolean {
  return position >= TOTAL_TILES - 1;
}

export function getStopsRemaining(position: number): number {
  return Math.max(0, TOTAL_TILES - 1 - position);
}
