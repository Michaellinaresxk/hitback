// services/soundEffectsService.ts - HITBACK Sound Effects Service
// 🔊 Maneja efectos de sonido del juego (SFX)

import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type SoundEffect = 'correct' | 'wrong' | 'victory';

const SOUND_FILES: Record<SoundEffect, any> = {
  correct: require('@/assets/sounds/correct.mp3'),
  wrong: require('@/assets/sounds/wrong.mp3'),
  victory: require('@/assets/sounds/victory.mp3'),
};

const DEFAULT_VOLUMES: Record<SoundEffect, number> = {
  correct: 0.8,
  wrong: 0.7,
  victory: 1.0,
};

interface SoundCache {
  player: AudioPlayer;
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

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔊 SoundEffects already initialized');
      return;
    }

    try {
      console.log('🔊 Initializing SoundEffectsService...');

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
        allowsRecording: false,
        shouldRouteThroughEarpiece: false,
      });

      await this.preloadAllSounds();

      this.isInitialized = true;
      console.log('✅ SoundEffectsService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SoundEffectsService:', error);
    }
  }

  private async preloadAllSounds(): Promise<void> {
    const effects: SoundEffect[] = ['correct', 'wrong', 'victory'];

    for (const effect of effects) {
      try {
        const player = createAudioPlayer(SOUND_FILES[effect]);
        player.volume = DEFAULT_VOLUMES[effect];
        this.soundCache.set(effect, { player, isLoaded: true });
        console.log(`  ✅ Preloaded: ${effect}`);
      } catch (error) {
        console.warn(`  ⚠️ Failed to preload ${effect}:`, error);
      }
    }
  }

  async play(effect: SoundEffect, volume?: number): Promise<void> {
    if (this.isMuted) return;

    try {
      const finalVolume = (volume ?? DEFAULT_VOLUMES[effect]) * this.masterVolume;
      const cached = this.soundCache.get(effect);

      if (cached?.isLoaded) {
        cached.player.volume = finalVolume;
        try {
          await cached.player.seekTo(0);
        } catch {}
        cached.player.play();
        console.log(`🔊 Playing: ${effect}`);
      } else {
        const player = createAudioPlayer(SOUND_FILES[effect]);
        player.volume = finalVolume;
        player.play();
        // Best-effort cleanup after a short delay
        setTimeout(() => {
          try { player.remove(); } catch {}
        }, 4000);
      }
    } catch (error) {
      console.error(`❌ Failed to play ${effect}:`, error);
    }
  }

  async playCorrect(): Promise<void> { await this.play('correct'); }
  async playWrong(): Promise<void> { await this.play('wrong'); }
  async playVictory(): Promise<void> { await this.play('victory'); }

  setMuted(muted: boolean): void { this.isMuted = muted; }
  toggleMute(): boolean { this.isMuted = !this.isMuted; return this.isMuted; }
  isSoundMuted(): boolean { return this.isMuted; }
  setMasterVolume(volume: number): void { this.masterVolume = Math.max(0, Math.min(1, volume)); }

  async dispose(): Promise<void> {
    for (const [, cached] of this.soundCache.entries()) {
      try {
        cached.player.remove();
      } catch {}
    }
    this.soundCache.clear();
    this.isInitialized = false;
  }
}

export const soundEffects = new SoundEffectsService();
