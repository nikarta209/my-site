import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  ShoppingCart, 
  Zap,
  Award,
  Eye,
  RefreshCw
} from 'lucide-react';
import { ResaleListing } from '@/api/entities';
import { Book } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { User } from '@/api/entities';
import { toast } from 'sonner';

import ResaleGrid from '../components/resale/ResaleGrid';
import ResaleFilters from '../components/resale/ResaleFilters';
import ListForResaleModal from '../components/resale/ListForResaleModal';

// Mock NFT minting
const mockNFTMint = {
  async mintNFT(bookId, ownerEmail, originalPurchaseId) {
    // Симуляция процесса mint NFT
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const tokenId = `nft_kas_${bookId}_${Date.now()}`;
    const contractAddress = 'kaspa:qz8x9y2w3e4r5t6y7u8i9o0p1q2w3e4r5t6y7u8i9o0p';
    
    return {
      success: true,
      tokenId,
      contractAddress,
      metadata: {
        name: `KASBOOK #${tokenId}`,
        description: 'Digital book ownership NFT on Kaspa blockchain',
        attributes: {
          bookId,
          originalOwner: ownerEmail,
          mintDate: new Date().toISOString()
        }
      }
    };
  }
};

// Расчёт роялти (5%)
const calculateRoyalties = (salePrice) => {
  const ROYALTY_PERCENTAGE = 5; // 5%
  const royaltyAmount = (salePrice * ROYALTY_PERCENTAGE) / 100;
  const sellerAmount = salePrice - royaltyAmount;
  
  return {
    totalPrice: salePrice,
    royaltyAmount,
    sellerAmount,
    royaltyPercentage: ROYALTY_PERCENTAGE
  };
};

export default function ResaleMarket() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [books, setBooks] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showListModal, setShowListModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    genre: 'all',
    priceMin: '',
    priceMax: '',
    sortBy: 'newest'
  });

  useEffect(() => {
    loadResaleData();
  }, []);

  const loadResaleData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Загружаем активные объявления о перепродаже
      const activeListings = await ResaleListing.filter({
        status: 'active'
      }, '-created_date', 100);

      setListings(activeListings);

      // Загружаем информацию о книгах
      const bookIds = [...new Set(activeListings.map(listing => listing.book_id))];
      const bookData = {};
      
      await Promise.all(
        bookIds.map(async (bookId) => {
          try {
            const book = await Book.get(bookId);
            if (book) bookData[bookId] = book;
          } catch (error) {
            console.error(`Error loading book ${bookId}:`, error);
          }
        })
      );

      setBooks(bookData);
    } catch (error) {
      console.error('Error loading resale data:', error);
      toast.error('Ошибка загрузки данных рынка');
    }
    setIsLoading(false);
  };

  const handleBuyResale = async (listing) => {
    if (!user) {
      toast.error('Войдите в систему для покупки');
      return;
    }

    if (user.balance_kas < listing.price_kas) {
      toast.error('Недостаточно средств на балансе');
      return;
    }

    try {
      toast.info('Обработка покупки...');

      // Расчёт роялти
      const royalties = calculateRoyalties(listing.price_kas);

      // Симуляция смарт-контракта для передачи NFT
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Создаём запись о покупке
      await Purchase.create({
        book_id: listing.book_id,
        buyer_email: user.email,
        seller_email: listing.seller_email,
        purchase_type: 'resale',
        price_kas: listing.price_kas,
        transaction_hash: 'resale_tx_' + Date.now(),
        royalty_amount: royalties.royaltyAmount,
        seller_payout: royalties.sellerAmount
      });

      // Обновляем статус объявления
      await ResaleListing.update(listing.id, { status: 'sold' });

      // Обновляем баланс пользователя (mock)
      await User.updateMyUserData({
        balance_kas: user.balance_kas - listing.price_kas
      });

      toast.success(`Книга успешно куплена! Роялти автору: ${royalties.royaltyAmount.toFixed(2)} KAS`);
      loadResaleData();

    } catch (error) {
      console.error('Error buying resale:', error);
      toast.error('Ошибка при покупке');
    }
  };

  const filteredListings = listings.filter(listing => {
    const book = books[listing.book_id];
    if (!book) return false;

    // Поиск
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (!book.title.toLowerCase().includes(searchTerm) &&
          !book.author.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }

    // Жанр
    if (filters.genre !== 'all' && book.genre !== filters.genre) {
      return false;
    }

    // Цена
    if (filters.priceMin && listing.price_kas < parseFloat(filters.priceMin)) {
      return false;
    }
    if (filters.priceMax && listing.price_kas > parseFloat(filters.priceMax)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'price_low':
        return a.price_kas - b.price_kas;
      case 'price_high':
        return b.price_kas - a.price_kas;
      case 'oldest':
        return new Date(a.created_date) - new Date(b.created_date);
      default: // newest
        return new Date(b.created_date) - new Date(a.created_date);
    }
  });

  const floorPrice = listings.length > 0 
    ? Math.min(...listings.map(l => l.price_kas)) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Рынок перепродаж NFT
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Покупайте и продавайте цифровые книги как NFT токены
              </p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Floor: {floorPrice.toFixed(2)} KAS
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Роялти: 5%
                </Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={loadResaleData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
              {user && (
                <Button onClick={() => setShowListModal(true)} className="bg-green-600 hover:bg-green-700">
                  <Zap className="w-4 h-4 mr-2" />
                  Выставить на продажу
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <ResaleFilters 
              filters={filters}
              onFilterChange={setFilters}
            />
          </div>

          {/* Listings Grid */}
          <div className="flex-1">
            <ResaleGrid
              listings={filteredListings}
              books={books}
              isLoading={isLoading}
              onBuyResale={handleBuyResale}
              currentUser={user}
            />
          </div>
        </div>
      </div>

      {/* List for Resale Modal */}
      {showListModal && (
        <ListForResaleModal
          isOpen={showListModal}
          onClose={() => setShowListModal(false)}
          user={user}
          onListingCreated={loadResaleData}
        />
      )}
    </div>
  );
}