import {
  ActId,
  CityData,
  MechanicTrigger,
  TileType,
} from '@/types/worldTour.types';
import citiesData from '@/constants/worldTourCities.json';

export const ACT_ORDER: ActId[] = [
  'act1_underground',
  'act2_theBuzz',
  'act3_goingGlobal',
  'act4_headliner',
];

export const TILE_MECHANICS: Record<TileType, MechanicTrigger | null> = {
  concert: null,
  festival: 'reaction_card',
  record_deal: 'split_dice',
  rival_band: 'duel',
  sold_out: 'double_points',
};

export const CITIES_PER_ACT = 5;
export const TOTAL_TILES = 22;

export const WORLD_TOUR = {
  startingPoint: { id: 'start', emoji: '🏠', tileType: 'concert' as TileType },
  finishPoint: { id: 'finish', emoji: '🏆', tileType: 'concert' as TileType },

  acts: {
    act1_underground: {
      positionRange: [1, 5] as [number, number],
      cities: citiesData.act1_underground as CityData[],
    },
    act2_theBuzz: {
      positionRange: [6, 10] as [number, number],
      cities: citiesData.act2_theBuzz as CityData[],
    },
    act3_goingGlobal: {
      positionRange: [11, 15] as [number, number],
      cities: citiesData.act3_goingGlobal as CityData[],
    },
    act4_headliner: {
      positionRange: [16, 20] as [number, number],
      cities: citiesData.act4_headliner as CityData[],
    },
  },
};
