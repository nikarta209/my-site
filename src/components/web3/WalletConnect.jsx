import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wallet, Copy, ExternalLink, Zap } from 'lucide-react';

// Mock Web3.js integration для KAS
const mockWeb3 = {
  isConnected: false,
  account: null,
  balance: 0,
  
  async connect() {
    // Симуляция подключения к KAS кошельку
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.isConnected = true;
    this.account = 'kaspa:qr5v8jl2k9x3m4n7p2q6w8e1r3t5y7u9i0o2a4s6d8f';
    this.balance = Math.random() * 1000 + 100; // Случайный баланс для демо
    return { success: true, account: this.account };
  },

  async disconnect() {
    this.isConnected = false;
    this.account = null;
    this.balance = 0;
    return { success: true };
  },

  async getBalance() {
    if (!this.isConnected) return 0;
    // Симуляция получения баланса
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.balance;
  },

  async sendTransaction(to, amount, memo) {
    if (!this.isConnected) throw new Error('Wallet not connected');
    
    // Симуляция отправки транзакции
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const txHash = 'kas_tx_' + Math.random().toString(36).substring(2, 15);
    this.balance -= amount + 0.001; // Комиссия за транзакцию
    
    return {
      success: true,
      txHash,
      amount,
      to,
      memo
    };
  }
};

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Проверяем, подключен ли кошелёк при загрузке
    const savedConnection = localStorage.getItem('kas_wallet_connected');
    if (savedConnection === 'true') {
      // Автоматическое переподключение
      connectWallet(true);
    }
  }, []);

  const connectWallet = async (autoConnect = false) => {
    setIsLoading(true);
    try {
      const result = await mockWeb3.connect();
      if (result.success) {
        setIsConnected(true);
        setAccount(result.account);
        setBalance(await mockWeb3.getBalance());
        localStorage.setItem('kas_wallet_connected', 'true');
        
        if (!autoConnect) {
          toast.success('Кошелёк успешно подключен!');
        }
      }
    } catch (error) {
      toast.error('Ошибка подключения кошелька');
      console.error('Wallet connection error:', error);
    }
    setIsLoading(false);
  };

  const disconnectWallet = async () => {
    try {
      await mockWeb3.disconnect();
      setIsConnected(false);
      setAccount(null);
      setBalance(0);
      localStorage.removeItem('kas_wallet_connected');
      toast.info('Кошелёк отключен');
    } catch (error) {
      toast.error('Ошибка отключения кошелька');
    }
  };

  const sendPayment = async (to, amount, memo = '') => {
    setIsLoading(true);
    try {
      const result = await mockWeb3.sendTransaction(to, amount, memo);
      setBalance(await mockWeb3.getBalance());
      toast.success(`Платёж отправлен! TX: ${result.txHash.substring(0, 16)}...`);
      return result;
    } catch (error) {
      toast.error('Ошибка отправки платежа');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    account,
    balance,
    isLoading,
    connectWallet,
    disconnectWallet,
    sendPayment
  };
};

export default function WalletConnect() {
  const { isConnected, account, balance, isLoading, connectWallet, disconnectWallet } = useWallet();

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast.success('Адрес скопирован!');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 12)}...${address.substring(address.length - 8)}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          KAS Кошелёк
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button 
            onClick={() => connectWallet()} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Подключение...
              </div>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Подключить кошелёк
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Zap className="w-3 h-3 mr-1" />
                Подключен
              </Badge>
              <Button variant="ghost" size="sm" onClick={disconnectWallet}>
                Отключить
              </Button>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Адрес:</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={copyAddress}>
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`https://explorer.kaspa.org/addresses/${account}`} target="_blank">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>
              <p className="text-sm font-mono">{formatAddress(account)}</p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Баланс:</span>
                <span className="font-semibold">{balance.toFixed(4)} KAS</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}