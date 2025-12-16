import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import es from './locales/es.json';
import en from './locales/en.json';
import pl from './locales/pl.json';

// Detectar el idioma del dispositivo
const locales = Localization.getLocales();
const languageCode = locales[0]?.languageCode || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      pl: { translation: pl },
    },
    lng: languageCode,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    // Esto ayuda a que el cambio de idioma sea detectado por React
    react: {
      useSuspense: false,
    },
  });

export default i18n;