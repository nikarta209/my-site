import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Star, ShoppingCart } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function PreviewsGrid({ books, isLoading, onPreviewBook }) {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(8).fill(0).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-64 w-full rounded-t-lg" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16">
        <Eye className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Нет доступных превью</h3>
        <p className="text-muted-foreground">Все доступные книги уже куплены.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map(book => (
        <Card key={book.id} className="hover:shadow-lg transition-shadow">
          <div className="relative">
            <img
              src={book.cover_url || `https://picsum.photos/300/400?random=${book.id}`}
              alt={book.title}
              className="w-full h-64 object-cover rounded-t-lg"
            />
            <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
              Превью
            </Badge>
          </div>
          
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
            
            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">{book.rating ? book.rating.toFixed(1) : '—'}</span>
              <span className="text-xs text-muted-foreground">({book.reviews_count || 0})</span>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {book.description}
            </p>

            {/* Price */}
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary" className="text-lg font-bold text-[#4CAF50]">
                {book.price_kas} KAS
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={() => onPreviewBook(book)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Превью
              </Button>
              <Button 
                size="sm"
                className="flex-1 bg-[#4CAF50] hover:bg-[#45a049]"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Купить
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}