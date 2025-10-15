import { describe, expect, it } from 'vitest';
import { scoreBook, rankAndSampleBooks } from './ranking';
import type { Book } from '@/lib/api/books';

let uid = 0;
const makeBook = (overrides: Partial<Book>): Book => ({
  id: overrides.id ?? `book-${uid++}`,
  title: overrides.title ?? 'Book',
  cover_url: overrides.cover_url ?? 'https://example.com/cover.jpg',
  genre: overrides.genre ?? 'fantasy',
  rating: overrides.rating ?? 0,
  weekly_sales: overrides.weekly_sales ?? 0,
  total_sales: overrides.total_sales ?? 0,
  ...overrides,
});

describe('scoreBook', () => {
  it('adds weight for rating and weekly sales', () => {
    const base = scoreBook(makeBook({ rating: 3, weekly_sales: 5 }), { ratingWeight: 2, salesWeight: 1 }, new Date());
    const improved = scoreBook(makeBook({ rating: 4, weekly_sales: 30 }), { ratingWeight: 2, salesWeight: 1 }, new Date());
    expect(improved).toBeGreaterThan(base);
  });

  it('includes freshness boost for recent books', () => {
    const now = new Date();
    const fresh = makeBook({ rating: 0, weekly_sales: 0, published_at: now.toISOString() });
    const old = makeBook({ rating: 0, weekly_sales: 0, published_at: '2000-01-01T00:00:00.000Z' });
    expect(scoreBook(fresh, {}, now)).toBeGreaterThan(scoreBook(old, {}, now));
  });
});

describe('rankAndSampleBooks', () => {
  const sampleBooks = Array.from({ length: 6 }).map((_, index) =>
    makeBook({
      id: `book-${index}`,
      title: `Book ${index}`,
      genre: index % 2 === 0 ? 'fantasy' : 'mystery',
      rating: 4 + (index % 2),
      weekly_sales: 10 + index * 3,
    })
  );

  it('returns unique books without exceeding size', () => {
    const picks = rankAndSampleBooks(sampleBooks, { size: 4 });
    expect(picks).toHaveLength(4);
    const uniqueIds = new Set(picks.map((book) => book.id));
    expect(uniqueIds.size).toBe(4);
  });

  it('respects avoid list and falls back gracefully', () => {
    const avoidIds = new Set(sampleBooks.slice(0, 5).map((book) => book.id));
    const picks = rankAndSampleBooks(sampleBooks, { size: 3, avoidIds });
    expect(picks.every((book) => !avoidIds.has(book.id))).toBe(true);
    expect(picks.length).toBeLessThanOrEqual(1);
  });
});
