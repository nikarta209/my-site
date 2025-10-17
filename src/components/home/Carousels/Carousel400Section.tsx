import { useMemo } from 'react';
import { BookCarousel400 } from './BookCarousel400';
import type { NewCarouselBook as CarouselBook } from './NewBooksCarousel';

interface Carousel400SectionProps {
  id: string;
  title: string;
  books: CarouselBook[];
  target?: number;
  placeholderTitle?: string;
  placeholderDescription?: string;
}

const PLACEHOLDER_COVER = '/assets/cover-placeholder.png';
const PLACEHOLDER_BANNER = '/assets/banner-placeholder.jpg';

let placeholderSeed = 0;

function generatePlaceholders(
  count: number,
  title: string,
  description: string
): CarouselBook[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    placeholderSeed += 1;
    const id = `placeholder-carousel-${index}-${placeholderSeed}`;
    return {
      id,
      title,
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
      description,
    } satisfies CarouselBook;
  });
}

const Carousel400Section: React.FC<Carousel400SectionProps> = ({
  id,
  title,
  books,
  target = 20,
  placeholderTitle = 'Скоро здесь будут книги',
  placeholderDescription = 'Мы собираем подборку специально для вас — зайдите немного позже.',
}) => {
  const preparedBooks = useMemo(() => {
    const unique: CarouselBook[] = [];
    const seen = new Set<string>();
    books.forEach((book) => {
      if (seen.has(book.id)) return;
      seen.add(book.id);
      unique.push(book);
    });
    if (unique.length >= target) {
      return unique.slice(0, target);
    }
    return [
      ...unique,
      ...generatePlaceholders(target - unique.length, placeholderTitle, placeholderDescription),
    ];
  }, [books, placeholderDescription, placeholderTitle, target]);

  return <BookCarousel400 id={id} title={title} books={preparedBooks} />;
};

export default Carousel400Section;
