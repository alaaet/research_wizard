import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { getUserMetaData } from '../connectors/userMetaDataIpc';

// Import translations
import translationEN from '../locales/en/translation.json';
import translationAR from '../locales/ar/translation.json';
import translationZH from '../locales/zh/translation.json';
import translationFR from '../locales/fr/translation.json';
import translationRU from '../locales/ru/translation.json';
import translationES from '../locales/es/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  ar: {
    translation: translationAR
  },
  zh: {
    translation: translationZH
  },
  fr: {
    translation: translationFR
  },
  ru: {
    translation: translationRU
  },
  es: {
    translation: translationES
  }
};

// Initialize i18n
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Load saved language from database
const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await getUserMetaData('ui_language');
    if (savedLanguage?.Value) {
      changeLanguage(savedLanguage.Value);
    }
  } catch (error) {
    console.error('Failed to load saved language:', error);
  }
};

// Function to change language and update document direction
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
};

// Load saved language on startup
loadSavedLanguage();

export default i18n; 