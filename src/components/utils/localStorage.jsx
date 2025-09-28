
// Утилиты для работы с localStorage
export const STORAGE_KEYS = {
  CART: 'kasbook_cart',
  WISHLIST: 'kasbook_wishlist',
  USER: 'kasbook_user',
  TOKEN: 'kasbook_token',
  PREFERENCES: 'user_preferences',
  REWARDS: 'kasbook_rewards'
};

// Корзина
export const cartStorage = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || '[]');
    } catch {
      return [];
    }
  },

  set: (cart) => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
  },

  add: (book) => {
    const cart = cartStorage.get();
    const existingItem = cart.find(item => item.id === book.id);
    
    if (!existingItem) {
      cart.push({
        ...book,
        addedAt: Date.now()
      });
      cartStorage.set(cart);
      return true;
    }
    return false;
  },

  remove: (bookId) => {
    const cart = cartStorage.get().filter(item => item.id !== bookId);
    cartStorage.set(cart);
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.CART);
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
  },

  has: (bookId) => {
    const cart = cartStorage.get();
    return cart.some(item => item.id === bookId);
  },

  getTotal: () => {
    const cart = cartStorage.get();
    return cart.reduce((total, item) => total + (item.price_kas || 0), 0);
  },

  getCount: () => {
    return cartStorage.get().length;
  }
};

// Wishlist
export const wishlistStorage = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST) || '[]');
    } catch {
      return [];
    }
  },

  set: (wishlist) => {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: wishlist }));
  },

  add: (book) => {
    const wishlist = wishlistStorage.get();
    const existingItem = wishlist.find(item => item.id === book.id);
    
    if (!existingItem) {
      wishlist.push({
        ...book,
        addedAt: Date.now()
      });
      wishlistStorage.set(wishlist);
      return true;
    }
    return false;
  },

  remove: (bookId) => {
    const wishlist = wishlistStorage.get().filter(item => item.id !== bookId);
    wishlistStorage.set(wishlist);
  },

  toggle: (book) => {
    const wishlist = wishlistStorage.get();
    const existingIndex = wishlist.findIndex(item => item.id === book.id);
    
    if (existingIndex >= 0) {
      wishlist.splice(existingIndex, 1);
      wishlistStorage.set(wishlist);
      return false; // removed
    } else {
      wishlist.push({
        ...book,
        addedAt: Date.now()
      });
      wishlistStorage.set(wishlist);
      return true; // added
    }
  },

  has: (bookId) => {
    const wishlist = wishlistStorage.get();
    return wishlist.some(item => item.id === bookId);
  },

  isInWishlist: (bookId) => {
    const wishlist = wishlistStorage.get();
    return wishlist.some(item => item.id === bookId);
  },

  getCount: () => {
    return wishlistStorage.get().length;
  }
};

// Rewards система
export const rewardsStorage = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.REWARDS) || '{}');
    } catch {
      return {};
    }
  },

  set: (rewards) => {
    localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
  },

  addActivity: (userEmail, activity) => {
    const rewards = rewardsStorage.get();
    if (!rewards[userEmail]) {
      rewards[userEmail] = {
        totalEarned: 0,
        activities: [],
        lastActivity: null
      };
    }

    const activityRecord = {
      type: activity.type,
      reward: activity.reward || 0.1,
      timestamp: Date.now(),
      description: activity.description
    };

    rewards[userEmail].activities.unshift(activityRecord);
    rewards[userEmail].totalEarned += activityRecord.reward;
    rewards[userEmail].lastActivity = Date.now();

    // Ограничиваем историю последними 100 активностями
    if (rewards[userEmail].activities.length > 100) {
      rewards[userEmail].activities = rewards[userEmail].activities.slice(0, 100);
    }

    rewardsStorage.set(rewards);
    return activityRecord;
  },

  getUserRewards: (userEmail) => {
    const rewards = rewardsStorage.get();
    return rewards[userEmail] || { totalEarned: 0, activities: [], lastActivity: null };
  }
};

// Tiered система
export const tieredSystem = {
  // Расчёт процента роялти на основе квалифицированных продаж
  calculateRoyaltyPercentage: (qualifiedSales) => {
    if (qualifiedSales >= 100001) return 90; // Platinum Elite
    if (qualifiedSales >= 50001) return 89;  // Platinum
    if (qualifiedSales >= 20001) return 88;  // Diamond
    if (qualifiedSales >= 5001) return 87;   // Gold
    if (qualifiedSales >= 1501) return 86;   // Silver Pro
    if (qualifiedSales >= 501) return 85;    // Silver
    if (qualifiedSales >= 101) return 84;    // Bronze Pro
    if (qualifiedSales >= 51) return 83;     // Bronze
    if (qualifiedSales >= 21) return 82;     // Rising
    if (qualifiedSales >= 8) return 81;      // Starter
    return 80; // Beginner
  },

  // Получение информации о уровне
  getTierInfo: (qualifiedSales) => {
    const tiers = [
      { name: 'Beginner', min: 0, max: 7, percentage: 80 },
      { name: 'Starter', min: 8, max: 20, percentage: 81 },
      { name: 'Rising', min: 21, max: 50, percentage: 82 },
      { name: 'Bronze', min: 51, max: 100, percentage: 83 },
      { name: 'Bronze Pro', min: 101, max: 500, percentage: 84 },
      { name: 'Silver', min: 501, max: 1500, percentage: 85 },
      { name: 'Silver Pro', min: 1501, max: 5000, percentage: 86 },
      { name: 'Gold', min: 5001, max: 20000, percentage: 87 },
      { name: 'Diamond', min: 20001, max: 50000, percentage: 88 },
      { name: 'Platinum', min: 50001, max: 100000, percentage: 89 },
      { name: 'Platinum Elite', min: 100001, max: Infinity, percentage: 90 }
    ];

    const currentTier = tiers.find(tier => 
      qualifiedSales >= tier.min && qualifiedSales <= tier.max
    ) || tiers[0];

    const nextTierIndex = tiers.findIndex(tier => tier.name === currentTier.name) + 1;
    const nextTier = nextTierIndex < tiers.length ? tiers[nextTierIndex] : null;

    return {
      current: currentTier,
      next: nextTier,
      salesNeeded: nextTier ? nextTier.min - qualifiedSales : 0,
      progress: nextTier ? 
        ((qualifiedSales - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100
    };
  },

  // Расчёт выплаты автору
  calculateAuthorPayout: (salePrice, qualifiedSales, isResale = false) => {
    const royaltyPercentage = tieredSystem.calculateRoyaltyPercentage(qualifiedSales);
    let authorPercentage = royaltyPercentage;

    // Для перепродаж автор получает фиксированные 5%
    if (isResale) {
      authorPercentage = 5;
    }

    const authorPayout = (salePrice * authorPercentage) / 100;
    const platformFee = salePrice - authorPayout;

    return {
      salePrice,
      authorPayout,
      platformFee,
      authorPercentage,
      isResale
    };
  }
};
