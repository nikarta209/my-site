import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

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

type RawNote = {
  id?: string;
  book_id?: string;
  bookId?: string;
  html?: string | null;
  bg_image_url?: string | null;
  background?: string | null;
  bgImageUrl?: string | null;
  image?: string | null;
};

type RawBook = {
  id?: string | number;
  title?: string | null;
  author?: string | null;
  author_name?: string | null;
  authorName?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  released_at?: string | null;
  release_date?: string | null;
  cover_url?: string | null;
  coverImages?: Record<string, string | null> | null;
  cover_images?: Record<string, string | null> | null;
  hero_main?: string | null;
  banner?: string | null;
  main_banner?: string | null;
  library_hero?: string | null;
  coverImagesLandscape?: string | null;
  cover_images_landscape?: string | null;
  likes_count?: number | null;
  weekly_sales?: number | null;
  total_sales?: number | null;
  sales_count?: number | null;
  popularity?: number | null;
  description?: string | null;
  summary?: string | null;
  short_description?: string | null;
  note?: RawNote | null;
  notes?: RawNote[] | null;
  metadata?: Record<string, unknown> | null;
};

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

const PLACEHOLDER_BG = [
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1455885666463-0526f52c983f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1458682625221-3a45f8a844c7?auto=format&fit=crop&w=1200&q=80',
];

const PLACEHOLDER_COVER = (w: number, h: number, label: string) =>
  `https://placehold.co/${w}x${h}?text=${encodeURIComponent(label)}`;

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

const pickCover = (source: Record<string, string | null> | null | undefined, key: string): string | undefined => {
  if (!source) return undefined;
  const value = source[key] ?? source[key.toLowerCase()];
  return value ?? undefined;
};

const normalizeNote = (bookId: string, raw: RawNote | null | undefined, index: number): Note | null => {
  if (!raw) return null;
  const id = ensureString(raw.id ?? `${bookId}-note-${index}`, `${bookId}-note-${index}`);
  const bgImageUrl =
    ensureString(
      raw.bgImageUrl ?? raw.bg_image_url ?? raw.background ?? raw.image ?? raw.bg_image_url,
      PLACEHOLDER_BG[index % PLACEHOLDER_BG.length]
    ) || PLACEHOLDER_BG[index % PLACEHOLDER_BG.length];

  const html = raw.html ?? undefined;
  return {
    id,
    bookId,
    html,
    bgImageUrl,
  };
};

const normalizeBook = (raw: RawBook, index: number): Book => {
  const id = ensureString(raw.id, `placeholder-${index + 1}`) || `placeholder-${index + 1}`;
  const coverImages = raw.cover_images ?? raw.coverImages ?? null;
  const covers: CoverUrls = {};

  const portrait = pickCover(coverImages, 'portrait_400x600') ?? raw.cover_url ?? undefined;
  if (portrait) covers['400x600'] = portrait;

  const square =
    pickCover(coverImages, 'square_600x600') ??
    pickCover(coverImages, 'square') ??
    pickCover(coverImages, 'square_large') ??
    undefined;
  if (square) covers['600x600'] = square;

  const landscape =
    pickCover(coverImages, 'landscape_1600x900') ??
    pickCover(coverImages, 'landscape') ??
    raw.coverImagesLandscape ??
    raw.cover_images_landscape ??
    raw.library_hero ??
    undefined;
  if (landscape) covers['1600x900'] = landscape;

  const mainBanner = raw.main_banner ?? raw.hero_main ?? raw.banner ?? pickCover(coverImages, 'main_banner') ?? undefined;
  if (mainBanner) covers.mainBanner = mainBanner;

  const hasWideBanner = Boolean(covers['1600x900']);
  const hasMainBanner = Boolean(covers.mainBanner);

  const baseDescription = raw.description ?? raw.summary ?? raw.short_description ?? PLACEHOLDER_TEXT;
  const noteSource = Array.isArray(raw.notes) ? raw.notes[0] : raw.note;
  const note = noteSource ? normalizeNote(id, noteSource, index) : null;

  return {
    id,
    title: ensureString(raw.title, `Книга ${index + 1}`) || `Книга ${index + 1}`,
    authorName: ensureString(raw.authorName ?? raw.author ?? raw.author_name, `Автор ${index + 1}`) || `Автор ${index + 1}`,
    covers,
    createdAt:
      parseDate(
        raw.created_at ?? raw.published_at ?? raw.released_at ?? raw.release_date ?? raw.updated_at ?? new Date().toISOString()
      ) || new Date().toISOString(),
    popularity:
      toNumber(raw.popularity ?? raw.likes_count ?? raw.weekly_sales ?? raw.total_sales ?? raw.sales_count, index % 100) +
      10,
    hasMainBanner,
    hasWideBanner,
    note,
    description: baseDescription,
  };
};

const createPlaceholderBook = (index: number): Book => {
  const id = `placeholder-${index + 1}`;
  const title = `Плейсхолдер ${index + 1}`;
  const authorName = `Команда KASBOOK`;
  const createdAt = new Date(Date.now() - index * 36e5).toISOString();

  const covers: CoverUrls = {
    '400x600': PLACEHOLDER_COVER(400, 600, title),
  };

  if (index % 2 === 0) {
    covers['600x600'] = PLACEHOLDER_COVER(600, 600, title);
  }

  if (index < 12) {
    covers['1600x900'] = PLACEHOLDER_COVER(1600, 900, `${title} Wide`);
  }

  if (index < 6) {
    covers.mainBanner = PLACEHOLDER_COVER(1600, 600, `${title} Banner`);
  }

  const note: Note = {
    id: `${id}-note`,
    bookId: id,
    html: PLACEHOLDER_NOTES[index % PLACEHOLDER_NOTES.length],
    bgImageUrl: PLACEHOLDER_BG[index % PLACEHOLDER_BG.length],
  };

  return {
    id,
    title,
    authorName,
    covers,
    createdAt,
    popularity: 100 - index,
    hasMainBanner: Boolean(covers.mainBanner),
    hasWideBanner: Boolean(covers['1600x900']),
    note,
    description: PLACEHOLDER_TEXT,
  };
};

const PLACEHOLDER_BOOKS: Book[] = Array.from({ length: 80 }, (_, index) => createPlaceholderBook(index));

const mergePlaceholders = (books: Book[]): Book[] => {
  const byId = new Map<string, Book>();
  books.forEach((book) => {
    byId.set(book.id, book);
  });

  for (const placeholder of PLACEHOLDER_BOOKS) {
    if (!byId.has(placeholder.id)) {
      byId.set(placeholder.id, placeholder);
    }
  }

  return Array.from(byId.values());
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

  if (!entry) return true;

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

export const buildTopSlider = (books: Book[], seen: Seen): Slide[] => {
  const slides: Slide[] = [...PROMO_SLIDES];
  const candidates = books.filter((book) => book.covers.mainBanner);
  for (const book of candidates) {
    if (slides.length >= 5) break;
    if (seen[book.id]?.main) continue;
    slides.push({ id: `book-${book.id}-slide`, type: 'book', book });
    markUsed(seen, book.id, 'main');
  }

  if (slides.length < 5) {
    for (const book of books) {
      if (slides.length >= 5) break;
      if (seen[book.id]?.main) continue;
      if (!book.covers.mainBanner) continue;
      slides.push({ id: `book-${book.id}-slide`, type: 'book', book });
      markUsed(seen, book.id, 'main');
    }
  }

  while (slides.length < 5) {
    const fallback = PLACEHOLDER_BOOKS[slides.length % PLACEHOLDER_BOOKS.length];
    slides.push({ id: `placeholder-${slides.length}`, type: 'book', book: fallback });
    markUsed(seen, fallback.id, 'main');
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

  const combined = [...first400, ...second400];
  let placeholderIndex = 0;
  while (first400.length < 20) {
    const placeholder = PLACEHOLDER_BOOKS[placeholderIndex++ % PLACEHOLDER_BOOKS.length];
    if (combined.some((book) => book.id === placeholder.id)) continue;
    if (!canUse400(placeholder, seen)) continue;
    first400.push(placeholder);
    markUsed(seen, placeholder.id, 's400');
  }
  while (second400.length < 20) {
    const placeholder = PLACEHOLDER_BOOKS[placeholderIndex++ % PLACEHOLDER_BOOKS.length];
    if ([...combined, ...second400].some((book) => book.id === placeholder.id)) continue;
    if (!canUse400(placeholder, seen)) continue;
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

  let placeholderIndex = 0;
  while (picked.length < 5) {
    const placeholder = PLACEHOLDER_BOOKS[placeholderIndex++ % PLACEHOLDER_BOOKS.length];
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

  let placeholderIndex = 0;
  while (picked.length < limit) {
    const placeholder = PLACEHOLDER_BOOKS[placeholderIndex++ % PLACEHOLDER_BOOKS.length];
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

  for (const placeholder of PLACEHOLDER_BOOKS) {
    if (canUse400(placeholder, seen)) {
      markUsed(seen, placeholder.id, 's400');
      return placeholder;
    }
  }

  return null;
};

export const buildReadersChoice = (books: Book[], seen: Seen, pairs = 5): Book[][] => {
  const sorted = sortByPopularity(filterAvailable(books, (book) => Boolean(book.covers['600x600'])));
  const result: Book[][] = [];

  for (const book of sorted) {
    if (result.length >= pairs) break;
    if (!canUse600(book, seen)) continue;
    // Find companion
    const companion = sorted.find((candidate) => {
      if (candidate.id === book.id) return false;
      if (result.some((pair) => pair.some((item) => item.id === candidate.id))) return false;
      return canUse600(candidate, seen);
    });
    if (!companion) continue;
    markUsed(seen, book.id, 's600');
    markUsed(seen, companion.id, 's600');
    result.push([book, companion]);
  }

  let index = 0;
  while (result.length < pairs) {
    const first = PLACEHOLDER_BOOKS[index++ % PLACEHOLDER_BOOKS.length];
    const second = PLACEHOLDER_BOOKS[index++ % PLACEHOLDER_BOOKS.length];
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

  let index = 0;
  while (picked.length < limit) {
    const placeholder = PLACEHOLDER_BOOKS[index++ % PLACEHOLDER_BOOKS.length];
    if (!canUse400(placeholder, seen)) continue;
    picked.push(placeholder);
    markUsed(seen, placeholder.id, 's400');
  }

  return picked.slice(0, limit);
};

const fetchSupabaseNotes = async (): Promise<Record<string, Note>> => {
  if (!isSupabaseConfigured) {
    return {};
  }

  try {
    const { data, error } = await supabase.from('book_notes').select('id, book_id, html, bg_image_url, metadata');
    if (error || !Array.isArray(data)) {
      return {};
    }

    return data.reduce<Record<string, Note>>((acc, item, index) => {
      const bookId = ensureString(item.book_id, ensureString(item.id));
      if (!bookId) return acc;
      const metadata = (item.metadata ?? {}) as Record<string, unknown>;
      const bgImageUrl = ensureString(
        item.bg_image_url ?? (metadata?.bgImageUrl as string | undefined) ?? PLACEHOLDER_BG[index % PLACEHOLDER_BG.length]
      );

      acc[bookId] = {
        id: ensureString(item.id, `${bookId}-note`),
        bookId,
        html: item.html ?? undefined,
        bgImageUrl,
      };
      return acc;
    }, {});
  } catch (error) {
    console.warn('[books] failed to load notes from supabase', error);
    return {};
  }
};

const hydrateWithNotes = (books: Book[], notes: Record<string, Note>): Book[] => {
  return books.map((book) => {
    const note = notes[book.id];
    if (!note) return book;
    return { ...book, note };
  });
};

type FetchHomeBooks = typeof import('@/lib/api/books.js')['fetchHomeBooks'];

let fetchHomeBooksFn: FetchHomeBooks | null = null;

const getFetchHomeBooks = async (): Promise<FetchHomeBooks> => {
  if (fetchHomeBooksFn) {
    return fetchHomeBooksFn;
  }

  const module = await import('@/lib/api/books.js');
  fetchHomeBooksFn = module.fetchHomeBooks;
  return fetchHomeBooksFn;
};

export const loadBooks = async (): Promise<Book[]> => {
  let rawBooks: RawBook[] = [];
  try {
    const fetchHomeBooks = await getFetchHomeBooks();
    const legacyBooks = await fetchHomeBooks();
    if (Array.isArray(legacyBooks)) {
      rawBooks = legacyBooks;
    }
  } catch (error) {
    console.warn('[books] failed to load legacy home books', error);
    rawBooks = [];
  }

  let normalized = rawBooks.map((book, index) => normalizeBook(book, index));
  if (normalized.length === 0) {
    normalized = [...PLACEHOLDER_BOOKS];
  }

  const notes = await fetchSupabaseNotes();
  const hydrated = hydrateWithNotes(normalized, notes);

  return mergePlaceholders(hydrated);
};

export const createSeen = (): Seen => ({});

