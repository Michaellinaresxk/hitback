import { audioService } from './audioService';

// 🎮 Game Card Interface - Aligned with Backend Response
interface GameCard {
  // QR and scan info
  qrCode: string;
  trackId: string;
  cardType: 'song' | 'artist' | 'decade' | 'lyrics' | 'challenge';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;

  // Question data
  question: string;
  answer: string;
  challengeType?: string | null;
  hints: string[];

  // Track info
  track: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    year: number;
    genre: string;
    decade: string;
  };

  // Audio info
  audio: {
    url: string | null;
    hasAudio: boolean;
    duration: number; // in seconds
    source: 'local' | 'none';
  };

  // Metadata
  timestamp: string;
}

/**
 * 🎵 Card Service - Backend-First Architecture
 *
 * Simplified service that works directly with the backend
 * through audioService, providing a clean interface for the game logic.
 */
class CardService {
  /**
   * 🔍 Get card by QR code - Main method for the game
   * This is the primary method your game components should use
   */
  async getCardByQR(qrCode: string): Promise<GameCard | null> {
    try {
      console.log(`🔍 CardService: Processing QR: ${qrCode}`);

      // Validate QR format before making backend call
      if (!this.isValidQRFormat(qrCode)) {
        console.error(`❌ Invalid QR format: ${qrCode}`);
        return null;
      }

      // Get data from backend via audioService
      const backendResponse = await audioService.scanQRAndPlay(qrCode);

      if (!backendResponse.success) {
        console.error('❌ Backend returned error:', backendResponse.error);
        return null;
      }

      // Transform backend response to GameCard format
      const gameCard = this.transformBackendResponse(backendResponse.data);

      console.log('✅ CardService: Game card created:', gameCard);
      return gameCard;
    } catch (error) {
      console.error('❌ CardService: Failed to get card:', error);
      return null;
    }
  }

  /**
   * 🔄 Transform backend response to consistent GameCard format
   */
  private transformBackendResponse(data: any): GameCard {
    return {
      // QR and scan info
      qrCode: data.qrCode,
      trackId: data.scan.trackId,
      cardType: data.scan.cardType,
      difficulty: data.scan.difficulty,
      points: data.scan.points,

      // Question data
      question: data.question.text,
      answer: data.question.answer,
      challengeType: data.question.challengeType,
      hints: data.question.hints || [],

      // Track info
      track: {
        id: data.track.id,
        title: data.track.title,
        artist: data.track.artist,
        album: data.track.album || '',
        year: data.track.year,
        genre: data.track.genre,
        decade: data.track.decade,
      },

      // Audio info
      audio: {
        url: data.audio.url,
        hasAudio: data.audio.hasAudio,
        duration: data.audio.duration, // Already in seconds from backend
        source: data.audio.source as 'local' | 'none',
      },

      // Metadata
      timestamp: data.game.timestamp,
    };
  }

  /**
   * 🔍 Validate QR code format locally (quick check)
   */
  isValidQRFormat(qrCode: string): boolean {
    try {
      // Format: HITBACK_ID_TYPE_DIFFICULTY
      if (!qrCode.startsWith('HITBACK_')) {
        return false;
      }

      const parts = qrCode.split('_');
      if (parts.length !== 4) {
        return false;
      }

      const [prefix, trackId, cardType, difficulty] = parts;

      // Validate parts
      if (prefix !== 'HITBACK') return false;
      if (!/^\d{3}$/.test(trackId)) return false; // 3-digit track ID
      if (!this.isValidCardType(cardType.toLowerCase())) return false;
      if (!this.isValidDifficulty(difficulty.toLowerCase())) return false;

      return true;
    } catch (error) {
      console.error('Error validating QR format:', error);
      return false;
    }
  }

  /**
   * 🔍 Validate QR code with backend (comprehensive check)
   */
  async validateQRCode(qrCode: string): Promise<boolean> {
    try {
      // Quick local check first
      if (!this.isValidQRFormat(qrCode)) {
        return false;
      }

      // Backend validation
      return await audioService.validateQRCode(qrCode);
    } catch (error) {
      console.error('Error validating QR code:', error);
      return false;
    }
  }

  /**
   * 🎯 Parse QR code components
   */
  parseQRCode(qrCode: string): {
    trackId: string;
    cardType: string;
    difficulty: string;
  } | null {
    try {
      if (!this.isValidQRFormat(qrCode)) {
        return null;
      }

      const parts = qrCode.split('_');
      return {
        trackId: parts[1],
        cardType: parts[2].toLowerCase(),
        difficulty: parts[3].toLowerCase(),
      };
    } catch (error) {
      console.error('Error parsing QR code:', error);
      return null;
    }
  }

  /**
   * 🎯 Generate QR code (for testing purposes)
   */
  generateQRCode(
    trackId: string,
    cardType: string,
    difficulty: string
  ): string {
    const paddedId = trackId.padStart(3, '0');
    return `HITBACK_${paddedId}_${cardType.toUpperCase()}_${difficulty.toUpperCase()}`;
  }

  /**
   * 📊 Calculate points based on card type and difficulty
   * (Should match backend calculation)
   */
  calculatePoints(cardType: string, difficulty: string): number {
    const basePoints: Record<string, number> = {
      song: 1,
      artist: 2,
      decade: 3,
      lyrics: 3,
      challenge: 5,
    };

    const difficultyMultiplier: Record<string, number> = {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3,
    };

    return Math.round(
      (basePoints[cardType] || 1) * (difficultyMultiplier[difficulty] || 1)
    );
  }

  /**
   * 📅 Calculate decade from year
   */
  calculateDecade(year: number): string {
    if (!year || isNaN(year)) return 'Unknown';
    const decade = Math.floor(year / 10) * 10;
    return `${decade}s`;
  }

  /**
   * 🔍 Valid card types (must match backend)
   */
  private isValidCardType(cardType: string): boolean {
    const validTypes = ['song', 'artist', 'decade', 'lyrics', 'challenge'];
    return validTypes.includes(cardType);
  }

  /**
   * 🔍 Valid difficulties (must match backend)
   */
  private isValidDifficulty(difficulty: string): boolean {
    const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
    return validDifficulties.includes(difficulty);
  }

  /**
   * 🎨 Get card type emoji for UI
   */
  getCardTypeEmoji(cardType: string): string {
    const emojis: Record<string, string> = {
      song: '🎵',
      artist: '🎤',
      decade: '📅',
      lyrics: '📝',
      challenge: '🔥',
    };
    return emojis[cardType] || '🎵';
  }

  /**
   * 🎨 Get card type color for UI
   */
  getCardTypeColor(cardType: string): string {
    const colors: Record<string, string> = {
      song: '#F59E0B', // Yellow
      artist: '#EF4444', // Red
      decade: '#3B82F6', // Blue
      lyrics: '#10B981', // Green
      challenge: '#8B5CF6', // Purple
    };
    return colors[cardType] || '#6B7280';
  }

  /**
   * 🎨 Get difficulty color for UI
   */
  getDifficultyColor(difficulty: string): string {
    const colors: Record<string, string> = {
      easy: '#10B981', // Green
      medium: '#F59E0B', // Yellow
      hard: '#EF4444', // Red
      expert: '#8B5CF6', // Purple
    };
    return colors[difficulty] || '#6B7280';
  }

  /**
   * 🧪 Test connection to backend
   */
  async testBackendConnection(): Promise<boolean> {
    return await audioService.testConnection();
  }
}

export const cardService = new CardService();
export type { GameCard };
