export interface Player {
  id: string;
  name: string;
  score: number;
  tokens: number;
  powerCards: PowerCard[];
  isCurrentTurn: boolean;
  activePowers: ActivePower[];
  // Betting system
  currentBet: number;
  isImmune: boolean; // Shield power
  boostActive: boolean; // Boost power
  peekUsed: boolean; // Peek power
}

export interface PowerCard {
  id: string;
  type: PowerType;
  name: string;
  description: string;
  emoji: string;
  usageLimit: number;
  currentUses: number;
}

export type PowerType =
  | 'robo' // 🥷 Steal 1 token from another player
  | 'escudo' // 🛡️ Immune to theft for 2 rounds
  | 'boost' // ⚡ Next answer worth double points
  | 'refresh' // 🔄 Recover 1 lost token
  | 'peek' // 👁️ See answer 3 seconds early
  | 'precision'; // 🎯 +2 extra points for exact year

export interface ActivePower {
  type: PowerType;
  turnsLeft: number;
  playerId: string;
}

export interface Track {
  id: string;
  qrCode: string;
  title: string;
  artist: string;
  year: number;
  decade: string;
  genre: string;
  previewUrl: string;
  duration: number;
  lyrics: string;
  difficulty: Difficulty;
  cardTypes: {
    song: CardTypeDetails;
    artist: CardTypeDetails;
    decade: CardTypeDetails;
    lyrics: CardTypeDetails;
    challenge: ChallengeCardDetails;
  };
}

export interface CardTypeDetails {
  question: string;
  answer: string;
  points: number;
}

export interface ChallengeCardDetails extends CardTypeDetails {
  challengeType: 'dance' | 'sing' | 'imitate' | 'performance';
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface GameCard {
  track: Track;
  cardType: keyof Track['cardTypes'];
  points: number;
  question: string;
  answer: string;
  difficulty: Difficulty;
}

export interface BettingRound {
  playerId: string;
  betAmount: number;
  card: GameCard;
  multiplier: number;
}

export interface GamePot {
  tokens: number;
  powerCards: PowerCard[];
  contributors: string[]; // Player IDs who contributed
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  conditions: ComboCondition[];
  reward: ComboReward;
  emoji: string;
}

export interface ComboCondition {
  type:
    | 'consecutive_wins'
    | 'card_type_streak'
    | 'difficulty_streak'
    | 'time_bonus';
  value: number;
  cardType?: keyof Track['cardTypes'];
  difficulty?: Difficulty;
}

export interface ComboReward {
  type: 'tokens' | 'points' | 'power_card' | 'multiplier';
  amount: number;
  powerCardType?: PowerType;
}

export interface GameMode {
  type: 'normal' | 'battle' | 'speed' | 'viral';
  settings?: {
    timeLimit?: number;
    playerCount?: number;
    cardCount?: number;
  };
}

export interface GameStats {
  totalGames: number;
  totalWins: Record<string, number>;
  averageGameTime: number;
  favoriteCardType: Record<string, keyof Track['cardTypes']>;
  highestStreak: Record<string, number>;
  combosAchieved: Record<string, string[]>;
}

export interface AudioPlayback {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  url: string | null;
}
