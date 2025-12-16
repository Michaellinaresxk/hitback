import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>🎵 HITBACK</Text>
          <Text style={styles.appSubtitle}> {t('home.subtitle')}</Text>
          <Text style={styles.description}>{t('home.description')}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Primary Action - The ONLY thing that matters */}
          <TouchableOpacity
            style={styles.newGameButton}
            onPress={() => router.push('/setup-game')}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <IconSymbol name='play.circle.fill' size={32} color='#FFFFFF' />
              <View style={styles.buttonText}>
                <Text style={styles.buttonTitle}>
                  {t('home.new_game.title')}
                </Text>
                <Text style={styles.buttonSubtitle}>
                  {t('home.new_game.subtitle')}
                </Text>
              </View>
              <IconSymbol
                name='chevron.right'
                size={24}
                color='rgba(255,255,255,0.7)'
              />
            </View>
          </TouchableOpacity>

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/help')}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryButtonContent}>
                <IconSymbol
                  name='questionmark.circle'
                  size={24}
                  color='#F59E0B'
                />
                <Text style={styles.secondaryButtonText}>
                  {' '}
                  {t('home.rules')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/settings')}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryButtonContent}>
                <IconSymbol name='gear' size={24} color='#8B5CF6' />
                <Text style={styles.secondaryButtonText}>
                  {' '}
                  {t('home.settings')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Simple Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              {' '}
              {t('home.how_works.title')}
            </Text>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={styles.instructionText}>
                  {' '}
                  {t('home.how_works.step1')}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={styles.instructionText}>
                  {' '}
                  {t('home.how_works.step2')}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={styles.instructionText}>
                  {t('home.how_works.step3')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('home.footer')}</Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    marginBottom: 100,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },

  appTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },

  appSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 16,
  },

  description: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },

  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  // New Game Button - The star of the show
  newGameButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    marginBottom: 40,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },

  buttonText: {
    flex: 1,
    marginLeft: 16,
  },

  buttonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Secondary Actions
  secondaryActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  secondaryButtonContent: {
    alignItems: 'center',
    padding: 20,
  },

  secondaryButtonText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },

  // Instructions
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 20,
    textAlign: 'center',
  },

  instructionsList: {
    gap: 16,
  },

  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  instructionNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 16,
  },

  instructionText: {
    fontSize: 16,
    color: '#CBD5E1',
    fontWeight: '500',
    flex: 1,
  },

  // Footer
  footer: {
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },

  footerText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
