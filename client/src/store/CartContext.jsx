import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  // Initialize state from localStorage if available
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('canteen-pro-cart');
      if (savedCart) {
        return JSON.parse(savedCart);
      }
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
    }
    return [];
  });

  const [orderNotes, setOrderNotes] = useState(() => {
    return localStorage.getItem('canteen-pro-notes') || '';
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync state to localStorage on changes
  useEffect(() => {
    localStorage.setItem('canteen-pro-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('canteen-pro-notes', orderNotes);
  }, [orderNotes]);

  // Derived state: Total Price
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  // Derived state: Total Items Count
  const cartCount = useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  // Actions
  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.id === product.id);

      let newCartItems;
      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + (product.quantity || 1),
        };
        newCartItems = updatedItems;
      } else {
        // New item
        newCartItems = [...prevItems, { ...product, quantity: product.quantity || 1 }];
      }

      // Sync item notes to global order notes automatically
      if (product.itemNotes) {
        const noteString = `${product.name} - ${product.itemNotes}`;
        setOrderNotes(prev => {
          if (!prev) return noteString;
          if (!prev.includes(noteString)) {
            return `${prev}\n${noteString}`;
          }
          return prev;
        });
      }

      return newCartItems;
    });
    setIsCartOpen(true); // Open cart automatically when adding
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setOrderNotes('');
  };

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  const value = {
    cartItems,
    orderNotes,
    setOrderNotes,
    cartTotal,
    cartCount,
    isCartOpen,
    toggleCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
