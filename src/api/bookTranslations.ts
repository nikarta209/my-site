import { supabase } from './supabaseClient';

export interface BookTranslationPayload {
  id?: number;
  book_id?: string | number;
  language_code: string;
  custom_title?: string | null;
  custom_description?: string | null;
  cover_400x600_url?: string | null;
  cover_600x600_url?: string | null;
  cover_1600x900_url?: string | null;
  cover_800x1000_url?: string | null;
  main_banner_url?: string | null;
  is_published?: boolean;
}

export interface BookTranslationRecord extends BookTranslationPayload {
  id: number;
  book_id: string | number;
  language_code: string;
  is_published: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

const TABLE = 'book_translations';
const SELECT_FIELDS = `
  id,
  book_id,
  language_code,
  custom_title,
  custom_description,
  cover_400x600_url,
  cover_600x600_url,
  cover_1600x900_url,
  cover_800x1000_url,
  main_banner_url,
  is_published,
  created_at,
  updated_at
`;

export const fetchBookTranslations = async (bookId: string | number) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_FIELDS)
    .eq('book_id', bookId)
    .order('language_code', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as BookTranslationRecord[];
};

export const upsertBookTranslation = async (
  bookId: string | number,
  payload: BookTranslationPayload,
) => {
  const translationPayload = {
    ...payload,
    book_id: bookId,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(translationPayload, { onConflict: 'book_id,language_code' })
    .select(SELECT_FIELDS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as BookTranslationRecord;
};

export const deleteBookTranslation = async (id: number) => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);

  if (error) {
    throw error;
  }

  return true;
};

