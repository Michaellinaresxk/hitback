import { CurrentCard } from '@/types/game.types';

export interface Player {
  id: string;
  name: string;
  score: number;
  isCurrentTurn: boolean;
  availableTokens: number[];
  powerCards: any[];
  currentBet: number;
  isImmune: boolean;
  boostActive: boolean;
  peekUsed: boolean;
  consecutiveWins: number;
  cardTypeStreaks: Record<string, number>;
  difficultyStreaks: Record<string, number>;
}

export type Card = CurrentCard;

export interface GameState {
  id: string;
  players: Player[];
  currentTurn: number;
  gameMode: 'normal' | 'battle' | 'speed' | 'viral';
  timeLeft: number;
  isActive: boolean;
  round: number;
  currentCard: Card | null;
  isScanning: boolean;
  error: string | null;
  timerInterval: NodeJS.Timeout | null;
  gamePot: { tokens: number; powerCards: any[] };
  viralMomentActive: boolean;
  speedRoundCards: Card[];
  speedRoundAnswers: Record<string, number>;
  battleRound: any;
  currentSpeedRoundIndex: number;
  speedRoundTimeLeft: number;
  audioFinished: boolean;
  showQuestion: boolean;
  showAnswer: boolean;
  showGameEndModal: boolean;
  battleModeActive: boolean;
  speedRoundActive: boolean;
  selectedBattlePlayers: { player1Id: string; player2Id: string } | null;
  backendConnected: boolean;
  lastBackendCheck: string | null;
}

export interface BackendSlice {
  backendConnected: boolean;
  lastBackendCheck: string | null;
  checkBackendConnection: () => Promise<boolean>;
  syncWithBackend: () => Promise<void>;
}
