import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/Auth';
import { updateTheme } from '@/api/functions';

const ThemeProviderContext = createContext({
  theme: 'dark',
  setTheme: () => null,
  toggleTheme: () => null,
  isMobile: false,
  isLoading: false
});

export function ThemeProvider({ children, storageKey = 'kasbook-ui-theme', ...props }) {
  const { user, isAuthenticated } = useAuth();
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Инициализация темы при загрузке
  useEffect(() => {
    if (isAuthenticated && user?.ui_theme) {
      // Для авторизованных пользователей используем тему из профиля
      setTheme(user.ui_theme);
      localStorage.setItem(storageKey, user.ui_theme);
    } else {
      // Для неавторизованных пользователей используем localStorage или default 'dark'
      const savedTheme = localStorage.getItem(storageKey) || 'dark';
      setTheme(savedTheme);
    }
  }, [user, isAuthenticated, storageKey]);

  // Проверка мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Применение темы к DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Обновляем localStorage для синхронизации
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const updateUserTheme = async (newTheme) => {
    if (isAuthenticated && user?.id) {
      setIsLoading(true);
      try {
        await updateTheme({ user_id: user.id, theme: newTheme });
        
        // Вызываем перезагрузку данных пользователя для синхронизации
        // Это можно сделать через событие или callback
        window.dispatchEvent(new CustomEvent('themeUpdated', { 
          detail: { theme: newTheme } 
        }));
      } catch (error) {
        console.error('Failed to update user theme:', error);
        // В случае ошибки, откатываемся к предыдущей теме
        return false;
      } finally {
        setIsLoading(false);
      }
    }
    return true;
  };

  const value = {
    theme,
    isMobile,
    isLoading,
    setTheme: async (newTheme) => {
      if (newTheme === theme) return;
      
      const success = await updateUserTheme(newTheme);
      if (success) {
        setTheme(newTheme);
      }
    },
    toggleTheme: async () => {
      const nextTheme = theme === 'light' ? 'dark' : 'light';
      const success = await updateUserTheme(nextTheme);
      if (success) {
        setTheme(nextTheme);
      }
    }
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};