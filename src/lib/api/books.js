import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

const BOOK_FIELDS = [
  'id',
  'title',
  'slug',
  'author',
  'author_id',
  'cover_url',
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

const logError = (scope, error) => {
  if (typeof console !== 'undefined') {
    console.error(`[booksApi] ${scope}`, error);
  }
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const hasCover = (book) => {
  if (!book) return false;
  if (book.cover_url) return true;
  const coverImages = book.cover_images || book.coverImages;
  return Boolean(coverImages && Object.values(coverImages).some(Boolean));
};

const normalizeBook = (book) => {
  if (!book) return null;

  const genres = Array.isArray(book.genres)
    ? book.genres
    : book.genre
      ? [book.genre]
      : [];

  const languages = ensureArray(book.languages);

  return {
    ...book,
    id: String(book.id),
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

const normalizeBooks = (books) => ensureArray(books).map(normalizeBook).filter(hasCover);

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

    return normalizeBooks(data).slice(0, limit);
  } catch (error) {
    logError('fetchBestsellers', error);

    try {
      const { data, error: booksError } = await supabase
        .from('books')
        .select(BOOK_FIELDS)
        .eq('status', 'approved')
        .order('sales_count', { ascending: false })
        .order('rating', { ascending: false })
        .limit(limit * 3);

      if (booksError) throw booksError;
      return normalizeBooks(data).slice(0, limit);
    } catch (fallbackError) {
      logError('fetchBestsellers:fallback', fallbackError);
      return [];
    }
  }
};

export const fetchHomeBooks = async () => {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase.from('books').select(BOOK_FIELDS).eq('status', 'approved');

    if (error) throw error;

    const books = normalizeBooks(data);

    try {
      const { data: bestsellerData, error: bestsellerError } = await supabase
        .from('bestsellers_view')
        .select('id, weekly_sales, total_sales, rating');

      if (!bestsellerError && Array.isArray(bestsellerData)) {
        const statsById = new Map(bestsellerData.map((entry) => [String(entry.id), entry]));

        return books.map((book) => {
          const stats = statsById.get(book.id);
          if (!stats) {
            return book;
          }

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
      logError('fetchHomeBooks:merge', mergeError);
    }

    return books;
  } catch (error) {
    logError('fetchHomeBooks', error);
    return [];
  }
};

export const fetchBooksByIds = async (ids = []) => {
  const idsArray = ensureArray(ids).map((id) => String(id).trim()).filter(Boolean);

  if (!isSupabaseConfigured || idsArray.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase.from('books').select(BOOK_FIELDS).in('id', idsArray);

    if (error) throw error;

    return normalizeBooks(data);
  } catch (error) {
    logError('fetchBooksByIds', error);
    return [];
  }
};
