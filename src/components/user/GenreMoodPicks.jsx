import React, { useState, useEffect } from 'react';
import { Book } from '@/api/entities';
import BookCarousel from '../home/BookCarousel';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music4 } from 'lucide-react';

export default function GenreMoodPicks({ userGenres, onAddToCart, onAddToWishlist }) {
  const genresToDisplay = [...new Set([...(userGenres || []), 'fiction', 'business', 'fantasy', 'science'])].slice(0, 4);
  const [activeTab, setActiveTab] = useState(genresToDisplay[0]);
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBooksForGenre(activeTab);
  }, [activeTab]);

  const loadBooksForGenre = async (genre) => {
    setIsLoading(true);
    try {
      const genreBooks = await Book.filter({ genre: genre, status: 'approved' }, '-rating', 12);
      setBooks(genreBooks);
    } catch (error) {
      console.error(`Error loading books for genre ${genre}:`, error);
    }
    setIsLoading(false);
  };
  
  const genreLabels = {
    fiction: 'Художественная', 'non-fiction': 'Нон-фикшн', science: 'Наука',
    history: 'История', business: 'Бизнес', romance: 'Романтика', mystery: 'Детектив',
    fantasy: 'Фэнтези', biography: 'Биография', 'self-help': 'Саморазвитие'
  };

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Music4 className="w-8 h-8 text-blue-500" />
            Подборки по жанрам
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Откройте для себя лучшее в ваших любимых жанрах
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          {genresToDisplay.map(genre => (
            <TabsTrigger key={genre} value={genre}>{genreLabels[genre] || genre}</TabsTrigger>
          ))}
        </TabsList>
        <div className="mt-8">
            <BookCarousel
                books={books}
                isLoading={isLoading}
                onAddToCart={onAddToCart}
                onAddToWishlist={onAddToWishlist}
            />
        </div>
      </Tabs>
    </section>
  );
}