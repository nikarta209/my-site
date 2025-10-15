
// Простая система интернационализации без внешних зависимомостей
import { useState, useEffect } from 'react';
import { logError } from '@/lib/logger';
import { translateText } from '../utils/translationService';
import { en } from './locales/en.jsx';
import { ru } from './locales/ru.jsx';
import { fr } from './locales/fr.jsx';
import deLocale from './locales/de.jsx?raw';
import esLocale from './locales/es.jsx?raw';

// Complete translations with full coverage - adding French and Spanish
const parseJsonLocale = (raw) => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    logError('i18n.parseLocale', error);
    return {};
  }
};

const translations = {
  en,
  ru,
  fr,
  de: parseJsonLocale(deLocale),
  es: parseJsonLocale(esLocale)
};

class SimpleI18n {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.listeners = [];
    this.loadedTranslations = translations; // Direct access to translations
  }

  detectLanguage() {
    // Check localStorage
    const saved = localStorage.getItem('kasbook-language');
    if (saved && translations[saved]) {
      return saved;
    }

    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && translations[urlLang]) {
      return urlLang;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
      return browserLang;
    }

    // Fallback
    return 'ru';
  }

  async changeLanguage(lang) {
    if (translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('kasbook-language', lang);
      this.notifyListeners();

      // Force page refresh to ensure all components re-render
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }

  t(key, options = {}, fallback = key) { // Added options parameter
    const currentTranslations = this.loadedTranslations[this.currentLanguage] || {};
    const keys = key.split('.');
    let value = currentTranslations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // Enhanced fallback logic: try English if translation not found in current language
    if (value === undefined && this.currentLanguage !== 'en') {
      const englishTranslations = this.loadedTranslations['en'] || {};
      let englishValue = englishTranslations;
      for (const k of keys) {
        if (englishValue && typeof englishValue === 'object' && k in englishValue) {
          englishValue = englishValue[k];
        } else {
          englishValue = undefined;
          break;
        }
      }
      value = englishValue;
    }

    let result = value !== undefined ? value : fallback;

    // Add interpolation logic for `{{key}}` placeholders
    if (typeof result === 'string' && options && Object.keys(options).length > 0) {
      for (const optKey in options) {
        if (Object.prototype.hasOwnProperty.call(options, optKey)) {
          // Use a more robust regex for interpolation
          result = result.replace(new RegExp(`{{\\s*${optKey}\\s*}}`, 'g'), options[optKey]);
        }
      }
    }

    return result;
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentLanguage));
  }

  get language() {
    return this.currentLanguage;
  }
}

export const i18n = new SimpleI18n();

// React hook for use in components
export const useTranslation = () => {
  const [language, setLanguage] = useState(i18n.language);
  const isReady = true; // Always ready since we have direct access

  useEffect(() => {
    const unsubscribe = i18n.subscribe((newLang) => {
      setLanguage(newLang);
    });
    return unsubscribe;
  }, []);

  return {
    t: (key, options, fallback) => i18n.t(key, options, fallback), // Updated signature for t
    language,
    i18n: {
      language,
      changeLanguage: i18n.changeLanguage.bind(i18n),
      isReady
    }
  };
};

// Hook for dynamic content translation
export const useDynamicTranslation = (originalText, sourceLanguage = 'ru') => {
  const { language, i18n: { isReady } } = useTranslation();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const doTranslate = async () => {
      if (!isReady || !originalText || language === sourceLanguage) {
        setTranslatedText(originalText);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const translation = await translateText(originalText, language, sourceLanguage);
        setTranslatedText(translation);
      } catch (error) {
        logError('i18n.dynamicTranslation', error);
        setTranslatedText(originalText); // Fallback to original text on error
      } finally {
        setIsLoading(false);
      }
    };

    doTranslate();
  }, [originalText, language, sourceLanguage, isReady]);

  return { translatedText, isLoading };
};
