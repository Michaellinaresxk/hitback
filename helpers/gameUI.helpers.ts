import type { Combo, Difficulty } from '@/types/game.types';

export const DIFFICULTY_VISUAL_CONFIG = {
  easy: { emoji: '🌟', color: '#27AE60' },
  medium: { emoji: '💫', color: '#F39C12' },
  hard: { emoji: '🔥', color: '#E74C3C' },
  expert: { emoji: '👑', color: '#9B59B6' },
};

export const getComboDescription = (combo: Combo, t: (key: string) => string) => {
  switch (combo.reward.type) {
    case 'tokens':
      return `+${combo.reward.amount} ${t('rewards.token_unit_plural')}`;
    case 'points':
      return `+${combo.reward.amount} puntos`;
    case 'power_card':
      return t('rewards.extra_power_card');
    case 'multiplier':
      return `${combo.reward.amount}x ${t('rewards.next_round')}`;
    default:
      return '';
  }
};
