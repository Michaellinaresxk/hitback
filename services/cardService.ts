// services/cardService.ts - LIMPIO: Solo Backend Integration
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
 * 🎯 Card Service - SOLO Backend Integration
 *
 * Este servicio elimina toda la duplicación de datos y solo consume el backend
 */
class CardService {
  /**
   * 🔍 Get card by QR code - Solo Backend
   */
  async getCardByQR(qrCode: string): Promise<GameCard | null> {
    try {
      console.log(`🔍 CardService: Getting card from backend: ${qrCode}`);

      // ✅ VALIDACIÓN LOCAL RÁPIDA
      if (!this.isValidQRFormat(qrCode)) {
        console.error(`❌ Invalid QR format: ${qrCode}`);
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
      challengeType: undefined, // Se puede agregar al backend si es necesario

      // Track Info (directo del backend)
      track: {
        id: data.track.id,
        title: data.track.title,
        artist: data.track.artist,
        album: data.track.album,
        year: data.track.year,
        genre: data.track.genre,
        decade: this.calculateDecade(data.track.year),
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
   * 🔍 Quick local QR validation (no backend call needed)
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

      // Basic validation
      if (prefix !== 'HITBACK') return false;
      if (!/^[A-Za-z0-9]{3,10}$/.test(trackId)) return false;
      if (!this.isValidCardType(cardType.toLowerCase())) return false;
      if (!this.isValidDifficulty(difficulty.toLowerCase())) return false;

      return true;
    } catch (error) {
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
      // En el futuro, el backend puede tener un endpoint de búsqueda
      // Por ahora, traer todos y filtrar localmente
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
   * 🧪 Generate test QR codes (for development)
   */
  generateTestQRCodes(): { qrCode: string; description: string }[] {
    const testCodes = [];
    const cardTypes = ['song', 'artist', 'decade', 'lyrics', 'challenge'];
    const difficulties = ['easy', 'medium', 'hard', 'expert'];
    const trackIds = ['001', '002', '003', '004', '005', '006']; // IDs del backend

    trackIds.forEach((trackId) => {
      cardTypes.forEach((cardType) => {
        difficulties.forEach((difficulty) => {
          const qrCode = `HITBACK_${trackId}_${cardType.toUpperCase()}_${difficulty.toUpperCase()}`;
          testCodes.push({
            qrCode,
            description: `Track ${trackId} - ${cardType} - ${difficulty}`,
          });
        });
      });
    });

    return testCodes;
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
