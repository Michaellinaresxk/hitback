// services/audioService.ts - FIXED Audio Service
import { Audio } from 'expo-av';
import Constants from 'expo-constants';

// Types
interface BackendTrackData {
  scan: {
    qrCode: string;
    timestamp: string;
    points: number;
    difficulty: string;
    processingTime: number;
    cardType: string;
  };
  track: {
    id: string;
    title: string;
    artist: string;
    album: string;
    year: number;
    genre: string;
    difficulty: string;
  };
  question: {
    type: string;
    text: string;
    answer: string;
    points: number;
    hints: string[];
    challengeType?: string;
  };
  audio: {
    hasAudio: boolean;
    url: string;
    duration: number;
  };
}

interface FrontendCard {
  id: string;
  type: 'SONG' | 'ARTIST' | 'DECADE' | 'LYRICS' | 'CHALLENGE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question: string;
  answer: string;
  points: number;
  hints: string[];
  color: string;
  track: {
    id: string;
    title: string;
    artist: string;
    album: string;
    year: number;
    genre: string;
  };
  audio?: {
    hasAudio: boolean;
    url: string;
    duration: number;
  };
}

// 🎵 FIXED Audio Manager - No more slowdown issues
class AudioManager {
  private sound: Audio.Sound | null = null;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 🔧 FIXED: Simple, working audio configuration
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        // Removed problematic properties that caused slowdown
      });

      this.isInitialized = true;
      console.log('✅ AudioManager initialized successfully');
    } catch (error) {
      console.error('❌ AudioManager initialization failed:', error);
      throw error;
    }
  }

  // 🎵 FIXED: Play with normal speed and duration control
  async playTrackPreview(
    audioUrl: string,
    maxDuration: number = 10000, // 10 seconds max
    onFinished?: () => void
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.stop();
      console.log(`🎵 Playing preview: ${audioUrl} (max ${maxDuration}ms)`);

      // 🔧 FIXED: Simple sound creation with proper rate
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          volume: 1.0,
          rate: 1.0, // 🔧 FIXED: Ensure normal playback speed
          isLooping: false,
          isMuted: false,
        }
      );

      this.sound = sound;

      // Auto-stop after max duration
      setTimeout(async () => {
        await this.stop();
        console.log('⏹️ Audio stopped after max duration');
        onFinished?.();
      }, maxDuration);

      console.log('✅ Audio preview started successfully');
    } catch (error) {
      console.error('❌ Audio playback failed:', error);
      throw new Error(`Audio playback failed: ${error.message}`);
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('❌ Error stopping audio:', error);
    }
  }

  isPlaying(): boolean {
    return this.sound !== null;
  }

  async cleanup(): Promise<void> {
    await this.stop();
    this.isInitialized = false;
  }
}

// 🌐 HTTP Client for backend communication
class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  private async request<T>(endpoint: string, options: RequestInit) {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(url, {
        ...options,
        headers: { ...this.defaultHeaders, ...options.headers },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      if (error.message.includes('Network request failed')) {
        throw new Error(`Network error: Cannot connect to ${this.baseUrl}`);
      }
      throw error;
    }
  }
}

// 🔧 Server Configuration
class ServerConfig {
  private static readonly YOUR_IP = '192.168.1.10'; // 🔧 Update this IP
  private static readonly PORT = '3000';

  static getServerUrl(): string {
    if (__DEV__ && Constants.expoConfig?.hostUri) {
      const hostUri = Constants.expoConfig.hostUri.split(':')[0];
      if (hostUri && hostUri !== 'localhost' && !hostUri.startsWith('127.')) {
        return `http://${hostUri}:${this.PORT}`;
      }
    }
    return `http://${this.YOUR_IP}:${this.PORT}`;
  }
}

// 🔄 Data Adapter for converting backend to frontend format
class DataAdapter {
  private static readonly TYPE_COLORS = {
    song: '#10B981',
    artist: '#3B82F6',
    decade: '#F59E0B',
    lyrics: '#8B5CF6',
    challenge: '#EF4444',
  };

  static backendToCard(backendData: BackendTrackData): FrontendCard {
    try {
      const { track, question, audio, scan } = backendData;

      const card: FrontendCard = {
        id: `${track.id}_${question.type}_${scan.difficulty}`,
        type: this.normalizeQuestionType(question.type),
        difficulty: this.normalizeDifficulty(scan.difficulty),
        question: question.text || 'Pregunta no disponible',
        answer: question.answer || 'Respuesta no disponible',
        points: question.points || 1,
        hints: question.hints || [],
        color: this.TYPE_COLORS[question.type.toLowerCase()] || '#64748B',
        track: {
          id: track.id,
          title: track.title || 'Título desconocido',
          artist: track.artist || 'Artista desconocido',
          album: track.album || 'Álbum desconocido',
          year: track.year || 2024,
          genre: track.genre || 'Género desconocido',
        },
        audio: audio
          ? {
              hasAudio: audio.hasAudio,
              url: audio.url,
              duration: audio.duration,
            }
          : undefined,
      };

      return card;
    } catch (error) {
      console.error('❌ Data conversion failed:', error);
      throw error;
    }
  }

  private static normalizeQuestionType(
    type: string
  ): 'SONG' | 'ARTIST' | 'DECADE' | 'LYRICS' | 'CHALLENGE' {
    const normalizedType = type.toUpperCase();
    switch (normalizedType) {
      case 'SONG':
        return 'SONG';
      case 'ARTIST':
        return 'ARTIST';
      case 'DECADE':
        return 'DECADE';
      case 'LYRICS':
        return 'LYRICS';
      case 'CHALLENGE':
        return 'CHALLENGE';
      default:
        return 'SONG';
    }
  }

  private static normalizeDifficulty(
    difficulty: string
  ): 'EASY' | 'MEDIUM' | 'HARD' {
    const normalizedDifficulty = difficulty.toUpperCase();
    switch (normalizedDifficulty) {
      case 'EASY':
        return 'EASY';
      case 'MEDIUM':
        return 'MEDIUM';
      case 'HARD':
        return 'HARD';
      default:
        return 'EASY';
    }
  }
}

// 🎯 Main Audio Service
class AudioService {
  private httpClient: HttpClient;
  private audioManager: AudioManager;

  constructor() {
    const serverUrl = ServerConfig.getServerUrl();
    this.httpClient = new HttpClient(serverUrl);
    this.audioManager = new AudioManager();
  }

  // Initialize audio system
  async initializeAudio(): Promise<void> {
    await this.audioManager.initialize();
  }

  // 🎯 MAIN METHOD: Scan QR and get card data
  async scanQRAndPlay(qrCode: string): Promise<{
    success: boolean;
    card: FrontendCard;
    data: BackendTrackData;
  }> {
    try {
      console.log(`🔍 Scanning QR: ${qrCode}`);

      const response = await this.httpClient.post<BackendTrackData>(
        `/api/qr/scan/${qrCode}`
      );

      if (!response.success) {
        throw new Error(response.error?.message || 'QR scan failed');
      }

      const card = DataAdapter.backendToCard(response.data);

      return {
        success: true,
        card: card,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ QR scan error:', error);
      throw error;
    }
  }

  // 🎵 Audio playback methods
  async playTrackPreview(
    audioUrl: string,
    duration: number = 10000,
    onFinished?: () => void
  ): Promise<void> {
    return this.audioManager.playTrackPreview(audioUrl, duration, onFinished);
  }

  async stopAudio(): Promise<void> {
    return this.audioManager.stop();
  }

  isPlaying(): boolean {
    return this.audioManager.isPlaying();
  }

  // 🧪 Connection testing
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/api/health');
      return response.success && response.data?.status === 'healthy';
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  // 📊 Utility methods
  getServerUrl(): string {
    return ServerConfig.getServerUrl();
  }

  async cleanup(): Promise<void> {
    await this.audioManager.cleanup();
  }

  // Additional methods for game statistics
  async saveGameStats(gameStats: any): Promise<void> {
    try {
      await this.httpClient.post('/api/game/stats', gameStats);
    } catch (error) {
      console.error('Failed to save game stats:', error);
    }
  }

  async validateQRCode(qrCode: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get(`/api/qr/validate/${qrCode}`);
      return response.success && response.data?.isValid === true;
    } catch (error) {
      return false;
    }
  }

  async getAllTracks(): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/api/tracks');
      return response.success ? response.data || [] : [];
    } catch (error) {
      return [];
    }
  }
}

// 🎯 Singleton export
export const audioService = new AudioService();
export type { BackendTrackData, FrontendCard };
