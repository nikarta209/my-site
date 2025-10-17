import { useMemo } from 'react';
import { BookCarousel600 } from './BookCarousel600';
import type { NewCarouselBook as CarouselBook } from './NewBooksCarousel';

interface PopularBooksCarouselProps {
  books: CarouselBook[];
}

const PLACEHOLDER_COVER = '/assets/cover-placeholder.png';
const PLACEHOLDER_BANNER = '/assets/banner-placeholder.jpg';
const TARGET_ITEMS = 20;

let placeholderSeed = 0;

function generatePlaceholders(count: number): CarouselBook[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    placeholderSeed += 1;
    const id = `placeholder-popular-${index}-${placeholderSeed}`;
    return {
      id,
      title: 'Популярное скоро здесь',
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
      description: 'Самые читаемые книги скоро появятся в этой подборке.',
    } satisfies CarouselBook;
  });
}

const PopularBooksCarousel: React.FC<PopularBooksCarouselProps> = ({ books }) => {
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

  return <BookCarousel600 id="popular-books" title="Популярное" books={preparedBooks} />;
};

export default PopularBooksCarousel;
