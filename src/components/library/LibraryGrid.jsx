
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, Highlighter, Globe, ShoppingCart, DownloadCloud } from 'lucide-react';
import { useTranslation } from '../i18n/SimpleI18n';
import { useAuth } from '../auth/Auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

export default function LibraryGrid({ books, bookProgress = {}, isLoading, showPurchaseOption = false, cachedBookIds }) {
  const { language, t } = useTranslation();
  const { user } = useAuth();
  const [selectedLanguages, setSelectedLanguages] = React.useState({});

  // The problematic useEffect block related to progressSync.getLocalProgress has been removed.
  // Synchronization logic should be handled elsewhere if needed.

  const getProgressPercentage = (bookId) => {
    // ИСПРАВЛЕНИЕ: Добавляем проверку на существование bookProgress
    if (!bookProgress || typeof bookProgress !== 'object') {
      return 0;
    }
    const progress = bookProgress[bookId];
    if (!progress) return 0;
    return Math.min((progress.reading_progress || 0), 100);
  };

  const getLastHighlights = (bookId) => {
    // ИСПРАВЛЕНИЕ: Добавляем фиктивные данные, так как реальные highlights пока не реализованы
    const mockHighlights = [
      { text: "Важная цитата из книги", color: "yellow" },
      { text: "Интересная мысль автора", color: "blue" },
      { text: "Ключевая идея главы", color: "green" }
    ];
    return mockHighlights.slice(0, 3);
  };

  const getTranslatedContent = (book, field) => {
    if (!book?.languages || !Array.isArray(book.languages)) return book?.[field] || '';
    
    const selectedLang = selectedLanguages[book.id];
    if (selectedLang) {
      const translation = book.languages.find(l => l && l.lang === selectedLang);
      if (translation?.[field]) return translation[field];
    }
    const userLang = book.languages.find(l => l && l.lang === language);
    const defaultLang = book.languages.find(l => l && l.title);
    return userLang?.[field] || defaultLang?.[field] || book?.[field] || '';
  };

  const handleLanguageChange = (bookId, newLanguage) => {
    setSelectedLanguages(prev => ({
      ...prev,
      [bookId]: newLanguage
    }));
  };

  const handlePurchase = (book) => {
    // Add to cart
    const cart = JSON.parse(localStorage.getItem('kasbook_cart') || '[]');
    const bookWithLang = {
      ...book,
      title: getTranslatedContent(book, 'title')
    };
    if (!cart.find(item => item.id === book.id)) {
      cart.push(bookWithLang);
      localStorage.setItem('kasbook_cart', JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(8).fill(0).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-64 w-full rounded-t-lg" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          {showPurchaseOption ? 
            t('library.noFreePreviews', 'Нет бесплатных фрагментов') : 
            t('library.noBooks', 'Нет книг')
          }
        </h3>
        <p className="text-muted-foreground">
          {showPurchaseOption ? 
            t('library.noFreePreviewsDesc', 'Откройте любую книгу для предварительного просмотра.') :
            t('library.noBooksDesc', 'Купите книги, чтобы они появились в вашей библиотеке.')
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map(book => {
        const progress = showPurchaseOption ? 0 : getProgressPercentage(book.id);
        const highlights = showPurchaseOption ? [] : getLastHighlights(book.id);
        const currentLang = selectedLanguages[book.id] || 
                           book.languages?.find(l => l.lang === language)?.lang || 
                           book.languages?.[0]?.lang || 'en';

        return (
          <Card key={book.id} className="hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={getCoverOrPlaceholder(book, `https://picsum.photos/seed/${book.id}/300/400`)}
                alt={getTranslatedContent(book, 'title')}
                className="w-full h-64 object-cover rounded-t-lg"
              />
              {/* Enhanced badges */}
              <div className="absolute top-2 left-2 space-y-1">
                {cachedBookIds?.has(book.id) && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <DownloadCloud className="w-3 h-3 mr-1" />
                    Офлайн
                  </Badge>
                )}
                {showPurchaseOption && (
                  <Badge className="bg-blue-600 text-white">
                    {t('library.freePreview', 'Фрагмент')}
                  </Badge>
                )}
              </div>
              
              {/* Progress indicator */}
              {!showPurchaseOption && progress > 0 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {progress.toFixed(0)}%
                </div>
              )}
            </div>

            <CardContent className="p-4">
              {/* Language Selector */}
              {book.languages && book.languages.length > 1 && (
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-3 h-3 text-muted-foreground" />
                  <Select 
                    value={currentLang} 
                    onValueChange={(value) => handleLanguageChange(book.id, value)}
                  >
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {book.languages.filter(lang => lang && lang.lang).map(lang => (
                        <SelectItem key={lang.lang} value={lang.lang} className="text-xs">
                          {(lang.lang || 'unknown').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                {getTranslatedContent(book, 'title')}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">{book.author || 'Неизвестный автор'}</p>

              {/* Enhanced Progress Bar */}
              {!showPurchaseOption && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {t('library.readingProgress', 'Прогресс чтения')}
                    </span>
                    <span className="text-xs font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {progress > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Последнее чтение: сегодня
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Price (only for previews) */}
              {showPurchaseOption && (
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="text-lg font-bold text-[#4CAF50]">
                    {book.price_kas} KAS
                  </Badge>
                </div>
              )}

              {/* Last Highlights (only for owned books) */}
              {!showPurchaseOption && highlights.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-2">
                    <Highlighter className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {t('library.lastNotes', 'Последние заметки')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {highlights.map((highlight, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs px-2 py-1 max-w-full truncate"
                        style={{
                          backgroundColor: `${highlight.color === 'yellow' ? '#fef3c7' :
                                          highlight.color === 'blue' ? '#dbeafe' : '#d1fae5'}`,
                          color: `${highlight.color === 'yellow' ? '#92400e' :
                                 highlight.color === 'blue' ? '#1e40af' : '#065f46'}`
                        }}
                      >
                        {highlight.text}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {showPurchaseOption ? (
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={createPageUrl(`Reader?bookId=${book.id}`)}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      {t('library.readPreview', 'Читать')}
                    </Link>
                  </Button>
                  <Button 
                    onClick={() => handlePurchase(book)}
                    size="sm"
                    className="flex-1 bg-[#4CAF50] hover:bg-[#45a049]"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {t('library.buy', 'Купить')}
                  </Button>
                </div>
              ) : (
                <Button asChild className="w-full" variant={progress > 0 ? "default" : "outline"}>
                   <Link to={createPageUrl(`Reader?bookId=${book.id}`)}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    {progress > 0 ? 
                      t('library.continueReading', 'Продолжить чтение') : 
                      t('library.startReading', 'Начать чтение')
                    }
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
