import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreditCard, Wallet, ArrowRight, AlertCircle } from 'lucide-react';
import { useWallet } from '../web3/WalletConnect';
import { getCoinGeckoPrice } from '../api/CoinGeckoAPI';

// NOWPayments API Mock
const nowPaymentsAPI = {
  async createPayment(amount, currency, orderId, description) {
    // Симуляция создания платежа через NOWPayments
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const paymentId = 'np_' + Math.random().toString(36).substring(2, 15);
    const fee = amount * 0.03; // 3% комиссия
    
    return {
      payment_id: paymentId,
      payment_status: 'waiting',
      pay_address: 'kaspa:qp5x8kl2m9y3n4o7r2t6w8e1u3v5z7a9i0b2c4e6g8h',
      price_amount: amount,
      price_currency: currency,
      pay_amount: amount + fee,
      actually_paid: 0,
      pay_currency: 'KAS',
      order_id: orderId,
      order_description: description,
      payment_url: `https://nowpayments.io/payment/${paymentId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async getPaymentStatus(paymentId) {
    // Симуляция проверки статуса платежа
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statuses = ['waiting', 'confirming', 'confirmed', 'sending', 'finished'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      payment_id: paymentId,
      payment_status: randomStatus,
      pay_address: 'kaspa:qp5x8kl2m9y3n4o7r2t6w8e1u3v5z7a9i0b2c4e6g8h',
      price_amount: 50,
      actually_paid: randomStatus === 'finished' ? 51.5 : 0,
      outcome_amount: randomStatus === 'finished' ? 50 : 0,
      updated_at: new Date().toISOString()
    };
  },

  async withdraw(amount, address, currency = 'KAS') {
    // Симуляция вывода средств
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const withdrawId = 'wd_' + Math.random().toString(36).substring(2, 15);
    const fee = Math.max(amount * 0.03, 1); // Минимум 1 KAS комиссии
    
    return {
      withdraw_id: withdrawId,
      status: 'sending',
      amount: amount - fee,
      fee: fee,
      currency: currency,
      address: address,
      txid: 'kas_' + Math.random().toString(36).substring(2, 20),
      created_at: new Date().toISOString()
    };
  }
};

export default function PaymentModal({ isOpen, onClose, book, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [kasPrice, setKasPrice] = useState(null);
  const [payment, setPayment] = useState(null);
  const { isConnected, sendPayment } = useWallet();
  const { register, handleSubmit, watch } = useForm();

  const bookPrice = book?.price_kas || 0;
  const fee = bookPrice * 0.03;
  const totalAmount = bookPrice + fee;

  useEffect(() => {
    if (isOpen) {
      loadKasPrice();
    }
  }, [isOpen]);

  const loadKasPrice = async () => {
    try {
      const price = await getCoinGeckoPrice('kaspa');
      setKasPrice(price);
    } catch (error) {
      console.error('Error loading KAS price:', error);
    }
  };

  const handleWalletPayment = async () => {
    if (!isConnected) {
      toast.error('Сначала подключите кошелёк');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await sendPayment(
        'kaspa:qbook_treasury_address', // Адрес казначейства KASBOOK
        totalAmount,
        `Payment for book: ${book.title}`
      );

      toast.success('Платёж успешно отправлен!');
      onPaymentSuccess?.(result);
      onClose();
    } catch (error) {
      toast.error('Ошибка при отправке платежа');
    }
    setIsProcessing(false);
  };

  const handleCardPayment = async (data) => {
    setIsProcessing(true);
    try {
      const paymentResult = await nowPaymentsAPI.createPayment(
        bookPrice,
        'USD',
        `book_${book.id}_${Date.now()}`,
        `Purchase of "${book.title}" by ${book.author}`
      );

      setPayment(paymentResult);
      toast.success('Платёж создан! Переводите средства на указанный адрес.');
    } catch (error) {
      toast.error('Ошибка создания платежа');
    }
    setIsProcessing(false);
  };

  const handleWithdraw = async (data) => {
    setIsProcessing(true);
    try {
      const result = await nowPaymentsAPI.withdraw(
        parseFloat(data.amount),
        data.address,
        'KAS'
      );

      toast.success(`Вывод инициирован! ID: ${result.withdraw_id}`);
    } catch (error) {
      toast.error('Ошибка при выводе средств');
    }
    setIsProcessing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Покупка книги
          </DialogTitle>
        </DialogHeader>

        {book && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-12 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm line-clamp-1">{book.title}</h3>
                  <p className="text-xs text-muted-foreground">{book.author}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{bookPrice} KAS</Badge>
                    {kasPrice && (
                      <Badge variant="secondary">
                        ≈${(bookPrice * kasPrice).toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex justify-between text-sm mb-1">
                  <span>Цена книги:</span>
                  <span>{bookPrice} KAS</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Комиссия (3%):</span>
                  <span>{fee.toFixed(4)} KAS</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Итого:</span>
                  <span>{totalAmount.toFixed(4)} KAS</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div>
            <Label>Способ оплаты</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wallet">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    KAS Кошелёк
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Банковская карта
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'wallet' && (
            <div className="space-y-3">
              {!isConnected && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Подключите кошелёк для продолжения
                  </span>
                </div>
              )}
              <Button 
                onClick={handleWalletPayment}
                disabled={!isConnected || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Обработка...
                  </div>
                ) : (
                  <>
                    Оплатить {totalAmount.toFixed(4)} KAS
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {paymentMethod === 'card' && (
            <form onSubmit={handleSubmit(handleCardPayment)} className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { required: true })}
                  placeholder="your@email.com"
                />
              </div>
              <Button type="submit" disabled={isProcessing} className="w-full">
                {isProcessing ? 'Создание платежа...' : 'Создать платёж'}
              </Button>
            </form>
          )}

          {payment && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Платёж создан</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Переведите {payment.pay_amount.toFixed(4)} KAS на адрес:
                </p>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs break-all">
                  {payment.pay_address}
                </div>
                <Badge className="mt-2" variant="secondary">
                  ID: {payment.payment_id}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}