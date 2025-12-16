import LanguageSelector from '@/components/LanguagePicker';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Future settings state (not functional yet, just for UI)
  const [settings, setSettings] = useState({
    gameDuration: 20, // minutes
    winningScore: 15, // points
    audioPreviewTime: 5, // seconds
    enableBetting: true,
    enablePowerCards: true,
    enableSpecialModes: true,
    autoAdvanceTurn: true,
    soundEffects: true,
    hapticFeedback: true,
  });

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    value: string | boolean,
    onPress: () => void,
    type: 'toggle' | 'select' = 'select'
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={type === 'toggle' ? 1 : 0.8}
      disabled={type === 'toggle'}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <IconSymbol name={icon} size={20} color='#64748B' />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.settingRight}>
        {type === 'toggle' ? (
          <Switch
            value={value as boolean}
            onValueChange={(newValue) => {
              // Future functionality
              console.log(`Toggle ${title}:`, newValue);
            }}
            trackColor={{ false: '#374151', true: '#3B82F6' }}
            thumbColor={value ? '#FFFFFF' : '#9CA3AF'}
          />
        ) : (
          <>
            <Text style={styles.settingValue}>{value}</Text>
            <IconSymbol name='chevron.right' size={16} color='#94A3B8' />
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <IconSymbol name={icon} size={20} color='#F59E0B' />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#0F172A' />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 🌍 LANGUAGE SECTION */}
        <View style={styles.section}>
          {renderSectionHeader(t('settings.language').toUpperCase(), 'globe')}

          {/* Language Selector Component */}
          <View style={styles.languageSelectorContainer}>
            <LanguageSelector />
          </View>
        </View>

        {/* Game Settings */}
        <View style={styles.section}>
          {renderSectionHeader('CONFIGURACIÓN DE JUEGO', 'gamecontroller')}

          {renderSettingItem(
            'clock',
            'Duración de Partida',
            'Tiempo máximo por juego',
            `${settings.gameDuration} min`,
            () => console.log('Change game duration')
          )}

          {renderSettingItem(
            'trophy',
            'Puntos para Ganar',
            'Puntuación objetivo para victoria',
            `${settings.winningScore} pts`,
            () => console.log('Change winning score')
          )}

          {renderSettingItem(
            'speaker.wave.3',
            'Tiempo de Audio',
            'Duración de preview musical',
            `${settings.audioPreviewTime} seg`,
            () => console.log('Change audio time')
          )}
        </View>

        {/* Game Features */}
        <View style={styles.section}>
          {renderSectionHeader('CARACTERÍSTICAS', 'sparkles')}

          {renderSettingItem(
            'dice.fill',
            'Sistema de Apuestas',
            'Permitir apostar tokens en respuestas',
            settings.enableBetting,
            () => console.log('Toggle betting'),
            'toggle'
          )}

          {renderSettingItem(
            'sparkles',
            'Cartas de Poder',
            'Habilitar power-ups especiales',
            settings.enablePowerCards,
            () => console.log('Toggle power cards'),
            'toggle'
          )}

          {renderSettingItem(
            'flame.fill',
            'Modos Especiales',
            'Battle, Speed Round, Viral Moment',
            settings.enableSpecialModes,
            () => console.log('Toggle special modes'),
            'toggle'
          )}

          {renderSettingItem(
            'arrow.clockwise',
            'Avance Automático',
            'Cambiar turno automáticamente',
            settings.autoAdvanceTurn,
            () => console.log('Toggle auto advance'),
            'toggle'
          )}
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          {renderSectionHeader('PREFERENCIAS', 'gear')}

          {renderSettingItem(
            'speaker',
            'Efectos de Sonido',
            'Sonidos de la interfaz',
            settings.soundEffects,
            () => console.log('Toggle sound effects'),
            'toggle'
          )}

          {renderSettingItem(
            'iphone.radiowaves.left.and.right',
            'Vibración',
            'Feedback háptico en acciones',
            settings.hapticFeedback,
            () => console.log('Toggle haptic'),
            'toggle'
          )}
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          {renderSectionHeader('AVANZADO', 'wrench.and.screwdriver')}

          {renderSettingItem(
            'trash',
            'Reiniciar Configuración',
            'Volver a valores por defecto',
            '',
            () => console.log('Reset settings')
          )}

          {renderSettingItem(
            'square.and.arrow.up',
            'Exportar Configuración',
            'Compartir ajustes con otros',
            '',
            () => console.log('Export settings')
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <IconSymbol name='info.circle' size={24} color='#3B82F6' />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Configuración en Desarrollo</Text>
              <Text style={styles.infoText}>
                Estas opciones estarán disponibles en futuras actualizaciones.
                Por ahora, todas las partidas usan la configuración estándar.
              </Text>
            </View>
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>HITBACK v1.0.0 Beta</Text>
          <Text style={styles.versionSubtext}>Game Master Edition</Text>
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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginLeft: 8,
    letterSpacing: 0.5,
  },

  // Language Selector Container
  languageSelectorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  settingInfo: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
  },

  settingSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },

  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },

  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginRight: 8,
  },

  // Info Section
  infoSection: {
    marginVertical: 24,
  },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },

  infoText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },

  // Version Section
  versionSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 40,
  },

  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },

  versionSubtext: {
    fontSize: 12,
    color: '#475569',
  },
});
