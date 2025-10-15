import { InvokeLLM } from '@/api/integrations';

const translationCache = new Map();

/**
 * Переводит текст с помощью LLM и кэширует результат.
 * @param {string} text - Текст для перевода.
 * @param {string} targetLanguage - Код целевого языка (например, 'en', 'ru').
 * @param {string} sourceLanguage - Код исходного языка.
 * @returns {Promise<string>} - Переведенный текст.
 */
export const translateText = async (text, targetLanguage, sourceLanguage = 'ru') => {
  if (!text || targetLanguage === sourceLanguage) {
    return text;
  }

  const cacheKey = `${sourceLanguage}:${targetLanguage}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Return ONLY the translated text, without any additional comments, explanations, or introductory phrases.\n\nText to translate: "${text}"`;

    const translated = await InvokeLLM({ prompt });

    const rawText = typeof translated === 'string'
      ? translated
      : typeof translated?.result === 'string'
        ? translated.result
        : '';

    if (!rawText || /^AI-ответ:/i.test(rawText)) {
      translationCache.set(cacheKey, text);
      return text;
    }

    // Убираем возможные кавычки, которые может добавить модель
    const cleanedTranslation = rawText.trim().replace(/^"|"$/g, '');

    if (!cleanedTranslation) {
      translationCache.set(cacheKey, text);
      return text;
    }

    translationCache.set(cacheKey, cleanedTranslation);
    return cleanedTranslation;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Возвращаем исходный текст в случае ошибки
  }
};