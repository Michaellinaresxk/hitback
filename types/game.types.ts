// types/game.types.ts - HITBACK Game Types

// 🎯 Card Types
export type CardType = 'song' | 'artist' | 'decade' | 'lyrics' | 'challenge';

// 🎮 Difficulty Levels
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

// 🎵 Track
export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  decade?: string;
  genre?: string;
  difficulty?: Difficulty;
  previewUrl?: string;
  duration?: number;
  hasAudio?: boolean;
  hasQuestions?: boolean;
  availableCardTypes?: CardType[];
  questions?: Record<CardType, QuestionData>;
}

// ❓ Question Data
export interface QuestionData {
  question: string;
  answer: string;
  points: number;
  hints?: string[];
  challengeType?: 'dance' | 'sing' | 'imitate' | 'performance' | 'rap' | 'pose';
}

// 👤 Player
export interface Player {
  id: string;
  name: string;
  score: number;
  tokens: number;
  powerCards: PowerCard[];
  streak: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalBets: number;
  avatar?: string;
  color?: string;
  isActive: boolean;
}

// ⚡ Power Card
export interface PowerCard {
  id: string;
  type: PowerCardType;
  name: string;
  description: string;
  icon: string;
  usesRemaining: number;
  maxUses: number;
  isActive: boolean;
}

export type PowerCardType =
  | 'THIEF'
  | 'SHIELD'
  | 'BOOST'
  | 'REFRESH'
  | 'PEEK'
  | 'PRECISION';

// 🃏 Current Card in Game
export interface CurrentCard {
  qrCode: string;
  track: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    year?: number;
    genre?: string;
    decade?: string;
  };
  question: {
    type: CardType;
    text: string;
    answer: string;
    points: number;
    hints: string[];
    challengeType?: string;
  };
  audio: {
    hasAudio: boolean;
    url: string | null;
    source: 'deezer' | 'local' | null;
    duration: number;
    albumArt?: string;
  };
  scan: {
    points: number;
    difficulty: string;
    timestamp: string;
    filters?: {
      genre: string;
      decade: string;
      cardType: string;
    };
  };
  bets: PlayerBet[];
  revealed: boolean;
  winnerId?: string;
}

// 💰 Player Bet
export interface PlayerBet {
  playerId: string;
  playerName: string;
  tokens: number;
  timestamp: number;
  potentialPoints: number;
}

// 🎮 Game State
export interface GameState {
  id: string;
  status: GameStatus;
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  currentCard: CurrentCard | null;
  roundNumber: number;
  timeLeft: number;
  maxTime: number;
  winnerId: string | null;
  settings: GameSettings;
}

export type GameStatus = 'setup' | 'playing' | 'paused' | 'finished';

export type GamePhase =
  | 'idle'
  | 'scanning'
  | 'audio'
  | 'betting'
  | 'question'
  | 'answer'
  | 'results';

// ⚙️ Game Settings
export interface GameSettings {
  maxPlayers: number;
  minPlayers: number;
  initialTokens: number;
  initialPowerCards: number;
  pointsToWin: number;
  maxTime: number;
  bettingTime: number;
  audioPreviewDuration: number;
  allowPowerCards: boolean;
  allowBetting: boolean;
}

// 🏆 Game Result
export interface GameResult {
  winnerId: string;
  winnerName: string;
  finalScores: {
    playerId: string;
    playerName: string;
    score: number;
    tokens: number;
  }[];
  totalRounds: number;
  duration: number;
}

export interface Alliance {
  id: string;
  player1Id: string;
  player2Id: string;
  roundsLeft: number;
  createdAtRound: number;
}

export interface AllianceSlice {
  alliances: Alliance[];
  declareAlliance: (player1Id: string, player2Id: string) => void;
  dissolveAlliance: (allianceId: string) => void;
  decrementAllianceRounds: () => void;
  getPlayerAlliance: (playerId: string) => Alliance | null;
}

export interface BackendSlice {
  backendConnected: boolean;
  lastBackendCheck: string | null;
  checkBackendConnection: () => Promise<boolean>;
  syncWithBackend: () => Promise<void>;
}

// ─── PlayerSlice — acciones que viven en playerSlice.ts ───────────────────────
export interface PlayerSlice {
  /**
   * Alliance 50/50
   * Llama DESPUÉS de syncPlayersFromBackend.
   * Deduce 50% al ganador y lo da al partner.
   * Funciona en ambas direcciones (cualquiera de los dos puede responder).
   */
  awardAllianceBonus: (winnerId: string, pointsAwarded: number) => void;

  /**
   * Featuring 100/100
   * Llama DESPUÉS de awardAllianceBonus.
   * El partner recibe exactamente los mismos puntos que el ganador.
   * clearFeaturing() se llama desde game.tsx justo después.
   */
  applyFeaturingBonus: (partnerId: string, pointsAwarded: number) => void;

  /** Activa el freeze (❄️) de un jugador — su próximo turno será saltado */
  toggleFreezePlayer: (playerId: string) => void;
}

export type GameStore = GameState & BackendSlice & AllianceSlice & PlayerSlice;
