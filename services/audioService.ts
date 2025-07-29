// AudioService.ts - ARCHIVO FINAL COMPLETO
// ✅ COPIA ESTE ARCHIVO EXACTAMENTE Y REEMPLAZA TU AudioService.ts

import { Audio } from 'expo-av';
import Constants from 'expo-constants';

// 🏗️ TIPOS BACKEND (lo que viene del servidor)
interface BackendTrackData {
  scan: {
    qrCode: string;
    timestamp: string;
    points: number;
    difficulty: string;
    processingTime: number;
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
    question: string;
    answer: string;
    points: number;
    hints: string[];
  };
  audio: {
    hasAudio: boolean;
    url: string;
    duration: number;
  };
}

// 🎯 TIPOS FRONTEND (lo que espera tu CardDisplay)
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

// 🔄 DATA ADAPTER
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
      console.log('🔄 Converting backend data to frontend card...');

      if (!backendData || !backendData.track || !backendData.question) {
        throw new Error('Invalid backend data structure');
      }

      const { track, question, audio, scan } = backendData;

      const normalizedType = this.normalizeQuestionType(question.type);
      const normalizedDifficulty = this.normalizeDifficulty(scan.difficulty);

      const card: FrontendCard = {
        id: `${track.id}_${question.type}_${scan.difficulty}`,
        type: normalizedType,
        difficulty: normalizedDifficulty,
        question: question.question || 'Pregunta no disponible',
        answer: question.answer || 'Respuesta no disponible',
        points: question.points || 1,
        hints: question.hints || [],
        color: this.TYPE_COLORS[question.type] || '#64748B',
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

      console.log('✅ Card converted successfully:', card.track.title);
      return card;
    } catch (error) {
      console.error('❌ Data conversion failed:', error);
      return this.createDefaultCard(backendData);
    }
  }

  private static normalizeQuestionType(
    type: string
  ): 'SONG' | 'ARTIST' | 'DECADE' | 'LYRICS' | 'CHALLENGE' {
    if (!type) return 'SONG';

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
        console.warn(`⚠️ Unknown question type: ${type}, defaulting to SONG`);
        return 'SONG';
    }
  }

  private static normalizeDifficulty(
    difficulty: string
  ): 'EASY' | 'MEDIUM' | 'HARD' {
    if (!difficulty) return 'EASY';

    const normalizedDifficulty = difficulty.toUpperCase();

    switch (normalizedDifficulty) {
      case 'EASY':
        return 'EASY';
      case 'MEDIUM':
        return 'MEDIUM';
      case 'HARD':
        return 'HARD';
      default:
        console.warn(
          `⚠️ Unknown difficulty: ${difficulty}, defaulting to EASY`
        );
        return 'EASY';
    }
  }

  private static createDefaultCard(backendData?: any): FrontendCard {
    console.log('🆘 Creating default card due to conversion error');

    return {
      id: 'default_001',
      type: 'SONG',
      difficulty: 'EASY',
      question: '¿Cuál es la canción?',
      answer: backendData?.track?.title || 'Canción desconocida',
      points: 1,
      hints: ['Escucha atentamente', 'Piensa en el título'],
      color: '#10B981',
      track: {
        id: backendData?.track?.id || '001',
        title: backendData?.track?.title || 'Canción desconocida',
        artist: backendData?.track?.artist || 'Artista desconocido',
        album: backendData?.track?.album || 'Álbum desconocido',
        year: backendData?.track?.year || 2024,
        genre: backendData?.track?.genre || 'Pop',
      },
      audio: backendData?.audio
        ? {
            hasAudio: backendData.audio.hasAudio,
            url: backendData.audio.url,
            duration: backendData.audio.duration,
          }
        : undefined,
    };
  }

  static validateCard(card: FrontendCard): boolean {
    try {
      const requiredFields = [
        'id',
        'type',
        'difficulty',
        'question',
        'answer',
        'points',
        'color',
        'track',
      ];

      for (const field of requiredFields) {
        if (card[field] === undefined || card[field] === null) {
          console.error(`❌ Card validation failed: missing field '${field}'`);
          return false;
        }
      }

      if (!card.track.id || !card.track.title || !card.track.artist) {
        console.error('❌ Card validation failed: incomplete track data');
        return false;
      }

      console.log('✅ Card validation passed');
      return true;
    } catch (error) {
      console.error('❌ Card validation error:', error);
      return false;
    }
  }
}

// 🔧 SERVER CONFIG
class ServerConfig {
  private static readonly YOUR_IP = '192.168.1.10';
  private static readonly PORT = '3000';

  static getServerUrl(): string {
    if (__DEV__ && Constants.expoConfig?.hostUri) {
      const hostUri = Constants.expoConfig.hostUri.split(':')[0];
      if (hostUri && hostUri !== 'localhost' && !hostUri.startsWith('127.')) {
        console.log(`🔧 Using Expo detected IP: ${hostUri}:${this.PORT}`);
        return `http://${hostUri}:${this.PORT}`;
      }
    }

    console.log(`🔧 Using specific IP: ${this.YOUR_IP}:${this.PORT}`);
    return `http://${this.YOUR_IP}:${this.PORT}`;
  }

  static getConnectionInfo() {
    return {
      serverUrl: this.getServerUrl(),
      yourSpecificIP: `${this.YOUR_IP}:${this.PORT}`,
      isExpoDevMode: __DEV__,
      expoHostUri: Constants.expoConfig?.hostUri,
      timestamp: new Date().toISOString(),
    };
  }
}

// 🌐 HTTP CLIENT
class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-expo-token': 'expo-dev-client',
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
      console.log(`📡 ${options.method} ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        ...options,
        headers: { ...this.defaultHeaders, ...options.headers },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`📡 Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Request failed for ${url}:`, error);

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

// 🔊 AUDIO MANAGER - CONFIGURACIÓN SIMPLIFICADA QUE FUNCIONA
class AudioManager {
  private sound: Audio.Sound | null = null;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // ✅ CONFIGURACIÓN SIMPLIFICADA - SIN PROPIEDADES PROBLEMÁTICAS
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      console.log('✅ AudioManager initialized successfully');
    } catch (error) {
      console.error('❌ AudioManager initialization failed:', error);
      throw error;
    }
  }

  async play(audioUrl: string, duration: number = 5000): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.stop();
      console.log(`🎵 Playing: ${audioUrl}`);

      // ✅ CONFIGURACIÓN BÁSICA QUE FUNCIONA
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          volume: 1.0,
          isLooping: false,
          isMuted: false,
        }
      );

      this.sound = sound;

      // Verificar status (opcional)
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          console.log(`✅ Audio loaded - Duration: ${status.durationMillis}ms`);
        }
      } catch (statusError) {
        console.warn('⚠️ Could not get audio status:', statusError);
      }

      // Auto-stop after duration
      setTimeout(async () => {
        await this.stop();
        console.log('⏹️ Audio finished automatically');
      }, duration);
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

// 🏥 HEALTH CHECK SERVICE
class HealthCheckService {
  constructor(private httpClient: HttpClient) {}

  async checkHealth(): Promise<boolean> {
    try {
      console.log('🏥 Checking server health...');

      const response = await this.httpClient.get('/api/health');

      console.log('📦 Health response:', {
        success: response.success,
        status: response.data?.status,
        message: response.message,
      });

      if (!response.success) {
        console.warn('⚠️ Health check: success=false');
        return false;
      }

      const isHealthy = this.evaluateHealthStatus(response);
      console.log(
        isHealthy ? '✅ Server is healthy' : '❌ Server is not healthy'
      );
      return isHealthy;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  private evaluateHealthStatus(response: any): boolean {
    if (response.success) {
      const status = response.data?.status;

      if (status === 'healthy') {
        return true;
      }

      if (status === 'error' || status === 'degraded') {
        console.warn('⚠️ Server reports issues but is responding');
        return true;
      }

      console.warn(`⚠️ Unknown server status: ${status}`);
      return false;
    }

    return false;
  }
}

// 🎯 MAIN AUDIO SERVICE - ARCHIVO PRINCIPAL
class AudioService {
  private httpClient: HttpClient;
  private audioManager: AudioManager;
  private healthCheck: HealthCheckService;

  constructor() {
    const serverUrl = ServerConfig.getServerUrl();
    this.httpClient = new HttpClient(serverUrl);
    this.audioManager = new AudioManager();
    this.healthCheck = new HealthCheckService(this.httpClient);
  }

  // 🎵 Audio Initialization
  async initializeAudio(): Promise<void> {
    await this.audioManager.initialize();
  }

  // 🚀 MAIN FUNCTION: Scan QR and get card with audio
  async scanQRAndPlay(qrCode: string): Promise<{
    success: boolean;
    card: FrontendCard;
    originalData: any;
  }> {
    try {
      console.log(`🔍 Scanning QR: ${qrCode}`);

      // 1. Check connectivity first
      const isConnected = await this.healthCheck.checkHealth();
      if (!isConnected) {
        throw new Error('Server is not available. Check your connection.');
      }

      // 2. Scan QR code
      const response = await this.httpClient.post<BackendTrackData>(
        `/api/qr/scan/${qrCode}`
      );

      if (!response.success) {
        throw new Error(response.error?.message || 'QR scan failed');
      }

      // 3. Validate response structure
      if (!this.validateBackendData(response.data)) {
        throw new Error('Invalid response structure from server');
      }

      console.log(
        `✅ QR scan success: ${response.data.track.title} by ${response.data.track.artist}`
      );

      // 4. Convert backend data to frontend card using DataAdapter
      console.log('🔄 Converting backend data to frontend format...');
      const card = DataAdapter.backendToCard(response.data);

      // 5. Validate converted card
      if (!DataAdapter.validateCard(card)) {
        console.warn(
          '⚠️ Card validation failed, using original data structure'
        );
        throw new Error('Data conversion failed - card structure invalid');
      }

      // 6. Play audio if available
      await this.handleAudioPlayback(response.data);

      console.log('✅ QR scan and conversion completed successfully');

      return {
        success: true,
        card: card,
        originalData: response.data,
      };
    } catch (error) {
      console.error('❌ QR scan error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    return this.healthCheck.checkHealth();
  }

  async validateQRCode(qrCode: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get<{ isValid: boolean }>(
        `/api/qr/validate/${qrCode}`
      );
      return response.success && response.data?.isValid === true;
    } catch (error) {
      console.error('❌ QR validation failed:', error);
      return false;
    }
  }

  async getAllTracks(): Promise<any[]> {
    try {
      const response = await this.httpClient.get<any[]>('/api/tracks');
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error('❌ Failed to get tracks:', error);
      return [];
    }
  }

  // 🎵 Audio Controls
  async stopAudio(): Promise<void> {
    await this.audioManager.stop();
  }

  isPlaying(): boolean {
    return this.audioManager.isPlaying();
  }

  // 📊 Utility Methods
  getServerUrl(): string {
    return ServerConfig.getServerUrl();
  }

  getConnectionInfo() {
    return ServerConfig.getConnectionInfo();
  }

  async cleanup(): Promise<void> {
    await this.audioManager.cleanup();
  }

  // 🔒 PRIVATE METHODS
  private validateBackendData(
    data: BackendTrackData | undefined
  ): data is BackendTrackData {
    return !!(
      data &&
      data.track &&
      data.track.title &&
      data.track.artist &&
      data.question &&
      data.question.question
    );
  }

  private async handleAudioPlayback(
    backendData: BackendTrackData
  ): Promise<void> {
    if (backendData.audio?.hasAudio && backendData.audio.url) {
      try {
        console.log(`🎵 Playing audio: ${backendData.audio.url}`);
        const duration = (backendData.audio.duration || 5) * 1000;
        await this.audioManager.play(backendData.audio.url, duration);
        console.log('🎵 Audio started successfully');
      } catch (audioError) {
        console.warn('⚠️ Audio playback failed (non-critical):', audioError);
        // Don't throw - audio failure shouldn't break QR scan
      }
    } else {
      console.warn('⚠️ No audio available for this track');
    }
  }
}

// 🎯 SINGLETON EXPORT
export const audioService = new AudioService();

// 🔄 EXPORT TYPES (para tu GameScreen)
export type { BackendTrackData, FrontendCard };
