import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Book, Purchase, ResaleListing } from '@/api/entities';

const MIN_PRICE = 1;

const formatKas = (value) => Number(value || 0).toFixed(2);

export default function ListForResaleModal({ isOpen, onClose, user, onListingCreated }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [price, setPrice] = useState('');

  const selectedPurchase = useMemo(
    () => purchases.find((purchase) => purchase.id === selectedPurchaseId),
    [purchases, selectedPurchaseId]
  );

  useEffect(() => {
    if (!isOpen || !user?.email) {
      return;
    }

    const loadPurchases = async () => {
      setIsLoading(true);

      try {
        const [userPurchases, existingListings] = await Promise.all([
          Purchase.filter({ buyer_email: user.email }),
          ResaleListing.filter({ seller_email: user.email, status: 'active' })
        ]);

        const listedIds = new Set(existingListings.map((listing) => listing.original_purchase_id));

        const enrichedPurchases = await Promise.all(
          userPurchases
            .filter((purchase) => purchase.purchase_type !== 'resale' && !listedIds.has(purchase.id))
            .map(async (purchase) => {
              try {
                const book = await Book.get(purchase.book_id);
                return { ...purchase, book };
              } catch (error) {
                console.error('Ошибка загрузки данных книги для перепродажи', error);
                return null;
              }
            })
        );

        setPurchases(enrichedPurchases.filter(Boolean));
      } catch (error) {
        console.error('Не удалось загрузить покупки пользователя для перепродажи', error);
        toast.error('Не удалось загрузить ваши покупки для перепродажи');
      } finally {
        setIsLoading(false);
      }
    };

    loadPurchases();
  }, [isOpen, user?.email]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPurchaseId(null);
      setPrice('');
    }
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedPurchase) {
      toast.error('Выберите книгу для перепродажи');
      return;
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice) || numericPrice < MIN_PRICE) {
      toast.error(`Минимальная цена для перепродажи — ${MIN_PRICE} KAS`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { book_id: bookId, id: originalPurchaseId } = selectedPurchase;
      const nftTokenId = `nft_kas_${bookId}_${Date.now()}`;

      await ResaleListing.create({
        book_id: bookId,
        seller_email: user.email,
        status: 'active',
        price_kas: numericPrice,
        nft_token_id: nftTokenId,
        original_purchase_id: originalPurchaseId
      });

      toast.success('Объявление о перепродаже успешно создано');
      onListingCreated?.();
      onClose();
    } catch (error) {
      console.error('Ошибка при создании объявления о перепродаже', error);
      toast.error('Не удалось создать объявление. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      );
    }

    if (!purchases.length) {
      return (
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          У вас пока нет покупок, доступных для перепродажи. Купите книгу, чтобы выставить её как NFT.
        </div>
      );
    }

    return (
      <ScrollArea className="max-h-64 pr-4">
        <div className="space-y-3">
          {purchases.map((purchase) => (
            <button
              key={purchase.id}
              type="button"
              onClick={() => setSelectedPurchaseId(purchase.id)}
              className={`w-full rounded-lg border p-3 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                selectedPurchaseId === purchase.id ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium leading-snug">
                    {purchase.book?.title || `ID книги: ${purchase.book_id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {purchase.book?.author ? `Автор: ${purchase.book.author}` : 'Автор неизвестен'}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Куплено: {new Date(purchase.created_date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <Badge variant="secondary">#{purchase.book_id}</Badge>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Выставить книгу на перепродажу</DialogTitle>
          <DialogDescription>
            Выберите купленную книгу, задайте цену в KAS и опубликуйте объявление на рынке перепродаж.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Купленные книги</Label>
              {renderContent()}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Цена продажи (KAS)</Label>
              <Input
                id="price"
                type="number"
                min={MIN_PRICE}
                step="0.01"
                placeholder="Например, 15"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                disabled={isSubmitting || !purchases.length}
              />
              <p className="text-xs text-muted-foreground">
                Минимальная цена: {formatKas(MIN_PRICE)} KAS. Комиссия платформы: 3%, роялти автору: 5%.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedPurchase}>
              {isSubmitting ? 'Публикация...' : 'Опубликовать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
