import { Audio } from 'expo-av';
import { AudioPlayback } from '@/types/game.types';

class AudioService {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;
  private currentUrl: string | null = null;
  private playbackTimer: NodeJS.Timeout | null = null;

  async initializeAudio() {
    try {
      // Configuración mínima y segura
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('✅ Audio service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize audio service:', error);
      // No lanzar error, continuar sin audio si es necesario
    }
  }

  // Play track preview for 5 seconds
  async playTrackPreview(
    url: string,
    duration: number = 5000,
    onComplete?: () => void
  ): Promise<void> {
    try {
      await this.stopAudio();

      if (!url) {
        throw new Error('URL de audio no proporcionada');
      }

      console.log(`🎵 Playing track preview: ${url}`);

      // Crear y cargar sonido
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        {
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        }
      );

      this.sound = sound;
      this.currentUrl = url;
      this.isPlaying = true;

      // Auto-stop después del tiempo especificado
      this.playbackTimer = setTimeout(async () => {
        await this.stopAudio();
        onComplete?.();
      }, duration);
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      this.isPlaying = false;
      // No lanzar error, mostrar mensaje en UI
      throw new Error(
        'No se pudo reproducir el audio. Verifica tu conexión a internet.'
      );
    }
  }

  // Stop audio immediately
  async stopAudio(): Promise<void> {
    try {
      if (this.playbackTimer) {
        clearTimeout(this.playbackTimer);
        this.playbackTimer = null;
      }

      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      this.isPlaying = false;
      this.currentUrl = null;
      console.log('🔇 Audio stopped');
    } catch (error) {
      console.error('❌ Error stopping audio:', error);
      // Reset state even if there's an error
      this.sound = null;
      this.isPlaying = false;
      this.currentUrl = null;
    }
  }

  // Pause/Resume functionality
  async pauseAudio(): Promise<void> {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }

  async resumeAudio(): Promise<void> {
    try {
      if (this.sound && !this.isPlaying) {
        await this.sound.playAsync();
        this.isPlaying = true;
      }
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  }

  // Set volume
  async setVolume(volume: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  // Get current playback status
  getCurrentStatus(): { isPlaying: boolean; currentUrl: string | null } {
    return {
      isPlaying: this.isPlaying,
      currentUrl: this.currentUrl,
    };
  }

  // Play sound effect for UI interactions (disabled until files are available)
  async playSoundEffect(
    type: 'success' | 'error' | 'scan' | 'combo'
  ): Promise<void> {
    // TODO: Implementar cuando tengamos los archivos de audio
    console.log(`🔊 Sound effect: ${type} (disabled - files not available)`);
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    await this.stopAudio();
  }

  // Test audio functionality with a sample URL
  async testAudio(): Promise<boolean> {
    try {
      const testUrl =
        'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
      await this.playTrackPreview(testUrl, 2000);
      return true;
    } catch (error) {
      console.error('Audio test failed:', error);
      return false;
    }
  }
}

export const audioService = new AudioService();
