import type { Player as StorePlayer } from '@/store/gameStore';

export const getBackendPlayerId = (
  frontendId: string,
  players: StorePlayer[],
  playerIdMap: Record<string, string>
): string => {
  if (playerIdMap[frontendId]) {
    return playerIdMap[frontendId];
  }

  const playerIndex = players.findIndex((p) => p.id === frontendId);
  if (playerIndex !== -1) {
    return `player_${playerIndex + 1}`;
  }

  return frontendId;
};

export const validateBet = (
  player: StorePlayer | undefined,
  amount: number
): { valid: boolean; error?: string } => {
  if (!player) {
    return { valid: false, error: 'Jugador no encontrado' };
  }

  if (player.tokens < 1) {
    return { valid: false, error: 'No tienes tokens disponibles' };
  }

  if (amount < 1 || amount > 3) {
    return { valid: false, error: 'El valor del token debe ser 1, 2 o 3' };
  }

  return { valid: true };
};
