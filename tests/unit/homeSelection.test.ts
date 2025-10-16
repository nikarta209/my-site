import { describe, expect, it } from 'vitest';
import {
  buildEditorsChoice,
  buildFeatured400,
  buildNewArrivals,
  buildReadersChoice,
  buildSquare600,
  buildTopSlider,
  buildWideBanners,
  canUse400,
  canUse600,
  createSeen,
  generatePlaceholders,
  markUsed,
  type Book,
  type Slide,
} from '@/api/books';

const createBook = (id: string, overrides: Partial<Book> = {}): Book => {
  const base: Book = {
    id,
    title: `Title ${id}`,
    authorName: `Author ${id}`,
    createdAt: new Date().toISOString(),
    covers: {
      '400x600': `https://example.com/${id}-400.jpg`,
      '600x600': `https://example.com/${id}-600.jpg`,
      '1600x900': `https://example.com/${id}-1600.jpg`,
      mainBanner: `https://example.com/${id}-banner.jpg`,
    },
    popularity: 100,
    hasMainBanner: true,
    hasWideBanner: true,
    description: 'Desc',
    note: {
      id: `${id}-note`,
      bookId: id,
      html: '<p>note</p>',
      bgImageUrl: 'https://example.com/bg.jpg',
    },
  };

  return {
    ...base,
    ...overrides,
    covers: {
      ...base.covers,
      ...overrides.covers,
    },
  };
};

const generateBooks = (count: number): Book[] =>
  Array.from({ length: count }, (_, index) =>
    createBook(`b-${index + 1}`, {
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      popularity: 200 - index,
    })
  );

describe('usage helpers', () => {
  it('marks usage per kind', () => {
    const seen = createSeen();
    markUsed(seen, '1', 's400');
    markUsed(seen, '1', 'main');
    expect(seen['1']).toMatchObject({ s400: true, main: true });
  });

  it('allows 400 duplicate only for wide/main rules', () => {
    const book = createBook('dup', { hasMainBanner: true, hasWideBanner: true });
    const seen = createSeen();
    expect(canUse400(book, seen)).toBe(true);
    markUsed(seen, book.id, 's400');
    expect(canUse400(book, seen)).toBe(false);

    const wideSeen = createSeen();
    markUsed(wideSeen, book.id, 'wide');
    expect(canUse400(book, wideSeen)).toBe(true);

    const mainSeen = createSeen();
    markUsed(mainSeen, book.id, 'main');
    expect(canUse400(book, mainSeen)).toBe(true);
    markUsed(mainSeen, book.id, 's600');
    expect(canUse400(book, mainSeen)).toBe(false);
  });

  it('allows 600 duplicate only for main rule', () => {
    const book = createBook('dup', { hasMainBanner: true });
    const seen = createSeen();
    expect(canUse600(book, seen)).toBe(true);
    markUsed(seen, book.id, 's600');
    expect(canUse600(book, seen)).toBe(false);

    const mainSeen = createSeen();
    markUsed(mainSeen, book.id, 'main');
    expect(canUse600(book, mainSeen)).toBe(true);
    markUsed(mainSeen, book.id, 's400');
    expect(canUse600(book, mainSeen)).toBe(false);
  });

  it('respects appearance limit of two per book', () => {
    const book = createBook('limit', { hasMainBanner: true, hasWideBanner: true });
    const seen = createSeen();
    markUsed(seen, book.id, 'main');
    markUsed(seen, book.id, 'wide');
    expect(canUse400(book, seen)).toBe(false);
    expect(canUse600(book, seen)).toBe(false);
  });
});

describe('builders', () => {
  const books = generateBooks(60);

  it('creates top slider with promos and book slides', () => {
    const seen = createSeen();
    const slides = buildTopSlider(books, seen);
    expect(slides).toHaveLength(5);
    const promoCount = (slides as Slide[]).filter((slide) => slide.type === 'promo').length;
    expect(promoCount).toBeGreaterThanOrEqual(2);
    const bookSlides = (slides as Slide[]).filter(
      (slide): slide is Extract<Slide, { type: 'book' }> => slide.type === 'book'
    );
    const bookIds = bookSlides.map((slide) => slide.book.id);
    expect(new Set(bookIds).size).toBe(bookIds.length);
    expect(bookSlides.length).toBeLessThanOrEqual(3);
  });

  it('builds new arrivals with 20+20 items', () => {
    const seen = createSeen();
    const { first400, second400 } = buildNewArrivals(books, seen);
    expect(first400).toHaveLength(20);
    expect(second400).toHaveLength(20);
    const ids = new Set([...first400, ...second400].map((book) => book.id));
    expect(ids.size).toBe(40);
    expect(new Set(first400.map((book) => book.id)).size).toBe(first400.length);
    expect(new Set(second400.map((book) => book.id)).size).toBe(second400.length);
  });

  it('builds wide banners with limit 5', () => {
    const seen = createSeen();
    const wide = buildWideBanners(books, seen);
    expect(wide).toHaveLength(5);
    const ids = new Set(wide.map((book) => book.id));
    expect(ids.size).toBe(5);
  });

  it('builds square 600 carousel with limit', () => {
    const seen = createSeen();
    const square = buildSquare600(books, seen, 15);
    expect(square).toHaveLength(15);
    const ids = new Set(square.map((book) => book.id));
    expect(ids.size).toBe(15);
  });

  it('builds featured 400 card', () => {
    const seen = createSeen();
    const featured = buildFeatured400(books, seen);
    expect(featured).not.toBeNull();
    if (featured) {
      expect(featured.covers['400x600']).toBeDefined();
    }
  });

  it('builds readers choice pairs', () => {
    const seen = createSeen();
    const pairs = buildReadersChoice(books, seen, 5);
    expect(pairs).toHaveLength(5);
    for (const pair of pairs) {
      expect(pair).toHaveLength(2);
      const ids = new Set(pair.map((book) => book.id));
      expect(ids.size).toBe(2);
    }
  });

  it('builds editors choice without duplicates', () => {
    const seen = createSeen();
    const editors = buildEditorsChoice(books, seen, 12);
    expect(editors).toHaveLength(12);
    const ids = new Set(editors.map((book) => book.id));
    expect(ids.size).toBe(12);
  });

  it('fills sections with placeholders when no books provided', () => {
    const seen = createSeen();
    const slider = buildTopSlider([], seen);
    expect(slider).toHaveLength(5);
    const promoCount = slider.filter((slide) => slide.type === 'promo').length;
    const bookSlides = slider.filter((slide): slide is Extract<Slide, { type: 'book' }> => slide.type === 'book');
    expect(promoCount).toBeGreaterThanOrEqual(2);
    expect(bookSlides.length).toBeLessThanOrEqual(3);

    const emptySeen = createSeen();
    const { first400, second400 } = buildNewArrivals([], emptySeen);
    expect(first400).toHaveLength(20);
    expect(second400).toHaveLength(20);
    expect(first400.every((book) => book.id.startsWith('placeholder-'))).toBe(true);
    expect(second400.every((book) => book.id.startsWith('placeholder-'))).toBe(true);

    const wide = buildWideBanners([], createSeen());
    expect(wide).toHaveLength(5);
    expect(wide.every((book) => book.id.startsWith('placeholder-'))).toBe(true);

    const square = buildSquare600([], createSeen(), 10);
    expect(square).toHaveLength(10);
    expect(square.every((book) => book.id.startsWith('placeholder-'))).toBe(true);

    const featured = buildFeatured400([], createSeen());
    expect(featured).not.toBeNull();
    if (featured) {
      expect(featured.id.startsWith('placeholder-')).toBe(true);
    }

    const readers = buildReadersChoice([], createSeen(), 3);
    expect(readers).toHaveLength(3);
    readers.forEach((pair) => {
      expect(pair.every((book) => book.id.startsWith('placeholder-'))).toBe(true);
    });

    const editors = buildEditorsChoice([], createSeen(), 6);
    expect(editors).toHaveLength(6);
    expect(editors.every((book) => book.id.startsWith('placeholder-'))).toBe(true);
  });

  it('generates placeholder books on demand', () => {
    const placeholders = generatePlaceholders(5);
    expect(placeholders).toHaveLength(5);
    placeholders.forEach((book, index) => {
      expect(book.id.startsWith('placeholder-')).toBe(true);
      expect(book.note).not.toBeNull();
      expect(book.title).toContain(`${index + 1}`);
    });
  });
});
