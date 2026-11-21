// services/audioService.ts - HITBACK Audio Service COMPLETO
// ✅ Todos los métodos que usa gameStore.ts
// ✅ Siempre obtiene audio desde el backend (Deezer)

import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

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
  private player: AudioPlayer | null = null;
  private statusSubscription: { remove: () => void } | null = null;
  private baseUrl: string;
  private playbackTimeout: ReturnType<typeof setTimeout> | null = null;
  private onFinishCallback: (() => void) | null = null;
  private hasFinished = false;

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
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
        allowsRecording: false,
        shouldRouteThroughEarpiece: false,
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
    this.hasFinished = false;

    try {
      const player = createAudioPlayer(url);
      player.volume = 1.0;
      this.player = player;
      this.state.currentUrl = url;

      this.statusSubscription = player.addListener('playbackStatusUpdate', (status) => {
        this.onPlaybackStatusUpdate(status);
      });

      player.play();
      this.state.isPlaying = true;
      this.state.isLoading = false;

      console.log(`✅ Audio playing`);

      // Timeout para detener después de la duración
      if (duration > 0) {
        this.playbackTimeout = setTimeout(() => {
          console.log(`⏰ Duration limit reached (${duration}s)`);
          this.finishPlayback();
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
    if (!status?.isLoaded) return;

    this.state.isPlaying = !!status.playing;
    this.state.duration = status.duration || 0;
    this.state.position = status.currentTime || 0;

    if (status.didJustFinish && !this.hasFinished) {
      console.log(`🏁 Audio finished naturally`);
      this.finishPlayback();
    }
  }

  private finishPlayback(): void {
    if (this.hasFinished) return;
    this.hasFinished = true;
    this.cleanup();
    const cb = this.onFinishCallback;
    this.onFinishCallback = null;
    // Stop player async but don't block callback
    if (this.player) {
      try { this.player.pause(); } catch {}
    }
    this.state.isPlaying = false;
    if (cb) cb();
  }

  /**
   * Detener audio
   * ✅ Usado por gameStore.createNewGame() y gameStore.endGame()
   */
  async stopAudio(): Promise<void> {
    console.log(`⏹️ AudioService.stopAudio`);

    this.cleanup();
    this.hasFinished = true; // prevent late callbacks

    if (this.statusSubscription) {
      try { this.statusSubscription.remove(); } catch {}
      this.statusSubscription = null;
    }

    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch (error) {
        // Ignorar errores al detener
      }
      this.player = null;
    }

    this.state.isPlaying = false;
    this.state.currentUrl = null;
    this.onFinishCallback = null;
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
    if (this.player && this.state.isPlaying) {
      try {
        this.player.pause();
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
    if (this.player && !this.state.isPlaying) {
      try {
        this.player.play();
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
    if (this.player) {
      try {
        this.player.volume = Math.max(0, Math.min(1, volume));
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
      const player = createAudioPlayer(testUrl);
      // Give it a moment to be created; then clean up
      setTimeout(() => {
        try { player.remove(); } catch {}
      }, 500);
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
