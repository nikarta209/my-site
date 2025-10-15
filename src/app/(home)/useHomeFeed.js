import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchHomeBooks } from '@/lib/api/books';
import { homeFeedPresets } from '@/lib/feed/presets';
import { rankAndSampleBooks } from '@/lib/feed/ranking';
import { loadRecent, rememberShown } from '@/lib/feed/storage';
import { uniqueById } from '@/lib/feed/utils';

const createAvoidSet = (recent, pageSeen) => {
  const avoid = new Set();
  recent.forEach((id) => avoid.add(String(id)));
  pageSeen.forEach((id) => avoid.add(String(id)));
  return avoid;
};

export const useHomeFeed = () => {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const presets = useMemo(() => homeFeedPresets, []);

  const buildSections = useCallback((books) => {
    const recent = loadRecent();
    const pageSeen = new Set();
    const built = [];

    for (const preset of presets) {
      const filtered = preset.predicate ? books.filter(preset.predicate) : books;
      const avoidIds = createAvoidSet(recent, pageSeen);
      const picks = rankAndSampleBooks(filtered, preset.size, {
        avoidIds,
        ...preset.ranking,
        maxPerGenre: preset.maxPerGenre ?? 3,
      });

      if (picks.length === 0 && filtered.length > 0) {
        const fallback = uniqueById(filtered).slice(0, preset.size);
        fallback.forEach((book) => pageSeen.add(String(book.id)));
        built.push({ ...preset, books: fallback });
        continue;
      }

      picks.forEach((book) => pageSeen.add(String(book.id)));
      built.push({ ...preset, books: picks });
    }

    rememberShown(Array.from(pageSeen));
    return built;
  }, [presets]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const books = await fetchHomeBooks();
      if (!Array.isArray(books) || books.length === 0) {
        setSections([]);
        return;
      }
      const nextSections = buildSections(books);
      setSections(nextSections);
    } catch (err) {
      console.error('[useHomeFeed] failed to load home feed', err);
      setError(err);
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildSections]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    sections,
    isLoading,
    error,
    reload: load,
  };
};
