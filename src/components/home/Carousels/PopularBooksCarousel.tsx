import Carousel600Section from './Carousel600Section';
import type { NewCarouselBook as CarouselBook } from './NewBooksCarousel';

interface PopularBooksCarouselProps {
  books: CarouselBook[];
}

const TARGET_ITEMS = 20;

const PopularBooksCarousel: React.FC<PopularBooksCarouselProps> = ({ books }) => (
  <Carousel600Section
    id="popular-books"
    title="Популярное"
    books={books}
    target={TARGET_ITEMS}
    placeholderTitle="Популярное скоро здесь"
    placeholderDescription="Самые читаемые книги скоро появятся в этой подборке."
  />
);

export default PopularBooksCarousel;
