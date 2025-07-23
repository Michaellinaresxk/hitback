import { Audio } from 'expo-av';
import { AudioPlayback } from '@/types/game.types';

class AudioService {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;
  private currentUrl: string | null = null;
  private playbackTimer: NodeJS.Timeout | null = null;
  private onPlaybackUpdate?: (status: AudioPlayback) => void;

  async initializeAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      console.log('Audio service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
  }

  // Play track preview for specified duration (default 5 seconds)
  async playTrackPreview(
    url: string,
    duration: number = 5000,
    onComplete?: () => void
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stopAudio();

      if (!url) {
        throw new Error('URL de audio no proporcionada');
      }

      // Create and load sound
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

      // Set up playback status updates
      this.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && this.onPlaybackUpdate) {
          this.onPlaybackUpdate({
            isPlaying: status.isPlaying || false,
            currentTime: status.positionMillis || 0,
            duration: status.durationMillis || duration,
            url: this.currentUrl,
          });
        }
      });

      // Auto-stop after specified duration
      this.playbackTimer = setTimeout(async () => {
        await this.stopAudio();
        onComplete?.();
      }, duration);
    } catch (error) {
      console.error('Error playing audio preview:', error);
      this.isPlaying = false;
      this.currentUrl = null;
      throw new Error('No se pudo reproducir el audio');
    }
  }

  // Stop current audio playback
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

      // Notify listeners
      if (this.onPlaybackUpdate) {
        this.onPlaybackUpdate({
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          url: null,
        });
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
      // Reset state even if stop fails
      this.isPlaying = false;
      this.currentUrl = null;
      this.sound = null;
    }
  }

  // Pause/Resume audio
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

  // Set volume (0.0 to 1.0)
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
  getPlaybackStatus(): AudioPlayback {
    return {
      isPlaying: this.isPlaying,
      currentTime: 0, // Would need to track this from status updates
      duration: 5000, // Default preview duration
      url: this.currentUrl,
    };
  }

  // Set callback for playback updates
  setOnPlaybackUpdate(callback: (status: AudioPlayback) => void) {
    this.onPlaybackUpdate = callback;
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    await this.stopAudio();
    this.onPlaybackUpdate = undefined;
  }

  // Play multiple previews in sequence (for speed round)
  async playSequentialPreviews(
    urls: string[],
    durationPerTrack: number = 6000,
    onTrackChange?: (index: number) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      for (let i = 0; i < urls.length; i++) {
        onTrackChange?.(i);

        await new Promise<void>((resolve) => {
          this.playTrackPreview(urls[i], durationPerTrack, resolve);
        });

        // Small gap between tracks
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      onComplete?.();
    } catch (error) {
      console.error('Error playing sequential previews:', error);
      throw error;
    }
  }

  // Test audio playback with a sample track
  async testAudioPlayback(): Promise<boolean> {
    try {
      // Use a test tone or sample audio
      const testUrl =
        'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
      await this.playTrackPreview(testUrl, 1000);
      return true;
    } catch (error) {
      console.error('Audio test failed:', error);
      return false;
    }
  }

  // Handle different audio formats
  private isValidAudioUrl(url: string): boolean {
    const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg'];
    return validExtensions.some((ext) => url.toLowerCase().includes(ext));
  }

  // Get audio format from URL
  private getAudioFormat(url: string): string {
    if (url.includes('.mp3')) return 'mp3';
    if (url.includes('.wav')) return 'wav';
    if (url.includes('.m4a')) return 'm4a';
    if (url.includes('.ogg')) return 'ogg';
    return 'unknown';
  }
}

export const audioService = new AudioService();
