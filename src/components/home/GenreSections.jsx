import React, { useEffect } from 'react';
import BookCard from './BookCard';
import { useTranslation } from '../i18n/SimpleI18n';
import { useCart } from '../cart/CartContext';
import { getBooksByGenre } from '../utils/supabase';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GenreSections({ filters }) {
  const [genreBooks, setGenreBooks] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const { t } = useTranslation();
  const { addToCart } = useCart();

  const handleAddToCart = (book) => {
    try {
      addToCart(book);
      toast.success(`"${book.title}" добавлена в корзину!`);
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      toast.error('Не удалось добавить в корзину');
    }
  };

  const handleAddToWishlist = (book) => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('kasbook_wishlist') || '[]');
      const isAlreadyInWishlist = wishlist.some(item => item.id === book.id);
      
      if (isAlreadyInWishlist) {
        toast.info(`"${book.title}" уже в избранном`);
      } else {
        wishlist.push(book);
        localStorage.setItem('kasbook_wishlist', JSON.stringify(wishlist));
        toast.success(`"${book.title}" добавлена в избранное!`);
      }
    } catch (error) {
      console.error('Ошибка добавления в избранное:', error);
      toast.error('Не удалось добавить в избранное');
    }
  };

  const handlePreview = (book) => {
    window.location.href = createPageUrl(`BookDetails?id=${book.id}`);
  };

  const loadGenreBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const genres = ['fiction', 'non-fiction', 'science', 'history', 'business'];
      const genrePromises = genres.map(async (genre) => {
        try {
          const books = await getBooksByGenre(genre, 5);
          return [genre, Array.isArray(books) ? books : []];
        } catch (err) {
          console.warn(`Failed to load genre ${genre}:`, err);
          toast.error(`Error loading genre "${genre}"`, { description: err.message });
          return [genre, []];
        }
      });

      const genreResults = await Promise.all(genrePromises);
      const genreData = Object.fromEntries(genreResults);
      
      console.log('Genre books loaded:', Object.keys(genreData).map(k => `${k}: ${genreData[k].length}`));
      
      setGenreBooks(genreData);

    } catch (err) {
      console.error('Critical error loading books by genre:', err);
      setError(err.message || 'Could not load books by genre.');
      toast.error('Critical error loading books by genre', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGenreBooks();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i}>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-96 w-full" />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-muted/50 rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Не удалось загрузить книги</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">{error}</p>
          <Button onClick={loadGenreBooks} variant="outline" aria-label="Попробовать снова загрузить книги по жанрам">
            <RefreshCw className="w-4 h-4 mr-2" />
            Попробовать снова
          </Button>
        </div>
      </section>
    );
  }

  const hasAnyBooks = Object.values(genreBooks).some(list => list && list.length > 0);

  if (!hasAnyBooks) {
     return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Книги не найдены</h3>
        <p className="text-muted-foreground mb-4">
          В каталоге пока нет опубликованных книг.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {Object.entries(genreBooks).map(([genre, bookList]) => {
        if (!bookList || !Array.isArray(bookList) || bookList.length === 0) {
          return null;
        }
        return (
          <section key={genre}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold capitalize">
                {t(`genres.${genre}`, genre)}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {bookList.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}