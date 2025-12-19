import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { usePowerCardStore } from '@/store/powerCardStore';
import NewPowerCardModal from './NewPowerCardModal';
import PowerCardStealTargetModal from './PowerCardStealTargetModal';
import PowerCardChallengeModal from './PowerCardChallengeModal';
import PowerCardPrecisionModal from './PowerCardPrecisionmodal';
import PowerCardResurrectModal from './PowerCardResurrectmodal';

interface PowerCardManagerProps {
  sessionId: string;
  children?: React.ReactNode;
}

/**
 * PowerCardManager - Componente contenedor para el sistema de Power Cards
 *
 * Este componente debe envolver la pantalla de juego y maneja:
 * - Modal de nueva carta obtenida
 * - Modal de selección de víctima (STEAL)
 * - Modal de preguntas rápidas (PRECISION)
 * - Modal de reto musical (CHALLENGE)
 * - Modal de selección de carta (RESURRECT)
 *
 * Uso:
 * <PowerCardManager sessionId={sessionId}>
 *   <GameScreen />
 * </PowerCardManager>
 */
export default function PowerCardManager({
  sessionId,
  children,
}: PowerCardManagerProps) {
  // Estado del store
  const {
    // Modal de nueva carta
    newCardModal,
    hideNewCardModal,

    // STEAL
    steal,
    useSteal,

    // PRECISION
    precision,
    submitPrecisionAnswers,

    // CHALLENGE
    challenge,
    submitChallengeResult,

    // RESURRECT
    resurrect,
    useResurrect,

    // Estado general
    isLoading,
  } = usePowerCardStore();

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Handler para seleccionar target de STEAL
  const handleStealTarget = useCallback(
    async (targetId: string) => {
      if (!steal.attackerId || !steal.cardId) return;
      await useSteal(steal.cardId, steal.attackerId, sessionId, targetId);
    },
    [steal, sessionId, useSteal]
  );

  // Handler para cancelar STEAL
  const handleCancelSteal = useCallback(() => {
    usePowerCardStore.setState({
      steal: {
        isSelectingTarget: false,
        attackerId: null,
        cardId: null,
        validTargets: [],
      },
    });
  }, []);

  // Handler para submit de PRECISION
  const handlePrecisionSubmit = useCallback(
    async (answers: any[]) => {
      await submitPrecisionAnswers(sessionId, answers);
    },
    [sessionId, submitPrecisionAnswers]
  );

  // Handler para timeout de PRECISION
  const handlePrecisionTimeout = useCallback(() => {
    // El submit se llamará automáticamente desde PrecisionModal
    console.log('⏰ PRECISION timeout');
  }, []);

  // Handler para resultado de CHALLENGE
  const handleChallengeComplete = useCallback(
    async (completed: boolean) => {
      await submitChallengeResult(sessionId, completed);
    },
    [sessionId, submitChallengeResult]
  );

  // Handler para cancelar CHALLENGE
  const handleCancelChallenge = useCallback(() => {
    usePowerCardStore.setState({
      challenge: {
        isActive: false,
        playerId: null,
        type: null,
        name: '',
        icon: '',
        instruction: '',
        startedAt: null,
        completed: null,
      },
    });
  }, []);

  // Handler para seleccionar carta en RESURRECT
  const handleResurrectSelect = useCallback(
    async (cardId: string) => {
      if (!resurrect.playerId) return;

      // Buscar el cardId de RESURRECT en el inventario (no el que vamos a resucitar)
      const inventory =
        usePowerCardStore.getState().inventories[resurrect.playerId];
      const resurrectCard = inventory?.cards.find(
        (c) => c.type === 'RESURRECT'
      );

      if (resurrectCard) {
        await useResurrect(
          resurrectCard.id,
          resurrect.playerId,
          sessionId,
          cardId
        );
      }
    },
    [resurrect, sessionId, useResurrect]
  );

  // Handler para cancelar RESURRECT
  const handleCancelResurrect = useCallback(() => {
    usePowerCardStore.setState({
      resurrect: {
        isSelectingCard: false,
        playerId: null,
        availableCards: [],
      },
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // OBTENER NOMBRE DEL JUGADOR
  // ═══════════════════════════════════════════════════════════════════════════

  const getPlayerName = (playerId: string | null): string => {
    if (!playerId) return 'Jugador';
    const inventory = usePowerCardStore.getState().inventories[playerId];
    return inventory?.playerName || 'Jugador';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <View style={styles.container}>
      {/* Contenido principal (pantalla de juego) */}
      {children}

      <NewPowerCardModal
        visible={newCardModal.visible}
        card={newCardModal.card}
        playerName={newCardModal.playerName}
        onClose={hideNewCardModal}
        reason='scan'
      />

      <PowerCardStealTargetModal
        visible={steal.isSelectingTarget}
        targets={steal.validTargets}
        attackerName={getPlayerName(steal.attackerId)}
        onSelectTarget={handleStealTarget}
        onCancel={handleCancelSteal}
      />

      <PowerCardPrecisionModal
        visible={precision.isActive}
        questions={precision.questions}
        timeLimit={precision.timeLeft}
        playerName={getPlayerName(precision.playerId)}
        onSubmit={handlePrecisionSubmit}
        onTimeout={handlePrecisionTimeout}
      />

      <PowerCardChallengeModal
        visible={challenge.isActive}
        challengeType={challenge.type}
        challengeName={challenge.name}
        challengeIcon={challenge.icon}
        instruction={challenge.instruction}
        playerName={getPlayerName(challenge.playerId)}
        onComplete={handleChallengeComplete}
        onCancel={handleCancelChallenge}
      />

      <PowerCardResurrectModal
        visible={resurrect.isSelectingCard}
        availableCards={resurrect.availableCards}
        playerName={getPlayerName(resurrect.playerId)}
        onSelectCard={handleResurrectSelect}
        onCancel={handleCancelResurrect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
