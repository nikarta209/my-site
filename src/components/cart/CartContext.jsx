import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Загрузка корзины из localStorage при первой загрузке
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('kasbook-cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      setCartItems([]);
    }
  }, []);

  // Сохранение корзины в localStorage при любом изменении
  useEffect(() => {
    localStorage.setItem('kasbook-cart', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cart-updated-for-legacy-components')); // Для совместимости, если где-то осталось
  }, [cartItems]);

  const addToCart = (book) => {
    if (!book || !book.id) {
        console.error("Attempted to add an invalid book to cart.", book);
        toast.error("Не удалось добавить книгу в корзину.");
        return;
    }

    setCartItems(prevItems => {
      const isItemInCart = prevItems.find(item => item.id === book.id);
      if (isItemInCart) {
        toast.info(`"${book.title || "Книга"}" уже в корзине.`);
        return prevItems;
      }
      toast.success(`"${book.title || "Книга"}" добавлена в корзину!`);
      return [...prevItems, { ...book, quantity: 1 }];
    });
  };

  const removeFromCart = (bookId) => {
    setCartItems(prevItems => {
      const updatedCart = prevItems.filter(item => item.id !== bookId);
      const removedItem = prevItems.find(item => item.id === bookId);
      if (removedItem) {
          toast.success(`"${removedItem.title || "Книга"}" удалена из корзины.`);
      }
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success("Корзина очищена.");
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price_kas || 0) * (item.quantity || 1), 0);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};