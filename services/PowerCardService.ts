// services/PowerCardService.ts
import { GameSessionService } from './GameSessionService';

export interface PowerCardData {
  cardId: string;
  cardName: string;
  cardType: string;
  emoji: string;
  description: string;
  usageLimit: number;
  count?: number;
}

export interface ScanQRResponse {
  success: boolean;
  data?: {
    cardId: string;
    cardName: string;
    cardType: string;
    emoji: string;
    description: string;
    usageLimit: number;
    inventory: Record<string, number>;
    totalCards: number;
  };
  error?: string;
}

export interface InventoryResponse {
  success: boolean;
  data?: {
    playerId: string;
    inventory: PowerCardData[];
    summary: {
      totalCards: number;
      uniqueCards: number;
      availableTypes: string[];
    };
  };
  error?: string;
}

export interface UsePowerCardResponse {
  success: boolean;
  data?: {
    cardId: string;
    cardName: string;
    cardType: string;
    emoji: string;
    activated: boolean;
    effect: any;
    message: string;
  };
  error?: string;
}

/**
 * 🎴 POWER CARD SERVICE
 *
 * Servicio para gestionar PowerCards en el frontend
 * - Escanear QR y obtener cartas
 * - Consultar inventario
 * - Usar cartas
 *
 * ✅ CLEAN CODE: Funciones async/await, manejo de errores
 */
class PowerCardService {
  private readonly baseUrl = '/cards';

  /**
   * 📱 Escanear QR de PowerCard física
   */
  async scanQR(qrCode: string, playerId: string): Promise<ScanQRResponse> {
    console.log(`\n📱 PowerCardService.scanQR`);
    console.log(`   QR: ${qrCode}`);
    console.log(`   Player: ${playerId}`);

    try {
      // Validar formato básico en frontend
      if (!qrCode.startsWith('HITBACK_PC_')) {
        throw new Error('QR inválido - debe empezar con HITBACK_PC_');
      }

      const response = await GameSessionService.postToBackend(
        `${this.baseUrl}/scan-qr`,
        { qrCode, playerId },
      );

      if (!response.success) {
        throw new Error(response.error || 'Error escaneando QR');
      }

      console.log(`   ✅ Carta escaneada: ${response.data.cardName}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`   ❌ Error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * 🎒 Obtener inventario de PowerCards de un jugador
   */
  async getInventory(playerId: string): Promise<InventoryResponse> {
    console.log(`\n🎒 PowerCardService.getInventory`);
    console.log(`   Player: ${playerId}`);

    try {
      const response = await GameSessionService.getFromBackend(
        `${this.baseUrl}/inventory/${playerId}`,
      );

      if (!response.success) {
        throw new Error(response.error || 'Error obteniendo inventario');
      }

      console.log(
        `   ✅ Inventario: ${response.data.summary.totalCards} cartas`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`   ❌ Error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * ⚡ Usar una PowerCard
   */
  async usePowerCard(
    playerId: string,
    cardId: string,
    targetPlayerId?: string,
  ): Promise<UsePowerCardResponse> {
    console.log(`\n⚡ PowerCardService.usePowerCard`);
    console.log(`   Player: ${playerId}`);
    console.log(`   Card: ${cardId}`);

    try {
      const response = await GameSessionService.postToBackend(
        `${this.baseUrl}/use`,
        { playerId, cardId, targetPlayerId },
      );

      if (!response.success) {
        throw new Error(response.error || 'Error usando PowerCard');
      }

      console.log(`   ✅ Carta usada: ${response.data.cardName}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`   ❌ Error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * 🧪 TESTING: Agregar carta manualmente al inventario
   */
  async testAddCard(
    playerId: string,
    cardId: string,
    count: number = 1,
  ): Promise<any> {
    console.log(`\n🧪 PowerCardService.testAddCard (TESTING MODE)`);
    console.log(`   Adding ${count}x ${cardId} to ${playerId}`);

    try {
      const response = await GameSessionService.postToBackend(
        `${this.baseUrl}/test-add`,
        { playerId, cardId, count },
      );

      console.log(`   ✅ Carta agregada`);
      return response;
    } catch (error) {
      console.error(`   ❌ Error:`, error);
      throw error;
    }
  }

  /**
   * 📊 Obtener información de una carta específica
   * (del archivo local powerCards.json)
   */
  getCardInfo(cardType: string): PowerCardData | null {
    const cardMap: Record<string, PowerCardData> = {
      replay: {
        cardId: 'power_replay_001',
        cardName: 'REPLAY',
        cardType: 'BOOST',
        emoji: '⚡',
        description: 'Tu próxima respuesta vale doble puntos',
        usageLimit: 1,
      },
      festival: {
        cardId: 'power_festival_001',
        cardName: 'FESTIVAL',
        cardType: 'FESTIVAL',
        emoji: '🎪',
        description: 'Todos los jugadores ganan +1 pt',
        usageLimit: 1,
      },
    };

    return cardMap[cardType] || null;
  }
}

export const powerCardService = new PowerCardService();
