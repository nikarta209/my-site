import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Book } from '@/lib/api/books';
import { fetchFeedBooks } from '@/lib/api/books';
import { HOME_FEED_PRESETS, type FeedPreset } from '@/lib/feed/presets';
import { rankAndSampleBooks, type RankingSampleOptions } from '@/lib/feed/ranking';
import { loadRecentIds, saveRecentIds } from '@/lib/feed/storage';
import { isSubscriptionEnabled } from '@/lib/config/flags';

export type HomeSection = {
  id: string;
  titleKey: string;
  viewAllHref: string;
  books: Book[];
  preset: FeedPreset;
};

export type HomeFeedState = {
  sections: HomeSection[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const applyPreset = (preset: FeedPreset, books: Book[], avoidIds: Set<string>, now: Date): Book[] => {
  const localAvoid = new Set([...avoidIds]);
  const baseOptions: RankingSampleOptions = {
    size: preset.size,
    avoidIds: localAvoid,
    weights: preset.weights,
    allowedGenres: preset.allowedGenres,
    preferredGenres: preset.preferredGenres,
    requiredTags: preset.requiredTags,
    disallowedTags: preset.disallowedTags,
    allowSubscriptionOnly: (preset.allowSubscriptionOnly ?? false) && isSubscriptionEnabled(),
    now,
    filter: preset.filter ? (book) => preset.filter!(book, now) : undefined,
  };

  const options = preset.applyOptions ? preset.applyOptions(baseOptions, now) : baseOptions;
  return rankAndSampleBooks(books, options);
};

export const useHomeFeed = (): HomeFeedState => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    setRecentIds(loadRecentIds());
  }, []);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFeedBooks({ limit: 220 });
      setBooks(result);
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to load feed');
      setError(errorInstance);
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const sections = useMemo(() => {
    if (books.length === 0) {
      return HOME_FEED_PRESETS.map((preset) => ({
        id: preset.id,
        titleKey: preset.titleKey,
        viewAllHref: preset.viewAllHref,
        books: [] as Book[],
        preset,
      }));
    }

    const now = new Date();
    const avoid = new Set(recentIds);
    const usedWithinPage = new Set<string>();

    return HOME_FEED_PRESETS.map((preset) => {
      const effectiveAvoid = new Set([...avoid, ...usedWithinPage]);
      const sampled = applyPreset(preset, books, effectiveAvoid, now);
      sampled.forEach((book) => {
        usedWithinPage.add(book.id);
      });
      return {
        id: preset.id,
        titleKey: preset.titleKey,
        viewAllHref: preset.viewAllHref,
        books: sampled,
        preset,
      };
    });
  }, [books, recentIds]);

  useEffect(() => {
    if (sections.length === 0) return;
    const visibleIds = sections.flatMap((section) => section.books.map((book) => book.id));
    if (visibleIds.length === 0) return;
    saveRecentIds(visibleIds);
    setRecentIds((prev) => {
      const merged = new Set(prev);
      let hasNew = false;
      visibleIds.forEach((id) => {
        if (!merged.has(id)) {
          merged.add(id);
          hasNew = true;
        }
      });
      return hasNew ? Array.from(merged) : prev;
    });
  }, [sections]);

  const refresh = useCallback(async () => {
    await fetchBooks();
  }, [fetchBooks]);

  return {
    sections,
    isLoading,
    error,
    refresh,
  };
};
