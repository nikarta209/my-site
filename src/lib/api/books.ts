import type { PostgrestError } from '@supabase/supabase-js';
import supabase, { isSupabaseConfigured } from '@/api/supabaseClient';

export type Book = {
  id: string;
  slug?: string | null;
  title: string;
  subtitle?: string | null;
  author?: string | null;
  genre?: string | null;
  genres?: string[] | null;
  lang?: string | null;
  language?: string | null;
  languages?: { lang?: string | null }[] | string[] | null;
  rating?: number | null;
  rating_count?: number | null;
  likes_count?: number | null;
  reviews_count?: number | null;
  cover_url: string | null;
  cover_images?: Record<string, string | null> | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  release_date?: string | null;
  last_sold_at?: string | null;
  price_kas?: number | null;
  price_usd?: number | null;
  is_editors_pick?: boolean | null;
  is_in_subscription?: boolean | null;
  is_public_domain?: boolean | null;
  is_exclusive?: boolean | null;
  is_preview_available?: boolean | null;
  tags?: string[] | null;
  status?: string | null;
  weekly_sales?: number | null;
  total_sales?: number | null;
};

const ensureArray = <T>(value: T[] | T | null | undefined): T[] | null => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  return [value];
};

const hasCover = (book: Book) => {
  if (!book) return false;
  if (book.cover_url && book.cover_url.trim().length > 0) return true;
  const coverImages = book.cover_images || {};
  return Object.values(coverImages).some((url) => typeof url === 'string' && url.trim().length > 0);
};

const handleError = (error: PostgrestError | null, context: string) => {
  if (!error) return;
  if (typeof console !== 'undefined') {
    console.error(`[books] ${context}`, error);
  }
  throw error;
};

const normalizeBooks = (books: Book[] | null) => {
  if (!books || books.length === 0) return [] as Book[];
  return books
    .filter((book): book is Book => Boolean(book && book.id))
    .map((book) => ({
      ...book,
      genres: ensureArray<string>(book.genres as string[] | string | null),
      languages: ensureArray(book.languages as { lang?: string | null }[] | string[] | string | null),
    }));
};

export async function fetchBestsellers(limit = 12): Promise<Book[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('bestsellers_top10')
    .select('*')
    .limit(limit);

  handleError(error, 'fetchBestsellers');

  return normalizeBooks((data as Book[] | null) || []).filter(hasCover);
}

export type FeedQueryOptions = {
  limit?: number;
  offset?: number;
  genres?: string[];
  isEditorsPick?: boolean;
  isExclusive?: boolean;
  isFreePreview?: boolean;
  onlyFresh?: boolean;
};

export async function fetchFeedBooks({ limit = 160 }: FeedQueryOptions = {}): Promise<Book[]> {
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
  return normalizeBooks((data as Book[] | null) || []).filter(hasCover);
}

export function ensureCoverUrl(book: Book): string | null {
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

export function inferGenres(book: Book): string[] {
  const genres: string[] = [];
  if (book.genre) {
    genres.push(book.genre);
  }
  if (Array.isArray(book.genres)) {
    book.genres.forEach((value) => {
      if (typeof value === 'string') {
        genres.push(value);
      }
    });
  }
  return Array.from(new Set(genres.map((g) => g.toLowerCase())));
}

export function inferLanguages(book: Book): string[] {
  const result: string[] = [];
  if (book.lang) result.push(book.lang);
  if (book.language) result.push(book.language);
  if (Array.isArray(book.languages)) {
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

export function getPrimaryGenre(book: Book): string {
  const [primary = 'other'] = inferGenres(book);
  return primary;
}
