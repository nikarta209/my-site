import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  BookText,
  LogIn,
  LogOut,
  UserCog,
  Shield,
  Crown,
  Bell,
  Home,
  Brain,
  Library,
  Users
} from 'lucide-react';
import { useAuth } from '../auth/Auth';
import { useCart } from '../cart/CartContext';
import { useTheme } from './ThemeProvider';
import { useTranslation } from '../i18n/SimpleI18n';
import { useExchangeRate } from '../utils/ExchangeRateContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mobile Bottom Navigation Component
function MobileBottomNav({ currentPageName, user, isAuthenticated, cartItems }) {
  const navigationItems = [
    { 
      name: 'Главная', 
      path: 'Home', 
      icon: Home
    },
    { 
      name: 'Каталог', 
      path: 'Catalog', 
      icon: Search
    },
    { 
      name: 'Читалка', 
      path: 'Library', 
      icon: BookText
    },
    { 
      name: 'Заметки', 
      path: 'NotesFeed', 
      icon: BookOpen
    },
    { 
      name: 'Профиль', 
      path: 'Profile', 
      icon: User,
      showBadge: isAuthenticated && cartItems.length > 0
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex justify-around items-center h-12">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPageName === item.path;
          
          return (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              className="flex items-center justify-center h-full w-full group"
              aria-label={item.name}
            >
              <div className="relative">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-orange-500 text-white' 
                      : 'text-muted-foreground group-hover:text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                {item.showBadge && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-card" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Header({ currentPageName, onLoginClick }) {
  const { user, isAuthenticated, login, logout, isLoading: isAuthLoading, hasRole, access } = useAuth();
  const { cartItems } = useCart();
  const { theme, toggleTheme, isMobile } = useTheme();
  const { kasRateFormatted, isLoading: isRateLoading } = useExchangeRate();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const isAdmin = hasRole ? hasRole('admin') : false;
  const isModerator = hasRole ? hasRole('moderator') : false;
  const isAuthor = hasRole ? hasRole('author') : false;

  const canAccessAuthorPanel = access?.canAccessAuthorPanel ?? (isAdmin || isModerator || isAuthor);
  const canAccessModeration = access?.canAccessModeration ?? (isAdmin || isModerator);
  const canAccessAdminPanel = access?.canAccessAdmin ?? !!isAdmin;

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
      return;
    }

    login();
  };

  const getThemeIcon = () => {
    switch(theme) {
      case 'light': return Moon;
      case 'dark': return Sun;
      default: return Sun;
    }
  };

  const ThemeIcon = getThemeIcon();

  // Mobile layout
  if (isMobile) {
    return (
      <>
        {/* Mobile header - компактный как у ЛитРеса */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between p-2">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-white" />
              </div>
              <div className="text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                KASBOOK
              </div>
            </Link>

            {/* Right side icons */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button className="relative p-2 text-foreground hover:text-primary">
                <Search className="w-4 h-4" />
              </button>
              
              {/* Notifications */}
              <button className="relative p-2 text-foreground hover:text-primary">
                <Bell className="w-4 h-4" />
              </button>

              {/* Cart */}
              <Link to={createPageUrl('Cart')} className="relative p-2 text-foreground hover:text-primary">
                <ShoppingCart className="w-4 h-4" />
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center p-0 text-xs bg-orange-500 hover:bg-orange-500 text-white">
                    {cartItems.length}
                  </Badge>
                )}
              </Link>

              {/* Profile */}
              <Link to={createPageUrl('Profile')} className="p-2 text-foreground hover:text-primary">
                <User className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav 
          currentPageName={currentPageName}
          user={user}
          isAuthenticated={isAuthenticated}
          cartItems={cartItems}
        />
      </>
    );
  }

  // Desktop Layout - компактный как у ЛитРеса
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-4">
            {/* Logo с градиентом */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="text-base font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                KASBOOK
              </div>
            </Link>

            {/* Search Bar */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Поиск книг..."
                className="pl-7 h-7 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = createPageUrl(`Catalog?search=${e.target.value}`);
                  }
                }}
              />
            </div>
          </div>

          {/* Right side links and controls */}
          <div className="flex items-center gap-2">
            {/* Conditional Library Link */}
            {isAuthenticated && (
              <Link
                to={createPageUrl('Library')}
                className={`flex items-center gap-1 text-xs font-medium transition-colors hover:text-primary px-2 py-1 ${
                  currentPageName === 'Library' ? 'text-primary' : 'text-foreground'
                }`}
              >
                <Library className="w-3 h-3" /> Библиотека
              </Link>
            )}

            {/* Existing Notes Feed Link */}
            <Link
              to={createPageUrl('NotesFeed')}
              className={`flex items-center gap-1 text-xs font-medium transition-colors hover:text-primary px-2 py-1 ${
                currentPageName === 'NotesFeed' ? 'text-primary' : 'text-foreground'
              }`}
            >
              <BookOpen className="w-3 h-3" /> Лента заметок
            </Link>

            {/* Exchange Rate Display */}
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground px-2">
              <span className="font-mono text-primary">K</span>
              <span>{isRateLoading ? '...' : kasRateFormatted}</span>
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-1 rounded-full hover:bg-secondary transition-colors text-foreground"
              aria-label="Переключить тему"
            >
              <ThemeIcon className="h-3 w-3" />
            </motion.button>

            {/* Cart */}
            <Link to={createPageUrl('Cart')} className="relative flex items-center">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="p-1 rounded-full hover:bg-secondary transition-colors text-foreground"
              >
                <ShoppingCart className="h-3 w-3" />
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center p-0 text-xs bg-orange-500 hover:bg-orange-500 text-white">
                    {cartItems.length}
                  </Badge>
                )}
              </motion.div>
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="p-1 rounded-full hover:bg-secondary transition-colors text-foreground"
                  >
                    <User className="h-3 w-3" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-lg bg-card border-border">
                  <DropdownMenuLabel className="text-foreground text-sm">{user.full_name || 'Профиль'}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Profile')} className="flex items-center text-foreground hover:text-primary text-sm">
                      <UserCog className="w-3 h-3 mr-2" />
                      Мой профиль
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('ReferralDashboard')} className="flex items-center text-foreground hover:text-primary text-sm">
                      <Users className="w-3 h-3 mr-2" />
                      Реферальная программа
                    </Link>
                  </DropdownMenuItem>
                  
                  {!canAccessAuthorPanel && (
                    <DropdownMenuItem asChild>
                      <Link
                        to={createPageUrl('RegisterAuthor')}
                        className="flex items-center text-purple-600 font-medium text-sm"
                      >
                        <BookOpen className="w-3 h-3 mr-2" />
                        Стать автором
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {canAccessAuthorPanel && (
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('AuthorPanel')} className="flex items-center text-foreground hover:text-primary text-sm">
                        <Crown className="w-3 h-3 mr-2 text-purple-600" />
                        Панель автора
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {canAccessModeration && (
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('ModerationPage')} className="flex items-center text-foreground hover:text-primary text-sm">
                        <Shield className="w-3 h-3 mr-2" />
                        Панель модерации
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {canAccessAdminPanel && (
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('AdminDashboard')} className="flex items-center text-foreground hover:text-primary text-sm">
                        <Shield className="w-3 h-3 mr-2 text-primary" />
                        <span className="font-bold text-primary text-sm">Панель администратора</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={logout} className="text-destructive text-sm">
                    <LogOut className="w-3 h-3 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button onClick={handleLoginClick} size="sm" className="h-6 px-3 text-sm">
                  <LogIn className="mr-1 h-3 w-3" />
                  Войти
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}