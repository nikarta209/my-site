import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// Контекст для курса KAS/USD
const CoinGeckoContext = createContext({
  kasPrice: 0.025, // Fallback цена
  isLoading: true,
  error: null,
  lastUpdated: null,
});

export const useCoinGecko = () => {
  const context = useContext(CoinGeckoContext);
  if (!context) {
    throw new Error('useCoinGecko must be used within CoinGeckoProvider');
  }
  return context;
};

export function CoinGeckoProvider({ children }) {
  const [kasPrice, setKasPrice] = useState(0.025); // Fallback цена
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchKasPrice = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/rate');
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.error || `API responded with status ${response.status}`;
        throw new Error(message);
      }

      const rate = data?.rate;
      if (!rate || typeof rate !== 'number' || rate <= 0) {
        throw new Error('Rate payload is invalid');
      }

      setKasPrice(rate);
      setLastUpdated(data?.updated_at ? new Date(data.updated_at) : new Date());
      setIsLoading(false);
      return;
      
    } catch (err) {
      console.error('Error fetching KAS price:', err);
      setError(err.message);
      
      // Показываем toast с ошибкой только если это первая загрузка
      if (isLoading) {
        toast.error('Не удалось загрузить актуальный курс KAS', {
          description: 'Используется резервная цена. Курс будет обновлен автоматически.',
          duration: 5000,
        });
      }
      
      // Используем fallback цену, но не показываем ошибку постоянно
      setKasPrice(0.025);
      setLastUpdated(new Date());
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    // Первоначальная загрузка
    fetchKasPrice();

    // Обновляем каждые 5 минут
    const interval = setInterval(fetchKasPrice, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchKasPrice]);

  // Повторная попытка при ошибке
  const retry = () => {
    setIsLoading(true);
    fetchKasPrice();
  };

  const value = {
    kasPrice,
    isLoading,
    error,
    lastUpdated,
    retry,
  };

  return (
    <CoinGeckoContext.Provider value={value}>
      {children}
    </CoinGeckoContext.Provider>
  );
}

// Компонент для отображения цены с анимацией
export function AnimatedPrice({ amount, className = '' }) {
  const { kasPrice, error } = useCoinGecko();
  const usdPrice = (amount * kasPrice).toFixed(2);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-bold">{amount} KAS</span>
      <motion.span
        key={`${usdPrice}-${error ? 'error' : 'success'}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`text-sm ${error ? 'text-red-500' : 'text-muted-foreground'}`}
      >
        ≈ ${usdPrice} USD {error && '(резерв)'}
      </motion.span>
    </div>
  );
}

// Хук для расчета цены с учетом текущего курса
export function useKasPrice(kasAmount) {
  const { kasPrice, error } = useCoinGecko();
  
  return {
    kasAmount,
    usdAmount: (kasAmount * kasPrice).toFixed(2),
    kasPrice,
    isUsingFallback: error !== null,
  };
}