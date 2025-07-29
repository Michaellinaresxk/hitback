import { Audio } from 'expo-av';

// 🔧 CHANGE THIS TO YOUR SERVER IP
const SERVER_URL = 'http://192.168.1.10:3000'; // ✅ TU IP

class AudioService {
  private sound: Audio.Sound | null = null;
  private isInitialized: boolean = false;

  async initializeAudio() {
    try {
      if (this.isInitialized) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      console.log('✅ Audio initialized successfully');
    } catch (error) {
      console.error('❌ Audio initialization failed:', error);
      throw error;
    }
  }

  // 🎵 MAIN FUNCTION: Scan QR and get card with audio
  async scanQRAndPlay(qrCode: string) {
    try {
      console.log(`🔍 Scanning QR: ${qrCode}`);

      // Llamada al backend
      const response = await fetch(`${SERVER_URL}/api/qr/scan/${qrCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'QR scan failed');
      }

      console.log(`✅ QR scan success: ${data.data.track.title}`);

      // 🎵 Reproducir audio si está disponible
      if (data.data.audio.hasAudio && data.data.audio.url) {
        try {
          // ✅ CORRECCIÓN: duration ya viene en segundos desde el backend
          await this.playAudio(
            data.data.audio.url,
            data.data.audio.duration * 1000 // Convertir a milisegundos
          );
          console.log('🎵 Audio playing successfully');
        } catch (audioError) {
          console.warn(
            '⚠️ Audio playback failed, but QR scan succeeded:',
            audioError
          );
        }
      } else {
        console.warn('⚠️ No audio available for this track');
      }

      return data;
    } catch (error) {
      console.error('❌ QR scan error:', error);
      throw error;
    }
  }

  // 🎵 Play audio from your backend
  async playAudio(audioUrl: string, duration: number = 5000) {
    try {
      if (!this.isInitialized) {
        await this.initializeAudio();
      }

      await this.stopAudio();

      console.log(`🎵 Playing audio: ${audioUrl}`);

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, volume: 1.0 }
      );

      this.sound = sound;

      // Auto stop after duration
      setTimeout(async () => {
        await this.stopAudio();
        console.log('⏹️ Audio finished automatically');
      }, duration);
    } catch (error) {
      console.error('❌ Audio play error:', error);
      throw new Error('No se pudo reproducir el audio');
    }
  }

  async stopAudio() {
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

  // 🧪 Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      console.log(`🧪 Testing connection to: ${SERVER_URL}`);

      const response = await fetch(`${SERVER_URL}/api/health`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`❌ Backend responded with status: ${response.status}`);
        return false;
      }

      const data = await response.json();
      const isConnected = data.success && data.data?.status === 'healthy';

      console.log(
        isConnected
          ? '✅ Backend connected'
          : '❌ Backend not responding properly'
      );
      return isConnected;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  // 🔍 Validate QR code format
  async validateQRCode(qrCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${SERVER_URL}/api/qr/validate/${qrCode}`);
      const data = await response.json();
      return data.success && data.data.isValid;
    } catch (error) {
      console.error('❌ Failed to validate QR:', error);
      return false;
    }
  }

  // 🎵 Get all available tracks
  async getAllTracks(): Promise<any[]> {
    try {
      const response = await fetch(`${SERVER_URL}/api/tracks`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('❌ Failed to get tracks:', error);
      return [];
    }
  }

  // 🎯 Get audio diagnostics
  async getAudioDiagnostics(): Promise<any> {
    try {
      const response = await fetch(`${SERVER_URL}/api/audio/diagnostics`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('❌ Failed to get audio diagnostics:', error);
      return null;
    }
  }

  getServerUrl(): string {
    return SERVER_URL;
  }

  // 📱 Get server info for debugging
  async getServerInfo(): Promise<any> {
    try {
      const response = await fetch(`${SERVER_URL}/api/health/detailed`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('❌ Failed to get server info:', error);
      return null;
    }
  }

  async cleanup() {
    await this.stopAudio();
    this.isInitialized = false;
  }
}

export const audioService = new AudioService();
