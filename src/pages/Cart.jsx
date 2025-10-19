
import React from 'react';
import { useCart } from '../components/cart/CartContext';
import { useAuth } from '../components/auth/Auth';
import { User } from '@/api/entities';
import { Purchase } from '@/api/entities';
import { ReferralTransaction } from '@/api/entities'; // Added import for ReferralTransaction
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  Wallet, 
  ShoppingBag,
  BookOpen,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from '../components/i18n/SimpleI18n';
import { toast } from 'sonner';
import { useExchangeRate } from '../components/utils/ExchangeRateContext';
import CryptoPaymentModal from '../components/payment/CryptoPaymentModal';
import { getCoverOrPlaceholder } from '@/lib/books/coverImages';

// SVG иллюстрация для пустой корзины
const EmptyCartIllustration = () => (
  <svg 
    width="200" 
    height="160" 
    viewBox="0 0 200 160" 
    fill="none" 
    className="mx-auto mb-6"
  >
    <defs>
      <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6A4C93" />
        <stop offset="100%" stopColor="#FF6B00" />
      </linearGradient>
    </defs>
    
    {/* Cart Body */}
    <rect x="40" y="60" width="120" height="80" rx="8" fill="url(#cartGradient)" opacity="0.1" />
    <rect x="40" y="60" width="120" height="80" rx="8" stroke="url(#cartGradient)" strokeWidth="2" fill="none" />
    
    {/* Cart Handle */}
    <path d="M60 60 L60 45 Q60 35 70 35 L130 35 Q140 35 140 45 L140 60" stroke="url(#cartGradient)" strokeWidth="2" fill="none" />
    
    {/* Wheels */}
    <circle cx="70" cy="155" r="8" fill="url(#cartGradient)" opacity="0.3" />
    <circle cx="130" cy="155" r="8" fill="url(#cartGradient)" opacity="0.3" />
    
    {/* Books floating around */}
    <rect x="20" y="20" width="12" height="16" rx="2" fill="#6A4C93" opacity="0.4" />
    <rect x="170" y="30" width="12" height="16" rx="2" fill="#FF6B00" opacity="0.4" />
    <rect x="15" y="100" width="12" height="16" rx="2" fill="#6A4C93" opacity="0.3" />
    
    {/* Dotted lines for movement */}
    <path d="M35 28 Q50 20 65 30" stroke="#6A4C93" strokeWidth="1" strokeDasharray="2,2" opacity="0.3" />
    <path d="M170 38 Q155 45 140 35" stroke="#FF6B00" strokeWidth="1" strokeDasharray="2,2" opacity="0.3" />
  </svg>
);

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart, cartTotal } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { kasRate } = useExchangeRate();
  const { t } = useTranslation();

  const getBookCoverUrl = React.useCallback((item) => {
    if (!item) return '/api/placeholder/80/112';

    const directCover =
      item.cover_image_url ||
      item.coverImageUrl ||
      item.cover;

    if (directCover) return directCover;

    return getCoverOrPlaceholder(item, '/api/placeholder/80/112');
  }, []);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const userBalance = user?.balance_kas || 0;
  const hasEnoughBalance = userBalance >= cartTotal;

  // Анимационные варианты
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { duration: 0.2 }
    }
  };

  // Обновленная оплата с баланса с реферальной системой
  const handleBalancePayment = async () => {
    if (!user || !hasEnoughBalance) {
      toast.error('Недостаточно средств на балансе');
      return;
    }

    setIsProcessing(true);
    const payoutsByAuthor = {};
    const referralPayouts = {}; // To aggregate commissions for referrers

    try {
      // Создаем записи о покупках и рассчитываем все комиссии
      for (const item of cartItems) {
        // Новая система комиссий с учетом рефералов
        let authorRoyaltyRate = item.is_public_domain ? 0.10 : 0.80; // Base author royalty rate
        let platformFeeRate = 0.15; // Base platform fee rate
        let referralCommissionAmount = 0; // Amount paid as referral commission (5%)
        let authorReferralBonusAmount = 0; // Amount paid as author's own referred sale bonus (6%)

        // Проверяем есть ли реферер у покупателя
        if (user.referred_by) {
          referralCommissionAmount = item.price_kas * 0.05; // 5% referral commission
          platformFeeRate -= 0.05; // Reduce platform fee by 5% (new platform rate is 0.10)

          // Если автор книги - реферер покупателя
          if (item.author_email === user.referred_by) {
            authorReferralBonusAmount = item.price_kas * 0.06; // 6% bonus for author selling their own book
          } else {
            // Обычная реферальная комиссия 5% идет рефереру (не автору книги)
            referralPayouts[user.referred_by] = (referralPayouts[user.referred_by] || 0) + referralCommissionAmount;
          }
        }

        // Calculate final author payout and platform fee
        const authorPayout = item.price_kas * authorRoyaltyRate + authorReferralBonusAmount;
        const platformFee = item.price_kas * platformFeeRate;
        
        // Создаем запись о покупке
        const purchase = await Purchase.create({
          book_id: item.id,
          buyer_email: user.email,
          seller_email: item.author_email || 'system@kasbook.com',
          price_kas: item.price_kas,
          purchase_type: 'primary',
          author_payout_kas: authorPayout,
          platform_fee_kas: platformFee,
          referral_commission_kas: referralCommissionAmount, // 5% of the price
          is_qualified_sale: !item.is_public_domain,
          referrer_email: user.referred_by,
          author_referral_bonus_kas: authorReferralBonusAmount, // 6% if applicable
        });

        // Создаем реферальную транзакцию если есть реферер и одна из комиссий была применена
        if (user.referred_by && (referralCommissionAmount > 0 || authorReferralBonusAmount > 0)) {
          await ReferralTransaction.create({
            referrer_email: user.referred_by,
            referee_email: user.email,
            purchase_id: purchase.id,
            book_id: item.id,
            book_author_email: item.author_email,
            purchase_amount_kas: item.price_kas,
            referrer_commission_kas: referralCommissionAmount, // The 5% recorded for transaction history
            commission_rate: item.author_email === user.referred_by ? 6 : 5, // Commission rate in percentage
            transaction_type: item.author_email === user.referred_by ? 'author_own_book' : 'regular_referral',
            processed: false // Assuming this needs to be processed later, or refers to manual payouts
          });
        }

        // Агрегируем выплаты авторам
        if (item.author_email) {
          payoutsByAuthor[item.author_email] = (payoutsByAuthor[item.author_email] || 0) + authorPayout;
        }
      }

      // Обновляем баланс покупателя
      await User.updateMyUserData({
        balance_kas: userBalance - cartTotal
      });

      // Начисляем средства авторам
      for (const authorEmail in payoutsByAuthor) {
        try {
          const authors = await User.filter({ email: authorEmail });
          if (authors.length > 0) {
            const author = authors[0];
            const newAuthorBalance = (author.balance_kas || 0) + payoutsByAuthor[authorEmail];
            await User.update(author.id, { balance_kas: newAuthorBalance });
          }
        } catch (authorError) {
          console.error(`Ошибка начисления автору ${authorEmail}:`, authorError);
        }
      }

      // Начисляем реферальные комиссии
      for (const referrerEmail in referralPayouts) {
        try {
          const referrers = await User.filter({ email: referrerEmail });
          if (referrers.length > 0) {
            const referrer = referrers[0];
            const newReferrerBalance = (referrer.balance_kas || 0) + referralPayouts[referrerEmail];
            // Assuming `referral_earnings_kas` field exists on the User model
            const newEarnings = (referrer.referral_earnings_kas || 0) + referralPayouts[referrerEmail];
            await User.update(referrer.id, { 
              balance_kas: newReferrerBalance,
              referral_earnings_kas: newEarnings
            });
          }
        } catch (referrerError) {
          console.error(`Ошибка начисления реферу ${referrerEmail}:`, referrerError);
        }
      }

      toast.success('Оплата прошла успешно! Книги добавлены в библиотеку.');
      clearCart();
      
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Ошибка при оплате. Попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoPayment = () => {
    setPaymentMethod('crypto');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (orderId) => {
    console.log(`Payment success for order ${orderId}`);
    clearCart();
    setIsPaymentModalOpen(false);
    setPaymentMethod(null);
  };

  const usdTotal = (cartTotal * kasRate).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <ShoppingCart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">
            {t('cart.title', 'Корзина')} 
            <span className="ml-2 text-lg font-normal text-muted-foreground">
              ({cartItems.length})
            </span>
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {cartItems.length === 0 ? (
            <motion.div
              key="empty"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="text-center py-20"
            >
              <EmptyCartIllustration />
              
              <motion.div variants={itemVariants}>
                <h2 className="text-2xl font-semibold mb-3 text-foreground">
                  {t('cart.emptyTitle', 'Ваша корзина пуста')}
                </h2>
                <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                  {t('cart.emptyDescription', 'Похоже, вы еще не добавили ни одной книги. Откройте для себя мир увлекательных историй!')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    asChild 
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white min-h-[48px] px-8"
                  >
                    <Link to={createPageUrl('Catalog')}>
                      <BookOpen className="w-5 h-5 mr-2" />
                      Перейти в каталог
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    asChild
                    className="min-h-[48px] px-8"
                  >
                    <Link to={createPageUrl('Home')}>
                      Главная страница
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="filled"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Список товаров */}
              <div className="lg:col-span-2">
                <motion.div variants={itemVariants} className="space-y-4">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={itemVariants}
                        exit="exit"
                        layout
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20">
                          <CardContent className="p-0">
                            <div className="flex items-center">
                              <div className="w-20 h-28 bg-muted flex-shrink-0 relative overflow-hidden">
                                <img
                                  src={getBookCoverUrl(item)}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex-1 p-4">
                                <h3 className="font-semibold text-lg mb-1 text-foreground line-clamp-2">
                                  {item.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {item.author}
                                </p>
                                <div className="flex items-center gap-2 mb-3">
                                  {item.genre && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.genre}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p 
                                      className="text-xl font-bold"
                                      style={{ color: '#FF6B00' }}
                                    >
                                      {item.price_kas} KAS
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      ≈ ${(item.price_kas * kasRate).toFixed(2)}
                                    </p>
                                  </div>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => removeFromCart(item.id)}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 min-w-[48px] min-h-[48px]"
                                      aria-label={`Удалить ${item.title} из корзины`}
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </Button>
                                  </motion.div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Итоговая информация */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <Card className="sticky top-4 border-2 border-primary/10">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Сумма заказа
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Книги ({cartItems.length})</span>
                        <span className="font-medium">{cartTotal.toFixed(2)} KAS</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>USD эквивалент</span>
                        <span>≈ ${usdTotal}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Итого</span>
                      <div className="text-right">
                        <div style={{ color: '#FF6B00' }}>{cartTotal.toFixed(2)} KAS</div>
                        <div className="text-sm text-muted-foreground font-normal">≈ ${usdTotal}</div>
                      </div>
                    </div>

                    {/* Информация о балансе пользователя */}
                    {isAuthenticated && user && (
                      <>
                        <Separator />
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <Wallet className="w-4 h-4" />
                              Ваш баланс
                            </span>
                            <span className="font-bold text-primary">{userBalance.toFixed(2)} KAS</span>
                          </div>
                          {!hasEnoughBalance && (
                            <p className="text-xs text-muted-foreground">
                              Недостаточно средств для оплаты с баланса
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Кнопки оплаты */}
                    <div className="space-y-3">
                      {/* Оплата с баланса */}
                      {isAuthenticated && user && hasEnoughBalance && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white min-h-[48px]"
                            onClick={handleBalancePayment}
                            disabled={isProcessing}
                          >
                            <Wallet className="w-5 h-5 mr-2" />
                            {isProcessing ? 'Обработка...' : 'Оплатить с баланса'}
                          </Button>
                        </motion.div>
                      )}
                      
                      {/* Криптовалютная оплата */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white min-h-[48px]"
                          onClick={handleCryptoPayment}
                          disabled={isProcessing}
                        >
                          <CreditCard className="w-5 h-5 mr-2" />
                          Оплатить криптовалютой
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </motion.div>
                    </div>

                    <Separator />
                    
                    <Button 
                      variant="outline" 
                      className="w-full min-h-[48px]" 
                      onClick={clearCart}
                      disabled={isProcessing}
                    >
                      Очистить корзину
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Модальное окно криптовалютной оплаты */}
        <CryptoPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentMethod(null);
          }}
          books={cartItems}
          totalAmount={usdTotal}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
}
