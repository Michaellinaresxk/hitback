// gameFlow/state.ts
import { BETTING_TIME_LIMIT } from '@/constants/Betting';
import { GameFlow } from './types';

export const initialState: GameFlow = {
  phase: 'idle',
  isLoading: false,
  currentRound: null,
  audioPlaying: false,
  audioUrl: null,
  bettingPhase: false,
  bettingTimeLeft: BETTING_TIME_LIMIT,
  questionVisible: false,
  answerRevealed: false,
  roundResult: null,
  correctAnswer: null,
  trackInfo: null,
  currentError: null,
  gameOver: false,
  gameWinner: null,
  showReward: false,
  rewardData: null,
  gameMasterAnswer: null,
  hasPlacedBet: false, // ✅ INICIALIZAR
  showBettingButton: false,
};

export const getResetState = (): Partial<GameFlow> => ({
  phase: 'idle',
  currentRound: null,
  audioPlaying: false,
  audioUrl: null,
  bettingPhase: false,
  bettingTimeLeft: BETTING_TIME_LIMIT,
  questionVisible: false,
  answerRevealed: false,
  roundResult: null,
  correctAnswer: null,
  trackInfo: null,
  currentError: null,
  showReward: false,
  rewardData: null,
});

export const getLoadingState = (): Partial<GameFlow> => ({
  phase: 'loading',
  isLoading: true,
  currentError: null,
  currentRound: null,
  audioPlaying: false,
  audioUrl: null,
  questionVisible: false,
  answerRevealed: false,
  roundResult: null,
  correctAnswer: null,
  trackInfo: null,
  bettingPhase: false,
  bettingTimeLeft: BETTING_TIME_LIMIT,
  showReward: false,
  rewardData: null,
});

export const getAudioState = (
  round: any,
  gameMasterData: any
): Partial<GameFlow> => ({
  phase: 'audio',
  isLoading: false,
  currentRound: round,
  gameMasterAnswer: gameMasterData,
  audioPlaying: !!round?.track?.audioUrl,
  audioUrl: round?.track?.audioUrl || null,
});

export const getPreRoundState = (): Partial<GameFlow> => ({
  phase: 'pre-round',
  bettingPhase: true,
  showBettingButton: true, // ✅ NUEVO
});

export const getBettingState = (): Partial<GameFlow> => ({
  phase: 'betting',
  audioPlaying: false,
  bettingPhase: true,
  bettingTimeLeft: BETTING_TIME_LIMIT,
  questionVisible: true,
});

export const getAnswerState = (
  roundResult: any,
  showReward: boolean = false,
  rewardData: any = null
): Partial<GameFlow> => ({
  phase: 'answer',
  answerRevealed: true,
  roundResult,
  correctAnswer: roundResult?.correctAnswer,
  trackInfo: roundResult?.trackInfo,
  gameOver: roundResult?.gameOver || false,
  gameWinner: roundResult?.gameWinner || null,
  showReward,
  rewardData,
});
