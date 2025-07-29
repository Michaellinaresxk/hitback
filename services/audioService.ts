import { Audio } from 'expo-av';
import Constants from 'expo-constants';

// 🏗️ TYPES & INTERFACES - Clean Architecture
interface ServerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  message?: string;
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface HealthCheckData {
  status: 'healthy' | 'error' | 'degraded';
  environment: string;
  uptime: number;
  version: string;
  services?: Record<string, any>;
}

interface TrackData {
  track: {
    id: string;
    title: string;
    artist: string;
    difficulty: string;
  };
  audio?: {
    hasAudio: boolean;
    url: string;
    duration: number;
  };
  question?: any;
}

interface ConnectionInfo {
  serverUrl: string;
  yourSpecificIP: string;
  isExpoDevMode: boolean;
  expoHostUri?: string;
  timestamp: string;
}

// 🔧 CONFIGURATION CLASS - Single Responsibility
class ServerConfig {
  private static readonly YOUR_IP = '192.168.1.10';
  private static readonly PORT = '3000';

  static getServerUrl(): string {
    // En desarrollo, intenta usar la IP del servidor de desarrollo de Expo
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

  static getConnectionInfo(): ConnectionInfo {
    return {
      serverUrl: this.getServerUrl(),
      yourSpecificIP: `${this.YOUR_IP}:${this.PORT}`,
      isExpoDevMode: __DEV__,
      expoHostUri: Constants.expoConfig?.hostUri,
      timestamp: new Date().toISOString(),
    };
  }
}

// 🌐 HTTP CLIENT CLASS - Separation of Concerns
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

  async get<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ServerResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    options?: RequestInit
  ): Promise<ServerResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<ServerResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      console.log(`📡 ${options.method} ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

      const data: ServerResponse<T> = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Request failed for ${url}:`, error);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      }

      if (error.message.includes('Network request failed')) {
        throw new Error(`Network error: Cannot connect to ${this.baseUrl}`);
      }

      throw error;
    }
  }
}

// 🔊 AUDIO MANAGER CLASS - Single Responsibility
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

  async play(audioUrl: string, duration: number = 5000): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.stop(); // Stop any existing audio

      console.log(`🎵 Playing: ${audioUrl}`);

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, volume: 1.0 }
      );

      this.sound = sound;

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

// 🏥 HEALTH CHECK SERVICE - Specialized Logic
class HealthCheckService {
  constructor(private httpClient: HttpClient) {}

  async checkHealth(): Promise<boolean> {
    try {
      console.log('🧪 Checking server health...');

      const response = await this.httpClient.get<HealthCheckData>(
        '/api/health'
      );

      console.log('📦 Health response:', {
        success: response.success,
        status: response.data?.status,
        message: response.message,
      });

      // ✅ FIXED: More resilient health check logic
      if (!response.success) {
        console.warn('⚠️ Health check: success=false');
        return false;
      }

      // Check multiple conditions for health status
      const isHealthy = this.evaluateHealthStatus(response);

      console.log(
        isHealthy ? '✅ Server is healthy' : '❌ Server is not healthy'
      );
      return isHealthy;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.logTroubleshootingInfo();
      return false;
    }
  }

  private evaluateHealthStatus(
    response: ServerResponse<HealthCheckData>
  ): boolean {
    // Si el servidor responde con success=true, considerarlo disponible
    // incluso si el status interno no es "healthy"
    if (response.success) {
      const status = response.data?.status;

      // Aceptar tanto "healthy" como "error" si el servidor responde
      if (status === 'healthy') {
        return true;
      }

      // Si status es "error" pero el servidor responde, log warning pero continuar
      if (status === 'error') {
        console.warn('⚠️ Server reports internal errors but is responding');
        return true; // ✅ Changed: Be more permissive
      }

      // Para estados desconocidos, ser conservador
      console.warn(`⚠️ Unknown server status: ${status}`);
      return false;
    }

    return false;
  }

  private logTroubleshootingInfo(): void {
    const serverUrl = ServerConfig.getServerUrl();
    console.error('💡 Troubleshooting:');
    console.error(`   - Server URL: ${serverUrl}`);
    console.error(`   - Make sure server is running`);
    console.error(`   - Check WiFi network connection`);
    console.error(`   - Verify firewall settings`);
  }
}

// 🎯 MAIN AUDIO SERVICE - Clean Architecture
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

  // 🚀 PUBLIC API - Clean Interface
  async scanQRAndPlay(qrCode: string): Promise<ServerResponse<TrackData>> {
    try {
      console.log(`🔍 Scanning QR: ${qrCode}`);

      // 1. Check connectivity first
      const isConnected = await this.healthCheck.checkHealth();
      if (!isConnected) {
        throw new Error('Server is not available. Check your connection.');
      }

      // 2. Scan QR code
      const response = await this.httpClient.post<TrackData>(
        `/api/qr/scan/${qrCode}`
      );

      if (!response.success) {
        throw new Error(response.error?.message || 'QR scan failed');
      }

      // 3. Validate response structure
      if (!this.validateTrackData(response.data)) {
        throw new Error('Invalid response structure from server');
      }

      console.log(
        `✅ QR scan success: ${response.data.track.title} by ${response.data.track.artist}`
      );

      // 4. Play audio if available
      await this.handleAudioPlayback(response.data);

      return response;
    } catch (error) {
      console.error('❌ QR scan error:', error);
      throw this.enhanceError(error);
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

  // 🎵 Audio Initialization (Public API for compatibility)
  async initializeAudio(): Promise<void> {
    await this.audioManager.initialize();
  }

  // 📊 Utility Methods
  getServerUrl(): string {
    return ServerConfig.getServerUrl();
  }

  getConnectionInfo(): ConnectionInfo {
    return ServerConfig.getConnectionInfo();
  }

  async cleanup(): Promise<void> {
    await this.audioManager.cleanup();
  }

  // 🔒 PRIVATE METHODS - Internal Logic
  private validateTrackData(data: TrackData | undefined): data is TrackData {
    return !!(data && data.track && data.track.title && data.track.artist);
  }

  private async handleAudioPlayback(trackData: TrackData): Promise<void> {
    if (trackData.audio?.hasAudio && trackData.audio.url) {
      try {
        console.log(`🎵 Playing audio: ${trackData.audio.url}`);
        const duration = (trackData.audio.duration || 5) * 1000;
        await this.audioManager.play(trackData.audio.url, duration);
        console.log('🎵 Audio started successfully');
      } catch (audioError) {
        console.warn('⚠️ Audio playback failed (non-critical):', audioError);
        // Don't throw - audio failure shouldn't break QR scan
      }
    } else {
      console.warn('⚠️ No audio available for this track');
    }
  }

  private enhanceError(error: any): Error {
    if (error.message?.includes('Network')) {
      const serverUrl = this.getServerUrl();
      return new Error(
        `Network error: Cannot connect to ${serverUrl}. ` +
          'Check if server is running and both devices are on the same WiFi network.'
      );
    }
    return error;
  }
}

// 🎯 SINGLETON EXPORT
export const audioService = new AudioService();
