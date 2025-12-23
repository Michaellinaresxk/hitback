// services/gameSessionService.ts - HITBACK Game Session Service
// ✅ Conecta con el nuevo API v2 (SIN QR)
// ✅ Maneja sesiones de juego completas
// ✅ Control 100% desde la app

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
export interface SessionConfig {
  players: string[];
  genres: string[];
  decades: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'ANY';
  targetScore: number;
  timeLimit: number;
  tokensPerPlayer: number;
  powerCardsPerPlayer: number;
}

export interface SessionPlayer {
  id: string;
  name: string;
  score: number;
  tokens: number;
  powerCards: any[];
  stats: {
    correctAnswers: number;
    wrongAnswers: number;
    tokensWon: number;
    tokensLost: number;
  };
}

export interface GameSession {
  id: string;
  status: 'created' | 'playing' | 'paused' | 'finished';
  createdAt: string;
  config: SessionConfig;
  players: SessionPlayer[];
  currentPlayerIndex: number;
  round: number;
  usedTrackIds: string[];
  currentRound: CurrentRound | null;
  timeRemaining: number;
  startedAt: string | null;
}

export interface CurrentRound {
  number: number;
  track: {
    id: string;
    genre: string;
    decade: string;
    audioUrl: string | null;
    audioSource: string;
  };
  question: {
    type: 'song' | 'artist' | 'decade' | 'year' | 'lyrics' | 'challenge';
    text: string;
    icon: string;
    points: number;
    hints: string[];
    isChallenge: boolean;
  };
  gameMasterAnswer?: {
    correct: string;
    trackTitle: string;
    trackArtist: string;
    acceptableAnswers?: string[];
  };
}

export interface RoundResult {
  correctAnswer: string;
  trackInfo: {
    title: string;
    artist: string;
  };
  winner: {
    id: string;
    name: string;
    newScore: number;
  } | null;
  pointsAwarded: number;
  tokensLost: Record<string, number>;
  tokensWon: number;
  gameOver?: boolean;
  gameWinner?: {
    id: string;
    name: string;
    score: number;
  };
}

export interface BetInfo {
  tokens: number;
  multiplier: number;
}

// 🏭 CLASE PRINCIPAL
class GameSessionService {
  private baseUrl: string;
  private timeout: number = 15000;
  private currentSessionId: string | null = null;

  constructor() {
    this.baseUrl = getBaseUrl();
    console.log(`🎮 GameSessionService initialized`);
    console.log(`   Base URL: ${this.baseUrl}/api/v2/game`);
  }

  // ════════════════════════════════════════════════════════════
  // 🔧 CONFIGURACIÓN
  // ════════════════════════════════════════════════════════════

  setBaseUrl(url: string): void {
    this.baseUrl = url;
    console.log(`🔧 GameSessionService URL: ${url}`);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // ════════════════════════════════════════════════════════════
  // 🌐 FETCH HELPER
  // ════════════════════════════════════════════════════════════

  private async fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v2/game${endpoint}`;

    console.log(`🌐 API Call: ${options.method || 'GET'} ${endpoint}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error del servidor');
      }

      return data;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Timeout: El servidor no respondió');
      }
      throw error;
    }
  }

  // ════════════════════════════════════════════════════════════
  // 📋 CREAR SESIÓN
  // ════════════════════════════════════════════════════════════

  /**
   * Crea una nueva sesión de juego
   */
  async createSession(config: Partial<SessionConfig>): Promise<{
    success: boolean;
    session: GameSession;
  }> {
    console.log(`📋 Creating session...`, config);

    const result = await this.fetchAPI<{
      success: boolean;
      session: GameSession;
    }>('/session', {
      method: 'POST',
      body: JSON.stringify(config),
    });

    if (result.success && result.session) {
      this.currentSessionId = result.session.id;
      console.log(`✅ Session created: ${this.currentSessionId}`);
    }

    return result;
  }

  // ════════════════════════════════════════════════════════════
  // ▶️ INICIAR JUEGO
  // ════════════════════════════════════════════════════════════

  /**
   * Inicia la partida
   */
  async startGame(sessionId?: string): Promise<{
    success: boolean;
    session: GameSession;
  }> {
    const id = sessionId || this.currentSessionId;

    if (!id) {
      throw new Error('No hay sesión activa');
    }

    console.log(`▶️ Starting game: ${id}`);

    return this.fetchAPI(`/session/${id}/start`, {
      method: 'POST',
    });
  }

  // ════════════════════════════════════════════════════════════
  // 🎵 SIGUIENTE RONDA
  // ════════════════════════════════════════════════════════════

  /**
   * Obtiene la siguiente ronda (track + pregunta aleatorios)
   * ✅ Este es el reemplazo del QR scan
   */
  async nextRound(
    sessionId?: string,
    forceQuestionType?: string
  ): Promise<{
    success: boolean;
    round?: {
      number: number;
      track: CurrentRound['track'];
      question: CurrentRound['question'];
    };
    gameOver?: boolean;
    winner?: any;
  }> {
    const id = sessionId || this.currentSessionId;

    if (!id) {
      throw new Error('No hay sesión activa');
    }

    console.log(`🎵 Getting next round for session: ${id}`);

    const body: any = {};
    if (forceQuestionType) {
      body.forceQuestionType = forceQuestionType;
    }

    return this.fetchAPI(`/session/${id}/round`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ════════════════════════════════════════════════════════════
  // 🎰 REGISTRAR APUESTAS
  // ════════════════════════════════════════════════════════════

  /**
   * Registra la apuesta de un jugador
   */
  async placeBet(
    playerId: string,
    tokens: number,
    sessionId?: string
  ): Promise<{
    success: boolean;
    bet: BetInfo;
    playerTokens: number;
  }> {
    const id = sessionId || this.currentSessionId;

    if (!id) {
      throw new Error('No hay sesión activa');
    }

    console.log(`🎰 Placing bet: player=${playerId}, tokens=${tokens}`);

    return this.fetchAPI(`/session/${id}/bet`, {
      method: 'POST',
      body: JSON.stringify({ playerId, tokens }),
    });
  }

  // ════════════════════════════════════════════════════════════
  // ✅ REVELAR RESPUESTA
  // ════════════════════════════════════════════════════════════

  /**
   * Revela la respuesta y asigna puntos al ganador
   */
  async revealAnswer(
    winnerId: string | null,
    sessionId?: string
  ): Promise<{
    success: boolean;
    results: RoundResult;
    players: SessionPlayer[];
  }> {
    const id = sessionId || this.currentSessionId;

    if (!id) {
      throw new Error('No hay sesión activa');
    }

    console.log(`✅ Revealing answer, winner: ${winnerId || 'none'}`);

    return this.fetchAPI(`/session/${id}/reveal`, {
      method: 'POST',
      body: JSON.stringify({ winnerId }),
    });
  }

  // ════════════════════════════════════════════════════════════
  // 📊 ESTADO DE SESIÓN
  // ════════════════════════════════════════════════════════════

  /**
   * Obtiene el estado actual de la sesión
   */
  async getStatus(sessionId?: string): Promise<{
    success: boolean;
    session: GameSession;
  }> {
    const id = sessionId || this.currentSessionId;

    if (!id) {
      throw new Error('No hay sesión activa');
    }

    return this.fetchAPI(`/session/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Lista todas las sesiones activas
   */
  async getAllSessions(): Promise<{
    success: boolean;
    count: number;
    sessions: Array<{
      id: string;
      status: string;
      players: number;
      round: number;
      createdAt: string;
    }>;
  }> {
    return this.fetchAPI('/sessions', {
      method: 'GET',
    });
  }

  // ════════════════════════════════════════════════════════════
  // ⚡ CARTAS DE PODER
  // ════════════════════════════════════════════════════════════

  /**
   * Usa una carta de poder
   */
  async usePowerCard(
    playerId: string,
    cardType: string,
    targetPlayerId?: string,
    sessionId?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const id = sessionId || this.currentSessionId;

    if (!id) {
      throw new Error('No hay sesión activa');
    }

    console.log(`⚡ Using power card: ${cardType} by ${playerId}`);

    return this.fetchAPI(`/session/${id}/power`, {
      method: 'POST',
      body: JSON.stringify({ playerId, cardType, targetPlayerId }),
    });
  }

  // ════════════════════════════════════════════════════════════
  // 🗑️ ELIMINAR SESIÓN
  // ════════════════════════════════════════════════════════════

  /**
   * Elimina una sesión
   */
  async deleteSession(sessionId?: string): Promise<{
    success: boolean;
  }> {
    const id = sessionId || this.currentSessionId;

    if (!id) {
      throw new Error('No hay sesión activa');
    }

    console.log(`🗑️ Deleting session: ${id}`);

    const result = await this.fetchAPI<{ success: boolean }>(`/session/${id}`, {
      method: 'DELETE',
    });

    if (result.success && id === this.currentSessionId) {
      this.currentSessionId = null;
    }

    return result;
  }

  /**
   * Limpiar sesión actual (sin eliminar en backend)
   */
  clearCurrentSession(): void {
    this.currentSessionId = null;
    console.log(`🧹 Current session cleared`);
  }

  // ════════════════════════════════════════════════════════════
  // 🧪 TEST DE CONEXIÓN
  // ════════════════════════════════════════════════════════════

  /**
   * Test de conexión al backend
   */
  async testConnection(): Promise<boolean> {
    console.log(`🧪 Testing connection to ${this.baseUrl}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/v2/game/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Backend v2 connection OK`);
        console.log(`   Active sessions: ${data.activeSessions || 0}`);
        return true;
      }

      console.warn(`⚠️ Backend responded with ${response.status}`);
      return false;
    } catch (error) {
      console.error(`❌ Backend connection failed:`, error);
      return false;
    }
  }

  // ════════════════════════════════════════════════════════════
  // 📊 HELPERS
  // ════════════════════════════════════════════════════════════

  /**
   * Calcula multiplicador de apuesta
   */
  getBettingMultiplier(tokens: number): number {
    const multipliers: Record<number, number> = {
      0: 1,
      1: 1.5,
      2: 2,
      3: 2.5,
      4: 3,
      5: 4, // ALL IN
    };
    return multipliers[tokens] || 1;
  }

  /**
   * Obtiene emoji por tipo de pregunta
   */
  getQuestionTypeEmoji(type: string): string {
    const emojis: Record<string, string> = {
      song: '🎵',
      artist: '🎤',
      decade: '📅',
      year: '📆',
      lyrics: '📝',
      challenge: '🔥',
    };
    return emojis[type] || '🎵';
  }

  /**
   * Obtiene puntos base por tipo de pregunta
   */
  getQuestionTypePoints(type: string): number {
    const points: Record<string, number> = {
      song: 1,
      artist: 2,
      decade: 2,
      year: 3,
      lyrics: 3,
      challenge: 5,
    };
    return points[type] || 1;
  }
}

// 🏭 Exportar instancia singleton
export const gameSessionService = new GameSessionService();

// También exportar la clase para testing
export { GameSessionService };
