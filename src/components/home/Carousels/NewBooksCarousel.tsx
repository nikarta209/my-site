import { useMemo } from 'react';
import type { PublicBook } from '@/api/books';
import { BookCarousel400 } from './BookCarousel400';

type CarouselBook = PublicBook & {
  covers: {
    '400x600'?: string | null;
    '600x600'?: string | null;
    '1600x900'?: string | null;
    mainBanner?: string | null;
  };
  authorName: string;
  description?: string | null;
};

interface NewBooksCarouselProps {
  books: CarouselBook[];
}

const PLACEHOLDER_COVER = '/assets/cover-placeholder.png';
const PLACEHOLDER_BANNER = '/assets/banner-placeholder.jpg';
const TARGET_ITEMS = 20;

let placeholderSeed = 0;

function generatePlaceholders(count: number): CarouselBook[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    placeholderSeed += 1;
    const id = `placeholder-new-${index}-${placeholderSeed}`;
    return {
      id,
      title: 'Скоро новинки',
      author: null,
      author_name: null,
      created_at: null,
      updated_at: null,
      cover_images: null,
      likes_count: null,
      sales_count: null,
      rating: null,
      is_editors_pick: null,
      status: null,
      covers: {
        '400x600': PLACEHOLDER_COVER,
        '600x600': PLACEHOLDER_COVER,
        '1600x900': PLACEHOLDER_BANNER,
        mainBanner: PLACEHOLDER_BANNER,
      },
      authorName: 'KASBOOK',
      description: 'Мы подбираем лучшие новинки для вас — скоро здесь появятся новые карточки.',
    } satisfies CarouselBook;
  });
}

const NewBooksCarousel: React.FC<NewBooksCarouselProps> = ({ books }) => {
  const preparedBooks = useMemo(() => {
    const unique: CarouselBook[] = [];
    const seen = new Set<string>();
    books.forEach((book) => {
      if (seen.has(book.id)) return;
      seen.add(book.id);
      unique.push(book);
    });
    if (unique.length >= TARGET_ITEMS) {
      return unique.slice(0, TARGET_ITEMS);
    }
    return [...unique, ...generatePlaceholders(TARGET_ITEMS - unique.length)];
  }, [books]);

  return <BookCarousel400 id="new-books" title="Новинки" books={preparedBooks} />;
};

export type { CarouselBook as NewCarouselBook };

export default NewBooksCarousel;
