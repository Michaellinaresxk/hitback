import { Dimensions } from 'react-native';

export type ReactionCardType =
  | 'FREEZE'
  | 'DUEL'
  | 'STOP_BLAST'
  | 'FEATURING'
  | 'ALLIANCE'
  | 'COPYRIGHTS'
  | 'BLOCK'
  | 'OVERDRIVE';

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
    type: 'FREEZE',
    emoji: '❄️',
    label: 'FREEZE',
    description: 'Salta su próxima ronda',
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
    type: 'COPYRIGHTS',
    emoji: '📜',
    label: 'COPYRIGHTS',
    description: 'Roba 1pt al líder',
    color: '#F59E0B',
  },
  {
    type: 'BLOCK',
    emoji: '🚫',
    label: 'BLOCK',
    description: 'Congela al líder 2 rondas',
    color: '#6366F1',
  },
  {
    type: 'OVERDRIVE',
    emoji: '⚡',
    label: 'OVERDRIVE',
    description: 'Próximas 3 respuestas ×1.5',
    color: '#10B981',
  },
];

export const { width } = Dimensions.get('window');

export const CARD_WIDTH = (width - 48 - 10) / 2; // 16px padding × 2 + 10px gap
