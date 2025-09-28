import React from 'react';
import BannerCarousel from '../home/BannerCarousel';
import GenreGrid from '../home/GenreGrid';
import { getBooks } from '../utils/localStorage';

export default function HomeTab() {
  const books = getBooks();
  const genreData = {
    'fiction': books.filter(book => book.genre === 'fiction').slice(0, 6),
    'science': books.filter(book => book.genre === 'science').slice(0, 6),
    'business': books.filter(book => book.genre === 'business').slice(0, 6),
    'romance': books.filter(book => book.genre === 'romance').slice(0, 6),
  };

  return (
    <div className="space-y-12">
      <BannerCarousel />
      <GenreGrid genreData={genreData} loading={false} />
    </div>
  );
}