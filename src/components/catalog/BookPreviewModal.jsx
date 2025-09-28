import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useTranslation } from '../i18n/SimpleI18n';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShoppingCart } from 'lucide-react';

export default function BookPreviewModal({ isOpen, onOpenChange, book, onAddToCart }) {
  const { t } = useTranslation();

  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="flex">
          <div className="w-1/3 hidden sm:block">
            <img src={book.cover_url || `https://picsum.photos/200/300?random=${book.id}`} alt={book.title} className="w-full h-full object-cover rounded-l-lg" />
          </div>
          <div className="flex-1 p-6 flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl mb-2">{book.title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">by {book.author}</DialogDescription>
            </DialogHeader>
            <div className="my-4 flex-grow overflow-y-auto max-h-[200px] pr-2">
              <h4 className="font-semibold mb-2">Предпросмотр</h4>
              <p className="text-sm text-foreground/80">
                {book.description || "Описание для этой книги пока недоступно."}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                *Полный предпросмотр глав будет доступен в следующих обновлениях.
              </p>
            </div>
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
              <span className="text-2xl font-bold kas-price">{book.price_kas || 0} KAS</span>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to={createPageUrl(`BookDetails?id=${book.id}`)}>Подробнее</Link>
                </Button>
                <Button className="kasbook-gradient-btn" onClick={() => onAddToCart(book)}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {t('cart.addToCart', 'В корзину')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}