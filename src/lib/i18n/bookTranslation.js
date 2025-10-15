import { i18n } from '@/components/i18n/SimpleI18n';
import { translateText } from '@/components/utils/translationService';
import { logError } from '@/lib/logger';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeLanguageCode = (code) => {
  if (!isNonEmptyString(code)) {
    return null;
  }
  return code.trim().toLowerCase().split('-')[0];
};

const detectLanguageFromArray = (values) => {
  if (!Array.isArray(values)) {
    return null;
  }
  for (const value of values) {
    const normalized = normalizeLanguageCode(value);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

export const detectBookLanguage = (book) => {
  if (!book || typeof book !== 'object') {
    return 'ru';
  }

  const candidates = [
    normalizeLanguageCode(book.originalLanguage),
    normalizeLanguageCode(book.language),
    normalizeLanguageCode(book.lang),
    detectLanguageFromArray(book.languages),
  ];

  const detected = candidates.find(Boolean);
  return detected || 'ru';
};

const translateString = async (value, targetLanguage, sourceLanguage) => {
  if (!isNonEmptyString(value)) {
    return value;
  }
  try {
    return await translateText(value, targetLanguage, sourceLanguage);
  } catch (error) {
    logError('i18n.translateString', error);
    return value;
  }
};

const translateArray = async (values, targetLanguage, sourceLanguage) => {
  if (!Array.isArray(values) || values.length === 0) {
    return values;
  }

  try {
    const translated = await Promise.all(
      values.map((item) => translateString(item, targetLanguage, sourceLanguage))
    );
    return translated.filter(isNonEmptyString);
  } catch (error) {
    logError('i18n.translateArray', error);
    return values;
  }
};

export const translateBookRecord = async (book, targetLanguage = i18n.language) => {
  if (!book) {
    return book;
  }

  const sourceLanguage = detectBookLanguage(book);
  const normalizedTarget = normalizeLanguageCode(targetLanguage) || i18n.language || 'ru';

  if (!normalizedTarget || normalizedTarget === sourceLanguage) {
    return {
      ...book,
      originalLanguage: sourceLanguage,
      translatedLanguage: normalizedTarget,
    };
  }

  try {
    const [
      title,
      author,
      description,
      shortDescription,
      aiSummary,
      summary,
      notes,
      subtitle,
    ] = await Promise.all([
      translateString(book.title, normalizedTarget, sourceLanguage),
      translateString(book.author, normalizedTarget, sourceLanguage),
      translateString(book.description, normalizedTarget, sourceLanguage),
      translateString(book.short_description ?? book.shortDescription, normalizedTarget, sourceLanguage),
      translateString(book.ai_summary, normalizedTarget, sourceLanguage),
      translateString(book.summary, normalizedTarget, sourceLanguage),
      translateString(book.notes, normalizedTarget, sourceLanguage),
      translateString(book.subtitle, normalizedTarget, sourceLanguage),
    ]);

    const translatedGenres = await translateArray(book.genres, normalizedTarget, sourceLanguage);
    const translatedTags = await translateArray(book.tags, normalizedTarget, sourceLanguage);

    return {
      ...book,
      originalLanguage: sourceLanguage,
      translatedLanguage: normalizedTarget,
      originalTitle: book.originalTitle ?? book.title,
      originalAuthor: book.originalAuthor ?? book.author,
      originalDescription: book.originalDescription ?? book.description,
      title: title ?? book.title,
      author: author ?? book.author,
      description: description ?? book.description,
      short_description: shortDescription ?? book.short_description ?? book.shortDescription,
      shortDescription: shortDescription ?? book.shortDescription ?? book.short_description,
      ai_summary: aiSummary ?? book.ai_summary,
      summary: summary ?? book.summary,
      notes: notes ?? book.notes,
      subtitle: subtitle ?? book.subtitle,
      genres: translatedGenres ?? book.genres,
      tags: translatedTags ?? book.tags,
    };
  } catch (error) {
    logError('i18n.translateBookRecord', error);
    return {
      ...book,
      originalLanguage: sourceLanguage,
      translatedLanguage: normalizedTarget,
    };
  }
};

export const translateBookCollection = async (books, targetLanguage = i18n.language) => {
  if (!Array.isArray(books) || books.length === 0) {
    return books ?? [];
  }

  const translated = await Promise.all(
    books.map((book) => translateBookRecord(book, targetLanguage))
  );

  return translated;
};
