
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Star, Bot } from 'lucide-react';
import { Book } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

const GENRE_CATEGORIES = [
  { key: 'all', label: 'Все жанры', filter: {} },
  { key: 'fiction', label: 'Художественная литература', filter: { genres: { '$in': ['roman', 'povest', 'rasskaz', 'poeziya', 'drama'] } } },
  { key: 'fantasy-scifi', label: 'Фантастика и фэнтези', filter: { genres: { '$in': ['fentezi', 'nauchnaya-fantastika', 'postapokkalipsis', 'antiutopiya'] } } },
  { key: 'detective', label: 'Детективы и триллеры', filter: { genres: { '$in': ['klassicheskiy-detektiv', 'psikhologicheskiy-triller', 'kriminal'] } } },
  { key: 'non-fiction', label: 'Нон-фикшн', filter: { genres: { '$in': ['biografii-memuary', 'istoriya', 'publitsistika', 'nauchno-populyarnoye'] } } },
  { key: 'self-development', label: 'Саморазвитие', filter: { genres: { '$in': ['lichnostnyy-rost', 'psikhologiya-uspekha', 'biznes-literatura'] } } },
  { key: 'children', label: 'Детская литература', filter: { genres: { '$in': ['detskaya-literatura', 'skazki', 'razvivayushchiye-knigi'] } } },
  { key: 'hobbies', label: 'Хобби и досуг', filter: { genres: { '$in': ['kulinariya', 'rukodelie', 'puteshestviya'] } } }
];

export default function Novelties() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const selectedCategory = GENRE_CATEGORIES.find(cat => cat.key === selectedGenre);
      const filter = { 
        status: 'approved',
        ...selectedCategory.filter
      };
      
      const fetchedBooks = await Book.filter(filter, '-created_date', 50);
      setBooks(fetchedBooks || []);
    } catch (error) {
      console.error('Error loading books:', error);
      toast.error('Не удалось загрузить книги');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGenre]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleGenreChange = (genreKey) => {
    setSelectedGenre(genreKey);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 py-3">
        {/* Breadcrumb */}
        <div className="text-xs text-muted-foreground mb-2">
          <Link to={createPageUrl('Home')} className="hover:text-primary">Книги</Link>
          <span className="mx-1">›</span>
          <span>Новинки</span>
        </div>

        {/* Page Title */}
        <h1 className="text-lg font-bold mb-3 text-foreground">Новинки книг</h1>

        <div className="flex gap-4">
          {/* Sidebar */}
          <div className="w-44 flex-shrink-0">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm mb-2 text-foreground">Жанры</h3>
              {GENRE_CATEGORIES.map((category) => (
                <button
                  key={category.key}
                  onClick={() => handleGenreChange(category.key)}
                  className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                    selectedGenre === category.key 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Books Grid - 10-12 книг в ряду как в ЛитРесе */}
            {isLoading ? (
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="aspect-[3/4] w-full rounded" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
                {books.map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onAddToWishlist={handleAddToWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookCard({ book, onAddToWishlist }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getCoverUrl = (book) => getCoverOrPlaceholder(book, `https://picsum.photos/seed/${book.id}/300/400`);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    if (onAddToWishlist) {
      onAddToWishlist(book);
    }
  };

  return (
    <Link 
      to={createPageUrl(`BookDetails?id=${book.id}`)} 
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Обложка книги */}
        <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-200 aspect-[3/4]">
          <img
            src={getCoverUrl(book)}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Кнопка лайка на обложке */}
          <button
            onClick={handleWishlistClick}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 shadow-sm ${
              isWishlisted 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            } ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        {/* Информация о книге */}
        <div className="mt-2 space-y-1">
          <h3 className="font-medium text-xs leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {book.author}
          </p>
          
          {/* Только рейтинг пользователей */}
          {book.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-muted-foreground font-medium">
                {book.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
