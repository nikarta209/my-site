import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

const logError = (scope, error) => {
  if (typeof console !== 'undefined') {
    console.error(`[booksApi] ${scope}`, error);
  }
};

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
  'preview_available'
]
  .filter(Boolean)
  .join(',');

const ensureCover = (book) =>
  book && (book.cover_url || (book.cover_images && Object.values(book.cover_images || {}).some(Boolean)));

const pickTopWithCover = (data = []) => data.filter(ensureCover);

const normalizeBook = (book) => ({
  ...book,
  id: String(book.id),
  genres: Array.isArray(book.genres)
    ? book.genres
    : book.genre
      ? [book.genre]
      : [],
  languages: Array.isArray(book.languages) ? book.languages : [],
  weekly_sales: typeof book.weekly_sales === 'number'
    ? book.weekly_sales
    : book.sales_count || 0,
  total_sales: typeof book.total_sales === 'number'
    ? book.total_sales
    : book.sales_count || 0,
  rating: typeof book.rating === 'number' ? book.rating : Number(book.rating) || 0,
});

export const fetchBestsellers = async (limit = 12) => {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('bestsellers_view')
      .select('*')
      .not('cover_url', 'is', null)
      .order('weekly_sales', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return pickTopWithCover((data || []).map(normalizeBook));
  } catch (error) {
    logError('fetchBestsellers', error);

    try {
      const { data, error: booksError } = await supabase
        .from('books')
        .select(BOOK_FIELDS)
        .eq('status', 'approved')
        .order('sales_count', { ascending: false })
        .order('rating', { ascending: false })
        .limit(limit * 2);

      if (booksError) throw booksError;
      return pickTopWithCover((data || []).map(normalizeBook)).slice(0, limit);
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
    const { data, error } = await supabase
      .from('books')
      .select(BOOK_FIELDS)
      .eq('status', 'approved');

    if (error) throw error;

    const books = (data || []).map(normalizeBook);

    try {
      const { data: bestsellerData, error: bestsellerError } = await supabase
        .from('bestsellers_view')
        .select('id, weekly_sales, total_sales, rating');

      if (!bestsellerError && Array.isArray(bestsellerData)) {
        const byId = new Map(bestsellerData.map((entry) => [String(entry.id), entry]));
        return books.map((book) => {
          const stats = byId.get(book.id);
          if (!stats) return book;
          return {
            ...book,
            weekly_sales: typeof stats.weekly_sales === 'number' ? stats.weekly_sales : book.weekly_sales,
            total_sales: typeof stats.total_sales === 'number' ? stats.total_sales : book.total_sales,
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
  if (!isSupabaseConfigured || !Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('books')
      .select(BOOK_FIELDS)
      .in('id', ids);

    if (error) throw error;
    return (data || []).map(normalizeBook);
  } catch (error) {
    logError('fetchBooksByIds', error);
    return [];
  }
};
