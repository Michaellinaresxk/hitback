import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface Language {
  code: string;
  label: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
];

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      console.log(`✅ Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('❌ Error changing language:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]}>
        {t('settings.language')}
      </Text>

      <View style={styles.languageList}>
        {LANGUAGES.map((language) => {
          const isSelected = i18n.language === language.code;

          return (
            <TouchableOpacity
              key={language.code}
              onPress={() => handleLanguageChange(language.code)}
              style={[
                styles.languageButton,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? '#3B82F6'
                      : '#60A5FA'
                    : isDark
                    ? '#1F2937'
                    : '#F3F4F6',
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: isSelected ? '#2563EB' : 'transparent',
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.languageContent}>
                <Text style={styles.flag}>{language.flag}</Text>
                <Text
                  style={[
                    styles.languageLabel,
                    {
                      color: isSelected
                        ? '#FFF'
                        : isDark
                        ? '#E5E7EB'
                        : '#374151',
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {language.label}
                </Text>
              </View>

              {isSelected && (
                <Ionicons name='checkmark-circle' size={24} color='#FFF' />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.currentLanguageContainer}>
        <Text
          style={[
            styles.currentLanguageLabel,
            { color: isDark ? '#9CA3AF' : '#6B7280' },
          ]}
        >
          {t('settings.language')}:{' '}
        </Text>
        <Text
          style={[
            styles.currentLanguageValue,
            { color: isDark ? '#E5E7EB' : '#374151' },
          ]}
        >
          {LANGUAGES.find((l) => l.code === i18n.language)?.label || 'English'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  languageList: {
    gap: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 28,
  },
  languageLabel: {
    fontSize: 16,
  },
  currentLanguageContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLanguageLabel: {
    fontSize: 14,
  },
  currentLanguageValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
