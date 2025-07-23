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
  cardTypes: {
    [key in CardType]: CardTypeData;
  };
}

export type CardType = 'song' | 'artist' | 'decade' | 'lyrics' | 'challenge';

export interface CardTypeData {
  question: string;
  answer: string;
  points: number;
  challengeType?: ChallengeType;
}

export type ChallengeType = 'sing' | 'dance' | 'imitate';

export interface Card {
  id: string;
  qrCode: string;
  type: CardType;
  track: Track;
  question: string;
  answer: string;
  points: number;
  challengeType?: ChallengeType;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isCurrentTurn: boolean;
}

export type GameMode = 'normal' | 'battle' | 'speed' | 'viral';

export interface GameState {
  id: string;
  players: Player[];
  currentTurn: number;
  gameMode: GameMode;
  timeLeft: number;
  isActive: boolean;
  round: number;
  currentCard: Card | null;
  isScanning: boolean;
  battlePlayers?: [string, string];
  speedRoundCards: Card[];
  speedRoundAnswers: SpeedRoundAnswer[];
}

export interface SpeedRoundAnswer {
  playerId: string;
  correct: number;
}

export interface BattleRound {
  player1: {
    id: string;
    cardType: CardType;
    hasAnswered: boolean;
    isCorrect: boolean;
  };
  player2: {
    id: string;
    cardType: CardType;
    hasAnswered: boolean;
    isCorrect: boolean;
  };
  track: Track;
}

export interface GameTimer {
  totalTime: number;
  currentTime: number;
  isRunning: boolean;
  onTimeUp: () => void;
}

export interface AudioPlayback {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  url: string | null;
}
