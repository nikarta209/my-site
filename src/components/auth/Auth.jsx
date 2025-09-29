
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/api/entities';
import { toast } from 'sonner';

// Placeholder for UI components and routing utilities.
// Adjust import paths based on your project's specific setup (e.g., Next.js, React Router, shadcn/ui).
// For example:
// import { Button } from '@/components/ui/button';
// import Link from 'next/link'; // For Next.js
// import { Link } from 'react-router-dom'; // For React Router

// If '@/components/ui/button' is not correct, you might need to adjust or create a simple <button>
import { Button } from '@/components/ui/button';

// Dummy createPageUrl function, replace with your actual routing utility
const createPageUrl = (pageName) => {
  if (pageName === 'SubscriptionPage') {
    return '/subscription'; // Example path for subscription page
  }
  return `/${pageName.toLowerCase()}`;
};

// ИСПРАВЛЕНИЕ: Функция для проверки полного доступа с правильным email
const hasFullAccess = (user) => {
  return user?.email === 'nikatrta2003@gmail.com';
};

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: async () => {}, // Changed to async function signature
  subscription: { // Added subscription object to context
    isActive: false,
    expiresAt: null,
    translationCredits: 0
  },
  hasFullAccess: false, // Добавляем флаг полного доступа
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ИСПРАВЛЕНИЕ: Предотвращаем множественные одновременные запросы
  const initializePromiseRef = useRef(null);
  
  const syncToLocalStorage = useCallback((userData) => {
    try {
      if (userData) {
        localStorage.setItem('kasbook_user', JSON.stringify(userData));
        localStorage.setItem('kasbook_user_timestamp', Date.now().toString());
      } else {
        localStorage.removeItem('kasbook_user');
        localStorage.removeItem('kasbook_user_timestamp');
      }
    } catch (error) {
      console.warn('LocalStorage недоступен:', error);
    }
  }, []);

  const getStoredUser = useCallback(() => {
    try {
      const storedUser = localStorage.getItem('kasbook_user');
      const timestamp = localStorage.getItem('kasbook_user_timestamp');
      
      if (storedUser && timestamp) {
        // Проверяем, не устарели ли данные (15 минут)
        const age = Date.now() - parseInt(timestamp);
        if (age < 15 * 60 * 1000) { // 15 минут
          return JSON.parse(storedUser);
        } else {
          // Данные устарели, очищаем их
          localStorage.removeItem('kasbook_user');
          localStorage.removeItem('kasbook_user_timestamp');
        }
      }
    } catch (error) {
      console.warn('Ошибка чтения из localStorage:', error);
    }
    return null;
  }, []);

  // ИСПРАВЛЕНИЕ: Стабилизируем инициализацию с предотвращением race conditions
  const initializeAuth = useCallback(async () => {
    // Если уже идет инициализация, ждем ее завершения
    if (initializePromiseRef.current) {
      return initializePromiseRef.current;
    }
    
    setIsLoading(true);
    
    // ИСПРАВЛЕНИЕ: Переносим handlePendingRegistration внутрь useCallback
    const handlePendingRegistration = async (userData) => {
      try {
        const pendingData = localStorage.getItem('kasbook_pending_registration');
        if (pendingData) {
          const registrationData = JSON.parse(pendingData);
          const updateData = {};
          
          if (registrationData.fullName && registrationData.fullName !== userData.full_name) {
            updateData.full_name = registrationData.fullName;
          }
          
          if (registrationData.role && registrationData.role !== userData.role) {
            if (userData.role === 'reader' || !userData.role) {
              updateData.role = registrationData.role;
            }
          }
          
          if (Object.keys(updateData).length > 0) {
            const updatedUser = await User.updateMyUserData(updateData);
            setUser(updatedUser);
            syncToLocalStorage(updatedUser);
          }
          
          localStorage.removeItem('kasbook_pending_registration');
          toast.success(`Welcome, ${registrationData.fullName || userData.full_name}!`);
        }
      } catch (error) {
        console.warn('Failed to process pending registration:', error);
        localStorage.removeItem('kasbook_pending_registration');
      }
    };
    
    initializePromiseRef.current = (async () => {
      try {
        // Сначала пробуем загрузить из localStorage для быстрого старта
        const storedUser = getStoredUser(); // Get the initial stored user once
        if (storedUser) {
          setUser(storedUser);
          setIsLoading(false); // Быстро убираем загрузку
        }

        // Затем проверяем актуальность с сервера
        const currentUser = await User.me();
        
        if (currentUser) {
          // Проверяем, не истекла ли подписка
          // Ensure subscription_expires_at exists before trying to create a Date object
          if (currentUser.subscription_status === 'active' && currentUser.subscription_expires_at && new Date(currentUser.subscription_expires_at) < new Date()) {
            // Подписка истекла, обновляем на сервере
            console.log('Subscription expired, updating status...');
            const updatedUser = await User.updateMyUserData({ subscription_status: 'inactive' });
            setUser(updatedUser);
            syncToLocalStorage(updatedUser);
            await handlePendingRegistration(updatedUser); // Pass the updated user for registration processing
            toast.info('Ваша подписка истекла и была деактивирована.');
          } else {
            // Обновляем только если данные отличаются
            // Compare against the initially retrieved storedUser to avoid re-reading local storage
            if (JSON.stringify(currentUser) !== JSON.stringify(storedUser)) {
              setUser(currentUser);
              syncToLocalStorage(currentUser);
            }
            await handlePendingRegistration(currentUser); // Pass the original currentUser for registration processing
          }
          
        } else {
          // Пользователь не авторизован
          if (storedUser) { // If there was a cached user, clear it
            setUser(null);
            syncToLocalStorage(null);
          }
        }
        
      } catch (error) {
        console.warn('Auth initialization error:', error);
        
        // ИСПРАВЛЕНИЕ: Различаем типы ошибок
        if (error.message?.includes('Invalid token') || error.message?.includes('401')) {
          // Токен недействителен, очищаем данные
          setUser(null);
          syncToLocalStorage(null);
        } else {
          // Сетевая ошибка, оставляем кэшированные данные если есть
          const storedUserOnError = getStoredUser(); // Re-read in case the initial attempt failed to set
          if (storedUserOnError && !user) { // Only set if we have stored data and user state is currently null
            setUser(storedUserOnError);
          }
        }
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        initializePromiseRef.current = null;
      }
    })();
    
    return initializePromiseRef.current;
  }, [getStoredUser, syncToLocalStorage, user]); // user is in dependency array to ensure handlePendingRegistration has latest user if needed

  // ИСПРАВЛЕНИЕ: Инициализация только один раз при монтировании
  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [initializeAuth, isInitialized]);

  // ИСПРАВЛЕНИЕ: Периодическая проверка актуальности токена (каждые 5 минут)
  useEffect(() => {
    if (!user || !isInitialized) return;
    
    const interval = setInterval(async () => {
      try {
        const currentUser = await User.me();
        if (!currentUser) {
          // Токен истек
          setUser(null);
          syncToLocalStorage(null);
          toast.info('Сессия истекла, необходимо войти заново');
        } else {
          // Check for expired subscription during periodic check
          if (currentUser.subscription_status === 'active' && currentUser.subscription_expires_at && new Date(currentUser.subscription_expires_at) < new Date()) {
            console.log('Periodic check: Subscription expired, updating status...');
            const updatedUser = await User.updateMyUserData({ subscription_status: 'inactive' });
            if (JSON.stringify(updatedUser) !== JSON.stringify(user)) { // Compare against current state user
                setUser(updatedUser);
                syncToLocalStorage(updatedUser);
                toast.info('Ваша подписка истекла и была деактивирована.');
            }
          } else if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
            // Данные обновились (and subscription is not expired, or was already inactive)
            setUser(currentUser);
            syncToLocalStorage(currentUser);
          }
        }
      } catch (error) {
        console.warn('Token validation failed:', error);
        // При ошибке сети не очищаем данные сразу
      }
    }, 5 * 60 * 1000); // Каждые 5 минут

    return () => clearInterval(interval);
  }, [user, isInitialized, syncToLocalStorage]);

  const login = useCallback(async ({ email, password, isRegistration, twoFactorCode, ...options } = {}) => {
    setIsLoading(true);
    try {
      const result = await User.login({
        email,
        password,
        isRegistration,
        twoFactorCode,
        ...options
      });

      if (result?.success) {
        const profile = await User.me();
        if (profile) {
          setUser(profile);
          syncToLocalStorage(profile);
        }
      } else if (result?.user) {
        // Fallback для сценариев, когда Supabase уже вернул пользователя
        setUser(result.user);
        syncToLocalStorage(result.user);
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [syncToLocalStorage]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await User.logout();
      setUser(null);
      syncToLocalStorage(null);
      toast.success('Вы успешно вышли из системы');
    } catch (error) {
      console.error('Logout error:', error);
      // Даже при ошибке очищаем локальные данные
      setUser(null);
      syncToLocalStorage(null);
    } finally {
      setIsLoading(false);
    }
  }, [syncToLocalStorage]);

  // Changed updateUser to refresh user data from server, as per outline
  const updateUser = useCallback(async () => {
    try {
      const updatedUser = await User.me(); // Refresh user data from server
      setUser(updatedUser);
      syncToLocalStorage(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update user error:', error);
      // As per outline, return the current user state on error
      return user;
    }
  }, [syncToLocalStorage, user]);

  // ИСПРАВЛЕНО: Создаем объект подписки с учетом полного доступа
  const isGodMode = hasFullAccess(user);
  const subscription = isGodMode 
    ? {
        isActive: true,
        expiresAt: 'never',
        translationCredits: 9999
      }
    : {
        isActive: user?.subscription_status === 'active',
        expiresAt: user?.subscription_expires_at,
        translationCredits: user?.translation_credits || 0,
      };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    subscription, // Передаем объект подписки
    hasFullAccess: isGodMode // Передаем флаг полного доступа
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// New useSubscription hook
export const useSubscription = () => {
    const { subscription } = useAuth();
    return subscription;
};


// ИСПРАВЛЕНИЕ: Улучшенный ProtectedRoute с лучшим UX
export function ProtectedRoute({ children, requireRole, requireSubscription, fallbackComponent }) {
  const { user, isAuthenticated, isLoading, hasFullAccess: isGodMode } = useAuth(); // Получаем флаг
  const subscription = useSubscription(); // Use the new hook for subscription data
  
  // ИСПРАВЛЕНИЕ: Показываем загрузку только когда реально идет проверка
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Проверка авторизации...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return fallbackComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md p-6">
          <h2 className="text-2xl font-bold">Требуется авторизация</h2>
          <p className="text-muted-foreground">Для доступа к этой странице необходимо войти в систему</p>
          <button
            onClick={() => User.login()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }
  
  // ИСПРАВЛЕНО: Пропускаем, если есть полный доступ
  if (requireRole && !isGodMode && user?.role !== requireRole && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md p-6">
          <h2 className="text-2xl font-bold">Доступ ограничен</h2>
          <p className="text-muted-foreground">
            У вас нет прав для доступа к этой странице. Требуется роль: {requireRole}
          </p>
        </div>
      </div>
    );
  }

  // New subscription check for ProtectedRoute
  // ИСПРАВЛЕНО: Пропускаем, если есть полный доступ
  if (requireSubscription && !isGodMode && !subscription.isActive) {
    return fallbackComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md p-6">
          <h2 className="text-2xl font-bold">Требуется подписка</h2>
          <p className="text-muted-foreground">
            Для доступа к этой функции необходима активная подписка KASBOOK Premium.
          </p>
          <Button asChild>
             {/* Using a standard <a> tag for the link. If you are using a routing library like react-router-dom or Next.js,
                 you would replace this with its <Link> component, e.g., <Link to={createPageUrl('SubscriptionPage')}> */}
             <a href={createPageUrl('SubscriptionPage')}>Оформить подписку</a>
          </Button>
        </div>
      </div>
    );
  }
  
  return children;
}
