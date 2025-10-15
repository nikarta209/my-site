import { describe, expect, it, vi, beforeEach } from 'vitest';
import { rankAndSampleBooks, scoreBook } from './ranking';

const baseBook = (overrides = {}) => ({
  id: overrides.id ?? `book-${Math.random().toString(36).slice(2)}`,
  title: 'Test',
  cover_url: 'https://example.com/cover.jpg',
  genre: 'fantasy',
  rating: 4.5,
  weekly_sales: 120,
  total_sales: 500,
  ...overrides,
});

describe('scoreBook', () => {
  it('weights rating and weekly sales', () => {
    const a = scoreBook(baseBook({ rating: 4, weekly_sales: 10 }));
    const b = scoreBook(baseBook({ rating: 4.5, weekly_sales: 100 }));
    expect(b).toBeGreaterThan(a);
  });

  it('adds bonuses for exclusive and editor picks', () => {
    const scoreExclusive = scoreBook(baseBook({ is_exclusive: true }), {
      exclusiveBoost: 1,
    });
    const scoreRegular = scoreBook(baseBook(), { exclusiveBoost: 1 });
    expect(scoreExclusive).toBeGreaterThan(scoreRegular);
  });
});

describe('rankAndSampleBooks', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
  });

  it('returns unique books respecting avoid set', () => {
    const books = Array.from({ length: 6 }).map((_, index) =>
      baseBook({ id: `book-${index}`, genre: index % 2 === 0 ? 'fantasy' : 'mystery' })
    );
    const result = rankAndSampleBooks(books, 4, { avoidIds: new Set(['book-0']) });
    expect(result).toHaveLength(4);
    expect(result.some((book) => book.id === 'book-0')).toBe(false);
    const ids = new Set(result.map((book) => book.id));
    expect(ids.size).toBe(result.length);
  });

  it('falls back gracefully when not enough content', () => {
    const books = [baseBook({ id: 'only-one' })];
    const result = rankAndSampleBooks(books, 4);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('only-one');
  });
});
