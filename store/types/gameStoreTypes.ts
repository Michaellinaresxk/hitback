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
  isFrozen: boolean; // ❄️ true = su próximo turno será saltado
  frozenForRound: number | null;
  artistHoldRoundsLeft: number;
  lossStreak: number;
  bSideActive: boolean;
}

export type Card = CurrentCard;

// ─────────────────────────────────────────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────────────────────────────────────────

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
  featuringPlayerId: string | null;
  featuringTargetId: string | null;
  backendConnected: boolean;
  lastBackendCheck: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME STORE
// ─────────────────────────────────────────────────────────────────────────────

export interface GameStore extends GameState {
  // ── Player slice ───────────────────────────────────────────────────────────
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  toggleFreezePlayer: (playerId: string) => void;
  applyRoyalties: (holderId: string) => void;
  updateLossStreaks: (winnerId: string | null) => string[];
  applyBSideBonus: (winnerId: string) => boolean;
  applyArtistHold: () => void;
  applyCopyrights: (playerId: string, points: number) => void;
  applySoldOut: (holderId: string) => void;
  applyBadReview: (targetId: string) => void;

  placeBet: (playerId: string, tokenValue: number) => void;
  clearBets: () => void;
  addPowerCard: (playerId: string, powerCard: any) => void;
  usePowerCard: (
    playerId: string,
    powerCardId: string,
    targetPlayerId?: string,
  ) => void;
  activateBoost: (playerId: string) => void;
  deactivateBoost: (playerId: string) => void;
  awardPoints: (playerId: string, points?: number, answerTime?: number) => void;

  /**
   * Alliance 50/50
   * Llama después de syncPlayersFromBackend.
   * Deducta 50% al ganador y se los da al partner.
   * Funciona en ambas direcciones (cualquiera de los dos puede responder).
   */
  awardAllianceBonus: (winnerId: string, pointsAwarded: number) => void;

  /**
   * Featuring 100/100
   * Llama después de awardAllianceBonus.
   * Da los mismos puntos que el ganador al partner del featuring.
   * El featuring se consume (uso único) — clearFeaturing() se llama desde game.tsx.
   */
  applyFeaturingBonus: (partnerId: string, pointsAwarded: number) => void;

  syncPlayersFromBackend: (
    backendPlayers: Array<{
      id: string;
      name: string;
      score: number;
      availableTokens: number[];
    }>,
  ) => void;

  // ── Game slice ────────────────────────────────────────────────────────────
  createNewGame: () => void;
  startGame: () => Promise<void>;
  setGameActive: (active: boolean) => void;
  endGame: () => Promise<void>;
  nextTurn: () => void;
  startTimer: (duration: number) => void;
  stopTimer: () => void;
  startBattleMode: (player1Id: string, player2Id: string) => void;
  startSpeedRound: () => void;
  startViralMoment: () => void;
  activateFeaturing: (portadorId: string, targetId: string) => void;
  clearFeaturing: () => void;

  // ── Card slice ────────────────────────────────────────────────────────────
  scanCard: (qrCode: string, gameCard?: Card) => Promise<void>;

  // ── UI slice ──────────────────────────────────────────────────────────────
  setAudioFinished: (finished: boolean) => void;
  setShowQuestion: (show: boolean) => void;
  setShowAnswer: (show: boolean) => void;
  setShowGameEndModal: (show: boolean) => void;
  setScanning: (scanning: boolean) => void;
  setError: (error: string | null) => void;

  // ── Backend slice ─────────────────────────────────────────────────────────
  checkBackendConnection: () => Promise<boolean>;
  syncWithBackend: () => Promise<void>;

  // ── Alliance slice ────────────────────────────────────────────────────────
  alliances: Alliance[];
  declareAlliance: (player1Id: string, player2Id: string) => void;
  dissolveAlliance: (allianceId: string) => void;
  decrementAllianceRounds: () => void;
  getPlayerAlliance: (playerId: string) => Alliance | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALLIANCE
// ─────────────────────────────────────────────────────────────────────────────

export interface Alliance {
  id: string;
  player1Id: string;
  player2Id: string;
  roundsLeft: number;
  createdAtRound: number;
}
