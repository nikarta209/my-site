import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Zap, Info, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Book, Purchase, ResaleListing } from '@/api/entities';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

const mockNFTMint = {
  async mintNFT(bookId, ownerEmail, originalPurchaseId) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const tokenId = `kas-nft-${bookId}-${Date.now()}`;

    return {
      success: true,
      tokenId,
      metadata: {
        owner: ownerEmail,
        originalPurchaseId,
        mintedAt: new Date().toISOString()
      }
    };
  }
};

const calculateRoyalties = (price) => {
  const royaltyPercentage = 5;
  const royaltyAmount = (price * royaltyPercentage) / 100;
  const sellerAmount = price - royaltyAmount;

  return {
    royaltyAmount,
    sellerAmount,
    royaltyPercentage
  };
};

export default function ListForResaleModal({ isOpen, onClose, user, onListingCreated }) {
  const [eligibleItems, setEligibleItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('');
  const [priceKas, setPriceKas] = useState('');

  const handleClose = useCallback(() => {
    setPriceKas('');
    setSelectedPurchaseId('');
    onClose?.();
  }, [onClose]);

  const loadEligiblePurchases = useCallback(async () => {
    if (!user?.email) {
      setEligibleItems([]);
      return;
    }

    setIsLoading(true);

    try {
      const [purchases, activeListings] = await Promise.all([
        Purchase.filter({ buyer_email: user.email }, '-created_date', 100),
        ResaleListing.filter({ seller_email: user.email, status: 'active' }, '-created_date', 100)
      ]);

      const activePurchaseIds = new Set(
        (activeListings || []).map(listing => listing.original_purchase_id)
      );

      const filteredPurchases = (purchases || []).filter(purchase =>
        !activePurchaseIds.has(purchase.id)
      );

      if (filteredPurchases.length === 0) {
        setEligibleItems([]);
        setSelectedPurchaseId('');
        return;
      }

      const uniqueBookIds = [...new Set(filteredPurchases.map(purchase => purchase.book_id))];
      const booksMap = {};

      await Promise.all(
        uniqueBookIds.map(async (bookId) => {
          try {
            const book = await Book.get(bookId);
            if (book) {
              booksMap[bookId] = book;
            }
          } catch (error) {
            console.error(`Error loading book ${bookId}:`, error);
          }
        })
      );

      const combinedItems = filteredPurchases
        .map(purchase => ({
          purchase,
          book: booksMap[purchase.book_id]
        }))
        .filter(item => Boolean(item.book));

      setEligibleItems(combinedItems);

      if (combinedItems.length > 0) {
        setSelectedPurchaseId(prev =>
          prev && combinedItems.some(item => item.purchase.id === prev)
            ? prev
            : combinedItems[0].purchase.id
        );
      } else {
        setSelectedPurchaseId('');
      }
    } catch (error) {
      console.error('Error loading eligible purchases:', error);
      toast.error('Не удалось загрузить ваши покупки для перепродажи');
      setEligibleItems([]);
      setSelectedPurchaseId('');
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (isOpen) {
      loadEligiblePurchases();
    }
  }, [isOpen, loadEligiblePurchases]);

  useEffect(() => {
    if (!selectedPurchaseId && eligibleItems.length > 0) {
      setSelectedPurchaseId(eligibleItems[0].purchase.id);
    }
  }, [eligibleItems, selectedPurchaseId]);

  const selectedItem = useMemo(
    () => eligibleItems.find(item => item.purchase.id === selectedPurchaseId),
    [eligibleItems, selectedPurchaseId]
  );

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    if (!priceKas) {
      const suggestedPrice = selectedItem.book.price_kas
        ? (parseFloat(selectedItem.book.price_kas) * 0.8).toFixed(2)
        : '';
      setPriceKas(suggestedPrice);
    }
  }, [selectedItem, priceKas]);

  const handleCreateListing = async () => {
    if (!selectedItem) {
      toast.error('Выберите книгу для перепродажи');
      return;
    }

    const parsedPrice = parseFloat(priceKas);

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Укажите корректную цену в KAS');
      return;
    }

    if (!user?.email) {
      toast.error('Требуется авторизация');
      return;
    }

    setIsSubmitting(true);

    try {
      toast.info('Создание NFT токена для вашей книги...');
      const mintResult = await mockNFTMint.mintNFT(
        selectedItem.book.id,
        user.email,
        selectedItem.purchase.id
      );

      if (!mintResult?.success) {
        throw new Error('Не удалось создать NFT токен');
      }

      await ResaleListing.create({
        book_id: selectedItem.book.id,
        seller_email: user.email,
        price_kas: parsedPrice,
        status: 'active',
        original_purchase_id: selectedItem.purchase.id,
        nft_token_id: mintResult.tokenId
      });

      toast.success('Книга успешно выставлена на продажу как NFT', {
        description: `Токен ${mintResult.tokenId.slice(0, 10)}... создан`
      });

      setPriceKas('');
      setSelectedPurchaseId('');
      await loadEligiblePurchases();
      onListingCreated?.();
      handleClose();
    } catch (error) {
      console.error('Error creating resale listing:', error);
      toast.error('Ошибка при создании объявления', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const royalties = useMemo(() => {
    const value = parseFloat(priceKas);
    if (Number.isNaN(value) || value <= 0) {
      return null;
    }
    return calculateRoyalties(value);
  }, [priceKas]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Выставить книгу на перепродажу
          </DialogTitle>
          <DialogDescription>
            Выберите купленную книгу, укажите цену в KAS и мы создадим NFT токен для перепродажи.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            Загрузка ваших покупок...
          </div>
        ) : eligibleItems.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground space-y-3">
            <BookOpen className="w-10 h-10 mx-auto" />
            <p className="font-medium">Нет книг, доступных для перепродажи</p>
            <p className="text-sm">
              Убедитесь, что вы приобрели книгу и она не выставлена на продажу в другом объявлении.
            </p>
            <Button variant="outline" onClick={loadEligiblePurchases} disabled={isSubmitting}>
              Обновить список
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Выберите книгу</Label>
              <Select
                value={selectedPurchaseId}
                onValueChange={(value) => {
                  setSelectedPurchaseId(value);
                  setPriceKas('');
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите книгу" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleItems.map(item => (
                    <SelectItem key={item.purchase.id} value={item.purchase.id}>
                      {item.book.title} — {item.book.author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex gap-4">
                    <img
                      src={getCoverOrPlaceholder(selectedItem.book, `https://picsum.photos/seed/${selectedItem.book.id}/200/280`)}
                      alt={selectedItem.book.title}
                      className="w-24 h-32 rounded object-cover"
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="text-lg font-semibold leading-tight">
                          {selectedItem.book.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedItem.book.author}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Оригинальная цена: {selectedItem.book.price_kas} KAS</Badge>
                        <Badge variant="secondary">Жанр: {selectedItem.book.genre || '—'}</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resale-price">Цена перепродажи (KAS)</Label>
                      <Input
                        id="resale-price"
                        type="number"
                        min="0"
                        step="0.1"
                        value={priceKas}
                        onChange={(event) => setPriceKas(event.target.value)}
                        placeholder={selectedItem.book.price_kas
                          ? (parseFloat(selectedItem.book.price_kas) * 0.8).toFixed(2)
                          : 'Укажите цену'}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Рекомендуемая цена: ~{selectedItem.book.price_kas
                          ? (parseFloat(selectedItem.book.price_kas) * 0.8).toFixed(2)
                          : '—'} KAS (20% скидка от оригинала)
                      </p>
                    </div>

                    {royalties && (
                      <div className="p-3 rounded-lg bg-muted/60 space-y-2 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          <Info className="w-4 h-4" />
                          Распределение
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span>Цена продажи:</span>
                          <span className="font-semibold">{priceKas} KAS</span>
                        </div>
                        <div className="flex justify-between text-orange-600">
                          <span>Роялти автору ({royalties.royaltyPercentage}%):</span>
                          <span>-{royalties.royaltyAmount.toFixed(2)} KAS</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-green-600 font-semibold">
                          <span>Вы получите:</span>
                          <span>{royalties.sellerAmount.toFixed(2)} KAS</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-sm text-blue-800 dark:text-blue-100">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5" />
                      <div>
                        <p className="font-medium">NFT защита</p>
                        <p>
                          После подтверждения будет создан NFT токен, подтверждающий право собственности на книгу.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Отмена
              </Button>
              <Button
                onClick={handleCreateListing}
                disabled={isSubmitting || !priceKas || !selectedItem}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Выставить на продажу'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
