import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, ShoppingCart, Heart } from 'lucide-react';

export default function TrendingDeals({ books, isLoading, onAddToCart, onAddToWishlist }) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg mb-12" />;
  }

  if (!books || books.length === 0) {
    return null;
  }

  const featuredBook = books[0];

  return (
    <div className="mb-12 p-8 rounded-xl bg-gradient-to-tr from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 flex flex-col md:flex-row items-center gap-8">
      <div className="flex-shrink-0">
        <Link to={createPageUrl(`BookDetails?id=${featuredBook.id}`)}>
          <img
            src={featuredBook.cover_url || `https://picsum.photos/300/400?random=${featuredBook.id}`}
            alt={featuredBook.title}
            className="w-48 h-64 object-cover rounded-lg shadow-2xl transition-transform hover:scale-105"
          />
        </Link>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Горячее предложение</h2>
        </div>
        <h3 className="text-3xl font-bold mb-2">{featuredBook.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">от {featuredBook.author}</p>
        <p className="text-gray-700 dark:text-gray-300 line-clamp-2 mb-6">{featuredBook.description}</p>
        <div className="flex items-center gap-4">
          <Button size="lg" onClick={() => onAddToCart(featuredBook)} className="kasbook-gradient text-white">
            <ShoppingCart className="w-5 h-5 mr-2" />
            {featuredBook.price_kas} KAS
          </Button>
          <Button size="lg" variant="outline" onClick={() => onAddToWishlist(featuredBook)}>
            <Heart className="w-5 h-5 mr-2" />В желаемое
          </Button>
        </div>
      </div>
    </div>
  );
}