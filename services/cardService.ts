import { Track, Card, CardType, CardTypeData } from '@/types/game.types';
import tracksData from '@/data/tracks.json';

class CardService {
  private tracks: Track[] = [];

  constructor() {
    this.initializeTracks();
  }

  private initializeTracks() {
    this.tracks = tracksData as Track[];
  }

  // Get card by QR code scan
  async getCardByQR(qrCode: string): Promise<Card | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const track = this.tracks.find((track) => track.qrCode === qrCode);
    if (!track) {
      return null;
    }

    // Generate random card type for this scan
    const cardType = this.getRandomCardType();
    return this.createCard(track, cardType);
  }

  // Get card by track ID and specific type
  getCardByTrackAndType(trackId: string, cardType: CardType): Card | null {
    const track = this.tracks.find((t) => t.id === trackId);
    if (!track) return null;

    return this.createCard(track, cardType);
  }

  // Get random card for speed rounds
  getRandomCard(): Card {
    const randomTrack =
      this.tracks[Math.floor(Math.random() * this.tracks.length)];
    const randomCardType = this.getRandomCardType();
    return this.createCard(randomTrack, randomCardType);
  }

  // Get all available tracks
  getAllTracks(): Track[] {
    return [...this.tracks];
  }

  // Search tracks by title, artist, or genre
  searchTracks(query: string): Track[] {
    const lowercaseQuery = query.toLowerCase();
    return this.tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(lowercaseQuery) ||
        track.artist.toLowerCase().includes(lowercaseQuery) ||
        track.genre.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get tracks by decade
  getTracksByDecade(decade: string): Track[] {
    return this.tracks.filter((track) => track.decade === decade);
  }

  // Get tracks by genre
  getTracksByGenre(genre: string): Track[] {
    return this.tracks.filter((track) => track.genre === genre);
  }

  // Create multiple cards for battle mode (same track, different questions)
  createBattleCards(trackId: string): [Card, Card] | null {
    const track = this.tracks.find((t) => t.id === trackId);
    if (!track) return null;

    const cardTypes = this.getTwoRandomCardTypes();
    return [
      this.createCard(track, cardTypes[0]),
      this.createCard(track, cardTypes[1]),
    ];
  }

  // Generate cards for speed round (5 different tracks)
  generateSpeedRoundCards(): Card[] {
    const shuffledTracks = [...this.tracks].sort(() => Math.random() - 0.5);
    const selectedTracks = shuffledTracks.slice(0, 5);

    return selectedTracks.map((track) => {
      const cardType = this.getRandomCardType();
      return this.createCard(track, cardType);
    });
  }

  // Validate QR code format
  isValidQRCode(qrCode: string): boolean {
    return qrCode.startsWith('HITBACK_') && qrCode.length > 8;
  }

  // Private helper methods
  private createCard(track: Track, cardType: CardType): Card {
    const cardTypeData = track.cardTypes[cardType];

    return {
      id: `${track.id}_${cardType}`,
      qrCode: track.qrCode,
      type: cardType,
      track,
      question: cardTypeData.question,
      answer: cardTypeData.answer,
      points: cardTypeData.points,
      challengeType: cardTypeData.challengeType,
    };
  }

  private getRandomCardType(): CardType {
    const cardTypes: CardType[] = [
      'song',
      'artist',
      'decade',
      'lyrics',
      'challenge',
    ];
    const weights = [25, 25, 20, 20, 10]; // Different probabilities

    const random = Math.random() * 100;
    let cumulativeWeight = 0;

    for (let i = 0; i < cardTypes.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return cardTypes[i];
      }
    }

    return 'song'; // fallback
  }

  private getTwoRandomCardTypes(): [CardType, CardType] {
    const cardTypes: CardType[] = ['song', 'artist', 'decade', 'lyrics'];
    const shuffled = [...cardTypes].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  // Get statistics
  getStats() {
    return {
      totalTracks: this.tracks.length,
      genres: [...new Set(this.tracks.map((t) => t.genre))],
      decades: [...new Set(this.tracks.map((t) => t.decade))],
      artists: [...new Set(this.tracks.map((t) => t.artist))],
    };
  }
}

export const cardService = new CardService();
