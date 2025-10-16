import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

const DEBUG = typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEBUG_HOME === '1';

export type CoverUrls = {
  '400x600'?: string;
  '600x600'?: string;
  '1600x900'?: string;
  mainBanner?: string;
};

export type Note = {
  id: string;
  bookId: string;
  html?: string;
  bgImageUrl?: string;
};

export type Book = {
  id: string;
  title: string;
  authorName: string;
  covers: CoverUrls;
  createdAt: string;
  popularity?: number;
  hasMainBanner?: boolean;
  hasWideBanner?: boolean;
  note?: Note | null;
  description?: string | null;
};

type SeenEntry = { main?: boolean; wide?: boolean; s400?: boolean; s600?: boolean };

export type Seen = Record<string, SeenEntry>;

export type Slide =
  | {
      id: string;
      type: 'promo';
      title: string;
      description: string;
      image: string;
      href?: string;
    }
  | {
      id: string;
      type: 'book';
      book: Book;
    };

class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

const PROMO_SLIDES: Slide[] = [
  {
    id: 'promo-authors',
    type: 'promo',
    title: 'Присоединяйтесь к КАСБУК',
    description: 'Найдите свою следующую любимую книгу и создайте библиотеку мечты.',
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
    href: '/Catalog',
  },
  {
    id: 'promo-publish',
    type: 'promo',
    title: 'Поделитесь своей историей',
    description: 'Авторы публикуют рукописи и находят читателей по всему миру.',
    image: 'https://images.unsplash.com/photo-1455885666463-0526f52c983f?auto=format&fit=crop&w=1200&q=80',
    href: '/RegisterAuthor',
  },
];

const PLACEHOLDER_TEXT =
  'Даже когда основной каталог временно недоступен, КАСБУК продолжает вдохновлять. Мы подготовили подборку книг специально для предпросмотра нового раздела.';

const PLACEHOLDER_NOTES: string[] = [
  'Глава, написанная в формате дневника, раскрывает эмоции героини. Этот отрывок покорил читателей своей искренностью.',
  'Редакция рекомендует прочитать фрагмент о сложном выборе. История оставляет послевкусие надежды.',
  'Наши читатели отмечают, что эта книга возвращает веру в чудеса. Обязательно загляните внутрь.',
  'Обложка скрывает в себе фэнтези-мир, наполненный магией и приключениями. Откройте его с первой страницы.',
  'Книга, которая напомнит о силе добрых дел. Нота редактора — читать медленно и с чашкой чая.',
  'Открывайте главы постепенно — каждая наполнена деталями, которые хочется перечитывать.',
  'Редкий пример научной фантастики, где технологии и человечность идут рука об руку.',
  'История, которую хочется обсуждать с друзьями. Подходит для книжного клуба.',
  'Мелодраматический детектив с неожиданным финалом. Не упустите подсказки в заметке.',
  'Роман, вдохновлённый реальными событиями. Заметка содержит эксклюзивный комментарий автора.',
];

const PLACEHOLDER_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1455885666463-0526f52c983f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1458682625221-3a45f8a844c7?auto=format&fit=crop&w=1200&q=80',
];

const PLACEHOLDER_COVERS = [
  'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1473862170181-5b0b9c63038d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
];

const ensureString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const parseDate = (raw: unknown): string => {
  if (typeof raw === 'string' && raw) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return new Date().toISOString();
};

const toNumber = (raw: unknown, fallback = 0): number => {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
};

const PLACEHOLDER_POOL_SIZE = 120;

const PLACEHOLDER_BOOKS: Book[] = Array.from({ length: PLACEHOLDER_POOL_SIZE }, (_, index) => {
  const id = `placeholder-${index + 1}`;
  const title = `Плейсхолдер ${index + 1}`;
  const authorName = 'Команда KASBOOK';
  const createdAt = new Date(Date.now() - index * 36e5).toISOString();
  const cover = PLACEHOLDER_COVERS[index % PLACEHOLDER_COVERS.length];
  const square = PLACEHOLDER_COVERS[(index + 3) % PLACEHOLDER_COVERS.length];
  const wide = PLACEHOLDER_BACKGROUNDS[index % PLACEHOLDER_BACKGROUNDS.length];

  const covers: CoverUrls = {
    '400x600': cover,
    '600x600': square,
    '1600x900': wide,
    mainBanner: wide,
  };

  const note: Note = {
    id: `${id}-note`,
    bookId: id,
    html: PLACEHOLDER_NOTES[index % PLACEHOLDER_NOTES.length],
    bgImageUrl: PLACEHOLDER_BACKGROUNDS[index % PLACEHOLDER_BACKGROUNDS.length],
  };

  return {
    id,
    title,
    authorName,
    covers,
    createdAt,
    popularity: PLACEHOLDER_POOL_SIZE - index,
    hasMainBanner: true,
    hasWideBanner: true,
    note,
    description: PLACEHOLDER_TEXT,
  };
});

type RawNote = {
  id?: string;
  book_id?: string;
  note_text?: string | null;
  metadata?: unknown;
  likes_count?: number | null;
  is_public?: boolean | null;
};

type RawBook = {
  id?: string | number | null;
  title?: string | null;
  author?: string | null;
  author_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  cover_url?: string | null;
  cover_images?: unknown;
  coverImages?: unknown;
  hero_main?: string | null;
  banner?: string | null;
  main_banner?: string | null;
  library_hero?: string | null;
  likes_count?: number | null;
  sales_count?: number | null;
  popularity?: number | null;
  description?: string | null;
  preview_text?: string | null;
  status?: string | null;
};

type LegacyBook = RawBook & {
  note?: RawNote | null;
  notes?: RawNote[] | null;
};

type NotesMap = Map<string, Note>;

const parseCoverImages = (raw: unknown): Record<string, string> | undefined => {
  if (!raw) return undefined;
  if (typeof raw === 'object') return raw as Record<string, string>;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string>;
      }
    } catch (error) {
      if (DEBUG) {
        console.info('[books] invalid cover_images JSON', error);
      }
    }
  }
  return undefined;
};

const storageBucket = 'books';

const urlFromStorage = (path: string | null | undefined): string | undefined => {
  const value = ensureString(path).trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.replace(/^\/+/, '');
  const { data } = supabase.storage.from(storageBucket).getPublicUrl(normalized);
  return data?.publicUrl ?? undefined;
};

const logMissingCover = (id: string, kind: keyof CoverUrls) => {
  if (!DEBUG) return;
  console.info(`[books] missing ${kind} cover for`, id);
};

const ensureCovers = (covers: CoverUrls, id: string): boolean => {
  const hasCover = Boolean(covers['400x600'] || covers['600x600'] || covers['1600x900'] || covers.mainBanner);
  if (!hasCover) {
    if (DEBUG) {
      console.info('[books] skipping book without covers', id);
    }
    return false;
  }
  if (!covers['400x600']) logMissingCover(id, '400x600');
  if (!covers['600x600']) logMissingCover(id, '600x600');
  if (!covers['1600x900']) logMissingCover(id, '1600x900');
  if (!covers.mainBanner) logMissingCover(id, 'mainBanner');
  return true;
};

const mapNote = (raw: RawNote | undefined, fallbackBg: string, index: number): Note | undefined => {
  if (!raw || raw.is_public === false) return undefined;
  const id = ensureString(raw.id, `note-${index}`) || `note-${index}`;
  const bookId = ensureString(raw.book_id, '');
  const html = raw.note_text ?? undefined;
  let bgImageUrl: string | undefined;

  const metadata = raw.metadata;
  if (metadata && typeof metadata === 'object') {
    const candidates = [
      (metadata as Record<string, unknown>).bgImageUrl,
      (metadata as Record<string, unknown>).backgroundImage,
      (metadata as Record<string, unknown>).background,
      (metadata as Record<string, unknown>).image,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) {
        bgImageUrl = candidate;
        break;
      }
    }
  }

  return {
    id,
    bookId,
    html,
    bgImageUrl: bgImageUrl ?? fallbackBg,
  };
};

const mapRowToBook = (row: RawBook, index: number, notes: NotesMap): Book | null => {
  const id = ensureString(row.id, `placeholder-${index + 1}`);
  const title = ensureString(row.title, '').trim();
  if (!title) {
    if (DEBUG) {
      console.info('[books] skipping row without title', row);
    }
    return null;
  }

  const coverImages = parseCoverImages(row.cover_images ?? row.coverImages);

  const covers: CoverUrls = {};
  const portrait =
    urlFromStorage(row.cover_url) ||
    urlFromStorage(coverImages?.portrait_large) ||
    urlFromStorage(coverImages?.portrait_medium) ||
    urlFromStorage(coverImages?.portrait) ||
    urlFromStorage(coverImages?.default);
  if (portrait) covers['400x600'] = portrait;

  const square =
    urlFromStorage(coverImages?.square_large) ||
    urlFromStorage(coverImages?.square_medium) ||
    urlFromStorage(coverImages?.square);
  if (square) covers['600x600'] = square;

  const landscape =
    urlFromStorage(coverImages?.landscape) ||
    urlFromStorage(coverImages?.landscape_large) ||
    urlFromStorage(coverImages?.library_hero) ||
    urlFromStorage(row.library_hero ?? undefined);
  if (landscape) covers['1600x900'] = landscape;

  const mainBanner =
    urlFromStorage(coverImages?.main_banner) ||
    urlFromStorage(coverImages?.hero_main) ||
    urlFromStorage(coverImages?.banner) ||
    urlFromStorage(row.main_banner ?? row.hero_main ?? row.banner ?? undefined);
  if (mainBanner) covers.mainBanner = mainBanner;

  if (!ensureCovers(covers, id)) {
    return null;
  }

  const note = notes.get(id) ?? null;

  return {
    id,
    title,
    authorName: ensureString(row.author ?? row.author_name, 'Неизвестный автор') || 'Неизвестный автор',
    covers,
    createdAt: parseDate(row.created_at ?? row.updated_at ?? new Date().toISOString()),
    popularity: toNumber(row.popularity ?? row.likes_count ?? row.sales_count, 0),
    hasMainBanner: Boolean(covers.mainBanner),
    hasWideBanner: Boolean(covers['1600x900']),
    note,
    description: row.description ?? row.preview_text ?? null,
  };
};

const createPlaceholderIterator = () => {
  let index = 0;
  return () => PLACEHOLDER_BOOKS[index++ % PLACEHOLDER_BOOKS.length];
};

const withTimeout = <T>(
  factory: (signal: AbortSignal) => Promise<T>,
  ms: number,
  externalSignal?: AbortSignal
): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new TimeoutError(`Timed out after ${ms}ms`));
  }, ms);

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason ?? new DOMException('Aborted', 'AbortError'));
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      onExternalAbort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return factory(controller.signal)
    .catch((error) => {
      if (controller.signal.aborted) {
        const reason = controller.signal.reason;
        if (reason instanceof TimeoutError) {
          throw reason;
        }
        if (externalSignal?.aborted) {
          throw externalSignal.reason ?? error;
        }
      }
      throw error;
    })
    .finally(() => {
      clearTimeout(timer);
      if (externalSignal) {
        (externalSignal as EventTarget).removeEventListener('abort', onExternalAbort as EventListener);
      }
    });
};

const fetchSharedNotes = async (limit: number, signal?: AbortSignal): Promise<NotesMap> => {
  const map: NotesMap = new Map();
  if (!isSupabaseConfigured) {
    return map;
  }

  try {
    const { data, error } = await supabase
      .from('shared_notes')
      .select('id, book_id, note_text, metadata, likes_count, is_public', { signal })
      .eq('is_public', true)
      .order('likes_count', { ascending: false })
      .limit(limit);

    if (error || !Array.isArray(data)) {
      if (DEBUG) {
        console.info('[books] shared_notes request failed', error);
      }
      return map;
    }

    data.forEach((item, index) => {
      const note = mapNote(item, PLACEHOLDER_BACKGROUNDS[index % PLACEHOLDER_BACKGROUNDS.length], index);
      const bookId = ensureString(item.book_id);
      if (note && bookId) {
        map.set(bookId, note);
      }
    });
  } catch (error) {
    if (DEBUG) {
      console.info('[books] shared_notes fetch error', error);
    }
  }

  return map;
};

const normalizeBooks = (rows: RawBook[], notes: NotesMap): Book[] => {
  return rows
    .map((row, index) => mapRowToBook(row, index, notes))
    .filter((book): book is Book => Boolean(book));
};

const fetchFromSupabase = async (limit: number, signal?: AbortSignal): Promise<Book[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const notes = await fetchSharedNotes(limit, signal);

  try {
    const { data, error } = await supabase
      .from('books')
      .select(
        'id, title, author, author_name, description, preview_text, cover_url, cover_images, created_at, updated_at, likes_count, sales_count, popularity, status, main_banner, hero_main, banner, library_hero',
        { signal }
      )
      .in('status', ['approved', 'public_domain'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const mapped = normalizeBooks(data, notes);
    if (DEBUG) {
      console.info('[books] supabase source', mapped.length);
    }
    return mapped;
  } catch (error) {
    if (DEBUG) {
      console.info('[books] supabase fetch error', error);
    }
    return [];
  }
};

let fetchHomeBooksFn: ((limit?: number) => Promise<LegacyBook[] | undefined>) | null = null;

const getLegacyFetcher = async () => {
  if (fetchHomeBooksFn) return fetchHomeBooksFn;
  try {
    const module = await import('@/lib/api/books.js');
    fetchHomeBooksFn = module.fetchHomeBooks as (limit?: number) => Promise<LegacyBook[]>;
  } catch (error) {
    if (DEBUG) {
      console.info('[books] unable to import legacy module', error);
    }
    fetchHomeBooksFn = null;
  }
  return fetchHomeBooksFn;
};

const fetchFromLegacy = async (limit: number, signal?: AbortSignal): Promise<Book[]> => {
  const fetcher = await getLegacyFetcher();
  if (!fetcher) return [];

  if (signal?.aborted) {
    return [];
  }

  let legacyBooks: LegacyBook[] = [];
  try {
    legacyBooks = (await fetcher(limit)) ?? [];
  } catch (error) {
    if (DEBUG) {
      console.info('[books] legacy fetch failed', error);
    }
    return [];
  }

  const notes = new Map<string, Note>();
  legacyBooks.forEach((book, index) => {
    const raw = Array.isArray(book.notes) ? book.notes[0] : book.note;
    const note = mapNote(raw ?? undefined, PLACEHOLDER_BACKGROUNDS[index % PLACEHOLDER_BACKGROUNDS.length], index);
    const bookId = ensureString(book.id);
    if (note && bookId) {
      notes.set(bookId, note);
    }
  });

  const mapped = normalizeBooks(legacyBooks, notes);
  if (DEBUG) {
    console.info('[books] legacy source', mapped.length);
  }
  return mapped.slice(0, limit);
};

const mergeWithPlaceholders = (books: Book[], limit: number): Book[] => {
  if (books.length >= limit) {
    return books;
  }
  const nextPlaceholder = createPlaceholderIterator();
  const result = [...books];
  while (result.length < limit) {
    const placeholder = nextPlaceholder();
    if (!result.some((book) => book.id === placeholder.id)) {
      result.push(placeholder);
    }
  }
  return result;
};

export const generatePlaceholders = (limit: number): Book[] => {
  return mergeWithPlaceholders([], limit).slice(0, limit);
};

export type LoadBooksOptions = {
  limit?: number;
  signal?: AbortSignal;
};

export const loadBooks = async (options: LoadBooksOptions = {}): Promise<Book[]> => {
  const { limit = 200, signal } = options;
  const sources: Array<'supabase' | 'legacy'> = ['supabase', 'legacy'];
  let books: Book[] = [];

  for (const source of sources) {
    if (signal?.aborted) break;
    try {
      if (source === 'supabase') {
        books = await withTimeout((timeoutSignal) => fetchFromSupabase(limit, timeoutSignal), 4000, signal);
      } else {
        books = await withTimeout((timeoutSignal) => fetchFromLegacy(limit, timeoutSignal), 4000, signal);
      }
    } catch (error) {
      if (DEBUG) {
        console.info(`[books] ${source} timed out`, error);
      }
      books = [];
    }
    if (books.length > 0) {
      if (DEBUG) {
        console.info(`[books] using ${source} books`, books.length);
      }
      break;
    }
  }

  if (signal?.aborted) {
    return [];
  }

  if (!books.length) {
    const placeholders = mergeWithPlaceholders([], limit);
    if (DEBUG) {
      console.info('[books] fallback to placeholders', placeholders.length);
    }
    return placeholders;
  }

  return books;
};

const countUsage = (entry: SeenEntry | undefined): number => {
  if (!entry) return 0;
  return [entry.main, entry.wide, entry.s400, entry.s600].filter(Boolean).length;
};

export const markUsed = (seen: Seen, id: string, kind: keyof SeenEntry) => {
  if (!id) return;
  if (!seen[id]) {
    seen[id] = {};
  }
  seen[id][kind] = true;
};

export const canUse400 = (book: Book, seen: Seen): boolean => {
  if (!book || !book.id) return false;
  const entry = seen[book.id];
  if (entry?.s400) return false;
  const usage = countUsage(entry);

  if (!entry) return Boolean(book.covers['400x600']);

  if (entry.wide) {
    return usage < 2;
  }

  if (entry.main) {
    if (entry.s600) return false;
    return usage < 2;
  }

  return usage === 0;
};

export const canUse600 = (book: Book, seen: Seen): boolean => {
  if (!book || !book.id) return false;
  const entry = seen[book.id];
  if (entry?.s600) return false;
  const usage = countUsage(entry);

  if (!entry) return Boolean(book.covers['600x600']);

  if (entry.main) {
    if (entry.s400) return false;
    return usage < 2 && Boolean(book.covers['600x600']);
  }

  if (entry.wide) {
    return false;
  }

  return usage === 0 && Boolean(book.covers['600x600']);
};

const filterAvailable = (books: Book[], predicate: (book: Book) => boolean): Book[] => {
  return books.filter((book) => Boolean(book) && predicate(book));
};

const sortByDateDesc = (books: Book[]): Book[] => {
  return [...books].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const sortByPopularity = (books: Book[]): Book[] => {
  return [...books].sort((a, b) => {
    const aHasNote = a.note ? 1 : 0;
    const bHasNote = b.note ? 1 : 0;
    if (aHasNote !== bHasNote) {
      return bHasNote - aHasNote;
    }
    return (b.popularity ?? 0) - (a.popularity ?? 0);
  });
};

const createPromoClone = (slide: Extract<Slide, { type: 'promo' }>, index: number): Slide => ({
  ...slide,
  id: `${slide.id}-clone-${index}`,
});

export const buildTopSlider = (books: Book[], seen: Seen): Slide[] => {
  const slides: Slide[] = [];
  slides.push(...PROMO_SLIDES);

  const candidates = books.filter((book) => Boolean(book.covers.mainBanner));
  const usedBookIds = new Set<string>();

  for (const book of candidates) {
    if (slides.length >= 5 || usedBookIds.size >= 3) break;
    if (seen[book.id]?.main) continue;
    slides.push({ id: `book-${book.id}-slide`, type: 'book', book });
    markUsed(seen, book.id, 'main');
    usedBookIds.add(book.id);
  }

  let cloneIndex = 0;
  while (slides.length < 5) {
    const promo = PROMO_SLIDES[slides.length % PROMO_SLIDES.length];
    slides.push(createPromoClone(promo, cloneIndex++));
  }

  return slides.slice(0, 5);
};

export const buildNewArrivals = (
  books: Book[],
  seen: Seen
): { first400: Book[]; second400: Book[] } => {
  const sorted = sortByDateDesc(books);
  const first400: Book[] = [];
  const second400: Book[] = [];

  for (const book of sorted) {
    if (first400.length < 20 && canUse400(book, seen)) {
      first400.push(book);
      markUsed(seen, book.id, 's400');
      continue;
    }
    if (second400.length < 20 && canUse400(book, seen)) {
      second400.push(book);
      markUsed(seen, book.id, 's400');
      continue;
    }
    if (first400.length >= 20 && second400.length >= 20) {
      break;
    }
  }

  const nextPlaceholder = createPlaceholderIterator();
  while (first400.length < 20) {
    const placeholder = nextPlaceholder();
    if (!canUse400(placeholder, seen)) continue;
    if (first400.some((book) => book.id === placeholder.id)) continue;
    first400.push(placeholder);
    markUsed(seen, placeholder.id, 's400');
  }
  while (second400.length < 20) {
    const placeholder = nextPlaceholder();
    if (!canUse400(placeholder, seen)) continue;
    if (second400.some((book) => book.id === placeholder.id)) continue;
    if (first400.some((book) => book.id === placeholder.id)) continue;
    second400.push(placeholder);
    markUsed(seen, placeholder.id, 's400');
  }

  return { first400, second400 };
};

export const buildWideBanners = (books: Book[], seen: Seen): Book[] => {
  const candidates = sortByDateDesc(filterAvailable(books, (book) => Boolean(book.covers['1600x900'])));
  const picked: Book[] = [];
  for (const book of candidates) {
    if (picked.length >= 5) break;
    if (seen[book.id]?.wide) continue;
    picked.push(book);
    markUsed(seen, book.id, 'wide');
  }

  const nextPlaceholder = createPlaceholderIterator();
  while (picked.length < 5) {
    const placeholder = nextPlaceholder();
    if (!placeholder.covers['1600x900']) continue;
    if (seen[placeholder.id]?.wide) continue;
    picked.push(placeholder);
    markUsed(seen, placeholder.id, 'wide');
  }

  return picked.slice(0, 5);
};

export const buildSquare600 = (books: Book[], seen: Seen, limit = 15): Book[] => {
  const candidates = sortByDateDesc(filterAvailable(books, (book) => Boolean(book.covers['600x600'])));
  const picked: Book[] = [];
  for (const book of candidates) {
    if (picked.length >= limit) break;
    if (!canUse600(book, seen)) continue;
    picked.push(book);
    markUsed(seen, book.id, 's600');
  }

  const nextPlaceholder = createPlaceholderIterator();
  while (picked.length < limit) {
    const placeholder = nextPlaceholder();
    if (!placeholder.covers['600x600']) continue;
    if (!canUse600(placeholder, seen)) continue;
    picked.push(placeholder);
    markUsed(seen, placeholder.id, 's600');
  }

  return picked.slice(0, limit);
};

export const buildFeatured400 = (books: Book[], seen: Seen): Book | null => {
  const candidates = sortByPopularity(filterAvailable(books, (book) => Boolean(book.covers['400x600'])));
  for (const book of candidates) {
    if (canUse400(book, seen)) {
      markUsed(seen, book.id, 's400');
      return book;
    }
  }

  const nextPlaceholder = createPlaceholderIterator();
  while (true) {
    const placeholder = nextPlaceholder();
    if (canUse400(placeholder, seen)) {
      markUsed(seen, placeholder.id, 's400');
      return placeholder;
    }
  }
};

export const buildReadersChoice = (books: Book[], seen: Seen, pairs = 5): Book[][] => {
  const sorted = sortByPopularity(filterAvailable(books, (book) => Boolean(book.covers['600x600'])));
  const result: Book[][] = [];
  const usedIds = new Set<string>();

  for (const book of sorted) {
    if (result.length >= pairs) break;
    if (!canUse600(book, seen)) continue;
    if (usedIds.has(book.id)) continue;

    const companion = sorted.find((candidate) => {
      if (candidate.id === book.id) return false;
      if (usedIds.has(candidate.id)) return false;
      return canUse600(candidate, seen);
    });
    if (!companion) continue;
    markUsed(seen, book.id, 's600');
    markUsed(seen, companion.id, 's600');
    usedIds.add(book.id);
    usedIds.add(companion.id);
    result.push([book, companion]);
  }

  const nextPlaceholder = createPlaceholderIterator();
  while (result.length < pairs) {
    const first = nextPlaceholder();
    const second = nextPlaceholder();
    if (!first.covers['600x600'] || !second.covers['600x600']) continue;
    if (!canUse600(first, seen) || !canUse600(second, seen)) continue;
    markUsed(seen, first.id, 's600');
    markUsed(seen, second.id, 's600');
    result.push([first, second]);
  }

  return result.slice(0, pairs);
};

export const buildEditorsChoice = (books: Book[], seen: Seen, limit = 12): Book[] => {
  const candidates = sortByPopularity(filterAvailable(books, (book) => Boolean(book.covers['400x600'])));
  const picked: Book[] = [];
  for (const book of candidates) {
    if (picked.length >= limit) break;
    if (!canUse400(book, seen)) continue;
    picked.push(book);
    markUsed(seen, book.id, 's400');
  }

  const nextPlaceholder = createPlaceholderIterator();
  while (picked.length < limit) {
    const placeholder = nextPlaceholder();
    if (!canUse400(placeholder, seen)) continue;
    if (picked.some((book) => book.id === placeholder.id)) continue;
    picked.push(placeholder);
    markUsed(seen, placeholder.id, 's400');
  }

  return picked.slice(0, limit);
};

export const createSeen = (): Seen => ({});
