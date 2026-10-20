export type TileType =
  | 'concert'
  | 'festival'
  | 'record_deal'
  | 'rival_band'
  | 'sold_out';
export type MechanicTrigger =
  | 'reaction_card'
  | 'split_dice'
  | 'duel'
  | 'double_points';
export type ActId =
  | 'act1_underground'
  | 'act2_theBuzz'
  | 'act3_goingGlobal'
  | 'act4_headliner';

export interface CityData {
  id: string;
  emoji: string;
  tileType: TileType;
  country: string;
  yearFact: number;
}

export interface BoardTile {
  position: number;
  cityId: string;
  emoji: string;
  tileType: TileType;
  act: ActId;
  isStart: boolean;
  isFinish: boolean;
}

export type Locale = 'es' | 'en' | 'pl';

/** Raw act entry from the structural JSON */
export interface ActData {
  positionRange: [number, number];
  cities: CityData[];
}

// ─── Locale Layer (from locales/{lang}.json) ─────────────────────────────────

/** Translated strings for a single city */
export interface CityLocale {
  city: string;
  country: string;
  venue: string;
  story: string;
  realFact: string;
}

/** Translated strings for an act */
export interface ActLocale {
  name: string;
  subtitle: string;
  description: string;
}

/** Translated strings for a tile type */
export interface TileTypeLocale {
  name: string;
  description: string;
}

/** Translated UI strings */
export interface TourUILocale {
  actTransition: string;
  actTransitionMessage: string; // uses {{actName}}
  stopsRemaining: string; // uses {{count}}
  progress: string;
  reachedFinish: string;
  landingTitle: string; // uses {{city}}
  landingVenue: string; // uses {{venue}}
  tileTypeLabel: string; // uses {{type}}
  factLabel: string;
  continueButton: string;
  viewRouteButton: string;
}

/** Full locale file shape */
export interface TourLocaleFile {
  tour: {
    gameName: string;
    gameSubtitle: string;
    acts: Record<ActId, ActLocale>;
    tileTypes: Record<TileType, TileTypeLocale>;
    cities: Record<string, CityLocale>;
    ui: TourUILocale;
  };
}

/** The generated route for a single game session */
export interface WorldTourRoute {
  id: string;
  tiles: BoardTile[]; // 22 tiles total
  generatedAt: string;
}

/** Player board state — add to Player interface in gameStoreTypes.ts */
export interface PlayerBoardState {
  boardPosition: number; // 0 = start, 21 = finish
  citiesVisited: string[]; // City IDs visited
  currentAct: ActId | 'start' | 'finish';
}

/** Event when a player lands on a tile */
export interface TileLandingEvent {
  tile: BoardTile;
  playerId: string;
  playerName: string;
  mechanicTrigger: MechanicTrigger | null;
  isActTransition: boolean;
  newAct?: ActId;
}

/** Resolved tile with translated strings — ready for UI rendering */
export interface ResolvedTile extends BoardTile {
  city: string;
  country: string;
  venue: string;
  story: string;
  realFact: string;
}
