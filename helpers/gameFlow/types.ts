// gameFlow/types.ts
import { CurrentRound, RoundResult } from '@/services/GameSessionService';

export type GamePhase =
  | 'idle'
  | 'loading'
  | 'audio'
  | 'betting'
  | 'question'
  | 'answer';

export interface RewardData {
  type: 'tokens' | 'powerCard' | 'combo' | 'achievement';
  amount?: number;
  name?: string;
  description?: string;
  icon?: string;
}

export interface GameFlow {
  // Fases del juego
  phase: GamePhase;
  isLoading: boolean;

  // Ronda actual
  currentRound: CurrentRound | null;

  // Audio
  audioPlaying: boolean;
  audioUrl: string | null;

  // Betting
  bettingPhase: boolean;
  bettingTimeLeft: number;

  // Pregunta y respuesta
  questionVisible: boolean;
  answerRevealed: boolean;
  roundResult: RoundResult | null;

  // Respuesta correcta para mostrar en modal
  correctAnswer: string | null;
  trackInfo: { title: string; artist: string } | null;

  // Errores
  currentError: string | null;

  // Game over
  gameOver: boolean;
  gameWinner: { id: string; name: string; score: number } | null;

  // Rewards
  showReward: boolean;
  rewardData: RewardData | null;

  gameMasterAnswer: {
    correctAnswer: string;
    trackTitle: string;
    trackArtist: string;
  } | null;

  hasPlacedBet?: boolean; // ✅ AGREGAR esta propiedad
  showBettingButton?: boolean;
}

export interface BettingStatus {
  isActive: boolean;
  timeLeft: number;
  canBet: boolean;
  urgentTime: boolean;
}

export interface CorrectAnswerInfo {
  answer: string | null;
  trackInfo: { title: string; artist: string } | null;
}

export interface RewardInfo {
  show: boolean;
  data: RewardData | null;
}

export interface PlayerSyncData {
  id: string;
  name: string;
  score: number;
  tokens: number;
}
