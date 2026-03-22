import { Dimensions } from 'react-native';

export type ReactionCardType =
  | 'MUTE'
  | 'DUEL'
  | 'STOP_BLAST'
  | 'FEATURING'
  | 'ALLIANCE'
  | 'COPYRIGHTS'
  | 'BLOCK'
  | 'CHARITY_SHOW'
  | 'ROYALTIES'
  | 'ARTIST_HOLD'
  | 'SOLD_OUT'
  | 'BAD_REVIEW'
  | 'MANAGEMENT_FEE';

export interface ReactionCardDef {
  type: ReactionCardType;
  emoji: string;
  label: string;
  description: string;
  color: string;
}

export interface ReactionCardPickerModalProps {
  visible: boolean;
  targetPlayer: { id: string; name: string; score: number } | null;
  /** Cards to disable (already active or not applicable) */
  disabledCards?: Partial<Record<ReactionCardType, string>>; // type → reason
  onSelect: (cardType: ReactionCardType, playerId: string) => void;
  onClose: () => void;
}

export const REACTION_CARDS: ReactionCardDef[] = [
  {
    type: 'MUTE',
    emoji: '❄️',
    label: 'MUTE',
    description: 'Pausa al jugador por 1 ronda',
    color: '#64748B',
  },

  {
    type: 'DUEL',
    emoji: '⚔️',
    label: 'DUEL',
    description: 'Head-to-head, 1 vs 1',
    color: '#F97316',
  },
  {
    type: 'STOP_BLAST',
    emoji: '🛑',
    label: 'STOP-BLAST',
    description: 'Solo él puede ganar esta ronda',
    color: '#EF4444',
  },
  {
    type: 'FEATURING',
    emoji: '🎤',
    label: 'FEATURING',
    description: 'Ambos reciben 100% de los puntos',
    color: '#A855F7',
  },
  {
    type: 'ALLIANCE',
    emoji: '🤝',
    label: 'ALLIANCE',
    description: 'Comparten 50/50 por 3 rondas',
    color: '#3B82F6',
  },
  {
    type: 'ROYALTIES',
    emoji: '📜',
    label: 'ROYALTIES',
    description: 'Roba 1pt al líder',
    color: '#F59E0B',
  },
  {
    type: 'COPYRIGHTS',
    emoji: '©️',
    label: 'COPYRIGHTS',
    description: 'Pierde 50% de sus últimos puntos',
    color: '#F59E0B',
  },
  {
    type: 'ARTIST_HOLD',
    emoji: '🚫',
    label: 'ARTIST HOLD',
    description: 'Congela al líder 2 rondas',
    color: '#64748B',
  },
  {
    type: 'CHARITY_SHOW',
    emoji: '🎸',
    label: 'CHARITY SHOW',
    description: 'El líder le regala 1 pt al último',
    color: '#10B981',
  },
  {
    type: 'SOLD_OUT',
    emoji: '🎟️',
    label: 'SOLD OUT',
    description: '+1 punto extra para ti',
    color: '#22C55E',
  },
  {
    type: 'BAD_REVIEW',
    emoji: '💔',
    label: 'BAD REVIEW',
    description: 'El jugador pierde 1 pt',
    color: '#F43F5E',
  },
  {
    type: 'MANAGEMENT_FEE',
    emoji: '🤵',
    label: 'MANAGEMENT FEE',
    description: 'Tu manager cobra su corte — pierdes 1 pt',
    color: '#6366F1',
  },
];

export const { width } = Dimensions.get('window');

export const CARD_WIDTH = (width - 48 - 10) / 2; // 16px padding × 2 + 10px gap
