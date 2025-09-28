import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { coinMarketCap } from '@/api/functions';
import { toast } from 'sonner';

const ExchangeRateContext = createContext({
  kasRate: 0.025, // Fallback rate
  kasRateFormatted: '$0.025', // Formatted fallback rate
  isLoading: true,
  error: null,
  lastUpdated: null,
  fetchRate: async () => {}
});

export const useExchangeRate = () => useContext(ExchangeRateContext);

// Константы для кэширования
const CACHE_KEY = 'kasbook_kas_rate';
const CACHE_DURATION = 4 * 60 * 1000; // 4 минуты в миллисекундах (чуть меньше интервала обновления)
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 минут для автоматического обновления

export function ExchangeRateProvider({ children }) {
  const [kasRate, setKasRate] = useState(0.025);
  const [kasRateFormatted, setKasRateFormatted] = useState('$0.025');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Функция для получения кэшированных данных
  const getCachedRate = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rate, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const age = now - timestamp;
        
        if (age < CACHE_DURATION) {
          return { rate, timestamp, fromCache: true };
        }
      }
    } catch (error) {
      console.warn('Error reading cached exchange rate:', error);
    }
    return null;
  }, []);

  // Функция для сохранения в кэш
  const setCachedRate = useCallback((rate) => {
    try {
      const timestamp = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp }));
      setLastUpdated(new Date(timestamp));
    } catch (error) {
      console.warn('Error saving exchange rate to cache:', error);
    }
  }, []);

  // Функция для обновления состояния курсов (числового и форматированного)
  const updateRateState = useCallback((rate) => {
    setKasRate(rate);
    setKasRateFormatted(`$${rate.toFixed(3)}`);
  }, []);

  const fetchRate = useCallback(async (forceUpdate = false) => {
    // Проверяем кэш, если не форсируем обновление
    if (!forceUpdate) {
      const cached = getCachedRate();
      if (cached) {
        updateRateState(cached.rate);
        setLastUpdated(new Date(cached.timestamp));
        setIsLoading(false);
        setError(null);
        return;
      }
    }

    // Не ставим isLoading в true, если это фоновое обновление, чтобы не дергать UI
    if (forceUpdate) {
       console.log('Performing background KAS rate update...');
    } else {
       setIsLoading(true);
    }
    setError(null);
    
    try {
      const { data, error: apiError } = await coinMarketCap({ action: 'getCurrentKasRate' });

      if (apiError || !data?.rate) {
        throw new Error(apiError?.message || 'Не удалось получить курс KAS');
      }
      
      updateRateState(data.rate);
      setCachedRate(data.rate);
      console.log(`KAS rate updated: $${data.rate.toFixed(3)}`);

    } catch (err) {
      console.error('Ошибка получения курса KAS:', err);
      setError(err.message);
      
      // Оставим уведомление только при ошибке
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { rate, timestamp } = JSON.parse(cached);
          updateRateState(rate);
          setLastUpdated(new Date(timestamp));
          if (forceUpdate) { // Показываем тост только если это была попытка форсированного обновления
            toast.warning("Не удалось обновить курс KAS", { 
              description: `Используется значение от ${new Date(timestamp).toLocaleTimeString()}` 
            });
          }
        } catch (parseError) {
          console.error('Error parsing cached rate:', parseError);
        }
      } else if (forceUpdate) { // И если кэша нет, тоже сообщаем об ошибке
         toast.error("Не удалось получить курс KAS", { 
          description: "Проверьте соединение с интернетом" 
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [getCachedRate, setCachedRate, updateRateState]);

  useEffect(() => {
    // Загружаем курс при инициализации
    fetchRate();
    
    // Устанавливаем интервал для автоматического обновления каждые 5 минут
    const interval = setInterval(() => {
      fetchRate(true); // Форсируем обновление по интервалу
    }, UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchRate]);

  const value = { 
    kasRate, 
    kasRateFormatted, // Include the formatted rate in the context value
    isLoading, 
    error, 
    lastUpdated,
    fetchRate: () => fetchRate(true) // Форсированное обновление для ручного вызова
  };

  return (
    <ExchangeRateContext.Provider value={value}>
      {children}
    </ExchangeRateContext.Provider>
  );
}