import { useGameStore } from '@/store/gameStore';
import { WORLD_TOUR } from '@/constants/worldTour';
import type { Player } from '@/store/types/gameStoreTypes';
import type { BoardTile, CityData } from '@/types/worldTour.types';

/**
 * Obtiene las ciudades visitadas por un jugador desde el inicio hasta su posición actual.
 * @param playerId - ID del jugador (formato backend: "player_1", "player_2", etc.)
 * @returns Objeto con las ciudades visitadas y metadatos
 */
export function useVisitedCities(playerId: string) {
  const { players, worldTourRoutes } = useGameStore();

  // Encontrar al jugador local o por ID
  const player = players.find((p) => p.id === playerId) || players[0];
  const route = worldTourRoutes?.[playerId];

  if (!route || !player) {
    return {
      visitedCities: [],
      totalCities: 0,
      currentPosition: 0,
      playerName: player?.name || 'Jugador',
    };
  }

  // Determinar posición actual (boardPosition del player en store)
  const currentPosition = player.boardPosition ?? 0;

  // Obtener todas las ciudades del WORLD_TOUR para lookup
  const allCities: CityData[] = Object.values(WORLD_TOUR.acts).reduce(
    (acc, act) => acc.concat(act.cities),
    [] as CityData[],
  );

  // Filtrar ciudades visitadas desde posición 0 hasta boardPosition (inclusive)
  // Las posiciones en route van de 0 a 21, y boardPosition es la casilla actual
  const visitedTiles = route.slice(0, currentPosition + 1);

  const visitedCities = visitedTiles
    .filter((tile): tile is BoardTile => !!tile && !!tile.cityId)
    .map((tile) => {
      const cityData = allCities.find((city) => city.id === tile.cityId);

      return {
        position: tile.position,
        cityId: tile.cityId,
        name: cityData?.name || tile.cityId,
        country: cityData?.country || 'Desconocido',
        emoji: cityData?.emoji || '🏙️',
        yearFact: cityData?.yearFact || 0,
        story: cityData?.story || '',
        tileType: tile.tileType,
        act: tile.act,
        venue: cityData?.venue || '',
      };
    })
    .sort((a, b) => a.position - b.position);

  return {
    visitedCities,
    totalCities: visitedCities.length,
    currentPosition,
    totalRouteLength: route.length,
    playerName: player.name,
  };
}

/**
 * Obtiene las ciudades visitadas para todos los jugadores
 */
export function useAllVisitedCities() {
  const { players, worldTourRoutes } = useGameStore();

  // Obtener todas las ciudades del WORLD_TOUR para lookup
  const allCities: CityData[] = Object.values(WORLD_TOUR.acts).reduce(
    (acc, act) => acc.concat(act.cities),
    [] as CityData[],
  );

  return players.map((player) => {
    const route = worldTourRoutes?.[player.id];
    const currentPosition = player.boardPosition ?? 0;

    if (!route) {
      return {
        playerName: player.name,
        visitedCities: [],
        totalCities: 0,
        currentPosition: 0,
      };
    }

    const visitedTiles = route.slice(0, currentPosition + 1);
    const visitedCities = visitedTiles
      .filter((tile): tile is BoardTile => !!tile && !!tile.cityId)
      .map((tile) => {
        const cityData = allCities.find((city) => city.id === tile.cityId);

        return {
          position: tile.position,
          cityId: tile.cityId,
          name: cityData?.name || 'Desconocida',
          country: cityData?.country || '',
          emoji: cityData?.emoji || '🏙️',
          act: tile.act,
        };
      })
      .sort((a, b) => a.position - b.position);

    return {
      playerName: player.name,
      visitedCities,
      totalCities: visitedCities.length,
      currentPosition,
    };
  });
}