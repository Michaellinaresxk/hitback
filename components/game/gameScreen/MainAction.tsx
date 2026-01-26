import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface MainActionProps {
  isLoading: boolean;
  currentPhase: string;
  canStartNextRound: boolean;
  onNextRound: () => void;
  questionVisible: boolean;
  currentRound: any;
  hasPlacedBet: boolean;
  onStartBetting: () => void;
  onSkipBetting: () => void;
  showBettingButton: boolean;
}

export const MainAction: React.FC<MainActionProps> = React.memo(
  ({
    isLoading,
    currentPhase,
    canStartNextRound,
    onNextRound,
    questionVisible,
    currentRound,
    hasPlacedBet,
    onStartBetting,
    onSkipBetting,
    showBettingButton,
  }) => {
    // ✅ NO console.log here - it was causing the freeze!

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#3B82F6' />
          <Text style={styles.loadingText}>Cargando ronda...</Text>
        </View>
      );
    }

    // ✅ FASE DE APUESTAS (Ronda 2+)
    if (showBettingButton && currentPhase === 'betting') {
      return (
        <View style={styles.bettingOpportunityContainer}>
          <TouchableOpacity
            style={styles.bettingOpportunityButton}
            onPress={onStartBetting}
            activeOpacity={0.8}
          >
            <Text style={styles.bettingOpportunityText}>
              🎰 USAR TOKEN (+1, +2, +3)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBettingButton}
            onPress={onSkipBetting}
          >
            <Text style={styles.skipBettingText}>
              ⭕ Saltar apuesta y escuchar audio
            </Text>
          </TouchableOpacity>

          <Text style={styles.bettingRoundInfo}>
            Ronda {currentRound?.number || '?'} -{' '}
            {currentRound?.question?.type?.toUpperCase() || ''}
          </Text>
        </View>
      );
    }

    // ✅ BOTÓN PARA SIGUIENTE RONDA
    // Show when phase is idle or answer, not showing question, and can start
    if (
      (currentPhase === 'idle' || currentPhase === 'answer') &&
      !questionVisible &&
      canStartNextRound
    ) {
      return (
        <View style={styles.nextRoundContainer}>
          <TouchableOpacity
            style={styles.nextRoundButton}
            onPress={onNextRound}
            activeOpacity={0.8}
          >
            <IconSymbol name='play.circle' size={28} color='#FFFFFF' />
            <Text style={styles.nextRoundText}>
              {currentRound ? 'SIGUIENTE RONDA' : 'EMPEZAR PRIMERA RONDA'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.nextRoundSubtext}>
            {currentRound
              ? `Ronda ${currentRound.number} completada`
              : 'Preparado para empezar'}
          </Text>
        </View>
      );
    }

    // ✅ SI ESTÁ EN AUDIO
    if (currentPhase === 'audio') {
      return (
        <View style={styles.activeRoundContainer}>
          <Text style={styles.activeRoundText}>🎵 Escuchando audio...</Text>
          <Text style={styles.activeRoundSubtext}>
            Prepárate para responder
          </Text>
        </View>
      );
    }

    // ✅ SI ESTÁ MOSTRANDO PREGUNTA
    if (currentPhase === 'question' && questionVisible) {
      return (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>❓ Esperando respuesta...</Text>
          <Text style={styles.answerSubtext}>
            Selecciona quién respondió correctamente
          </Text>
        </View>
      );
    }

    // ✅ FALLBACK para idle sin otras condiciones
    if (currentPhase === 'idle') {
      return (
        <View style={styles.nextRoundContainer}>
          <TouchableOpacity
            style={styles.nextRoundButton}
            onPress={onNextRound}
            activeOpacity={0.8}
          >
            <IconSymbol name='play.circle' size={28} color='#FFFFFF' />
            <Text style={styles.nextRoundText}>
              {currentRound ? 'SIGUIENTE RONDA' : 'EMPEZAR PRIMERA RONDA'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.nextRoundSubtext}>
            {currentRound
              ? `Ronda ${currentRound.number} completada`
              : 'Preparado para empezar'}
          </Text>
        </View>
      );
    }

    // ✅ SI ESTÁ MOSTRANDO RESPUESTA pero no puede continuar aún
    if (currentPhase === 'answer') {
      return (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>✅ Respuesta revelada</Text>
          <Text style={styles.answerSubtext}>
            Preparando siguiente ronda...
          </Text>
        </View>
      );
    }

    // ÚLTIMO FALLBACK - siempre muestra algo
    return (
      <View style={styles.defaultContainer}>
        <TouchableOpacity
          style={styles.nextRoundButton}
          onPress={onNextRound}
          activeOpacity={0.8}
        >
          <Text style={styles.nextRoundText}>CONTINUAR</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

// Add display name for debugging
MainAction.displayName = 'MainAction';

const styles = StyleSheet.create({
  loadingContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  bettingOpportunityContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
  },
  bettingOpportunityButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
    gap: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  bettingOpportunityText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  bettingRoundInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontWeight: '500',
  },
  skipBettingButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  skipBettingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  nextRoundContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
  },
  nextRoundButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
    gap: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  nextRoundText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  nextRoundSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  activeRoundContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  activeRoundText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },
  activeRoundSubtext: {
    fontSize: 12,
    color: 'rgba(245, 158, 11, 0.8)',
    fontWeight: '600',
  },
  answerContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    alignItems: 'center',
  },
  answerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  answerSubtext: {
    fontSize: 12,
    color: 'rgba(139, 92, 246, 0.8)',
    fontWeight: '600',
  },
  defaultContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
});
