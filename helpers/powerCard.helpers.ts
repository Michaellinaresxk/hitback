import { POWER_CARD_CONFIG } from '@/constants/PowerCard';
import { PowerCardType } from '@/types/game.types';
import {
  PowerCardCategory,
  PowerCardDefinition,
  PowerCardEffectType,
} from '@/types/powerCard.types';

/**
 * Obtiene la configuración de un tipo de carta
 */
export function getCardConfig(type: PowerCardType): PowerCardDefinition {
  return POWER_CARD_CONFIG[type];
}

/**
 * Verifica si un QR es de Power Card
 */
export function isPowerCardQR(qrCode: string): boolean {
  return qrCode?.startsWith('HITBACK_PWR_') || false;
}

/**
 * Parsea un QR de Power Card
 */
export function parsePowerCardQR(qrCode: string): {
  success: boolean;
  type?: PowerCardType;
  id?: string;
  error?: string;
} {
  if (!isPowerCardQR(qrCode)) {
    return { success: false, error: 'No es un QR de Power Card' };
  }

  const regex = /^HITBACK_PWR_([A-Z]+)_(\d{3})$/;
  const match = qrCode.match(regex);

  if (!match) {
    return { success: false, error: 'Formato de QR inválido' };
  }

  const [, type, idNumber] = match;

  if (!POWER_CARD_CONFIG[type as PowerCardType]) {
    return { success: false, error: `Tipo de carta inválido: ${type}` };
  }

  return {
    success: true,
    type: type as PowerCardType,
    id: qrCode,
  };
}

/**
 * Obtiene el color de fondo según la categoría
 */
export function getCategoryColor(category: PowerCardCategory): string {
  const colors: Record<PowerCardCategory, string> = {
    offensive: '#EF4444', // Rojo
    defensive: '#3B82F6', // Azul
    special: '#F59E0B', // Amarillo
    utility: '#10B981', // Verde
  };
  return colors[category];
}

/**
 * Obtiene el color de borde según el tipo de efecto
 */
export function getEffectTypeColor(effectType: PowerCardEffectType): string {
  return effectType === 'persistent' ? '#8B5CF6' : '#64748B';
}
