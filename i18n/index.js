import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from './locales/es.json';
import en from './locales/en.json';
import pl from './locales/pl.json';
import tourCitiesEs from './locales/tour-cities.es.json';
import tourCitiesEn from './locales/tour-cities.en.json';
import tourCitiesPl from './locales/tour-cities.pl.json';

export const SUPPORTED_LANGUAGES = ['es', 'en', 'pl'];
const LANGUAGE_STORAGE_KEY = 'hitback.language';
const withTourCities = (locale, tourCities) => ({
  ...locale,
  tour: {
    ...locale.tour,
    cities: {
      ...locale.tour.cities,
      ...tourCities,
    },
  },
});

const getSupportedLanguage = (languageCode) =>
  SUPPORTED_LANGUAGES.includes(languageCode?.toLowerCase().split('-')[0])
    ? languageCode.toLowerCase().split('-')[0]
    : null;

export const i18nReady = (async () => {
  let savedLanguage = null;

  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Unable to read the saved language preference:', error);
  }

  const deviceLanguage = Localization.getLocales()[0]?.languageCode;
  const language =
    getSupportedLanguage(savedLanguage) ??
    getSupportedLanguage(deviceLanguage) ??
    'en';

  await i18n.use(initReactI18next).init({
    resources: {
      es: { translation: withTourCities(es, tourCitiesEs) },
      en: { translation: withTourCities(en, tourCitiesEn) },
      pl: { translation: withTourCities(pl, tourCitiesPl) },
    },
    lng: language,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
})();

export async function changeAppLanguage(languageCode) {
  const language = getSupportedLanguage(languageCode);
  if (!language) {
    throw new Error(`Unsupported language: ${languageCode}`);
  }

  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18n.changeLanguage(language);
}

export default i18n;
