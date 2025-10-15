import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchFeedBooks } from '@/lib/api/books';
import { HOME_FEED_PRESETS } from '@/lib/feed/presets';
import { rankAndSampleBooks } from '@/lib/feed/ranking';
import { loadRecentIds, saveRecentIds } from '@/lib/feed/storage';
import { isSubscriptionEnabled } from '@/lib/config/flags';

const applyPreset = (preset, books, avoidIds, now) => {
  const localAvoid = new Set([...avoidIds]);
  const baseOptions = {
    size: preset.size,
    avoidIds: localAvoid,
    weights: preset.weights,
    allowedGenres: preset.allowedGenres,
    preferredGenres: preset.preferredGenres,
    requiredTags: preset.requiredTags,
    disallowedTags: preset.disallowedTags,
    allowSubscriptionOnly: (preset.allowSubscriptionOnly ?? false) && isSubscriptionEnabled(),
    now,
    filter: preset.filter ? (book) => preset.filter(book, now) : undefined,
  };

  const options = typeof preset.applyOptions === 'function' ? preset.applyOptions(baseOptions, now) : baseOptions;
  return rankAndSampleBooks(books, options);
};

export const useHomeFeed = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [books, setBooks] = useState([]);
  const [recentIds, setRecentIds] = useState([]);

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
        books: [],
        preset,
      }));
    }

    const now = new Date();
    const avoid = new Set(recentIds);
    const usedWithinPage = new Set();

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

export default useHomeFeed;
