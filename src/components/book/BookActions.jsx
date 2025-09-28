import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, BookOpen, Heart } from 'lucide-react';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/Auth';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BookActions({ book }) {
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const handleAddToCart = () => {
    addToCart(book);
  };

  const hasAccess = isAuthenticated && user?.purchase_history?.includes(book.id);

  return (
    <div className="space-y-4">
      {hasAccess ? (
        <div className="space-y-3">
          <Link to={createPageUrl(`Reader?bookId=${book.id}`)}>
            <Button size="lg" className="w-full kasbook-gradient">
              <BookOpen className="w-5 h-5 mr-2" />
              Читать книгу
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <Button 
            size="lg" 
            onClick={handleAddToCart}
            className="w-full kasbook-gradient"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            В корзину за {book.price_kas} KAS
          </Button>
          
          <Link to={createPageUrl(`Reader?bookId=${book.id}&preview=true`)}>
            <Button size="lg" variant="outline" className="w-full">
              <BookOpen className="w-5 h-5 mr-2" />
              Читать тестовый фрагмент (20%)
            </Button>
          </Link>
        </div>
      )}
      
      <Button variant="outline" size="lg" className="w-full">
        <Heart className="w-5 h-5 mr-2" />
        В избранное
      </Button>
    </div>
  );
}