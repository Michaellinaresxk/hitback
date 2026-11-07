import React from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    // ✅ NO console.log here - it was causing the freeze!

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#3B82F6' />
          <Text style={styles.loadingText}>{t('game.flow.loading_round')}</Text>
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
              {t('game.flow.use_token')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBettingButton}
            onPress={onSkipBetting}
          >
            <Text style={styles.skipBettingText}>
              {t('game.flow.skip_bet')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.bettingRoundInfo}>
            {t('game.flow.round_question', {
              round: currentRound?.number || '?',
              type: currentRound?.question?.type?.toUpperCase() || '',
            })}
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
              {currentRound
                ? t('game.flow.next_round')
                : t('game.flow.start_first_round')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.nextRoundSubtext}>
            {currentRound
              ? t('game.flow.round_completed', {
                  round: currentRound.number,
                })
              : t('game.flow.ready')}
          </Text>
        </View>
      );
    }

    // ✅ SI ESTÁ EN AUDIO
    if (currentPhase === 'audio') {
      return (
        <View style={styles.activeRoundContainer}>
          <Text style={styles.activeRoundText}>
            {t('game.flow.listening')}
          </Text>
          <Text style={styles.activeRoundSubtext}>
            {t('game.flow.prepare_to_answer')}
          </Text>
        </View>
      );
    }

    // ✅ SI ESTÁ MOSTRANDO PREGUNTA
    if (currentPhase === 'question' && questionVisible) {
      return (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>
            {t('game.flow.waiting_for_answer')}
          </Text>
          <Text style={styles.answerSubtext}>
            {t('game.flow.select_correct_player')}
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
              {currentRound
                ? t('game.flow.next_round')
                : t('game.flow.start_first_round')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.nextRoundSubtext}>
            {currentRound
              ? t('game.flow.round_completed', {
                  round: currentRound.number,
                })
              : t('game.flow.ready')}
          </Text>
        </View>
      );
    }

    // ✅ SI ESTÁ MOSTRANDO RESPUESTA pero no puede continuar aún
    if (currentPhase === 'answer') {
      return (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>
            {t('game.flow.answer_revealed')}
          </Text>
          <Text style={styles.answerSubtext}>
            {t('game.flow.preparing_next_round')}
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
          <Text style={styles.nextRoundText}>{t('tour.ui.continueButton')}</Text>
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
