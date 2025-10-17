import { supabase } from './supabaseClient';

export type CoverImages = Record<string, string | null | undefined> & {
  default?: string | null;
  square?: string | null;
  main_banner?: string | null;
  notes_1?: string | null;
  notes_2?: string | null;
  landscape?: string | null;
  library_hero?: string | null;
};

export interface PublicBook {
  id: string;
  title: string;
  author: string | null;
  author_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  cover_images: CoverImages | null;
  likes_count: number | null;
  sales_count: number | null;
  rating: number | null;
  is_editors_pick: boolean | null;
  status: string | null;
}

export const BOOK_FIELDS = [
  'id',
  'title',
  'author',
  'author_name',
  'created_at',
  'updated_at',
  'cover_images',
  'likes_count',
  'sales_count',
  'rating',
  'is_editors_pick',
  'status',
].join(', ');

type SupabaseBookResponse = PromiseLike<{ data: PublicBook[] | null; error: unknown }>;

type SupabaseSingleBookResponse = PromiseLike<{ data: PublicBook | null; error: unknown }>;

const BOOKS_VIEW = 'v_books_public';

/** Новинки: книги со статусом approved или public_domain, новые сначала */
export function fetchNewBooks(): SupabaseBookResponse {
  return supabase
    .from(BOOKS_VIEW)
    .select(BOOK_FIELDS)
    .in('status', ['approved', 'public_domain'])
    .order('created_at', { ascending: false });
}

/** Популярное: книги, отсортированные по количеству продаж (sales_count) по убыванию */
export function fetchPopularBooks(): SupabaseBookResponse {
  return supabase
    .from(BOOKS_VIEW)
    .select(BOOK_FIELDS)
    .order('sales_count', { ascending: false, nullsLast: true });
}

/** Выбор редакции: книги, помеченные флагом is_editors_pick */
export function fetchEditorsPicks(): SupabaseBookResponse {
  return supabase
    .from(BOOKS_VIEW)
    .select(BOOK_FIELDS)
    .eq('is_editors_pick', true);
}

/** Выбор редакции – одна книга */
export function fetchSingleEditorsPick(): SupabaseSingleBookResponse {
  return supabase
    .from(BOOKS_VIEW)
    .select(BOOK_FIELDS)
    .eq('is_editors_pick', true)
    .limit(1)
    .maybeSingle();
}

/** Книги с баннерами: книги, у которых загружены широкоформатные баннеры (main_banner) */
export function fetchBannerBooks(limit = 5): SupabaseBookResponse {
  return supabase
    .from(BOOKS_VIEW)
    .select(BOOK_FIELDS)
    .not('cover_images->>main_banner', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);
}

// Поддержка старых импортов типов
export type Book = PublicBook;
export type Slide = never;
export type HomeMedia = never;
export type Seen = Record<string, never>;
