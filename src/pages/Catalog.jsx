
import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "../components/cart/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslation } from '../components/i18n/SimpleI18n';
import BookGrid from "../components/catalog/BookGrid";
import SearchFilters from "../components/catalog/SearchFilters";
import { toast } from "sonner";
import { getApprovedBooks, getPublicBooks } from '../components/utils/supabase';
import BookPreviewModal from '../components/catalog/BookPreviewModal';

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    genre: 'all',
    language: 'all',
    priceMin: '',
    priceMax: '',
    rating: 'all',
    sortBy: 'popular'
  });
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const [previewBook, setPreviewBook] = useState(null);

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Используем getPublicBooks для получения и одобренных, и public_domain книг
      const publicBooks = await getPublicBooks(100);
      
      // ИСПРАВЛЕНИЕ: Добавлена логика фильтрации и сортировки
      let filteredBooks = publicBooks.filter(book => {
        if (!book) return false;
        
        const searchMatch = filters.search === '' || 
          book.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
          book.description?.toLowerCase().includes(filters.search.toLowerCase());

        const genreMatch = filters.genre === 'all' || 
          (Array.isArray(book.genres) && book.genres.includes(filters.genre));

        const langMatch = filters.language === 'all' ||
          (Array.isArray(book.languages) && book.languages.some(l => l.lang === filters.language));

        const minPriceMatch = filters.priceMin === '' || (book.price_kas ?? 0) >= parseFloat(filters.priceMin);
        const maxPriceMatch = filters.priceMax === '' || (book.price_kas ?? Infinity) <= parseFloat(filters.priceMax);

        return searchMatch && genreMatch && langMatch && minPriceMatch && maxPriceMatch;
      });

      // Сортировка
      switch (filters.sortBy) {
        case 'price_asc':
          filteredBooks.sort((a, b) => (a.price_kas ?? 0) - (b.price_kas ?? 0));
          break;
        case 'price_desc':
          filteredBooks.sort((a, b) => (b.price_kas ?? 0) - (a.price_kas ?? 0));
          break;
        case 'popular':
        default:
          // По умолчанию (и для 'popular') сортируем по дате создания
          filteredBooks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
      }

      setBooks(filteredBooks);
      
      if (filteredBooks.length === 0) {
        toast.info('Книги не найдены', {
          description: 'Попробуйте изменить фильтры поиска или сбросить их.'
        });
      }
      
    } catch (err) {
      console.error('❌ Критическая ошибка загрузки каталога:', err);
      setError(err.message);
      toast.error(`Failed to load: ${err.message}`, {
        description: 'Не удалось загрузить каталог'
      });
      setBooks([]); // Fallback к пустому массиву
    } finally {
      setIsLoading(false);
    }
  }, [filters]); // Теперь 'filters' является необходимой зависимостью

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddToCart = (book) => {
    addToCart(book);
    toast.success(`"${book.title}" добавлена в корзину!`);
  };

  const genreOptions = [
    { value: 'all', label: t('filters.allGenres', 'Все жанры') },
    { value: 'fiction', label: t('genres.fiction', 'Художественная литература') },
    { value: 'non-fiction', label: t('genres.non-fiction', 'Нон-фикшн') },
    { value: 'science', label: t('genres.science', 'Наука') },
    { value: 'history', label: t('genres.history', 'История') },
  ];

  const languageOptions = [
    { value: 'all', label: t('filters.allLanguages', 'Все языки') },
    { value: 'ru', label: 'Русский' },
    { value: 'en', label: 'English' },
  ];

  return (
    <>
      <div className="w-full">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-2 text-foreground">Каталог книг</h1>
          <p className="text-muted-foreground mb-4 text-sm">Найдите свою следующую любимую книгу среди тысяч произведений.</p>

          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            genreOptions={genreOptions}
            languageOptions={languageOptions}
          />
          
          <div className="mt-6">
            {error && (
              <div 
                className="text-center py-12 bg-muted/50 rounded-lg"
                role="alert"
                aria-live="polite"
                aria-label="Ошибка загрузки каталога книг"
              >
                <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-destructive mb-2">
                  Не удалось загрузить книги
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  {error}
                </p>
                <Button 
                  onClick={loadBooks} 
                  variant="outline" 
                  aria-label="Повторить попытку загрузки каталога книг"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Попробовать снова
                </Button>
              </div>
            )}
             {!error && (
              <div
                role="region" 
                aria-label="Каталог книг"
                aria-live="polite"
                aria-busy={isLoading}
              >
                <BookGrid
                  books={books}
                  isLoading={isLoading}
                  viewMode="grid"
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={() => {}}
                  onPreview={setPreviewBook}
                />
              </div>
            )}
          </div>
        </div>
      </div>
       <BookPreviewModal
        isOpen={!!previewBook}
        onOpenChange={() => setPreviewBook(null)}
        book={previewBook}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
