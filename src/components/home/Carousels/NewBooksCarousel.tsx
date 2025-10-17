import type { PublicBook } from '@/api/books';
import Carousel400Section from './Carousel400Section';

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

const TARGET_ITEMS = 20;

const NewBooksCarousel: React.FC<NewBooksCarouselProps> = ({ books }) => (
  <Carousel400Section
    id="new-books"
    title="Новинки"
    books={books}
    target={TARGET_ITEMS}
    placeholderTitle="Скоро новинки"
    placeholderDescription="Мы подбираем лучшие новинки для вас — скоро здесь появятся новые карточки."
  />
);

export type { CarouselBook as NewCarouselBook };

export default NewBooksCarousel;
