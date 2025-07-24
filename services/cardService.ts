import { Track, GameCard, Difficulty, PowerCard } from '@/types/game.types';
import tracksData from '@/data/tracks.json';
import powerCards from '@/data/powerCards.json';

class CardService {
  private tracks: Track[] = tracksData;
  private difficultyWeights = {
    easy: 0.4,
    medium: 0.3,
    hard: 0.2,
    expert: 0.1,
  };

  // Get card by QR code
  async getCardByQR(qrCode: string): Promise<GameCard | null> {
    try {
      const track = this.tracks.find((t) => t.qrCode === qrCode);
      if (!track) return null;

      // Determine card type and difficulty based on QR pattern
      const cardInfo = this.parseQRCode(qrCode);
      const cardType = cardInfo.type;
      const difficulty = cardInfo.difficulty;

      const cardTypeData = track.cardTypes[cardType];
      if (!cardTypeData) return null;

      return {
        track,
        cardType,
        points: this.calculatePoints(cardType, difficulty),
        question: cardTypeData.question,
        answer: cardTypeData.answer,
        difficulty,
      };
    } catch (error) {
      console.error('Error getting card by QR:', error);
      return null;
    }
  }

  // Parse QR code to extract card type and difficulty
  private parseQRCode(qrCode: string): {
    type: keyof Track['cardTypes'];
    difficulty: Difficulty;
  } {
    // QR Format: HITBACK_XXX_TYPE_DIFFICULTY
    // Examples:
    // HITBACK_001_SONG_EASY
    // HITBACK_002_ARTIST_HARD
    // HITBACK_003_DECADE_EXPERT

    const parts = qrCode.split('_');

    let type: keyof Track['cardTypes'] = 'song'; // default
    let difficulty: Difficulty = 'medium'; // default

    if (parts.length >= 4) {
      const typeStr = parts[2].toLowerCase();
      const diffStr = parts[3].toLowerCase();

      // Map card types
      switch (typeStr) {
        case 'song':
          type = 'song';
          break;
        case 'artist':
          type = 'artist';
          break;
        case 'decade':
          type = 'decade';
          break;
        case 'lyrics':
          type = 'lyrics';
          break;
        case 'challenge':
          type = 'challenge';
          break;
        default:
          type = 'song';
      }

      // Map difficulties
      switch (diffStr) {
        case 'easy':
          difficulty = 'easy';
          break;
        case 'medium':
          difficulty = 'medium';
          break;
        case 'hard':
          difficulty = 'hard';
          break;
        case 'expert':
          difficulty = 'expert';
          break;
        default:
          difficulty = 'medium';
      }
    } else {
      // Fallback: Determine by card emoji/color pattern
      type = this.getCardTypeByPattern(qrCode);
      difficulty = this.getDifficultyByPattern(qrCode);
    }

    return { type, difficulty };
  }

  // Calculate points based on card type and difficulty
  private calculatePoints(
    cardType: keyof Track['cardTypes'],
    difficulty: Difficulty
  ): number {
    const basePoints = {
      song: 1,
      artist: 2,
      decade: 3,
      lyrics: 3,
      challenge: 5,
    };

    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3,
    };

    return Math.round(basePoints[cardType] * difficultyMultiplier[difficulty]);
  }

  // Get card type by QR pattern (fallback method)
  private getCardTypeByPattern(qrCode: string): keyof Track['cardTypes'] {
    const num = parseInt(qrCode.replace(/\D/g, ''));
    const types: Array<keyof Track['cardTypes']> = [
      'song',
      'artist',
      'decade',
      'lyrics',
      'challenge',
    ];
    return types[num % types.length];
  }

  // Get difficulty by pattern (fallback method)
  private getDifficultyByPattern(qrCode: string): Difficulty {
    const num = parseInt(qrCode.replace(/\D/g, ''));
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
    return difficulties[num % difficulties.length];
  }

  // Check if player should receive reward based on difficulty
  shouldReceiveReward(difficulty: Difficulty): {
    powerCard: boolean;
    bonusTokens: number;
  } {
    const thresholds = {
      easy: { powerCardChance: 0.1, bonusTokenChance: 0.2 },
      medium: { powerCardChance: 0.2, bonusTokenChance: 0.3 },
      hard: { powerCardChance: 0.4, bonusTokenChance: 0.5 },
      expert: { powerCardChance: 0.6, bonusTokenChance: 0.7 },
    };

    const threshold = thresholds[difficulty];
    const powerCard = Math.random() < threshold.powerCardChance;
    const bonusTokens =
      Math.random() < threshold.bonusTokenChance
        ? this.getBonusTokensByDifficulty(difficulty)
        : 0;

    return { powerCard, bonusTokens };
  }

  private getBonusTokensByDifficulty(difficulty: Difficulty): number {
    switch (difficulty) {
      case 'easy':
        return 1;
      case 'medium':
        return 1;
      case 'hard':
        return 2;
      case 'expert':
        return 3;
      default:
        return 0;
    }
  }

  // Get random power card for rewards
  getRandomPowerCard(): PowerCard {
    const availableCards = powerCards.powerCards;
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards[randomIndex];

    return {
      ...card,
      id: `${card.id}_${Date.now()}_${Math.random()}`,
      currentUses: 0,
    };
  }

  // Generate QR codes for physical cards
  generateQRCode(
    trackId: string,
    cardType: keyof Track['cardTypes'],
    difficulty: Difficulty
  ): string {
    const paddedId = trackId.padStart(3, '0');
    return `HITBACK_${paddedId}_${cardType.toUpperCase()}_${difficulty.toUpperCase()}`;
  }

  // Get all tracks for card generation
  getAllTracks(): Track[] {
    return this.tracks;
  }

  // Get track by ID
  getTrackById(id: string): Track | null {
    return this.tracks.find((t) => t.id === id) || null;
  }

  // Validate QR code format
  isValidQRCode(qrCode: string): boolean {
    const qrPattern = /^HITBACK_\d{3}(_[A-Z]+_[A-Z]+)?$/;
    return qrPattern.test(qrCode);
  }

  // Get card type emoji for UI
  getCardTypeEmoji(cardType: keyof Track['cardTypes']): string {
    const emojis = {
      song: '🎵',
      artist: '🎤',
      decade: '📅',
      lyrics: '📝',
      challenge: '🔥',
    };
    return emojis[cardType];
  }

  // Get difficulty color for UI
  getDifficultyColor(difficulty: Difficulty): string {
    const colors = {
      easy: '#27AE60',
      medium: '#F39C12',
      hard: '#E74C3C',
      expert: '#9B59B6',
    };
    return colors[difficulty];
  }

  // Generate cards for printing (physical cards)
  generateCardsForPrinting(): Array<{
    qrCode: string;
    track: Track;
    cardType: keyof Track['cardTypes'];
    difficulty: Difficulty;
    emoji: string;
    color: string;
    points: number;
  }> {
    const cards: any[] = [];

    this.tracks.forEach((track) => {
      const cardTypes: Array<keyof Track['cardTypes']> = [
        'song',
        'artist',
        'decade',
        'lyrics',
        'challenge',
      ];
      const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

      cardTypes.forEach((cardType) => {
        difficulties.forEach((difficulty) => {
          // Generate more easy/medium cards, fewer expert cards
          const shouldGenerate =
            Math.random() < this.difficultyWeights[difficulty];

          if (shouldGenerate) {
            const qrCode = this.generateQRCode(track.id, cardType, difficulty);
            cards.push({
              qrCode,
              track,
              cardType,
              difficulty,
              emoji: this.getCardTypeEmoji(cardType),
              color: this.getDifficultyColor(difficulty),
              points: this.calculatePoints(cardType, difficulty),
            });
          }
        });
      });
    });

    return cards;
  }

  // Search tracks by query (for admin/testing)
  searchTracks(query: string): Track[] {
    const searchTerm = query.toLowerCase();
    return this.tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(searchTerm) ||
        track.artist.toLowerCase().includes(searchTerm) ||
        track.genre.toLowerCase().includes(searchTerm)
    );
  }
}

export const cardService = new CardService();
