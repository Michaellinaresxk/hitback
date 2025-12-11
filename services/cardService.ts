// services/cardService.ts - FIXED: New QR Format Support
import { audioService, BackendScanResponse } from './audioService';

// 🎮 INTERFACE PARA GAME CARD - Simplificada
interface GameCard {
  // QR Info
  qrCode: string;
  trackId: string;
  cardType: 'song' | 'artist' | 'decade' | 'lyrics' | 'challenge';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;

  // Question Data (from backend)
  question: string;
  answer: string;
  hints: string[];
  challengeType?: string;

  // Track Info (from backend)
  track: {
    id: string;
    title: string;
    artist: string;
    album: string;
    year: number;
    genre: string;
    decade: string;
    previewUrl: string; // URL from backend
    qrCode: string;
  };

  // Audio Info (from backend)
  audio: {
    url: string;
    hasAudio: boolean;
    duration: number;
    source: 'backend';
  };

  // Metadata
  timestamp: string;
}

/**
 * 🎯 Card Service - Backend Integration with NEW QR Format
 *
 * ✅ NUEVO FORMATO: HITBACK_TYPE:SONG_DIFF:EASY_GENRE:ROCK_DECADE:1980s
 */
class CardService {
  /**
   * 🔍 Get card by QR code - Solo Backend
   */
  async getCardByQR(qrCode: string): Promise<GameCard | null> {
    try {
      console.log(`🔍 CardService: Getting card from backend: ${qrCode}`);

      // ✅ VALIDACIÓN LOCAL RÁPIDA - NUEVO FORMATO
      if (!this.isValidQRFormat(qrCode)) {
        console.error(`❌ Invalid QR format: ${qrCode}`);
        console.error(
          'Expected format: HITBACK_TYPE:SONG_DIFF:EASY_GENRE:ROCK_DECADE:1980s'
        );
        return null;
      }

      // ✅ ESCANEO COMPLETO VIA BACKEND
      const scanResponse = await audioService.scanQRAndPlay(qrCode);

      if (!scanResponse.success || !scanResponse.data) {
        console.error('❌ Backend scan failed:', scanResponse.error?.message);
        return null;
      }

      // ✅ TRANSFORMAR RESPUESTA DEL BACKEND A GAMECARD
      const gameCard = this.transformBackendResponse(scanResponse);

      console.log('✅ GameCard created from backend:', gameCard.track.title);
      return gameCard;
    } catch (error) {
      console.error('❌ CardService: Failed to get card:', error);
      return null;
    }
  }

  /**
   * 🔄 Transform backend response to GameCard
   */
  private transformBackendResponse(
    scanResponse: BackendScanResponse
  ): GameCard {
    const data = scanResponse.data!;

    return {
      // QR Info
      qrCode: data.scan.qrCode,
      trackId: data.track.id,
      cardType: data.question.type as any,
      difficulty: data.scan.difficulty as any,
      points: data.scan.points,

      // Question Data (directo del backend)
      question: data.question.question,
      answer: data.question.answer,
      hints: data.question.hints,
      challengeType: undefined,

      // Track Info (directo del backend)
      track: {
        id: data.track.id,
        title: data.track.title,
        artist: data.track.artist,
        album: data.track.album,
        year: data.track.year,
        genre: data.track.genre,
        decade: data.track.decade || this.calculateDecade(data.track.year),
        previewUrl: data.audio.url, // ✅ URL del backend
        qrCode: data.scan.qrCode,
      },

      // Audio Info (directo del backend)
      audio: {
        url: data.audio.url,
        hasAudio: data.audio.hasAudio,
        duration: data.audio.duration,
        source: 'backend',
      },

      // Metadata
      timestamp: data.scan.timestamp,
    };
  }

  /**
   * 🔍 Quick local QR validation - NEW FORMAT
   *
   * ✅ NUEVO FORMATO: HITBACK_TYPE:SONG_DIFF:EASY_GENRE:ROCK_DECADE:1980s
   * ❌ FORMATO VIEJO: HITBACK_001_SONG_EASY (NO SOPORTADO)
   */
  isValidQRFormat(qrCode: string): boolean {
    try {
      // ✅ Debe empezar con HITBACK_TYPE:
      if (!qrCode.startsWith('HITBACK_TYPE:')) {
        console.warn(
          `❌ QR must start with HITBACK_TYPE:, got: ${qrCode.substring(
            0,
            20
          )}...`
        );
        return false;
      }

      // ✅ NUEVO FORMATO: HITBACK_TYPE:SONG_DIFF:EASY_GENRE:ROCK_DECADE:1980s
      const pattern =
        /^HITBACK_TYPE:([A-Z]+)_DIFF:([A-Z]+)_GENRE:([A-Z0-9_&]+)_DECADE:([A-Z0-9s]+)$/;
      const match = qrCode.match(pattern);

      if (!match) {
        console.warn(`❌ QR doesn't match new format pattern`);
        console.warn(
          `Expected: HITBACK_TYPE:SONG_DIFF:EASY_GENRE:ROCK_DECADE:1980s`
        );
        console.warn(`Got: ${qrCode}`);
        return false;
      }

      const [, cardType, difficulty, genre, decade] = match;

      // Validar componentes
      if (!this.isValidCardType(cardType.toLowerCase())) {
        console.warn(`❌ Invalid card type: ${cardType}`);
        return false;
      }

      if (!this.isValidDifficulty(difficulty.toLowerCase())) {
        console.warn(`❌ Invalid difficulty: ${difficulty}`);
        return false;
      }

      if (!this.isValidGenre(genre)) {
        console.warn(`❌ Invalid genre: ${genre}`);
        return false;
      }

      if (!this.isValidDecade(decade)) {
        console.warn(`❌ Invalid decade: ${decade}`);
        return false;
      }

      console.log(
        `✅ QR format valid: ${cardType} | ${difficulty} | ${genre} | ${decade}`
      );
      return true;
    } catch (error) {
      console.error('❌ QR validation error:', error);
      return false;
    }
  }

  /**
   * 🔍 Full QR validation with backend
   */
  async validateQRCode(qrCode: string): Promise<boolean> {
    // Quick local check first
    if (!this.isValidQRFormat(qrCode)) {
      return false;
    }

    // Backend validation
    return await audioService.validateQRCode(qrCode);
  }

  /**
   * 📋 Get all tracks from backend
   */
  async getAllTracks(): Promise<any[]> {
    try {
      return await audioService.getAllTracks();
    } catch (error) {
      console.error('❌ Failed to get tracks from backend:', error);
      return [];
    }
  }

  /**
   * 🔍 Search tracks (via backend)
   */
  async searchTracks(query: string): Promise<any[]> {
    try {
      const allTracks = await this.getAllTracks();
      const searchTerm = query.toLowerCase();

      return allTracks.filter(
        (track) =>
          track.title?.toLowerCase().includes(searchTerm) ||
          track.artist?.toLowerCase().includes(searchTerm) ||
          track.genre?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('❌ Search tracks failed:', error);
      return [];
    }
  }

  /**
   * 🧪 Test backend connection
   */
  async testBackendConnection(): Promise<boolean> {
    return await audioService.testConnection();
  }

  /**
   * 📅 Calculate decade from year
   */
  private calculateDecade(year: number): string {
    if (!year || isNaN(year)) return 'Unknown';
    const decade = Math.floor(year / 10) * 10;
    return `${decade}s`;
  }

  /**
   * 🔍 Valid card types
   */
  private isValidCardType(cardType: string): boolean {
    const validTypes = ['song', 'artist', 'decade', 'lyrics', 'challenge'];
    return validTypes.includes(cardType);
  }

  /**
   * 🔍 Valid difficulties
   */
  private isValidDifficulty(difficulty: string): boolean {
    const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
    return validDifficulties.includes(difficulty);
  }

  /**
   * 🔍 Valid genres - NEW
   */
  private isValidGenre(genre: string): boolean {
    const validGenres = [
      'ANY',
      'ROCK',
      'POP',
      'REGGAETON',
      'HIP_HOP',
      'HIP-HOP',
      'ELECTRONIC',
      'R&B',
      'COUNTRY',
      'JAZZ',
      'LATIN',
      'METAL',
    ];
    return validGenres.includes(genre.toUpperCase());
  }

  /**
   * 🔍 Valid decades - NEW
   */
  private isValidDecade(decade: string): boolean {
    const validDecades = [
      'ANY',
      '1960s',
      '1970s',
      '1980s',
      '1990s',
      '2000s',
      '2010s',
      '2020s',
    ];
    return validDecades.includes(decade);
  }

  /**
   * 🎨 UI Helpers (these can stay in frontend)
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
   * 🧪 Generate test QR codes - NEW FORMAT
   */
  generateTestQRCodes(): { qrCode: string; description: string }[] {
    const testCodes = [];
    const cardTypes = ['SONG', 'ARTIST', 'DECADE', 'LYRICS', 'CHALLENGE'];
    const difficulties = ['EASY', 'MEDIUM', 'HARD'];
    const genres = ['ANY', 'ROCK', 'POP', 'REGGAETON'];
    const decades = ['ANY', '1980s', '1990s', '2010s'];

    // Generate sample QR codes with new format
    cardTypes.forEach((cardType) => {
      difficulties.forEach((difficulty) => {
        genres.slice(0, 2).forEach((genre) => {
          decades.slice(0, 2).forEach((decade) => {
            const qrCode = `HITBACK_TYPE:${cardType}_DIFF:${difficulty}_GENRE:${genre}_DECADE:${decade}`;
            testCodes.push({
              qrCode,
              description: `${cardType} - ${difficulty} - ${genre} - ${decade}`,
            });
          });
        });
      });
    });

    return testCodes.slice(0, 20); // Return first 20 for testing
  }

  /**
   * 📊 Get backend stats
   */
  async getBackendStats(): Promise<any> {
    try {
      const [connectionInfo, tracks] = await Promise.all([
        audioService.getConnectionInfo(),
        this.getAllTracks(),
      ]);

      return {
        connection: connectionInfo,
        tracks: {
          total: tracks.length,
          withAudio: tracks.filter((t) => t.audioFile).length,
          withQuestions: tracks.filter((t) => t.hasQuestions).length,
        },
        qrFormat: 'NEW_SCALABLE',
        expectedFormat: 'HITBACK_TYPE:SONG_DIFF:EASY_GENRE:ROCK_DECADE:1980s',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to get backend stats:', error);
      return { error: error.message };
    }
  }
}

export const cardService = new CardService();
export type { GameCard };
