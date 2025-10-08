
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User } from '@/api/entities';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

// Placeholder for UI components and routing utilities.
// Adjust import paths based on your project's specific setup (e.g., Next.js, React Router, shadcn/ui).
// For example:
// import { Button } from '@/components/ui/button';
// import Link from 'next/link'; // For Next.js
// import { Link } from 'react-router-dom'; // For React Router

// If '@/components/ui/button' is not correct, you might need to adjust or create a simple <button>
import { Button } from '@/components/ui/button';

// ИСПРАВЛЕНИЕ: Функция для проверки полного доступа с правильным email
const hasFullAccess = (user) => {
  return user?.email === 'nikatrta2003@gmail.com';
};

const normalizeRoleValue = (role) => {
  if (!role || typeof role !== 'string') return null;
  const normalized = role.trim().toLowerCase();
  return normalized || null;
};

const collectUserRoles = (user) => {
  const roles = new Set();

  const addRole = (value) => {
    const normalized = normalizeRoleValue(value);
    if (normalized) {
      roles.add(normalized);
    }
  };

  if (!user) return roles;

  addRole(user.role);
  addRole(user.user_type);
  addRole(user.user_metadata?.role);

  if (Array.isArray(user.roles)) {
    user.roles.forEach(addRole);
  }

  if (Array.isArray(user.user_metadata?.roles)) {
    user.user_metadata.roles.forEach(addRole);
  }

  if (user.is_admin) addRole('admin');
  if (user.is_moderator) addRole('moderator');
  if (user.is_author) addRole('author');

  return roles;
};

const determinePrimaryRole = (roles) => {
  if (roles.has('admin')) return 'admin';
  if (roles.has('moderator')) return 'moderator';
  if (roles.has('author')) return 'author';
  if (roles.has('reader')) return 'reader';

  const [firstRole] = roles;
  return firstRole || null;
};

const enhanceUserWithRoles = (user) => {
  if (!user) return null;

  const roles = collectUserRoles(user);
  const primaryRole = determinePrimaryRole(roles) || normalizeRoleValue(user.role) || null;

  return {
    ...user,
    role: primaryRole || user.role,
    roles: Array.from(roles.size > 0 ? roles : primaryRole ? [primaryRole] : []),
    permissions: {
      canAccessAdmin: roles.has('admin') || primaryRole === 'admin',
      canAccessModeration: roles.has('admin') || roles.has('moderator') || primaryRole === 'admin' || primaryRole === 'moderator',
      canAccessAuthorPanel:
        roles.has('admin') ||
        roles.has('moderator') ||
        roles.has('author') ||
        primaryRole === 'admin' ||
        primaryRole === 'moderator' ||
        primaryRole === 'author'
    }
  };
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
  role: null,
  roles: [],
  hasRole: () => false,
  access: {
    canAccessAdmin: false,
    canAccessModeration: false,
    canAccessAuthorPanel: false
  }
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
        const enhanced = enhanceUserWithRoles(userData);
        localStorage.setItem('kasbook_user', JSON.stringify(enhanced));
        localStorage.setItem('kasbook_user_timestamp', Date.now().toString());
      } else {
        localStorage.removeItem('kasbook_user');
        localStorage.removeItem('kasbook_user_timestamp');
      }
    } catch (error) {
      console.warn('LocalStorage недоступен:', error);
    }
  }, []);

  const setAndPersistUser = useCallback((userData) => {
      if (!userData) {
        setUser(null);
        syncToLocalStorage(null);
        return null;
      }

      const enhancedUser = enhanceUserWithRoles(userData);
      setUser(enhancedUser);
      syncToLocalStorage(enhancedUser);
      return enhancedUser;
  }, [syncToLocalStorage]);

  const getStoredUser = useCallback(() => {
    try {
      const storedUser = localStorage.getItem('kasbook_user');
      const timestamp = localStorage.getItem('kasbook_user_timestamp');
      
      if (storedUser && timestamp) {
        // Проверяем, не устарели ли данные (15 минут)
        const age = Date.now() - parseInt(timestamp);
        if (age < 15 * 60 * 1000) { // 15 минут
          return enhanceUserWithRoles(JSON.parse(storedUser));
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
            setAndPersistUser(updatedUser);
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
          setAndPersistUser(storedUser);
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
            const normalized = setAndPersistUser(updatedUser);
            await handlePendingRegistration(normalized); // Pass the updated user for registration processing
            toast.info('Ваша подписка истекла и была деактивирована.');
          } else {
            // Обновляем только если данные отличаются
            // Compare against the initially retrieved storedUser to avoid re-reading local storage
            if (JSON.stringify(currentUser) !== JSON.stringify(storedUser)) {
              const normalized = setAndPersistUser(currentUser);
              await handlePendingRegistration(normalized); // Pass the original currentUser for registration processing
            } else {
              await handlePendingRegistration(storedUser); // Use stored normalized user
            }
          }

        } else {
          // Пользователь не авторизован
          if (storedUser) { // If there was a cached user, clear it
            setAndPersistUser(null);
          }
        }

      } catch (error) {
        console.warn('Auth initialization error:', error);
        
        // ИСПРАВЛЕНИЕ: Различаем типы ошибок
        if (error.message?.includes('Invalid token') || error.message?.includes('401')) {
          // Токен недействителен, очищаем данные
          setAndPersistUser(null);
        } else {
          // Сетевая ошибка, оставляем кэшированные данные если есть
          const storedUserOnError = getStoredUser(); // Re-read in case the initial attempt failed to set
          if (storedUserOnError && !user) { // Only set if we have stored data and user state is currently null
            setAndPersistUser(storedUserOnError);
          }
        }
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        initializePromiseRef.current = null;
      }
    })();
    
    return initializePromiseRef.current;
  }, [getStoredUser, setAndPersistUser, user]); // user is in dependency array to ensure handlePendingRegistration has latest user if needed

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
          setAndPersistUser(null);
          toast.info('Сессия истекла, необходимо войти заново');
        } else {
          // Check for expired subscription during periodic check
          if (currentUser.subscription_status === 'active' && currentUser.subscription_expires_at && new Date(currentUser.subscription_expires_at) < new Date()) {
            console.log('Periodic check: Subscription expired, updating status...');
            const updatedUser = await User.updateMyUserData({ subscription_status: 'inactive' });
            if (JSON.stringify(updatedUser) !== JSON.stringify(user)) { // Compare against current state user
                setAndPersistUser(updatedUser);
                toast.info('Ваша подписка истекла и была деактивирована.');
            }
          } else if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
            // Данные обновились (and subscription is not expired, or was already inactive)
            setAndPersistUser(currentUser);
          }
        }
      } catch (error) {
        console.warn('Token validation failed:', error);
        // При ошибке сети не очищаем данные сразу
      }
    }, 5 * 60 * 1000); // Каждые 5 минут

    return () => clearInterval(interval);
  }, [user, isInitialized, setAndPersistUser]);

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
          setAndPersistUser(profile);
        }
      } else if (result?.user) {
        // Fallback для сценариев, когда Supabase уже вернул пользователя
        setAndPersistUser(result.user);
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setAndPersistUser]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await User.logout();
      setAndPersistUser(null);
      toast.success('Вы успешно вышли из системы');
    } catch (error) {
      console.error('Logout error:', error);
      // Даже при ошибке очищаем локальные данные
      setAndPersistUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [syncToLocalStorage]);

  // Changed updateUser to refresh user data from server, as per outline
  const updateUser = useCallback(async () => {
    try {
      const updatedUser = await User.me(); // Refresh user data from server
      return setAndPersistUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      // As per outline, return the current user state on error
      return user;
    }
  }, [setAndPersistUser, user]);

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

  const roleList = useMemo(() => {
    const roles = collectUserRoles(user);

    if (user?.permissions?.canAccessAdmin) {
      roles.add('admin');
    }

    if (user?.permissions?.canAccessModeration) {
      roles.add('moderator');
    }

    if (user?.permissions?.canAccessAuthorPanel) {
      roles.add('author');
    }

    return Array.from(roles);
  }, [user]);
  const primaryRole = useMemo(() => {
    if (user?.role) {
      const normalized = normalizeRoleValue(user.role);
      if (normalized) {
        return normalized;
      }
    }

    return determinePrimaryRole(new Set(roleList)) || null;
  }, [roleList, user?.role]);

  const hasRole = useCallback((roleToCheck) => {
    const normalized = normalizeRoleValue(roleToCheck);
    if (!normalized) return false;

    if (roleList.some(role => role === normalized)) {
      return true;
    }

    if (user?.role && normalizeRoleValue(user.role) === normalized) {
      return true;
    }

    if (user?.user_type && normalizeRoleValue(user.user_type) === normalized) {
      return true;
    }

    if (normalized === 'admin' && user?.permissions?.canAccessAdmin) {
      return true;
    }

    if (normalized === 'moderator' && user?.permissions?.canAccessModeration) {
      return true;
    }

    if (normalized === 'author' && user?.permissions?.canAccessAuthorPanel) {
      return true;
    }

    return false;
  }, [roleList, user?.permissions, user?.role, user?.user_type]);

  const access = {
    canAccessAdmin: user?.permissions?.canAccessAdmin || hasRole('admin'),
    canAccessModeration: user?.permissions?.canAccessModeration || hasRole('admin') || hasRole('moderator'),
    canAccessAuthorPanel: user?.permissions?.canAccessAuthorPanel || hasRole('admin') || hasRole('moderator') || hasRole('author')
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    subscription, // Передаем объект подписки
    hasFullAccess: isGodMode, // Передаем флаг полного доступа
    role: primaryRole,
    roles: roleList,
    hasRole,
    access
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
  const { user, isAuthenticated, isLoading, hasFullAccess: isGodMode, hasRole } = useAuth(); // Получаем флаг
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

  const handleDirectLogin = async () => {
    try {
      await User.login();
    } catch (error) {
      console.error('Direct login failed:', error);
      toast.error('Сервис авторизации недоступен. Попробуйте еще раз позже.');
    }
  };

  if (!isAuthenticated) {
    return fallbackComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md p-6">
          <h2 className="text-2xl font-bold">Требуется авторизация</h2>
          <p className="text-muted-foreground">Для доступа к этой странице необходимо войти в систему</p>
          <button
            onClick={handleDirectLogin}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }
  
  // ИСПРАВЛЕНО: Пропускаем, если есть полный доступ
  if (requireRole && !isGodMode && !hasRole(requireRole) && !hasRole('admin')) {
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
