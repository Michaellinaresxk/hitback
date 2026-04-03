import { useState, useEffect, useCallback, MutableRefObject } from 'react';
import { gameSessionService } from '@/services/GameSessionService';
import { getBackendPlayerId } from '@/utils/game/gameHelpers';
import type { Player } from '@/store/types/gameStoreTypes';

export interface ComboFlowState {
  isActive: boolean;
  showNotification: boolean;
  showScanner: boolean;
  playerId: string | null;
  playerName: string;
  comboName: string;
  comboEmoji: string;
  comboDescription: string;
}

export interface ComboActivationData {
  playerId: string;
  playerName: string;
  comboName: string;
  comboEmoji: string;
  comboDescription: string;
}

const INITIAL_COMBO_STATE: ComboFlowState = {
  isActive: false,
  showNotification: false,
  showScanner: false,
  playerId: null,
  playerName: '',
  comboName: '',
  comboEmoji: '',
  comboDescription: '',
};

interface UseComboFlowParams {
  players: Player[];
  playerIdMap: Record<string, string>;
  addPowerCard: (playerId: string, powerCard: any) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  advanceToNextTurn: () => void;
  resetProcessingRefs: () => void;
  isPowerCardProcessingRef: MutableRefObject<boolean>;
  /** Aplica el efecto inmediato de cartas como LABEL FEE (-1 pt al que la toma) */
  applyImmediateCardEffect: (playerId: string, scoreChange: number) => void;
}

/**
 * Gestiona el flujo completo de combo:
 * notificación → escáner de power card → avance de turno.
 * Incluye un safety reset de 30s para evitar estados colgados.
 */
export function useComboFlow({
  players,
  playerIdMap,
  addPowerCard,
  showSuccess,
  showError,
  advanceToNextTurn,
  resetProcessingRefs,
  isPowerCardProcessingRef,
  applyImmediateCardEffect,
}: UseComboFlowParams) {
  const [comboFlowState, setComboFlowState] = useState<ComboFlowState>(INITIAL_COMBO_STATE);

  // Safety: resetea el flujo si lleva más de 30s activo y avanza el turno
  useEffect(() => {
    if (!comboFlowState.isActive) return;

    const safetyTimer = setTimeout(() => {
      console.warn('⚠️ Safety: Combo flow was active for too long, resetting');
      setComboFlowState(INITIAL_COMBO_STATE);
      resetProcessingRefs();
      advanceToNextTurn();
    }, 30000);

    return () => clearTimeout(safetyTimer);
  }, [comboFlowState.isActive, resetProcessingRefs, advanceToNextTurn]);

  /** Activa el flujo de combo tras una respuesta correcta con streak. */
  const activateCombo = useCallback(
    (data: ComboActivationData) => {
      resetProcessingRefs();
      setComboFlowState({
        isActive: true,
        showNotification: true,
        showScanner: false,
        playerId: data.playerId,
        playerName: data.playerName,
        comboName: data.comboName,
        comboEmoji: data.comboEmoji,
        comboDescription: data.comboDescription,
      });
    },
    [resetProcessingRefs],
  );

  /** El jugador cierra la notificación → abre el escáner de carta. */
  const handleComboNotificationClose = useCallback(() => {
    console.log('✅ Combo notification closed, opening scanner');
    isPowerCardProcessingRef.current = false;
    setComboFlowState((prev) => ({
      ...prev,
      showNotification: false,
      showScanner: true,
    }));
  }, [isPowerCardProcessingRef]);

  /** El jugador escanea el QR de la power card. */
  const handlePowerCardScanned = useCallback(
    async (qrCode: string) => {
      console.log('🔥 handlePowerCardScanned called with:', qrCode);

      if (isPowerCardProcessingRef.current) {
        console.log('⏳ Already processing power card, ignoring');
        return;
      }
      isPowerCardProcessingRef.current = true;

      const { playerId: playerIdForScan, playerName: playerNameForScan } = comboFlowState;
      setComboFlowState(INITIAL_COMBO_STATE);

      if (!playerIdForScan) {
        console.error('❌ No player ID for scan');
        showError('Error', 'No se encontró el jugador del combo');
        isPowerCardProcessingRef.current = false;
        setTimeout(() => advanceToNextTurn(), 200);
        return;
      }

      const player = players.find((p) => p.id === playerIdForScan);
      if (!player) {
        console.error('❌ Player not found');
        showError('Error', 'Jugador no encontrado');
        isPowerCardProcessingRef.current = false;
        setTimeout(() => advanceToNextTurn(), 200);
        return;
      }

      try {
        console.log(`🔍 Scanning power card QR: ${qrCode} for player ${playerIdForScan}`);
        const backendPlayerId = getBackendPlayerId(playerIdForScan, players, playerIdMap);
        const result = await gameSessionService.scanPowerCard(qrCode, backendPlayerId);

        if (result.success) {
          console.log(`✅ Power card scanned: ${result.data.cardName} (type: ${result.data.cardType})`);

          if (result.data.effectOnDraw) {
            // Carta con efecto inmediato (ej: LABEL FEE) — no va al inventario
            const { scoreChange } = result.data.effectOnDraw;
            if (scoreChange && scoreChange !== 0) {
              applyImmediateCardEffect(playerIdForScan, scoreChange);
            }
            showError(
              `${result.data.emoji} ${result.data.cardName}`,
              `${playerNameForScan}: ${result.data.description}`,
            );
          } else {
            // Carta normal — va al inventario del jugador
            addPowerCard(playerIdForScan, {
              id: result.data.cardId,
              name: result.data.cardName,
              emoji: result.data.emoji,
              type: result.data.cardType,
              description: result.data.description,
              currentUses: 0,
              usageLimit: result.data.usageLimit,
              isActive: false,
            });
            showSuccess(
              '⚡ ¡Carta Obtenida!',
              `${playerNameForScan} ha obtenido: ${result.data.emoji} ${result.data.cardName}`,
            );
          }
        } else {
          showError('Error', 'No se pudo añadir la carta');
        }
      } catch (error: any) {
        console.error('❌ Error scanning power card:', error);
        showError('Error', error.message || 'No se pudo escanear la carta');
      }

      console.log('🧹 Cleanup complete, advancing to next turn');
      isPowerCardProcessingRef.current = false;
      setTimeout(() => {
        console.log('🔄 Calling advanceToNextTurn');
        advanceToNextTurn();
      }, 300);
    },
    [
      comboFlowState,
      players,
      playerIdMap,
      addPowerCard,
      showSuccess,
      showError,
      advanceToNextTurn,
      isPowerCardProcessingRef,
    ],
  );

  /** El jugador omite el escáner (cierra el modal). */
  const handlePowerCardScanClose = useCallback(() => {
    console.log('⭕ Power card scan skipped');
    setComboFlowState(INITIAL_COMBO_STATE);
    isPowerCardProcessingRef.current = false;
    setTimeout(() => advanceToNextTurn(), 300);
  }, [advanceToNextTurn, isPowerCardProcessingRef]);

  return {
    comboFlowState,
    activateCombo,
    handleComboNotificationClose,
    handlePowerCardScanned,
    handlePowerCardScanClose,
  };
}
