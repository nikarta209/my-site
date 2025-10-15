import supabase, { isSupabaseConfigured } from '@/api/supabaseClient';

const ensureArray = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  return [value];
};

const hasCover = (book) => {
  if (!book) return false;
  if (book.cover_url && book.cover_url.trim().length > 0) return true;
  const coverImages = book.cover_images || {};
  return Object.values(coverImages).some((url) => typeof url === 'string' && url.trim().length > 0);
};

const handleError = (error, context) => {
  if (!error) return;
  if (typeof console !== 'undefined') {
    console.error(`[books] ${context}`, error);
  }
  throw error;
};

const normalizeBooks = (books) => {
  if (!books || books.length === 0) return [];
  return books
    .filter((book) => Boolean(book && book.id))
    .map((book) => ({
      ...book,
      genres: ensureArray(book.genres),
      languages: ensureArray(book.languages),
    }));
};

export async function fetchBestsellers(limit = 12) {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('bestsellers_top10')
    .select('*')
    .limit(limit);

  handleError(error, 'fetchBestsellers');

  return normalizeBooks(data || []).filter(hasCover);
}

export async function fetchFeedBooks({ limit = 160 } = {}) {
  if (!isSupabaseConfigured) {
    return [];
  }

  const query = supabase
    .from('bestsellers_view')
    .select('*')
    .not('cover_url', 'is', null)
    .order('weekly_sales', { ascending: false })
    .order('rating', { ascending: false })
    .limit(limit);

  const { data, error } = await query;
  handleError(error, 'fetchFeedBooks');
  return normalizeBooks(data || []).filter(hasCover);
}

export function ensureCoverUrl(book) {
  if (!book) return null;
  if (book.cover_url && book.cover_url.trim().length > 0) {
    return book.cover_url;
  }
  const variants = book.cover_images || {};
  const candidate = ['portrait_large', 'default', 'square', 'landscape']
    .map((key) => variants[key] || null)
    .find((value) => typeof value === 'string' && value.trim().length > 0);
  return candidate ?? null;
}

export function inferGenres(book) {
  const genres = [];
  if (book?.genre) {
    genres.push(book.genre);
  }
  if (Array.isArray(book?.genres)) {
    book.genres.forEach((value) => {
      if (typeof value === 'string') {
        genres.push(value);
      }
    });
  }
  return Array.from(new Set(genres.map((g) => g.toLowerCase())));
}

export function inferLanguages(book) {
  const result = [];
  if (book?.lang) result.push(book.lang);
  if (book?.language) result.push(book.language);
  if (Array.isArray(book?.languages)) {
    book.languages.forEach((item) => {
      if (typeof item === 'string') {
        result.push(item);
      } else if (item && typeof item === 'object' && 'lang' in item && item.lang) {
        result.push(String(item.lang));
      }
    });
  }
  return Array.from(new Set(result.map((lang) => lang.toLowerCase())));
}

export function getPrimaryGenre(book) {
  const [primary = 'other'] = inferGenres(book);
  return primary;
}
