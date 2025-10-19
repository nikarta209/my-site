import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ShoppingCart, Eye, Zap, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

// Расчёт роялти для отображения
const calculateDisplayRoyalties = (price) => {
  const royaltyAmount = (price * 5) / 100;
  const sellerAmount = price - royaltyAmount;
  return { royaltyAmount, sellerAmount };
};

const ResaleCard = ({ listing, book, onBuy, currentUser }) => {
  const { royaltyAmount, sellerAmount } = calculateDisplayRoyalties(listing.price_kas);
  const isOwnListing = currentUser?.email === listing.seller_email;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
      <div className="relative">
        <img
          src={getCoverOrPlaceholder(book, `https://picsum.photos/seed/${book.id}/300/400`)}
          alt={book.title}
          className="w-full h-64 object-cover rounded-t-lg"
        />
        <Badge className="absolute top-2 left-2 bg-purple-600 text-white flex items-center gap-1">
          <Zap className="w-3 h-3" />
          NFT
        </Badge>
        <Badge className="absolute top-2 right-2 bg-black/80 text-white">
          #{listing.nft_token_id?.substring(0, 8) || 'MINT'}
        </Badge>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
        
        {/* Original book stats */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm">{book.rating ? book.rating.toFixed(1) : '—'}</span>
          <span className="text-xs text-muted-foreground ml-2">
            {book.sales_count || 0} продаж
          </span>
        </div>

        {/* Pricing breakdown */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Цена:</span>
            <span className="text-lg font-bold text-green-600">
              {listing.price_kas} KAS
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              Роялти автору:
            </span>
            <span>{royaltyAmount.toFixed(2)} KAS</span>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Продавец получит:</span>
            <span>{sellerAmount.toFixed(2)} KAS</span>
          </div>
        </div>

        {/* Seller info */}
        <div className="text-xs text-muted-foreground mb-3">
          <p>Продавец: {listing.seller_email.split('@')[0]}***</p>
          <p>Выставлено: {format(new Date(listing.created_date), 'dd MMM yyyy', { locale: ru })}</p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {isOwnListing ? (
            <Badge variant="secondary" className="w-full justify-center">
              Ваше объявление
            </Badge>
          ) : (
            <Button 
              onClick={() => onBuy(listing)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Купить NFT
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ResaleGrid({ listings, books, isLoading, onBuyResale, currentUser }) {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(8).fill(0).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-64 w-full rounded-t-lg" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Нет активных объявлений</h3>
        <p className="text-muted-foreground">
          Пока никто не выставил свои книги на продажу как NFT.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map(listing => {
        const book = books[listing.book_id];
        if (!book) return null;
        
        return (
          <ResaleCard
            key={listing.id}
            listing={listing}
            book={book}
            onBuy={onBuyResale}
            currentUser={currentUser}
          />
        );
      })}
    </div>
  );
}