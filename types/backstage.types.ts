import type { ReactionCardType } from '@/constants/ReactionCard';

/** How the tour is played. Distinct from the legacy `gameMode`. */
export type PlayMode = 'physical' | 'digital';

/** A Streaming backstage card pending application, as stored by the backend. */
export interface BackstageCard {
  playerId: string;
  cardType: ReactionCardType;
  position: number;
  cityId: string;
}
