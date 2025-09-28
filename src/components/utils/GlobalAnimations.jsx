import React from 'react';
import { motion } from 'framer-motion';

// Global animation variants
export const globalAnimations = {
  button: {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.02 },
    transition: { duration: 0.1, ease: "easeInOut" }
  },
  
  card: {
    whileHover: { 
      y: -2,
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)"
    },
    transition: { duration: 0.2, ease: "easeOut" }
  },
  
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  
  icon: {
    whileHover: { 
      rotate: [0, -10, 10, 0],
      scale: 1.1
    },
    whileTap: { scale: 0.9 },
    transition: { duration: 0.3 }
  }
};

// Enhanced Button component with global animations
export const AnimatedButton = React.forwardRef(({ 
  children, 
  variant = 'default',
  className = '',
  disabled = false,
  onClick,
  ...props 
}, ref) => {
  const baseClass = `
    inline-flex items-center justify-center rounded-md text-sm font-medium 
    transition-colors focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 
    disabled:pointer-events-none ring-offset-background
  `;
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 py-2 px-4',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 py-2 px-4',
    ghost: 'hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4',
    link: 'underline-offset-4 hover:underline text-primary h-auto p-0',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white h-10 py-2 px-4'
  };

  return (
    <motion.button
      ref={ref}
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...globalAnimations.button}
      {...props}
    >
      {children}
    </motion.button>
  );
});

// Enhanced Card component with global animations
export const AnimatedCard = React.forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...globalAnimations.card}
      {...props}
    >
      {children}
    </motion.div>
  );
});

// Icon wrapper with animations
export const AnimatedIcon = ({ 
  icon: Icon, 
  className = '',
  color = '#FF6B00',
  size = 'w-5 h-5',
  ...props 
}) => {
  return (
    <motion.div
      className="inline-flex items-center justify-center"
      {...globalAnimations.icon}
      {...props}
    >
      <Icon 
        className={`${size} ${className}`} 
        style={{ color: color }}
      />
    </motion.div>
  );
};

// Global loading component
export const AnimatedLoader = ({ size = 'md', color = '#FF6B00' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      className={`${sizes[size]} border-2 border-transparent rounded-full`}
      style={{ 
        borderTopColor: color,
        borderRightColor: `${color}80`
      }}
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 1, 
        repeat: Infinity, 
        ease: "linear" 
      }}
    />
  );
};

// Personalized banner data helper
export const getPersonalizedBanners = (user, userPurchases = [], userPreferences = {}) => {
  if (!user) return [];

  const banners = [];

  // Welcome banner for new users
  if (!userPurchases || userPurchases.length === 0) {
    banners.push({
      id: 'welcome-new',
      type: 'personalized',
      title: `Добро пожаловать, ${user.full_name?.split(' ')[0] || 'читатель'}! 👋`,
      subtitle: 'Откройте для себя тысячи книг на блокчейне',
      cta: 'Начать изучение',
      href: '/catalog',
      gradient: 'from-purple-600 to-blue-600',
      accentColor: '#FF6B00'
    });
  }

  // Returning user with preferences
  if (userPreferences.favoriteGenre) {
    banners.push({
      id: 'genre-recommendation',
      type: 'personalized',
      title: `Новинки в жанре "${userPreferences.favoriteGenre}" 📚`,
      subtitle: 'Специально подобранные книги для вас',
      cta: 'Посмотреть',
      href: `/catalog?genre=${userPreferences.favoriteGenre}`,
      gradient: 'from-green-500 to-teal-600',
      accentColor: '#FF6B00'
    });
  }

  // Continue reading banner
  if (userPreferences.currentlyReading) {
    banners.push({
      id: 'continue-reading',
      type: 'personalized', 
      title: 'Продолжить чтение 📖',
      subtitle: `"${userPreferences.currentlyReading.title}" - ${userPreferences.currentlyReading.progress}%`,
      cta: 'Читать дальше',
      href: `/reader?bookId=${userPreferences.currentlyReading.id}`,
      gradient: 'from-orange-500 to-red-500',
      accentColor: '#FFD700'
    });
  }

  return banners;
};

export default globalAnimations;