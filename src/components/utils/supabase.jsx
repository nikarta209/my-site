
import { toast } from 'sonner';
import { Book, Purchase, User, UserBookData } from '@/api/entities';
import { UploadFile as CoreUploadFile } from '@/api/integrations';
import supabaseClient from '@/api/supabaseClient';

export const supabase = supabaseClient;

// ОПТИМИЗАЦИЯ: Простой кэш в памяти с TTL
const cache = new Map();
const CACHE_TTL = 60000; // 1 минута

const getCacheKey = (operation, params = {}) => {
  return `${operation}_${JSON.stringify(params)}`;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const getCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
};

/**
 * Утилита для повторных попыток выполнения асинхронной операции
 * при сетевых сбоях.
 */
const withRetry = async (operation, maxAttempts = 3, operationName = 'operation') => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // ИСПРАВЛЕНИЕ: Выполняем операцию и возвращаем результат
      return await operation();
    } catch (error) {
      console.warn(`⚠️ ${operationName} - попытка ${attempt} неудачна:`, error.message);
      if (attempt === maxAttempts) {
        toast.error(`Ошибка сети: ${error.message}`, {
          description: `Не удалось выполнить операцию '${operationName}' после ${maxAttempts} попыток.`
        });
        // Пробрасываем ошибку дальше, чтобы компонент мог ее обработать
        throw error;
      }
      // Экспоненциальная задержка перед следующей попыткой
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }
};

// --- ПУБЛИЧНЫЕ ФУНКЦИИ ---

/**
 * Получает одобренные книги с кэшированием.
 * @param {number} limit - Максимальное количество книг.
 * @returns {Promise<Array>} - Массив книг.
 */
export const getApprovedBooks = (limit = 12) => {
  const cacheKey = getCacheKey('approved_books', { limit });
  const cached = getCache(cacheKey);
  if (cached) return Promise.resolve(cached);

  return withRetry(async () => {
    const books = await Book.filter({ status: 'approved' }, '-created_at', limit);
    setCache(cacheKey, books);
    return books;
  }, 3, 'getApprovedBooks');
};

/**
 * Получает публичные и одобренные книги с кэшированием.
 * @param {number} limit - Максимальное количество книг.
 * @returns {Promise<Array>} - Массив книг.
 */
export const getPublicBooks = (limit = 20) => {
  const cacheKey = getCacheKey('public_books', { limit });
  const cached = getCache(cacheKey);
  if (cached) return Promise.resolve(cached);

  return withRetry(async () => {
    const books = await Book.filter({ status: { '$in': ['approved', 'public_domain'] } }, '-created_at', limit);
    setCache(cacheKey, books);
    return books;
  }, 3, 'getPublicBooks');
};

/**
 * ОПТИМИЗАЦИЯ: Кэшированное получение книг по жанру
 * @param {string} genre - Жанр для поиска.
 * @param {number} limit - Максимальное количество книг.
 * @returns {Promise<Array>} - Массив книг.
 */
export const getBooksByGenre = (genre, limit = 10) => {
  const cacheKey = getCacheKey('books_by_genre', { genre, limit });
  const cached = getCache(cacheKey);
  if (cached) return Promise.resolve(cached);

  return withRetry(async () => {
    const books = await Book.filter({ status: 'approved', genres: { '$in': [genre] } }, '-created_at', limit);
    setCache(cacheKey, books);
    return books;
  }, 3, 'getBooksByGenre');
};

/**
 * НОВАЯ ФУНКЦИЯ: Получает статистику сравнения по жанру
 * @param {string} genre - Жанр для сравнения
 * @returns {Promise<object>} - Объект со средней статистикой по жанру
 */
export const getComparisonStats = async (genre) => {
  const cacheKey = getCacheKey('comparison_stats', { genre });
  const cached = getCache(cacheKey);
  if (cached) return cached;

  return withRetry(async () => {
    try {
      // Получаем все книги этого жанра
      const books = await Book.filter({ 
        status: 'approved', 
        genres: { '$in': [genre] } 
      });

      if (!books || books.length === 0) {
        return {
          sales: 0,
          likes: 0,
          rating: 0,
          revenue: 0
        };
      }

      // Вычисляем средние значения
      const totalBooks = books.length;
      const stats = {
        sales: books.reduce((sum, book) => sum + (book.sales_count || 0), 0) / totalBooks,
        likes: books.reduce((sum, book) => sum + (book.likes_count || 0), 0) / totalBooks,
        rating: books.reduce((sum, book) => sum + (book.rating || 0), 0) / totalBooks,
        revenue: books.reduce((sum, book) => sum + ((book.sales_count || 0) * (book.price_kas || 0) * 0.8), 0) / totalBooks
      };

      setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error getting comparison stats:', error);
      // Возвращаем нулевые значения при ошибке
      return {
        sales: 0,
        likes: 0,
        rating: 0,
        revenue: 0
      };
    }
  }, 3, 'getComparisonStats');
};

/**
 * ОПТИМИЗАЦИЯ: Кэшированное получение превью пользователя
 * @returns {Promise<Array>} - Массив книг для превью.
 */
export const getUserPreviews = () => {
  return withRetry(async () => {
    const user = await User.me();
    if (!user) return [];

    const cacheKey = getCacheKey('user_previews', { userEmail: user.email });
    const cached = getCache(cacheKey);
    if (cached) return cached;

    // 1. Получаем все взаимодействия пользователя с книгами
    const userBookInteractions = await UserBookData.filter({ user_email: user.email });
    if (!userBookInteractions || userBookInteractions.length === 0) return [];

    // 2. Получаем все покупки пользователя
    const purchases = await Purchase.filter({ buyer_email: user.email });
    const purchasedBookIds = new Set(purchases.map(p => p.book_id));

    // 3. Находим ID книг, с которыми было взаимодействие, но которые не были куплены
    const previewBookIds = userBookInteractions
      .map(interaction => interaction.book_id)
      .filter(bookId => bookId && !purchasedBookIds.has(bookId));

    if (previewBookIds.length === 0) return [];

    // 4. Загружаем полную информацию по найденным ID книг
    const books = await Book.filter({ id: { '$in': previewBookIds } });
    setCache(cacheKey, books);
    return books;
  }, 3, 'getUserPreviews');
};


// --- ФУНКЦИИ, ТРЕБУЮЩИЕ АУТЕНТИФИКАЦИИ ---

/**
 * ОПТИМИЗАЦИЯ: Кэшированное получение покупок пользователя
 * @returns {Promise<Array>} - Массив покупок с данными о книгах.
 */
export const getUserPurchases = () => {
  return withRetry(async () => {
    const user = await User.me();
    if (!user) throw new Error("Требуется аутентификация");

    const cacheKey = getCacheKey('user_purchases', { userEmail: user.email });
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const purchases = await Purchase.filter({ buyer_email: user.email });
    if (!purchases || purchases.length === 0) return [];

    const bookIds = purchases.map(p => p.book_id).filter(Boolean);
    if (bookIds.length === 0) return purchases.map(p => ({ ...p, book: null }));

    const books = await Book.filter({ id: { '$in': bookIds } });

    const booksById = books.reduce((acc, book) => {
      acc[book.id] = book;
      return acc;
    }, {});

    const result = purchases.map(p => ({
      ...p,
      book: booksById[p.book_id] || null
    }));

    setCache(cacheKey, result);
    return result;
  }, 3, 'getUserPurchases');
};

/**
 * ОПТИМИЗАЦИЯ: Кэшированное получение книг автора
 * @returns {Promise<Array>} - Массив книг автора.
 */
export const getAuthorBooks = () => {
  return withRetry(async () => {
    const user = await User.me();
    if (!user) throw new Error("Требуется аутентификация");

    const cacheKey = getCacheKey('author_books', { userEmail: user.email });
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const books = await Book.filter({ author_email: user.email });
    setCache(cacheKey, books);
    return books;
  }, 3, 'getAuthorBooks');
};


// --- ОПЕРАЦИИ ЗАПИСИ И ЗАГРУЗКИ ---

/**
 * Загружает файл через интеграцию Base44.
 * @param {File} file - Файл для загрузки.
 * @param {object} options - Опции (не используются, для совместимости).
 * @returns {Promise<{publicUrl: string, path: string}>} - URL и путь к файлу.
 */
export const uploadFile = (file, options = {}) => withRetry(async () => {
  // ИСПРАВЛЕНИЕ: Убираем передачу параметра path (already not present, confirming its absence)
  const { file_url } = await CoreUploadFile({ file });
  return { publicUrl: file_url, path: file_url };
}, 3, 'uploadFile');

/**
 * Создает новую книгу.
 * @param {object} bookData - Данные книги.
 * @returns {Promise<object>} - Созданный объект книги.
 */
export const createBook = (bookData) => withRetry(async () => {
  const user = await User.me();
  if (!user) throw new Error("Требуется аутентификация");
  
  // ИСПРАВЛЕНИЕ: Добавляем author_email и author в данные книги
  const bookWithAuthor = {
    ...bookData,
    author_email: user.email,
    author: bookData.author || user.full_name || 'Неизвестный автор',
    author_id: user.id
  };
  
  return Book.create(bookWithAuthor);
}, 3, 'createBook');

/**
 * Обновляет существующую книгу.
 * @param {string} bookId - ID книги.
 * @param {object} updateData - Данные для обновления.
 * @returns {Promise<object>} - Обновленный объект книги.
 */
export const updateBook = (bookId, updateData) => withRetry(() =>
  Book.update(bookId, updateData)
, 3, 'updateBook');

/**
 * Получает книги, ожидающие модерации.
 * @returns {Promise<Array>} - Массив книг.
 */
export const getPendingBooks = () => withRetry(() =>
  Book.filter({ status: 'pending' }, '-created_at')
, 3, 'getPendingBooks');

/**
 * ОПТИМИЗАЦИЯ: Функция для инвалидации кэша
 * @param {string|null} pattern - Шаблон для ключей кэша, которые нужно удалить. Если null, очищается весь кэш.
 */
export const invalidateCache = (pattern = null) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

/**
 * Безопасно обновляет статус книги через сервер с использованием сервисного ключа Supabase.
 */
export const moderateBookStatus = ({ bookId, status, moderatorEmail, rejectionInfo = null }) =>
  withRetry(async () => {
    if (!bookId) throw new Error('Не указан идентификатор книги');
    if (!status) throw new Error('Не указан статус модерации');
    if (!moderatorEmail) throw new Error('Не указан email модератора');

    const normalizedStatus = status.toLowerCase();

    const buildUpdatePayload = () => {
      const payload = {
        status: normalizedStatus,
        moderator_email: moderatorEmail
      };

      if (normalizedStatus === 'approved') {
        payload.rejection_info = null;
      } else if (normalizedStatus === 'rejected') {
        payload.rejection_info = rejectionInfo || null;
      }

      return payload;
    };

    const attemptFallbackUpdate = async () => {
      try {
        const updatedBook = await Book.update(bookId, buildUpdatePayload());
        if (!updatedBook) {
          throw new Error('Пустой ответ Supabase');
        }
        invalidateCache();
        toast.warning(
          'Использован резервный путь обновления через Supabase. Проверьте конфигурацию серверной модерации.'
        );
        return updatedBook;
      } catch (fallbackError) {
        console.error('[moderation] fallback update failed', fallbackError);
        throw fallbackError;
      }
    };

    let response;
    try {
      response = await fetch(`/api/moderation/books/${bookId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: normalizedStatus, moderatorEmail, rejectionInfo })
      });
    } catch (networkError) {
      console.warn('[moderation] server request failed, attempting fallback', networkError);
      return attemptFallbackUpdate();
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('Не удалось разобрать ответ сервера модерации', error);
    }

    if (response.ok && payload?.success) {
      invalidateCache();
      return payload.data;
    }

    const errorMessage = payload?.error || `Не удалось обновить статус книги (код ${response.status})`;
    const shouldFallback =
      response.status === 404 ||
      response.status === 503 ||
      (response.status === 500 &&
        (errorMessage.toLowerCase().includes('не настроен') || errorMessage.toLowerCase().includes('not configured')));

    if (shouldFallback) {
      console.warn('[moderation] server returned fallback-eligible error:', errorMessage);
      return attemptFallbackUpdate();
    }

    throw new Error(errorMessage);
  }, 3, 'moderateBookStatus');
