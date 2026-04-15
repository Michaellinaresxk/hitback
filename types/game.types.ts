// types/game.types.ts - HITBACK Game Types

export type CardType = 'song' | 'artist' | 'decade' | 'lyrics' | 'challenge';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

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

export interface QuestionData {
  question: string;
  answer: string;
  points: number;
  hints?: string[];
  challengeType?: 'dance' | 'sing' | 'imitate' | 'performance' | 'rap' | 'pose';
}

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

export interface PowerCard {
  id: string;
  type: PowerCardType;
  name: string;
  description: string;
  emoji: string;
  currentUses: number;
  usageLimit: number;
  isActive: boolean;
}

// Valores en minúsculas — coinciden con el campo `type` del backend (powerCards.json)
export type PowerCardType =
  | 'replay'
  | 'festival'
  | 'double_platinum'
  | 'label_fee';

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

export interface PlayerBet {
  playerId: string;
  playerName: string;
  tokens: number;
  timestamp: number;
  potentialPoints: number;
}

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

export interface PlayerSlice {
  awardAllianceBonus: (winnerId: string, pointsAwarded: number) => void;
  applyFeaturingBonus: (partnerId: string, pointsAwarded: number) => void;
  toggleFreezePlayer: (playerId: string) => void;
  applyRoyalties: (holderId: string) => void;

  /**
   * Actualiza lossStreak al final de cada ronda.
   * - winnerId: el jugador que ganó → su streak se resetea a 0 y bSideActive a false
   * - null (nadie ganó) → todos suman +1 al streak
   * Cuando un jugador alcanza exactamente 3, se activa bSideActive = true.
   * Retorna los IDs de jugadores que recién activaron B-SIDE (para la notificación).
   */
  updateLossStreaks: (winnerId: string | null) => string[];

  /**
   * Aplica el +1 comeback bonus al ganador si tenía bSideActive.
   * Llama DESPUÉS de syncPlayersFromBackend y alliance/featuring bonuses.
   * Limpia bSideActive y resetea lossStreak.
   */
  applyBSideBonus: (winnerId: string) => boolean;

  /**
   * COPYRIGHTS — roba el 50% de los últimos puntos ganados por un jugador.
   * points: los puntos que ganó en la última ronda (capturados en lastAwardedPointsRef).
   */
  applyCopyrights: (playerId: string, points: number) => void;
}

export type GameStore = GameState & BackendSlice & AllianceSlice & PlayerSlice;
