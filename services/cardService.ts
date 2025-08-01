// services/cardService.ts - CORREGIDO para trabajar con el JSON real del backend
import { audioService, ProcessedScanResponse } from './audioService';

// ✅ CORREGIDO: GameCard interface que coincide con la respuesta procesada
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
  challengeType?: string;
  hints: string[];

  // Track info
  track: {
    id: string;
    title: string;
    artist: string;
    album: string;
    year: number;
    genre: string;
    decade: string;
  };

  // Audio info
  audio: {
    url: string;
    hasAudio: boolean;
    duration: number; // in seconds
    source: 'local' | 'none';
  };

  // Metadata
  timestamp: string;
}

/**
 * 🎵 Card Service - CORREGIDO para trabajar con el backend real
 *
 * Este servicio ahora funciona correctamente con la estructura JSON real del backend
 */
class CardService {
  /**
   * 🔍 CORREGIDO: Get card by QR code - Funciona con estructura real
   */
  async getCardByQR(qrCode: string): Promise<GameCard | null> {
    try {
      console.log(`🔍 CardService: Processing QR: ${qrCode}`);

      // Validate QR format before making backend call
      if (!this.isValidQRFormat(qrCode)) {
        console.error(`❌ Invalid QR format: ${qrCode}`);
        return null;
      }

      // ✅ CORREGIDO: Get data from backend via audioService
      const scanResponse = await audioService.scanQRAndPlay(qrCode);

      if (!scanResponse.success || !scanResponse.card) {
        console.error('❌ Scan failed:', scanResponse.error?.message);
        return null;
      }

      // ✅ CORREGIDO: Transform to GameCard format
      const gameCard = this.transformScanResponse(scanResponse);

      console.log('✅ CardService: Game card created:', gameCard.track.title);
      return gameCard;
    } catch (error) {
      console.error('❌ CardService: Failed to get card:', error);
      return null;
    }
  }

  /**
   * ✅ CORREGIDO: Transform scan response to GameCard format
   */
  private transformScanResponse(scanResponse: ProcessedScanResponse): GameCard {
    const card = scanResponse.card!;

    return {
      // QR and scan info
      qrCode: card.qrCode,
      trackId: card.trackId,
      cardType: card.cardType as any,
      difficulty: card.difficulty as any,
      points: card.points,

      // Question data - ✅ Ya viene procesado correctamente
      question: card.question,
      answer: card.answer,
      challengeType: card.challengeType,
      hints: card.hints,

      // Track info
      track: {
        ...card.track,
        decade: this.calculateDecade(card.track.year),
      },

      // Audio info - ✅ Ya viene con URL construida
      audio: {
        url: card.audio.url,
        hasAudio: card.audio.hasAudio,
        duration: card.audio.duration,
        source: card.audio.hasAudio ? 'local' : 'none',
      },

      // Metadata
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🔍 CORREGIDO: Validate QR code format locally (quick check)
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
   * 📊 CORREGIDO: Calculate points based on card type and difficulty
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

  /**
   * ✅ NUEVO: Get all available tracks for management
   */
  async getAllTracks(): Promise<any[]> {
    try {
      return await audioService.getAllTracks();
    } catch (error) {
      console.error('Failed to get tracks:', error);
      return [];
    }
  }

  /**
   * ✅ NUEVO: Search tracks by title/artist
   */
  searchTracks(query: string): any[] {
    // This would search through available tracks
    // For now, return empty array as this requires backend implementation
    return [];
  }

  /**
   * ✅ NUEVO: Generate test QR codes for development
   */
  generateTestQRCodes(): { qrCode: string; description: string }[] {
    const testCodes = [];

    // Generate QR codes for available tracks
    const cardTypes = ['song', 'artist', 'decade', 'lyrics', 'challenge'];
    const difficulties = ['easy', 'medium', 'hard', 'expert'];
    const trackIds = ['001', '002', '004']; // From the JSON

    trackIds.forEach((trackId) => {
      cardTypes.forEach((cardType) => {
        difficulties.forEach((difficulty) => {
          const qrCode = this.generateQRCode(trackId, cardType, difficulty);
          testCodes.push({
            qrCode,
            description: `Track ${trackId} - ${cardType} - ${difficulty}`,
          });
        });
      });
    });

    return testCodes;
  }

  validateTrackCardType(track: any, cardType: string): boolean {
    return track.questions && track.questions[cardType];
  }

  getQuestionPreview(
    track: any,
    cardType: string
  ): { question: string; points: number } | null {
    if (!this.validateTrackCardType(track, cardType)) {
      return null;
    }

    const questionData = track.questions[cardType];
    return {
      question: questionData.question,
      points: questionData.points,
    };
  }
}

export const cardService = new CardService();
export type { GameCard };
