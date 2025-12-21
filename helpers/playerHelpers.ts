// store/helpers/playerHelpers.ts

import { Player } from '@/store/types/gameStoreTypes';

export function getAvailableTokens(player: Player): number[] {
  return player.availableTokens || [];
}

export function isTokenAvailable(player: Player, tokenValue: number): boolean {
  return player.availableTokens?.includes(tokenValue) || false;
}

export function getPlayerTokenCount(player: Player): number {
  return player.availableTokens?.length || 0;
}
