// gameFlow/utils.ts
import {
  GameFlow,
  BettingStatus,
  CorrectAnswerInfo,
  RewardInfo,
} from './types';

export const getBettingStatus = (flowState: GameFlow): BettingStatus => ({
  isActive: flowState.bettingPhase,
  timeLeft: flowState.bettingTimeLeft,
  canBet: flowState.bettingPhase && flowState.bettingTimeLeft > 0,
  urgentTime: flowState.bettingTimeLeft <= 10,
});

export const getCurrentPhase = (flowState: GameFlow) => flowState.phase;

export const isRoundActive = (flowState: GameFlow) =>
  flowState.currentRound !== null;

export const canStartNextRound = (flowState: GameFlow) =>
  flowState.phase === 'idle' ||
  flowState.phase === 'answer' ||
  flowState.answerRevealed;

export const getCorrectAnswer = (flowState: GameFlow): CorrectAnswerInfo => ({
  answer: flowState.correctAnswer,
  trackInfo: flowState.trackInfo,
});

export const getRewardData = (flowState: GameFlow): RewardInfo => ({
  show: flowState.showReward,
  data: flowState.rewardData,
});
