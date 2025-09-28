import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Zap, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function ResaleModal({ book, isOpen, onClose }) {
  const [resalePrice, setResalePrice] = useState('');
  const [isListing, setIsListing] = useState(false);

  const originalPrice = book?.price_kas || 0;
  const suggestedPrice = Math.floor(originalPrice * 0.8); // 20% discount suggestion
  const authorRoyalty = resalePrice ? (parseFloat(resalePrice) * 0.05).toFixed(2) : '0';
  const sellerEarnings = resalePrice ? (parseFloat(resalePrice) * 0.95).toFixed(2) : '0';

  const handleListForResale = async () => {
    if (!resalePrice || parseFloat(resalePrice) <= 0) {
      toast.error('Укажите корректную цену');
      return;
    }

    if (parseFloat(resalePrice) > originalPrice) {
      toast.warning('Цена выше оригинальной', {
        description: 'Это может снизить интерес покупателей'
      });
    }

    setIsListing(true);

    try {
      toast.info('Размещение на маркетплейсе...', {
        description: 'Создание NFT листинга в блокчейне KAS'
      });

      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate mock NFT ID
      const nftId = 'KAS-NFT-' + Math.random().toString(36).substring(2, 15);

      toast.success('Книга выставлена на продажу!', {
        description: `NFT токен ${nftId} создан на маркетплейсе`
      });

      // Save to local storage (mock)
      const listings = JSON.parse(localStorage.getItem('user-resale-listings') || '[]');
      listings.push({
        id: Date.now().toString(),
        bookId: book.id,
        price: parseFloat(resalePrice),
        nftId,
        timestamp: new Date().toISOString(),
        status: 'active'
      });
      localStorage.setItem('user-resale-listings', JSON.stringify(listings));

      onClose();
      setResalePrice('');

    } catch (error) {
      toast.error('Ошибка размещения', {
        description: 'Попробуйте еще раз'
      });
    } finally {
      setIsListing(false);
    }
  };

  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Продать на маркетплейсе
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Book Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <img 
                  src={book.cover_url} 
                  alt={book.title}
                  className="w-16 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium line-clamp-2">{book.title}</h4>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  <Badge variant="outline" className="mt-1">
                    Оригинал: {originalPrice} KAS
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Setting */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="resale-price">Цена перепродажи (KAS)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="resale-price"
                  type="number"
                  min="1"
                  step="0.1"
                  placeholder={suggestedPrice.toString()}
                  value={resalePrice}
                  onChange={(e) => setResalePrice(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Рекомендуемая цена: {suggestedPrice} KAS
              </p>
            </div>

            {/* Breakdown */}
            {resalePrice && (
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="w-4 h-4" />
                    Распределение доходов
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Цена продажи:</span>
                      <span className="font-medium">{resalePrice} KAS</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Роялти автору (5%):</span>
                      <span className="font-medium">-{authorRoyalty} KAS</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium text-green-600">
                      <span>Ваш доход:</span>
                      <span>{sellerEarnings} KAS</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* NFT Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">О NFT токенах</p>
                <p>Ваша книга будет конвертирована в NFT токен на блокчейне KAS. Это гарантирует подлинность и позволяет безопасно перепродавать цифровой контент.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isListing}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleListForResale}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={isListing || !resalePrice}
            >
              {isListing ? 'Размещение...' : 'Выставить на продажу'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}