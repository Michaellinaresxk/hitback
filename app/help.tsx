import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HelpScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <IconSymbol name='chevron.left' size={24} color='#F8FAFC' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reglas del Juego</Text>
        <View style={styles.headerSpacer} />
      </View> */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Game Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('help.objective.title')}</Text>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewText}>
              Ser el primer jugador en alcanzar{' '}
              <Text style={styles.highlight}>15 puntos</Text> o tener la mayor
              puntuación después de{' '}
              <Text style={styles.highlight}>20 minutos</Text> de juego.
            </Text>
          </View>
        </View>

        {/* Setup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('help.setup.title')}</Text>
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>{t('help.setup.step1')}</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>{t('help.setup.step2')}</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>{t('help.setup.step3')}</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>{t('help.setup.step4')}</Text>
            </View>
          </View>
        </View>

        {/* Game Flow */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('help.flow.title')}</Text>
          <View style={styles.flowCard}>
            <View style={styles.flowStep}>
              <Text style={styles.flowTitle}>
                {t('help.flow.normal_round')}
              </Text>
              <Text style={styles.flowText}>{t('help.flow.normal_steps')}</Text>
            </View>

            <View style={styles.flowStep}>
              <Text style={styles.flowTitle}>{t('help.flow.rotation')}</Text>
              <Text style={styles.flowText}>
                {t('help.flow.rotation_steps')}
              </Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('help.tips.title')}</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tipText}>{t('help.tips.list')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  backButton: {
    padding: 8,
  },

  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },

  headerSpacer: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  section: {
    marginVertical: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },

  // Overview
  overviewCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  overviewText: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 24,
    textAlign: 'center',
  },

  highlight: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  // Steps
  stepsList: {
    gap: 12,
  },

  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  stepNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#10B981',
    borderRadius: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 16,
  },

  stepText: {
    fontSize: 15,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 22,
  },

  // Flow
  flowCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  flowStep: {
    marginBottom: 16,
  },

  flowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },

  flowText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },

  // Card Types
  cardTypeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  cardTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  cardTypeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },

  cardTypeInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTypeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },

  cardTypePoints: {
    fontSize: 12,
    fontWeight: '700',
  },

  cardTypeDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },

  // Special Modes
  specialModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  specialModeIcon: {
    fontSize: 24,
    marginRight: 16,
  },

  specialModeInfo: {
    flex: 1,
  },

  specialModeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },

  specialModeDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },

  // Tips
  tipsCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },

  tipText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
  },
});
