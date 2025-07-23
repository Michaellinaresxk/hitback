import { Track } from './game.types';

export interface Card {
  id: string;
  qrCode: string;
  type: 'song' | 'artist' | 'decade' | 'lyrics' | 'challenge';
  track: Track;
  points: number;
  question: string;
  answer: string;
  challengeType?: 'sing' | 'dance' | 'imitate';
}
