import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { logError } from '@/lib/logger';
import { translateBookCollection } from '@/lib/i18n/bookTranslation';
import { hasCoverImage } from '@/lib/books/coverImages';

export const BOOK_FIELDS = [
  'id',
  'title',
  'slug',
  'author',
  'author_id',
  'cover_images',
  'genre',
  'genres',
  'lang',
  'languages',
  'rating',
  'weekly_sales',
  'total_sales',
  'sales_count',
  'likes_count',
  'reviews_count',
  'price',
  'price_kas',
  'is_free',
  'is_editors_pick',
  'is_exclusive',
  'is_subscription_only',
  'tags',
  'created_at',
  'updated_at',
  'published_at',
  'released_at',
  'release_date',
  'preview_available',
]
  .filter(Boolean)
  .join(',');

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const hasCover = (book) => hasCoverImage(book);

const normalizeBook = (book) => {
  if (!book) return null;
  const genres = Array.isArray(book.genres)
    ? book.genres
    : book.genre
      ? [book.genre]
      : [];

  const languages = Array.isArray(book.languages)
    ? book.languages
    : book.lang
      ? [book.lang]
      : [];

  return {
    ...book,
    id: book.id != null ? String(book.id) : undefined,
    genres,
    languages,
    weekly_sales:
      typeof book.weekly_sales === 'number'
        ? book.weekly_sales
        : typeof book.sales_count === 'number'
          ? book.sales_count
          : 0,
    total_sales:
      typeof book.total_sales === 'number'
        ? book.total_sales
        : typeof book.sales_count === 'number'
          ? book.sales_count
          : 0,
    rating: typeof book.rating === 'number' ? book.rating : Number(book.rating) || 0,
  };
};

const normalizeBooks = (items) => ensureArray(items).map(normalizeBook).filter(hasCover);

export const fetchBestsellers = async (limit = 12) => {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('bestsellers_view')
      .select(BOOK_FIELDS)
      .order('weekly_sales', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit * 2);

    if (error) throw error;

    const books = normalizeBooks(data);
    const translated = await translateBookCollection(books);
    return translated.slice(0, limit);
  } catch (error) {
    logError('books.fetchBestsellers', error);
  }

  try {
    const { data, error: fallbackError } = await supabase
      .from('v_books_public')
      .select(BOOK_FIELDS)
      .eq('status', 'approved')
      .order('sales_count', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit * 3);

    if (fallbackError) throw fallbackError;

    const books = normalizeBooks(data);
    const translated = await translateBookCollection(books);
    return translated.slice(0, limit);
  } catch (fallbackError) {
    logError('books.fetchBestsellers.fallback', fallbackError);
    return [];
  }
};

export const fetchHomeBooks = async () => {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('v_books_public')
      .select(BOOK_FIELDS)
      .eq('status', 'approved');

    if (error) throw error;

    const books = normalizeBooks(data);

    if (books.length === 0) {
      return [];
    }

    const translatedBooks = await translateBookCollection(books);

    try {
      const { data: bestsellerStats, error: statsError } = await supabase
        .from('bestsellers_view')
        .select('id, weekly_sales, total_sales, rating');

      if (statsError) throw statsError;

      if (Array.isArray(bestsellerStats) && bestsellerStats.length > 0) {
        const byId = new Map(bestsellerStats.map((entry) => [String(entry.id), entry]));

        return translatedBooks.map((book) => {
          const stats = byId.get(book.id);
          if (!stats) return book;

          return {
            ...book,
            weekly_sales:
              typeof stats.weekly_sales === 'number' ? stats.weekly_sales : book.weekly_sales,
            total_sales:
              typeof stats.total_sales === 'number' ? stats.total_sales : book.total_sales,
            rating: typeof stats.rating === 'number' ? stats.rating : book.rating,
          };
        });
      }
    } catch (mergeError) {
      logError('books.fetchHomeBooks.merge', mergeError);
    }

    return translatedBooks;
  } catch (error) {
    logError('books.fetchHomeBooks', error);
    return [];
  }
};

export const fetchBooksByIds = async (ids = []) => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const uniqueIds = Array.from(new Set(ensureArray(ids).map((id) => (id != null ? String(id) : null)).filter(Boolean)));

  if (uniqueIds.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('v_books_public')
      .select(BOOK_FIELDS)
      .in('id', uniqueIds);

    if (error) throw error;

    const books = normalizeBooks(data);
    return translateBookCollection(books);
  } catch (error) {
    logError('books.fetchBooksByIds', error);
    return [];
  }
};
