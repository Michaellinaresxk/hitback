// services/audioService.ts - LIMPIO: Solo Backend Integration
import { Audio } from 'expo-av';
import Constants from 'expo-constants';

// 🔧 SOLO INTERFACES - Sin datos hardcodeados
interface BackendScanResponse {
  success: boolean;
  data?: {
    scan: {
      qrCode: string;
      points: number;
      difficulty: string;
      timestamp: string;
    };
    track: {
      id: string;
      title: string;
      artist: string;
      album: string;
      year: number;
      genre: string;
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
  };
  error?: { message: string };
}

// 🎵 Audio Manager - Solo para reproducción
class AudioManager {
  private sound: Audio.Sound | null = null;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      console.log('✅ AudioManager initialized');
    } catch (error) {
      console.error('❌ AudioManager initialization failed:', error);
      throw error;
    }
  }

  async playTrackPreview(
    audioUrl: string,
    maxDuration: number = 5000,
    onFinished?: () => void
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.stop();
      console.log(`🎵 Playing: ${audioUrl} (${maxDuration}ms)`);

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          volume: 1.0,
          rate: 1.0,
          isLooping: false,
          isMuted: false,
        }
      );

      this.sound = sound;

      // Auto-stop after duration
      setTimeout(async () => {
        await this.stop();
        onFinished?.();
      }, maxDuration);
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

// 🌐 HTTP Client para Backend
class BackendClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = this.getServerUrl();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private getServerUrl(): string {
    // 🔧 CONFIGURACIÓN DINÁMICA IP
    const YOUR_IP = '192.168.1.10'; // Cambia por tu IP local
    const PORT = '3000';

    if (__DEV__ && Constants.expoConfig?.hostUri) {
      const hostUri = Constants.expoConfig.hostUri.split(':')[0];
      if (hostUri && hostUri !== 'localhost' && !hostUri.startsWith('127.')) {
        return `http://${hostUri}:${PORT}`;
      }
    }
    return `http://${YOUR_IP}:${PORT}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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

      return await response.json();
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

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// 🎮 Main Audio Service - SOLO Backend Integration
class AudioService {
  private backendClient: BackendClient;
  private audioManager: AudioManager;

  constructor() {
    this.backendClient = new BackendClient();
    this.audioManager = new AudioManager();
  }

  async initializeAudio(): Promise<void> {
    await this.audioManager.initialize();
  }

  // 🔍 ESCANEO QR - Backend Only
  async scanQRAndPlay(qrCode: string): Promise<BackendScanResponse> {
    try {
      console.log(`🔍 Scanning QR via backend: ${qrCode}`);

      // ✅ LLAMADA AL BACKEND REAL
      const response = await this.backendClient.post(`/api/qr/scan/${qrCode}`);

      if (response.success && response.data) {
        console.log('✅ Backend scan successful:', response.data.track.title);
        return {
          success: true,
          data: response.data,
        };
      }

      throw new Error(response.error?.message || 'Backend scan failed');
    } catch (error) {
      console.error('❌ QR scan error:', error);
      return {
        success: false,
        error: { message: error.message || 'QR scan failed' },
      };
    }
  }

  // 🎵 REPRODUCIR AUDIO - Solo streaming desde backend
  async playTrackPreview(
    audioUrl: string,
    duration: number = 5000,
    onFinished?: () => void
  ): Promise<void> {
    if (!audioUrl) {
      throw new Error('No audio URL provided');
    }

    console.log(`🎵 Playing audio from backend: ${audioUrl}`);
    return this.audioManager.playTrackPreview(audioUrl, duration, onFinished);
  }

  async stopAudio(): Promise<void> {
    return this.audioManager.stop();
  }

  isPlaying(): boolean {
    return this.audioManager.isPlaying();
  }

  // 🔧 HEALTH CHECK - Backend
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.backendClient.get('/api/health');
      return response.success && response.data?.status === 'healthy';
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return false;
    }
  }

  // 📋 OBTENER TRACKS - Backend Only
  async getAllTracks(): Promise<any[]> {
    try {
      const response = await this.backendClient.get('/api/tracks');
      return response.success ? response.data : [];
    } catch (error) {
      console.error('❌ Failed to get tracks from backend:', error);
      return [];
    }
  }

  // ✅ VALIDAR QR - Backend
  async validateQRCode(qrCode: string): Promise<boolean> {
    try {
      const response = await this.backendClient.get(
        `/api/qr/validate/${qrCode}`
      );
      return response.success && response.data?.isValid === true;
    } catch (error) {
      console.error('❌ QR validation failed:', error);
      return false;
    }
  }

  // 📊 STATS DEL SERVIDOR
  async getConnectionInfo(): Promise<any> {
    const serverUrl = this.backendClient.getBaseUrl();
    const isExpoDevMode = __DEV__ && !!Constants.expoConfig?.hostUri;

    try {
      const [healthResponse, tracksResponse] = await Promise.all([
        this.backendClient.get('/api/health').catch(() => null),
        this.backendClient.get('/api/tracks').catch(() => null),
      ]);

      return {
        serverUrl,
        isExpoDevMode,
        expoHostUri: Constants.expoConfig?.hostUri || null,
        backendConnected: !!healthResponse?.success,
        tracksAvailable: tracksResponse?.data?.length || 0,
        serverStatus: healthResponse?.data?.status || 'unknown',
      };
    } catch (error) {
      return {
        serverUrl,
        isExpoDevMode,
        expoHostUri: Constants.expoConfig?.hostUri || null,
        backendConnected: false,
        tracksAvailable: 0,
        serverStatus: 'error',
        error: error.message,
      };
    }
  }

  // 💾 GUARDAR STATS - Backend
  async saveGameStats(gameStats: any): Promise<void> {
    try {
      await this.backendClient.post('/api/game/stats', gameStats);
      console.log('✅ Game stats saved to backend');
    } catch (error) {
      console.error('❌ Failed to save game stats:', error);
      // No fallar el juego por esto
    }
  }

  async cleanup(): Promise<void> {
    await this.audioManager.cleanup();
  }
}

export const audioService = new AudioService();
export type { BackendScanResponse };
