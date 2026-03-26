import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const fetchCart = async () => {
    if (!user) {
      setCart(null);
      setCartTotal(0);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCart(data.cart);
      setCartTotal(data.total);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (menuItemId, quantity) => {
    try {
      const { data } = await api.post('/cart/add', { menuItemId, quantity });
      setCart(data);
      let total = 0;
      data.items.forEach(item => total += item.menuItem.price * item.quantity);
      setCartTotal(total);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to add',
        requiresClear: error.response?.data?.requiresClear || false
      };
    }
  };

  const updateQuantity = async (menuItemId, quantity) => {
    try {
      const { data } = await api.put('/cart/update', { menuItemId, quantity });
      setCart(data);
      let total = 0;
      data.items.forEach(item => total += item.menuItem.price * item.quantity);
      setCartTotal(total);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update' };
    }
  };

  const removeFromCart = async (menuItemId) => {
    try {
      const { data } = await api.delete('/cart/remove', { data: { menuItemId } });
      setCart(data);
      let total = 0;
      data.items.forEach(item => total += item.menuItem.price * item.quantity);
      setCartTotal(total);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to remove' };
    }
  };

  const clearCart = async () => {
    try {
      const { data } = await api.delete('/cart/clear');
      setCart(data);
      setCartTotal(0);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to clear' };
    }
  };

  return (
    <CartContext.Provider value={{ cart, cartTotal, loading, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
