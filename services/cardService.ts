// services/cardService.ts - HITBACK Card Service
// ✅ Siempre usa la API del backend
// ✅ Formato nuevo escalable: HITBACK_TYPE:SONG_DIFF:EASY_GENRE:ROCK_DECADE:1980s
// ✅ Usa CurrentCard de game_types (tipo unificado)

import { Platform } from 'react-native';
import type { CurrentCard, CardType } from '@/types/game_types';

// ✅ Re-exportar CurrentCard como GameCard para compatibilidad
export type GameCard = CurrentCard;

// 🔧 CONFIGURACIÓN - AJUSTA TU IP AQUÍ
const getBaseUrl = (): string => {
  if (__DEV__) {
    // ⚠️ CAMBIA ESTA IP POR LA DE TU COMPUTADORA
    const LOCAL_IP = '192.168.1.10';

    if (Platform.OS === 'android') {
      return `http://${LOCAL_IP}:3000`;
    }
    return `http://${LOCAL_IP}:3000`;
  }
  return 'https://api.hitback.com';
};

const API_CONFIG = {
  get baseUrl() {
    return getBaseUrl();
  },
  timeout: 15000,
  retries: 3,
};

// 📋 TIPOS ADICIONALES
export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  genre?: string;
  decade?: string;
  difficulty?: string;
  previewUrl?: string;
  duration?: number;
}

interface BackendResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: {
    message: string;
    code: string;
    help?: any;
  };
}

// 🏭 CLASE PRINCIPAL
class CardService {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
    this.retries = API_CONFIG.retries;

    console.log(`🎵 CardService initialized`);
    console.log(`   Base URL: ${this.baseUrl}`);
  }

  // 🔧 Actualizar URL base
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    console.log(`🔧 CardService URL updated: ${url}`);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // 🌐 Fetch con retry y timeout
  private async fetchWithRetry(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.retries}: ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`✅ Success on attempt ${attempt}`);
          return response;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < this.retries) {
          await this.delay(attempt * 1000);
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 🎯 MÉTODO PRINCIPAL: Escanear QR y obtener carta
  async getCardByQR(qrCode: string): Promise<CurrentCard> {
    console.log(`\n🔍 CardService.getCardByQR`);
    console.log(`   QR: ${qrCode}`);
    console.log(`   URL: ${this.baseUrl}`);

    // Validación básica
    if (!qrCode || typeof qrCode !== 'string') {
      throw new Error('QR code inválido');
    }

    // Validar formato
    const isValidFormat =
      qrCode.match(/^HITBACK_TYPE:\w+_DIFF:\w+_GENRE:\w+_DECADE:\w+$/) ||
      qrCode.match(/^HITBACK_\d{3}_[A-Z]+_[A-Z]+$/);

    if (!isValidFormat) {
      throw new Error(
        'Formato de QR no válido. ' +
          'Esperado: HITBACK_TYPE:SONG_DIFF:EASY_GENRE:ROCK_DECADE:1980s'
      );
    }

    // Llamar al backend
    const url = `${this.baseUrl}/api/qr/scan/${encodeURIComponent(qrCode)}`;

    try {
      const response = await this.fetchWithRetry(url, { method: 'POST' });
      const data: BackendResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Error del servidor');
      }

      // Transformar respuesta a CurrentCard (tipo unificado)
      const backendData = data.data;

      const card: CurrentCard = {
        qrCode: backendData.scan.qrCode || qrCode,
        track: {
          id: backendData.track.id,
          title: backendData.track.title,
          artist: backendData.track.artist,
          album: backendData.track.album,
          year: backendData.track.year,
          genre: backendData.track.genre,
          decade: backendData.track.decade,
        },
        question: {
          type: backendData.question.type as CardType,
          text: backendData.question.question,
          answer: backendData.question.answer,
          points: backendData.question.points,
          hints: backendData.question.hints || [],
          challengeType: backendData.question.challengeType,
        },
        audio: {
          hasAudio: backendData.audio.hasAudio,
          url: backendData.audio.url,
          source: backendData.audio.source,
          duration: backendData.audio.duration || 30,
          albumArt: backendData.audio.metadata?.albumArt,
        },
        scan: {
          points: backendData.scan.points,
          difficulty: backendData.scan.difficulty,
          timestamp: backendData.scan.timestamp,
          filters: backendData.scan.filters,
        },
        // ✅ Campos adicionales requeridos por CurrentCard
        bets: [],
        revealed: false,
      };

      console.log(`✅ Card created: ${card.track.title}`);
      console.log(
        `   Audio: ${card.audio.hasAudio ? '✅' : '❌'} (${card.audio.source})`
      );

      return card;
    } catch (error) {
      console.error(`❌ getCardByQR failed:`, error);
      throw error;
    }
  }

  // 📚 Obtener todos los tracks
  async getAllTracks(): Promise<Track[]> {
    console.log(`📚 CardService.getAllTracks`);

    const url = `${this.baseUrl}/api/tracks`;

    try {
      const response = await this.fetchWithRetry(url);
      const data: BackendResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Error obteniendo tracks');
      }

      let tracks: Track[] = [];

      if (data.data?.tracks) {
        tracks = data.data.tracks;
      } else if (Array.isArray(data.data)) {
        tracks = data.data;
      }

      console.log(`✅ ${tracks.length} tracks obtenidos`);
      return tracks;
    } catch (error) {
      console.error(`❌ getAllTracks failed:`, error);
      throw error;
    }
  }

  // 🔍 Buscar tracks
  async searchTracks(query: string): Promise<Track[]> {
    console.log(`🔍 CardService.searchTracks: "${query}"`);

    const url = `${this.baseUrl}/api/tracks/search?q=${encodeURIComponent(
      query
    )}`;

    try {
      const response = await this.fetchWithRetry(url);
      const data: BackendResponse = await response.json();

      if (!data.success) {
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error(`❌ searchTracks failed:`, error);
      return [];
    }
  }

  // 🧪 Test de conexión
  async testConnection(): Promise<boolean> {
    console.log(`🧪 Testing connection to ${this.baseUrl}`);

    try {
      const url = `${this.baseUrl}/api/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`✅ Backend connection OK`);
        return true;
      }

      console.warn(`⚠️ Backend responded with ${response.status}`);
      return false;
    } catch (error) {
      console.error(`❌ Backend connection failed:`, error);
      return false;
    }
  }

  // 📊 Validar QR sin hacer scan completo
  async validateQR(
    qrCode: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const url = `${this.baseUrl}/api/qr/validate/${encodeURIComponent(
        qrCode
      )}`;
      const response = await this.fetchWithRetry(url);
      const data = await response.json();

      return {
        isValid: data.data?.isValid || false,
        error: data.data?.error,
      };
    } catch (error) {
      return {
        isValid: false,
        error: (error as Error).message,
      };
    }
  }

  // 📈 Obtener estadísticas
  async getStats(): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/qr/stats`;
      const response = await this.fetchWithRetry(url);
      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error(`❌ getStats failed:`, error);
      return {};
    }
  }

  // 🎯 Obtener emoji por tipo de carta
  getCardTypeEmoji(type: CardType): string {
    const emojis: Record<CardType, string> = {
      song: '🎵',
      artist: '🎤',
      decade: '📅',
      lyrics: '📝',
      challenge: '🔥',
    };
    return emojis[type] || '🎵';
  }

  // 📊 Obtener puntos por tipo de carta
  getCardTypePoints(type: CardType): number {
    const points: Record<CardType, number> = {
      song: 1,
      artist: 2,
      decade: 3,
      lyrics: 3,
      challenge: 5,
    };
    return points[type] || 1;
  }
}

// 🏭 Exportar instancia singleton
export const cardService = new CardService();

// También exportar la clase para testing
export { CardService };
