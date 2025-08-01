import { Audio } from 'expo-av';
import Constants from 'expo-constants';

interface BackendTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  genre: string;
  decade: string;
  popularity: number;
  duration: number;
  audioFile: string;
  audioSource: 'local' | 'none';
  hasAudio: boolean;
  hasQuestions: boolean;
  availableCardTypes: string[];
  questionCount: number;
  lastUpdated: string;
  questions: {
    song: QuestionDetails;
    artist: QuestionDetails;
    decade: QuestionDetails;
    lyrics: QuestionDetails;
    challenge: ChallengeQuestionDetails;
  };
}

interface QuestionDetails {
  question: string;
  answer: string;
  points: number;
  hints: string[];
}

interface ChallengeQuestionDetails extends QuestionDetails {
  challengeType: 'dance' | 'sing' | 'imitate' | 'performance';
}

interface ProcessedScanResponse {
  success: boolean;
  card?: {
    // QR info (generado por nosotros)
    qrCode: string;
    trackId: string;
    cardType: string;
    difficulty: string;
    track: {
      id: string;
      title: string;
      artist: string;
      album: string;
      year: number;
      genre: string;
    };
    question: string;
    answer: string;
    points: number;
    hints: string[];
    challengeType?: string;
    audio: {
      hasAudio: boolean;
      url: string;
      duration: number;
    };
  };
  error?: { message: string };
}
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
      console.log('✅ AudioManager initialized successfully');
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
      console.log(`🎵 Playing preview: ${audioUrl} (max ${maxDuration}ms)`);

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

      setTimeout(async () => {
        await this.stop();
        console.log('⏹️ Audio stopped after max duration');
        onFinished?.();
      }, maxDuration);

      console.log('✅ Audio preview started successfully');
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

class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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

      const data = await response.json();
      return data;
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
}

class ServerConfig {
  private static readonly YOUR_IP = '192.168.1.10';
  private static readonly PORT = '3000';

  static getServerUrl(): string {
    if (__DEV__ && Constants.expoConfig?.hostUri) {
      const hostUri = Constants.expoConfig.hostUri.split(':')[0];
      if (hostUri && hostUri !== 'localhost' && !hostUri.startsWith('127.')) {
        return `http://${hostUri}:${this.PORT}`;
      }
    }
    return `http://${this.YOUR_IP}:${this.PORT}`;
  }
}

class QRCodeParser {
  static parseQRCode(qrCode: string): {
    trackId: string;
    cardType: string;
    difficulty: string;
  } | null {
    try {
      if (!qrCode.startsWith('HITBACK_')) {
        return null;
      }

      const parts = qrCode.split('_');
      if (parts.length !== 4) {
        return null;
      }

      const [prefix, trackId, cardType, difficulty] = parts;

      return {
        trackId: trackId,
        cardType: cardType.toLowerCase(),
        difficulty: difficulty.toLowerCase(),
      };
    } catch (error) {
      console.error('Error parsing QR code:', error);
      return null;
    }
  }

  static isValidQRFormat(qrCode: string): boolean {
    return this.parseQRCode(qrCode) !== null;
  }
}

class BackendDataProcessor {
  static processTrackData(
    backendTrack: BackendTrack,
    qrCode: string,
    serverUrl: string
  ): ProcessedScanResponse {
    try {
      const qrData = QRCodeParser.parseQRCode(qrCode);
      if (!qrData) {
        throw new Error('Invalid QR code format');
      }

      const questionData =
        backendTrack.questions[
          qrData.cardType as keyof typeof backendTrack.questions
        ];
      if (!questionData) {
        throw new Error(`No question data for card type: ${qrData.cardType}`);
      }

      const audioUrl = backendTrack.hasAudio
        ? `${serverUrl}/audio/tracks/${backendTrack.audioFile}`
        : '';
      const difficultyMultiplier = this.getDifficultyMultiplier(
        qrData.difficulty
      );
      const finalPoints = Math.round(
        questionData.points * difficultyMultiplier
      );

      const processedCard = {
        qrCode: qrCode,
        trackId: backendTrack.id,
        cardType: qrData.cardType,
        difficulty: qrData.difficulty,

        track: {
          id: backendTrack.id,
          title: backendTrack.title,
          artist: backendTrack.artist,
          album: backendTrack.album,
          year: backendTrack.year,
          genre: backendTrack.genre,
        },

        question: questionData.question,
        answer: questionData.answer,
        points: finalPoints,
        hints: questionData.hints || [],
        challengeType:
          'challengeType' in questionData
            ? questionData.challengeType
            : undefined,

        audio: {
          hasAudio: backendTrack.hasAudio,
          url: audioUrl,
          duration: 5,
        },
      };

      return {
        success: true,
        card: processedCard,
      };
    } catch (error) {
      console.error('❌ Error processing track data:', error);
      return {
        success: false,
        error: { message: error.message },
      };
    }
  }

  private static getDifficultyMultiplier(difficulty: string): number {
    const multipliers = {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3,
    };
    return multipliers[difficulty as keyof typeof multipliers] || 1;
  }
}
class LocalTracksDatabase {
  private tracks: BackendTrack[] = [];

  constructor() {
    this.initializeLocalTracks();
  }

  private initializeLocalTracks() {
    this.tracks = [
      {
        id: '001',
        title: 'Despacito',
        artist: 'Luis Fonsi ft. Daddy Yankee',
        album: 'Vida',
        year: 2017,
        genre: 'Reggaeton',
        decade: '2010s',
        popularity: 95,
        duration: 229000,
        audioFile: '001_despacito.mp3',
        audioSource: 'local',
        hasAudio: true,
        hasQuestions: true,
        availableCardTypes: ['song', 'artist', 'decade', 'lyrics', 'challenge'],
        questionCount: 5,
        lastUpdated: '2024-01-15T10:00:00.000Z',
        questions: {
          song: {
            question: '¿Cuál es la canción?',
            answer: 'Despacito',
            points: 1,
            hints: ['Es un hit de reggaeton', 'Luis Fonsi la canta'],
          },
          artist: {
            question: '¿Quién canta esta canción?',
            answer: 'Luis Fonsi ft. Daddy Yankee',
            points: 2,
            hints: ['Colaboración entre dos artistas', 'Uno es puertorriqueño'],
          },
          decade: {
            question: '¿De qué década es esta canción?',
            answer: '2010s',
            points: 3,
            hints: ['Es relativamente reciente', 'Se hizo viral en YouTube'],
          },
          lyrics: {
            question: "Completa: 'Sí, sabes que ya llevo un rato...'",
            answer: 'mirándote',
            points: 3,
            hints: ['Primera línea de la canción', 'Habla de observar'],
          },
          challenge: {
            question: 'Baila los primeros 10 segundos de Despacito',
            answer: 'Completar baile reggaeton',
            points: 5,
            challengeType: 'dance',
            hints: ['Movimientos de reggaeton', 'Ritmo lento y sensual'],
          },
        },
      },
      {
        id: '002',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        year: 1975,
        genre: 'Rock',
        decade: '1970s',
        popularity: 90,
        duration: 355000,
        audioFile: '002_bohemian_rhapsody.mp3',
        audioSource: 'local',
        hasAudio: true,
        hasQuestions: true,
        availableCardTypes: ['song', 'artist', 'decade', 'lyrics', 'challenge'],
        questionCount: 5,
        lastUpdated: '2024-01-15T10:00:00.000Z',
        questions: {
          song: {
            question: '¿Cuál es la canción?',
            answer: 'Bohemian Rhapsody',
            points: 1,
            hints: ['Clásico del rock', 'Tiene una parte operística'],
          },
          artist: {
            question: '¿Quién canta esta canción?',
            answer: 'Queen',
            points: 2,
            hints: ['Banda británica', 'Freddie Mercury era el vocalista'],
          },
          decade: {
            question: '¿De qué década es esta canción?',
            answer: '1970s',
            points: 3,
            hints: ['Era del rock clásico', 'Antes de los 80s'],
          },
          lyrics: {
            question: "Completa: 'Is this the real life...'",
            answer: 'is this just fantasy',
            points: 3,
            hints: ['Primera línea icónica', 'Pregunta existencial'],
          },
          challenge: {
            question: 'Imita a Freddie Mercury cantando la canción',
            answer: 'Completar imitación de Freddie',
            points: 5,
            challengeType: 'imitate',
            hints: ['Movimientos teatrales', 'Voz potente y dramática'],
          },
        },
      },
    ];
  }

  getTrackById(id: string): BackendTrack | null {
    return this.tracks.find((track) => track.id === id) || null;
  }

  getAllTracks(): BackendTrack[] {
    return this.tracks;
  }
}

class AudioService {
  private httpClient: HttpClient;
  private audioManager: AudioManager;
  private localDatabase: LocalTracksDatabase;

  constructor() {
    const serverUrl = ServerConfig.getServerUrl();
    this.httpClient = new HttpClient(serverUrl);
    this.audioManager = new AudioManager();
    this.localDatabase = new LocalTracksDatabase();
  }

  async initializeAudio(): Promise<void> {
    await this.audioManager.initialize();
  }

  async scanQRAndPlay(qrCode: string): Promise<ProcessedScanResponse> {
    try {
      console.log(`🔍 Scanning QR: ${qrCode}`);

      const qrData = QRCodeParser.parseQRCode(qrCode);
      if (!qrData) {
        throw new Error('Invalid QR code format');
      }

      console.log('📋 Parsed QR:', qrData);

      let backendTrack: BackendTrack | null = null;

      try {
        console.log(`🌐 Trying backend for track: ${qrData.trackId}`);
        const response = await this.httpClient.get(
          `/api/tracks/${qrData.trackId}`
        );

        if (response.success && response.data) {
          backendTrack = response.data;
          console.log('✅ Got track from backend');
        }
      } catch (error) {
        console.log('⚠️ Backend unavailable, using local database');
      }
      if (!backendTrack) {
        backendTrack = this.localDatabase.getTrackById(qrData.trackId);
        if (!backendTrack) {
          throw new Error(`Track not found: ${qrData.trackId}`);
        }
        console.log('✅ Got track from local database');
      }

      const processedResponse = BackendDataProcessor.processTrackData(
        backendTrack,
        qrCode,
        this.getServerUrl()
      );

      if (!processedResponse.success) {
        throw new Error(
          processedResponse.error?.message || 'Failed to process track data'
        );
      }

      console.log(
        '✅ Card processed successfully:',
        processedResponse.card?.track.title
      );
      return processedResponse;
    } catch (error) {
      console.error('❌ QR scan error:', error);
      return {
        success: false,
        error: { message: error.message || 'Unknown error' },
      };
    }
  }

  async playTrackPreview(
    audioUrl: string,
    duration: number = 5000,
    onFinished?: () => void
  ): Promise<void> {
    return this.audioManager.playTrackPreview(audioUrl, duration, onFinished);
  }

  async stopAudio(): Promise<void> {
    return this.audioManager.stop();
  }

  isPlaying(): boolean {
    return this.audioManager.isPlaying();
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/api/health');
      return response.success && response.data?.status === 'healthy';
    } catch (error) {
      console.error('❌ Health check failed, using local mode');
      return true;
    }
  }

  getServerUrl(): string {
    return ServerConfig.getServerUrl();
  }

  async cleanup(): Promise<void> {
    await this.audioManager.cleanup();
  }

  async saveGameStats(gameStats: any): Promise<void> {
    try {
      await this.httpClient.post('/api/game/stats', gameStats);
    } catch (error) {
      console.error('Failed to save game stats (local mode):', error);
    }
  }

  async validateQRCode(qrCode: string): Promise<boolean> {
    try {
      if (!QRCodeParser.isValidQRFormat(qrCode)) {
        return false;
      }

      const response = await this.httpClient.get(`/api/qr/validate/${qrCode}`);
      return response.success && response.data?.isValid === true;
    } catch (error) {
      const qrData = QRCodeParser.parseQRCode(qrCode);
      if (!qrData) return false;

      const track = this.localDatabase.getTrackById(qrData.trackId);
      return !!track;
    }
  }

  async getAllTracks(): Promise<BackendTrack[]> {
    try {
      const response = await this.httpClient.get('/api/tracks');
      return response.success
        ? response.data || []
        : this.localDatabase.getAllTracks();
    } catch (error) {
      return this.localDatabase.getAllTracks();
    }
  }

  async getConnectionInfo(): Promise<any> {
    const serverUrl = this.getServerUrl();
    const isExpoDevMode = __DEV__ && !!Constants.expoConfig?.hostUri;

    return {
      serverUrl,
      isExpoDevMode,
      expoHostUri: Constants.expoConfig?.hostUri || null,
      localTracksCount: this.localDatabase.getAllTracks().length,
    };
  }
}

export const audioService = new AudioService();
export type { BackendTrack, ProcessedScanResponse };
