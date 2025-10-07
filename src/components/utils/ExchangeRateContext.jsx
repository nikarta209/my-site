import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { coinMarketCap } from '@/api/functions';
import { toast } from 'sonner';

export const DEFAULT_KAS_LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/400006eb0_15301661.png';

const ExchangeRateContext = createContext({
  kasRate: 0.025, // Fallback rate
  kasRateFormatted: '$0.025', // Formatted fallback rate
  kasLogo: DEFAULT_KAS_LOGO,
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
  const [kasLogo, setKasLogo] = useState(DEFAULT_KAS_LOGO);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Функция для получения кэшированных данных
  const getCachedRate = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rate, timestamp, logo } = JSON.parse(cached);
        const now = Date.now();
        const age = now - timestamp;

        if (age < CACHE_DURATION) {
          return { rate, timestamp, logo, fromCache: true };
        }
      }
    } catch (error) {
      console.warn('Error reading cached exchange rate:', error);
    }
    return null;
  }, []);

  // Функция для сохранения в кэш
  const setCachedRate = useCallback((rate, logo, updatedAt) => {
    try {
      const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp, logo }));
      setLastUpdated(new Date(timestamp));
    } catch (error) {
      console.warn('Error saving exchange rate to cache:', error);
    }
  }, []);

  // Функция для обновления состояния курсов (числового и форматированного)
  const updateRateState = useCallback((rate, logo) => {
    setKasRate(rate);
    setKasRateFormatted(`$${rate.toFixed(3)}`);
    if (logo) {
      setKasLogo(logo);
    }
  }, []);

  const fetchRate = useCallback(async (forceUpdate = false) => {
    // Проверяем кэш, если не форсируем обновление
    if (!forceUpdate) {
      const cached = getCachedRate();
      if (cached) {
        updateRateState(cached.rate, cached.logo || DEFAULT_KAS_LOGO);
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

      const logo = data.logo || DEFAULT_KAS_LOGO;
      updateRateState(data.rate, logo);
      setCachedRate(data.rate, logo, data.lastUpdated);
      setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
      console.log(`KAS rate updated: $${data.rate.toFixed(3)}`);

    } catch (err) {
      console.error('Ошибка получения курса KAS:', err);
      setError(err.message);

      // Оставим уведомление только при ошибке
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { rate, timestamp, logo } = JSON.parse(cached);
          updateRateState(rate, logo || DEFAULT_KAS_LOGO);
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
    kasLogo,
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