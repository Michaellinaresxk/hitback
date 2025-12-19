// services/PowerCardService.ts - HITBACK Power Cards Service
// Servicio para comunicación con el backend de Power Cards

import { Platform } from 'react-native';
import type {
  PowerCardType,
  PowerCardInstance,
  PowerCardEffects,
  ScanCardResponse,
  UseCardResponse,
  InventoryResponse,
  DeckStatusResponse,
  ConfigResponse,
  PrecisionAnswer,
} from '@/types/powerCards';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const getBaseUrl = (): string => {
  if (__DEV__) {
    const LOCAL_IP = '192.168.1.10'; // ⚠️ CAMBIA POR TU IP
    return `http://${LOCAL_IP}:3000`;
  }
  return 'https://api.hitback.com';
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

class PowerCardService {
  private baseUrl: string;
  private timeout: number = 10000;

  constructor() {
    this.baseUrl = getBaseUrl();
    console.log(`🎴 PowerCardService initialized`);
    console.log(`   Base URL: ${this.baseUrl}/api/power-cards`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  setBaseUrl(url: string): void {
    this.baseUrl = url;
    console.log(`🔧 PowerCardService URL updated: ${url}`);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH HELPER
  // ═══════════════════════════════════════════════════════════════════════════

  private async fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/power-cards${endpoint}`;

    console.log(`🌐 PowerCard API: ${options.method || 'GET'} ${endpoint}`);

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

      if (!response.ok && !data.success) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Timeout: El servidor no respondió');
      }
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESCANEAR CARTA DEL MAZO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Escanea una Power Card del mazo para agregarla al inventario
   */
  async scanCard(
    qrCode: string,
    playerId: string,
    sessionId: string
  ): Promise<ScanCardResponse> {
    console.log(`📱 Scanning Power Card: ${qrCode}`);

    return this.fetchAPI<ScanCardResponse>('/scan', {
      method: 'POST',
      body: JSON.stringify({ qrCode, playerId, sessionId }),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USAR CARTA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Usa una Power Card del inventario
   */
  async useCard(
    cardId: string,
    playerId: string,
    sessionId: string,
    options: {
      targetPlayerId?: string;
      cardToResurrect?: string;
    } = {}
  ): Promise<UseCardResponse> {
    console.log(`⚡ Using Power Card: ${cardId}`);

    return this.fetchAPI<UseCardResponse>('/use', {
      method: 'POST',
      body: JSON.stringify({
        cardId,
        playerId,
        sessionId,
        ...options,
      }),
    });
  }

  /**
   * Usa BOOST
   */
  async useBoost(
    cardId: string,
    playerId: string,
    sessionId: string
  ): Promise<UseCardResponse> {
    return this.useCard(cardId, playerId, sessionId);
  }

  /**
   * Usa STEAL - Paso 1: obtener targets válidos
   */
  async getStealTargets(
    cardId: string,
    playerId: string,
    sessionId: string
  ): Promise<UseCardResponse> {
    return this.useCard(cardId, playerId, sessionId);
  }

  /**
   * Usa STEAL - Paso 2: ejecutar robo
   */
  async executeSteal(
    cardId: string,
    playerId: string,
    sessionId: string,
    targetPlayerId: string
  ): Promise<UseCardResponse> {
    return this.useCard(cardId, playerId, sessionId, { targetPlayerId });
  }

  /**
   * Usa SHIELD
   */
  async useShield(
    cardId: string,
    playerId: string,
    sessionId: string
  ): Promise<UseCardResponse> {
    return this.useCard(cardId, playerId, sessionId);
  }

  /**
   * Usa COUNTER
   */
  async useCounter(
    cardId: string,
    playerId: string,
    sessionId: string
  ): Promise<UseCardResponse> {
    return this.useCard(cardId, playerId, sessionId);
  }

  /**
   * Usa PRECISION - inicia las 3 preguntas
   */
  async usePrecision(
    cardId: string,
    playerId: string,
    sessionId: string
  ): Promise<UseCardResponse> {
    return this.useCard(cardId, playerId, sessionId);
  }

  /**
   * Usa CHALLENGE - inicia el reto
   */
  async useChallenge(
    cardId: string,
    playerId: string,
    sessionId: string
  ): Promise<UseCardResponse> {
    return this.useCard(cardId, playerId, sessionId);
  }

  /**
   * Usa RESURRECT - Paso 1: obtener cartas usadas
   */
  async getResurrectOptions(
    cardId: string,
    playerId: string,
    sessionId: string
  ): Promise<UseCardResponse> {
    return this.useCard(cardId, playerId, sessionId);
  }

  /**
   * Usa RESURRECT - Paso 2: recuperar carta
   */
  async executeResurrect(
    cardId: string,
    playerId: string,
    sessionId: string,
    cardToResurrect: string
  ): Promise<UseCardResponse> {
    return this.useCard(cardId, playerId, sessionId, { cardToResurrect });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESOLVER PRECISION Y CHALLENGE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Resuelve las respuestas de PRECISION
   */
  async resolvePrecision(
    sessionId: string,
    answers: PrecisionAnswer[]
  ): Promise<{
    success: boolean;
    correctAnswers: number;
    totalQuestions: number;
    pointsEarned: number;
    message: string;
  }> {
    console.log(`🎯 Resolving PRECISION answers`);

    return this.fetchAPI('/precision/resolve', {
      method: 'POST',
      body: JSON.stringify({ sessionId, answers }),
    });
  }

  /**
   * Resuelve el resultado de CHALLENGE
   */
  async resolveChallenge(
    sessionId: string,
    completed: boolean
  ): Promise<{
    success: boolean;
    completed: boolean;
    pointsEarned: number;
    message: string;
  }> {
    console.log(
      `🔥 Resolving CHALLENGE: ${completed ? 'completed' : 'failed'}`
    );

    return this.fetchAPI('/challenge/resolve', {
      method: 'POST',
      body: JSON.stringify({ sessionId, completed }),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTARIO Y ESTADO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene el inventario de Power Cards de un jugador
   */
  async getInventory(
    sessionId: string,
    playerId: string
  ): Promise<InventoryResponse> {
    console.log(`📦 Getting inventory for player: ${playerId}`);

    return this.fetchAPI(`/inventory/${sessionId}/${playerId}`, {
      method: 'GET',
    });
  }

  /**
   * Obtiene el estado del mazo
   */
  async getDeckStatus(): Promise<DeckStatusResponse> {
    console.log(`📊 Getting deck status`);

    return this.fetchAPI('/deck-status', {
      method: 'GET',
    });
  }

  /**
   * Obtiene la configuración de cartas
   */
  async getConfig(): Promise<ConfigResponse> {
    console.log(`⚙️ Getting cards config`);

    return this.fetchAPI('/config', {
      method: 'GET',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Reinicia el mazo (para nuevo juego)
   */
  async resetDeck(): Promise<{
    success: boolean;
    totalCards: number;
    message: string;
  }> {
    console.log(`🔄 Resetting deck`);

    return this.fetchAPI('/reset-deck', {
      method: 'POST',
    });
  }

  /**
   * Parsea un QR sin usarlo (preview)
   */
  async parseQR(qrCode: string): Promise<{
    success: boolean;
    isPowerCard?: boolean;
    cardId?: string;
    type?: PowerCardType;
    name?: string;
    icon?: string;
    description?: string;
    error?: string;
  }> {
    console.log(`🔍 Parsing QR: ${qrCode}`);

    return this.fetchAPI('/parse-qr', {
      method: 'POST',
      body: JSON.stringify({ qrCode }),
    });
  }

  /**
   * Obtiene todos los QR codes (para imprimir)
   */
  async getAllQRCodes(): Promise<{
    success: boolean;
    totalCards: number;
    cards: Array<{
      qrCode: string;
      type: PowerCardType;
      name: string;
      icon: string;
    }>;
  }> {
    console.log(`🖨️ Getting all QR codes`);

    return this.fetchAPI('/qr-codes', {
      method: 'GET',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDACIÓN LOCAL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica si un QR es de Power Card (sin llamar al backend)
   */
  isPowerCardQR(qrCode: string): boolean {
    return qrCode?.startsWith('HITBACK_PWR_') || false;
  }

  /**
   * Parsea un QR localmente (sin llamar al backend)
   */
  parseQRLocal(qrCode: string): {
    success: boolean;
    type?: PowerCardType;
    id?: string;
    error?: string;
  } {
    if (!this.isPowerCardQR(qrCode)) {
      return { success: false, error: 'No es un QR de Power Card' };
    }

    const regex = /^HITBACK_PWR_([A-Z]+)_(\d{3})$/;
    const match = qrCode.match(regex);

    if (!match) {
      return { success: false, error: 'Formato de QR inválido' };
    }

    const [, type] = match;
    const validTypes = [
      'BOOST',
      'STEAL',
      'SHIELD',
      'COUNTER',
      'PRECISION',
      'CHALLENGE',
      'RESURRECT',
    ];

    if (!validTypes.includes(type)) {
      return { success: false, error: `Tipo de carta inválido: ${type}` };
    }

    return {
      success: true,
      type: type as PowerCardType,
      id: qrCode,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAR SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

export const powerCardService = new PowerCardService();

// También exportar la clase para testing
export { PowerCardService };
