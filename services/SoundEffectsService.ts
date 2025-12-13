// services/soundEffectsService.ts - HITBACK Sound Effects Service
// 🔊 Maneja efectos de sonido del juego (SFX)

import { Audio, AVPlaybackSource } from 'expo-av';

// 🎵 Tipos de efectos de sonido disponibles
export type SoundEffect = 'correct' | 'wrong' | 'victory';

// 📁 Mapeo de efectos a archivos en assets/sounds/
const SOUND_FILES: Record<SoundEffect, AVPlaybackSource> = {
  correct: require('@/assets/sounds/correct.mp3'),
  wrong: require('@/assets/sounds/wrong.mp3'),
  victory: require('@/assets/sounds/victory.mp3'),
};

// 🎚️ Volúmenes por defecto
const DEFAULT_VOLUMES: Record<SoundEffect, number> = {
  correct: 0.8,
  wrong: 0.7,
  victory: 1.0,
};

interface SoundCache {
  sound: Audio.Sound;
  isLoaded: boolean;
}

class SoundEffectsService {
  private soundCache: Map<SoundEffect, SoundCache> = new Map();
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private masterVolume: number = 1.0;

  constructor() {
    console.log('🔊 SoundEffectsService created');
  }

  /**
   * Inicializar y precargar todos los sonidos
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔊 SoundEffects already initialized');
      return;
    }

    try {
      console.log('🔊 Initializing SoundEffectsService...');

      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Precargar los 3 sonidos
      await this.preloadAllSounds();

      this.isInitialized = true;
      console.log('✅ SoundEffectsService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SoundEffectsService:', error);
    }
  }

  /**
   * Precargar todos los sonidos
   */
  private async preloadAllSounds(): Promise<void> {
    const effects: SoundEffect[] = ['correct', 'wrong', 'victory'];

    for (const effect of effects) {
      try {
        const { sound } = await Audio.Sound.createAsync(SOUND_FILES[effect], {
          shouldPlay: false,
          volume: DEFAULT_VOLUMES[effect],
        });

        this.soundCache.set(effect, { sound, isLoaded: true });
        console.log(`  ✅ Preloaded: ${effect}`);
      } catch (error) {
        console.warn(`  ⚠️ Failed to preload ${effect}:`, error);
      }
    }
  }

  /**
   * Reproducir un efecto de sonido
   */
  async play(effect: SoundEffect, volume?: number): Promise<void> {
    if (this.isMuted) {
      return;
    }

    try {
      const finalVolume =
        (volume ?? DEFAULT_VOLUMES[effect]) * this.masterVolume;
      const cached = this.soundCache.get(effect);

      if (cached?.isLoaded) {
        await cached.sound.setPositionAsync(0);
        await cached.sound.setVolumeAsync(finalVolume);
        await cached.sound.playAsync();
        console.log(`🔊 Playing: ${effect}`);
      } else {
        // Fallback: cargar on-demand
        const { sound } = await Audio.Sound.createAsync(SOUND_FILES[effect], {
          shouldPlay: true,
          volume: finalVolume,
        });

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
          }
        });
      }
    } catch (error) {
      console.error(`❌ Failed to play ${effect}:`, error);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 🎮 MÉTODOS DE CONVENIENCIA
  // ═══════════════════════════════════════════════════════════════

  /** Sonido de respuesta correcta */
  async playCorrect(): Promise<void> {
    await this.play('correct');
  }

  /** Sonido cuando nadie respondió / respuesta incorrecta */
  async playWrong(): Promise<void> {
    await this.play('wrong');
  }

  /** Sonido de victoria final */
  async playVictory(): Promise<void> {
    await this.play('victory');
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔊 CONTROL
  // ═══════════════════════════════════════════════════════════════

  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  isSoundMuted(): boolean {
    return this.isMuted;
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Liberar recursos
   */
  async dispose(): Promise<void> {
    for (const [, cached] of this.soundCache.entries()) {
      try {
        if (cached.isLoaded) {
          await cached.sound.unloadAsync();
        }
      } catch {
        // Ignorar
      }
    }
    this.soundCache.clear();
    this.isInitialized = false;
  }
}

// 🏭 Singleton
export const soundEffects = new SoundEffectsService();
