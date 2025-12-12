// services/audioService.ts - HITBACK Audio Service COMPLETO
// ✅ Todos los métodos que usa gameStore.ts
// ✅ Siempre obtiene audio desde el backend (Deezer)

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// 🔧 CONFIGURACIÓN
const getBaseUrl = (): string => {
  if (__DEV__) {
    const LOCAL_IP = '192.168.1.10'; // ⚠️ CAMBIA POR TU IP
    return `http://${LOCAL_IP}:3000`;
  }
  return 'https://api.hitback.com';
};

// 📋 TIPOS
interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentUrl: string | null;
  duration: number;
  position: number;
  error: string | null;
  isInitialized: boolean;
}

interface PlayOptions {
  url: string;
  onFinish?: () => void;
  onError?: (error: string) => void;
  duration?: number;
}

interface ConnectionInfo {
  backendConnected: boolean;
  baseUrl: string;
  timestamp: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  genre?: string;
  decade?: string;
  previewUrl?: string;
}

// 🏭 CLASE PRINCIPAL
class AudioService {
  private sound: Audio.Sound | null = null;
  private baseUrl: string;
  private playbackTimeout: NodeJS.Timeout | null = null;
  private onFinishCallback: (() => void) | null = null;

  private state: AudioState = {
    isPlaying: false,
    isLoading: false,
    currentUrl: null,
    duration: 0,
    position: 0,
    error: null,
    isInitialized: false,
  };

  constructor() {
    this.baseUrl = getBaseUrl();
    console.log(`🎵 AudioService initialized`);
    console.log(`   Base URL: ${this.baseUrl}`);
  }

  // ════════════════════════════════════════════════════════════
  // 🔧 MÉTODOS DE INICIALIZACIÓN (usados por gameStore)
  // ════════════════════════════════════════════════════════════

  /**
   * Inicializar el sistema de audio
   * ✅ Usado por gameStore.startGame()
   */
  async initializeAudio(): Promise<void> {
    if (this.state.isInitialized) {
      console.log('🎵 Audio already initialized');
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.state.isInitialized = true;
      console.log(`✅ Audio mode configured`);
    } catch (error) {
      console.error(`❌ Failed to initialize audio:`, error);
      throw error;
    }
  }

  /**
   * Actualizar URL base
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    console.log(`🔧 AudioService URL: ${url}`);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // ════════════════════════════════════════════════════════════
  // 🎵 MÉTODOS DE REPRODUCCIÓN
  // ════════════════════════════════════════════════════════════

  /**
   * Reproducir audio desde URL
   */
  async play(options: PlayOptions): Promise<boolean> {
    const { url, onFinish, onError, duration = 30 } = options;

    console.log(`\n🎵 AudioService.play`);
    console.log(`   URL: ${url}`);
    console.log(`   Duration: ${duration}s`);

    // Detener audio anterior
    await this.stopAudio();

    this.state.isLoading = true;
    this.state.error = null;
    this.onFinishCallback = onFinish || null;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, volume: 1.0 },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.state.isPlaying = true;
      this.state.isLoading = false;
      this.state.currentUrl = url;

      console.log(`✅ Audio playing`);

      // Timeout para detener después de la duración
      if (duration > 0) {
        this.playbackTimeout = setTimeout(() => {
          console.log(`⏰ Duration limit reached (${duration}s)`);
          this.stopAudio();
          if (this.onFinishCallback) {
            this.onFinishCallback();
          }
        }, duration * 1000);
      }

      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(`❌ Audio play failed:`, errorMessage);

      this.state.isLoading = false;
      this.state.isPlaying = false;
      this.state.error = errorMessage;

      if (onError) {
        onError(errorMessage);
      }

      return false;
    }
  }

  /**
   * Callback de estado de reproducción
   */
  private onPlaybackStatusUpdate(status: any): void {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`❌ Playback error: ${status.error}`);
        this.state.error = status.error;
      }
      return;
    }

    this.state.isPlaying = status.isPlaying;
    this.state.duration = status.durationMillis
      ? status.durationMillis / 1000
      : 0;
    this.state.position = status.positionMillis
      ? status.positionMillis / 1000
      : 0;

    if (status.didJustFinish && !status.isLooping) {
      console.log(`🏁 Audio finished naturally`);
      this.cleanup();
      if (this.onFinishCallback) {
        this.onFinishCallback();
      }
    }
  }

  /**
   * Detener audio
   * ✅ Usado por gameStore.createNewGame() y gameStore.endGame()
   */
  async stopAudio(): Promise<void> {
    console.log(`⏹️ AudioService.stopAudio`);

    this.cleanup();

    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        // Ignorar errores al detener
      }
      this.sound = null;
    }

    this.state.isPlaying = false;
    this.state.currentUrl = null;
  }

  /**
   * Alias de stopAudio para compatibilidad
   */
  async stop(): Promise<void> {
    return this.stopAudio();
  }

  /**
   * Pausar audio
   */
  async pause(): Promise<void> {
    if (this.sound && this.state.isPlaying) {
      try {
        await this.sound.pauseAsync();
        this.state.isPlaying = false;
        console.log(`⏸️ Audio paused`);
      } catch (error) {
        console.error(`❌ Pause failed:`, error);
      }
    }
  }

  /**
   * Reanudar audio
   */
  async resume(): Promise<void> {
    if (this.sound && !this.state.isPlaying) {
      try {
        await this.sound.playAsync();
        this.state.isPlaying = true;
        console.log(`▶️ Audio resumed`);
      } catch (error) {
        console.error(`❌ Resume failed:`, error);
      }
    }
  }

  /**
   * Ajustar volumen
   */
  async setVolume(volume: number): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
      } catch (error) {
        console.error(`❌ Set volume failed:`, error);
      }
    }
  }

  /**
   * Limpiar recursos
   */
  private cleanup(): void {
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }
  }

  // ════════════════════════════════════════════════════════════
  // 🌐 MÉTODOS DE CONEXIÓN (usados por gameStore)
  // ════════════════════════════════════════════════════════════

  /**
   * Test de conexión al backend
   * ✅ Usado por gameStore.checkBackendConnection()
   */
  async testConnection(): Promise<boolean> {
    console.log(`🧪 Testing connection to ${this.baseUrl}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/health`, {
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

  /**
   * Obtener info de conexión
   * ✅ Usado por gameStore.syncWithBackend()
   */
  async getConnectionInfo(): Promise<ConnectionInfo> {
    const isConnected = await this.testConnection();

    return {
      backendConnected: isConnected,
      baseUrl: this.baseUrl,
      timestamp: new Date().toISOString(),
    };
  }

  // ════════════════════════════════════════════════════════════
  // 📚 MÉTODOS DE TRACKS (usados por gameStore)
  // ════════════════════════════════════════════════════════════

  /**
   * Obtener todos los tracks
   * ✅ Usado por gameStore.syncWithBackend()
   */
  async getAllTracks(): Promise<Track[]> {
    console.log(`📚 AudioService.getAllTracks`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/api/tracks`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Manejar diferentes estructuras de respuesta
      let tracks: Track[] = [];

      if (data.data?.tracks) {
        tracks = data.data.tracks;
      } else if (data.tracks) {
        tracks = data.tracks;
      } else if (Array.isArray(data.data)) {
        tracks = data.data;
      } else if (Array.isArray(data)) {
        tracks = data;
      }

      console.log(`✅ ${tracks.length} tracks retrieved`);
      return tracks;
    } catch (error) {
      console.error(`❌ getAllTracks failed:`, error);
      return [];
    }
  }

  // ════════════════════════════════════════════════════════════
  // 📊 MÉTODOS DE ESTADO
  // ════════════════════════════════════════════════════════════

  /**
   * Obtener estado actual
   */
  getState(): AudioState {
    return { ...this.state };
  }

  /**
   * ¿Está reproduciendo?
   */
  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * ¿Está inicializado?
   */
  isInitialized(): boolean {
    return this.state.isInitialized;
  }

  // ════════════════════════════════════════════════════════════
  // 🧪 MÉTODOS DE TEST
  // ════════════════════════════════════════════════════════════

  /**
   * Test de reproducción de audio
   */
  async testAudio(): Promise<{ success: boolean; error?: string }> {
    const testUrl = 'https://www.soundjay.com/buttons/beep-01a.mp3';

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: testUrl },
        { shouldPlay: false }
      );

      await sound.unloadAsync();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Liberar todos los recursos
   */
  async dispose(): Promise<void> {
    await this.stopAudio();
    this.state.isInitialized = false;
    console.log(`🧹 AudioService disposed`);
  }
}

// 🏭 Exportar instancia singleton
export const audioService = new AudioService();

// También exportar la clase
export { AudioService };
export type { AudioState, PlayOptions, ConnectionInfo, Track };
