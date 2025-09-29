import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import BannerCarousel from '../home/BannerCarousel';
import GenreGrid from '../home/GenreGrid';
import { getBooksByGenre } from '../utils/supabase';

const GENRES = ['fiction', 'science', 'business', 'romance'];

export default function HomeTab() {
  const [genreData, setGenreData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadGenres = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.all(
          GENRES.map(async (genre) => {
            try {
              const books = await getBooksByGenre(genre, 6);
              return [genre, books || []];
            } catch (error) {
              console.error('[HomeTab] Failed to fetch books for genre', genre, error);
              return [genre, []];
            }
          })
        );

        if (!isMounted) return;

        setGenreData(Object.fromEntries(results));
      } catch (error) {
        console.error('[HomeTab] Failed to load genres', error);
        toast.error('Не удалось загрузить подборки книг');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadGenres();

    return () => {
      isMounted = false;
    };
  }, []);

  const preparedData = useMemo(() => ({
    fiction: genreData.fiction || [],
    science: genreData.science || [],
    business: genreData.business || [],
    romance: genreData.romance || []
  }), [genreData]);

  return (
    <div className="space-y-12">
      <BannerCarousel />
      <GenreGrid genreData={preparedData} loading={isLoading} />
    </div>
  );
}