import { franc } from 'franc-min';

const FRANC_TO_ISO6391 = {
  afr: 'af',
  ara: 'ar',
  ben: 'bn',
  ces: 'cs',
  deu: 'de',
  eng: 'en',
  eus: 'eu',
  fra: 'fr',
  heb: 'he',
  hin: 'hi',
  hun: 'hu',
  ita: 'it',
  jpn: 'ja',
  kor: 'ko',
  pol: 'pl',
  por: 'pt',
  ron: 'ro',
  rus: 'ru',
  spa: 'es',
  swe: 'sv',
  tur: 'tr',
  ukr: 'uk',
  vie: 'vi',
  zho: 'zh'
};

const LANGUAGE_METADATA = {
  ar: { label: 'العربية', flag: '🇸🇦' },
  de: { label: 'Deutsch', flag: '🇩🇪' },
  en: { label: 'English', flag: '🇺🇸' },
  es: { label: 'Español', flag: '🇪🇸' },
  fr: { label: 'Français', flag: '🇫🇷' },
  it: { label: 'Italiano', flag: '🇮🇹' },
  ja: { label: '日本語', flag: '🇯🇵' },
  ko: { label: '한국어', flag: '🇰🇷' },
  pl: { label: 'Polski', flag: '🇵🇱' },
  pt: { label: 'Português', flag: '🇵🇹' },
  ru: { label: 'Русский', flag: '🇷🇺' },
  tr: { label: 'Türkçe', flag: '🇹🇷' },
  uk: { label: 'Українська', flag: '🇺🇦' },
  vi: { label: 'Tiếng Việt', flag: '🇻🇳' },
  zh: { label: '中文', flag: '🇨🇳' }
};

const MIN_SAMPLE_LENGTH = 48;

const sanitizeText = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/\u0000/g, ' ')
    .replace(/[\u0001-\u001F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const readBlobAsText = (blob) => new Promise((resolve, reject) => {
  if (typeof FileReader === 'undefined') {
    resolve('');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    resolve(typeof reader.result === 'string' ? reader.result : '');
  };
  reader.onerror = () => {
    reject(reader.error || new Error('Не удалось прочитать файл'));
  };
  reader.readAsText(blob, 'utf-8');
});

export const detectLanguageFromText = (text) => {
  const sanitized = sanitizeText(text);
  if (!sanitized || sanitized.length < MIN_SAMPLE_LENGTH) {
    return null;
  }

  const francCode = franc(sanitized, { minLength: Math.max(10, Math.floor(MIN_SAMPLE_LENGTH / 2)) });
  if (!francCode || francCode === 'und') {
    return null;
  }

  return FRANC_TO_ISO6391[francCode] || null;
};

export const detectLanguageFromFile = async (file, options = {}) => {
  if (!file) return null;
  if (typeof window === 'undefined') return null;

  try {
    const chunkSize = options.chunkSize || 256 * 1024; // 256KB
    const slice = file.slice(0, Math.min(file.size, chunkSize));
    const text = await readBlobAsText(slice);
    return detectLanguageFromText(text);
  } catch (error) {
    console.error('[languageDetection] Failed to detect language', error);
    return null;
  }
};

export const getLanguageMetadata = (code) => {
  if (!code) {
    return { label: 'Неизвестно', flag: '🏷️' };
  }

  return LANGUAGE_METADATA[code] || {
    label: code.toUpperCase(),
    flag: '🏷️'
  };
};

export const isSameLanguage = (a, b) => {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
};

export const LANGUAGE_METADATA_MAP = LANGUAGE_METADATA;

