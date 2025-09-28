import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTranslation } from '../i18n/SimpleI18n';

export default function BookRecommendations({ currentBook, language }) {
  const [recommendations, setRecommendations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (currentBook) {
      loadRecommendations();
    }
  }, [currentBook, language]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Get books from the same genre
      const sameGenre = await Book.filter({ 
        genre: currentBook.genre,
        status: 'approved'
      }, '-rating', 20);

      // Filter out current book and prioritize books in current language
      let filtered = sameGenre.filter(book => book.id !== currentBook.id);
      
      // Sort by language preference and rating
      filtered.sort((a, b) => {
        const aHasLang = a.languages?.some(l => l.lang === language);
        const bHasLang = b.languages?.some(l => l.lang === language);
        
        if (aHasLang && !bHasLang) return -1;
        if (!aHasLang && bHasLang) return 1;
        
        // If same language availability, sort by rating and sales
        const aScore = (a.rating || 0) * 0.6 + (a.sales_count || 0) * 0.4;
        const bScore = (b.rating || 0) * 0.6 + (b.sales_count || 0) * 0.4;
        return bScore - aScore;
      });

      setRecommendations(filtered.slice(0, 12));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
    setIsLoading(false);
  };

  const getTranslated = (book, field) => {
    const translation = book.languages?.find(l => l.lang === language);
    const defaultTranslation = book.languages?.[0];
    return translation?.[field] || defaultTranslation?.[field] || '';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const itemsPerPage = 4;
  const totalPages = Math.ceil(recommendations.length / itemsPerPage);
  const currentItems = recommendations.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Рекомендуем также</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-md mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Рекомендуем также</CardTitle>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevSlide}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextSlide}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentItems.map((book) => (
            <div key={book.id} className="group cursor-pointer">
              <Link to={createPageUrl(`BookDetails?id=${book.id}`)}>
                <div className="relative overflow-hidden rounded-lg mb-3">
                  <img
                    src={book.cover_url || `https://picsum.photos/300/400?random=${book.id}`}
                    alt={getTranslated(book, 'title')}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <Badge className="absolute top-2 left-2 text-xs">
                    {t(`genres.${book.genre}`, book.genre)}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary">
                    {getTranslated(book, 'title')}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {book.author}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="flex">{renderStars(book.rating || 0)}</div>
                      <span className="text-xs text-muted-foreground">
                        {(book.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {book.price_kas} KAS
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}