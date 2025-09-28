import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { nowpayments } from '@/api/functions';
import { useExchangeRate } from '../utils/ExchangeRateContext';
import { useAuth } from '../auth/Auth';
import { handleSubscriptionPayment } from '@/api/functions';
import AIPreferencesModal from '../subscription/AIPreferencesModal'; // ИСПРАВЛЕНО: Правильный путь

export default function CryptoPaymentModal({ 
  isOpen, 
  onClose, 
  books = [], 
  totalAmount, 
  onPaymentSuccess,
  productType = 'books'
}) {
  const { user, updateUser } = useAuth();
  const [paymentState, setPaymentState] = useState('initial');
  const [paymentData, setPaymentData] = useState(null);
  const [kasAmount, setKasAmount] = useState(0);
  const [statusChecking, setStatusChecking] = useState(false);
  const { kasRate, isLoading: isRateLoading } = useExchangeRate();
  const [showAIPreferences, setShowAIPreferences] = useState(false);

  useEffect(() => {
    if (isOpen && totalAmount > 0 && kasRate > 0) {
      setKasAmount(parseFloat(totalAmount) / kasRate);
    }
  }, [isOpen, totalAmount, kasRate]);

  const handleSuccessfulPayment = useCallback(async (orderId) => {
    setPaymentState('success');
    toast.success('Payment completed successfully!');

    if (productType === 'subscription' && user) {
      try {
        await handleSubscriptionPayment({ userId: user.id });
        await updateUser(); 
        toast.success("Подписка успешно активирована!");
        setTimeout(() => {
          setShowAIPreferences(true);
        }, 2000);
      } catch (error) {
        toast.error("Не удалось активировать подписку.");
        console.error("Error activating subscription:", error);
      }
    } else {
      onPaymentSuccess(orderId);
    }

    setTimeout(() => {
      onClose();
    }, 2000);
  }, [productType, user, updateUser, onPaymentSuccess, onClose]);

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentData?.payment_id) return;
    
    setStatusChecking(true);
    try {
      const { data } = await nowpayments({
        action: 'getPaymentStatus',
        payment_id: paymentData.payment_id
      });

      if (data.success) {
        const status = data.status;
        
        if (status === 'finished') {
          handleSuccessfulPayment(paymentData.order_id);
        } else if (status === 'failed' || status === 'expired') {
          setPaymentState('failed');
          toast.error('Payment failed or expired');
        }
      }
    } catch (error) {
      console.error('Status check failed:', error);
    }
    setStatusChecking(false);
  }, [paymentData, handleSuccessfulPayment]);

  useEffect(() => {
    let interval;
    if (paymentState === 'waiting' && paymentData?.payment_id) {
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentState, paymentData, checkPaymentStatus]);

  const createPayment = async () => {
    setPaymentState('creating');
    try {
      const payload = {
        action: 'createPayment',
        totalAmount: parseFloat(totalAmount),
        totalAmountKas: kasAmount,
        currency: 'USD',
        appBaseUrl: window.location.origin,
        productType: productType,
      };

      if (productType === 'books') {
        payload.books = books;
      } else if (productType === 'subscription') {
        if (!user || !user.id) {
          throw new Error('User not authenticated for subscription.');
        }
        payload.userId = user.id;
      }
        
      const { data } = await nowpayments(payload);

      if (data.success) {
        setPaymentData(data);
        setPaymentState('waiting');
        toast.success('Payment created! Please complete the payment.');
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Payment creation failed:', error);
      setPaymentState('failed');
      toast.error('Failed to create payment. Please try again.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const openPaymentUrl = () => {
    if (paymentData?.payment_url) {
      window.open(paymentData.payment_url, '_blank');
    }
  };

  const safeKasAmount = typeof kasAmount === 'number' ? kasAmount : 0;

  const renderContent = () => {
    switch (paymentState) {
      case 'initial':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <img 
                  src="https://cryptologos.cc/logos/kaspa-kas-logo.png" 
                  alt="KAS" 
                  className="w-8 h-8"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">Pay with Kaspa (KAS)</h3>
              <p className="text-muted-foreground">
                Fast and secure cryptocurrency payment
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>
                    {productType === 'books' ? `Books (${books.length})` : 'Subscription'}
                  </span>
                  <span>${parseFloat(totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Amount in KAS</span>
                  <span>
                    {isRateLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      `~${safeKasAmount.toFixed(4)} KAS`
                    )}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Rate: ${kasRate.toFixed(4)} per KAS
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You will be redirected to NOWPayments to complete your payment securely.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={createPayment} 
              className="w-full" 
              size="lg"
              disabled={isRateLoading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay with KAS
            </Button>
          </div>
        );

      case 'creating':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Creating Payment...</h3>
            <p className="text-muted-foreground">
              Please wait while we prepare your payment
            </p>
          </div>
        );

      case 'waiting':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Waiting for Payment</h3>
              <p className="text-muted-foreground">
                Complete your payment to continue
              </p>
            </div>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Payment ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {paymentData?.payment_id?.slice(0, 8)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(paymentData?.payment_id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Amount:</span>
                  <span className="font-semibold">{safeKasAmount.toFixed(4)} KAS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status:</span>
                  <Badge variant="secondary">
                    {statusChecking && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    Waiting
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                onClick={openPaymentUrl} 
                className="flex-1"
                variant="default"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Payment Page
              </Button>
              <Button 
                onClick={checkPaymentStatus} 
                variant="outline"
                disabled={statusChecking}
              >
                <RefreshCw className={`w-4 h-4 ${statusChecking ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Don't close this window. We'll automatically detect when your payment is complete.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">
              {productType === 'books' ? 'Your books have been added to your library' : 'Your subscription has been activated.'}
            </p>
            <Badge className="bg-green-100 text-green-800">
              Transaction Complete
            </Badge>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
            <p className="text-muted-foreground mb-4">
              Something went wrong with your payment
            </p>
            <Button onClick={() => setPaymentState('initial')} variant="outline">
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img 
                src="https://cryptologos.cc/logos/kaspa-kas-logo.png" 
                alt="KAS" 
                className="w-5 h-5"
              />
              Kaspa Payment
            </DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>

      <AIPreferencesModal
        isOpen={showAIPreferences}
        onClose={() => setShowAIPreferences(false)}
      />
    </>
  );
}