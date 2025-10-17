import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/supabaseClient', () => {
  type Step = { method: string; args: unknown[] };
  type Call = { table: string; steps: Step[] };

  const calls: Call[] = [];

  const createBuilder = (call: Call) => {
    const builder: any = {
      select(...args: unknown[]) {
        call.steps.push({ method: 'select', args });
        return builder;
      },
      in(...args: unknown[]) {
        call.steps.push({ method: 'in', args });
        return builder;
      },
      order(...args: unknown[]) {
        call.steps.push({ method: 'order', args });
        return builder;
      },
      eq(...args: unknown[]) {
        call.steps.push({ method: 'eq', args });
        return builder;
      },
      not(...args: unknown[]) {
        call.steps.push({ method: 'not', args });
        return builder;
      },
      limit(...args: unknown[]) {
        call.steps.push({ method: 'limit', args });
        return builder;
      },
      maybeSingle(...args: unknown[]) {
        call.steps.push({ method: 'maybeSingle', args });
        return Promise.resolve({ data: null, error: null });
      },
      then(onFulfilled?: (...args: any[]) => unknown, onRejected?: (...args: any[]) => unknown) {
        return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
      },
      catch(onRejected?: (...args: any[]) => unknown) {
        return Promise.resolve({ data: [], error: null }).catch(onRejected);
      },
    };

    return builder;
  };

  const supabase = {
    from(table: string) {
      const call: Call = { table, steps: [] };
      calls.push(call);
      return createBuilder(call);
    },
    __getCalls() {
      return calls;
    },
    __reset() {
      calls.length = 0;
    },
  } as any;

  return { supabase, default: supabase };
});

import {
  BOOK_FIELDS,
  fetchBannerBooks,
  fetchEditorsPicks,
  fetchNewBooks,
  fetchPopularBooks,
} from '@/api/books';
import { supabase } from '@/api/supabaseClient';

describe('books api helpers', () => {
  beforeEach(() => {
    (supabase as any).__reset?.();
  });

  it('fetches new books with status filter and newest first', async () => {
    await fetchNewBooks();
    const calls = (supabase as any).__getCalls?.() ?? [];
    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call.table).toBe('v_books_public');
    expect(call.steps).toEqual(
      expect.arrayContaining([
        { method: 'select', args: [BOOK_FIELDS] },
        { method: 'in', args: ['status', ['approved', 'public_domain']] },
        { method: 'order', args: ['created_at', { ascending: false }] },
      ]),
    );
  });

  it('fetches popular books ordered by sales_count', async () => {
    await fetchPopularBooks();
    const calls = (supabase as any).__getCalls?.() ?? [];
    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call.steps).toEqual(
      expect.arrayContaining([
        { method: 'select', args: [BOOK_FIELDS] },
        { method: 'order', args: ['sales_count', { ascending: false, nullsLast: true }] },
      ]),
    );
  });

  it('fetches editor picks with equality filter', async () => {
    await fetchEditorsPicks();
    const calls = (supabase as any).__getCalls?.() ?? [];
    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call.steps).toEqual(
      expect.arrayContaining([
        { method: 'select', args: [BOOK_FIELDS] },
        { method: 'eq', args: ['is_editors_pick', true] },
      ]),
    );
  });

  it('fetches banner books with default limit and banner filter', async () => {
    await fetchBannerBooks();
    const calls = (supabase as any).__getCalls?.() ?? [];
    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call.steps).toEqual(
      expect.arrayContaining([
        { method: 'select', args: [BOOK_FIELDS] },
        { method: 'not', args: ['cover_images->>main_banner', 'is', null] },
        { method: 'order', args: ['created_at', { ascending: false }] },
        { method: 'limit', args: [5] },
      ]),
    );
  });

  it('allows custom limit for banner books', async () => {
    await fetchBannerBooks(3);
    const calls = (supabase as any).__getCalls?.() ?? [];
    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call.steps).toEqual(
      expect.arrayContaining([
        { method: 'limit', args: [3] },
      ]),
    );
  });
});
