import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItemCount, setCartItemCount] = useState(0);
  const { user } = useAuth();

  const fetchCartCount = async () => {
    if (user && user.role === 'buyer') {
      try {
        const response = await cartAPI.getCart();
        let items = [];
        
        if (response?.data?.data) {
          items = response.data.data.items;
        } else if (response?.data) {
          items = response.data.items;
        }
        
        if (Array.isArray(items)) {
          setCartItemCount(items.length);
        }
      } catch (error) {
        console.error('Error fetching cart count:', error);
        setCartItemCount(0);
      }
    } else {
      setCartItemCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [user]);

  const updateCartCount = (count) => {
    if (typeof count === 'number') {
      setCartItemCount(count);
    } else {
      fetchCartCount();
    }
  };

  const value = {
    cartItemCount,
    updateCartCount,
    fetchCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  return useContext(CartContext);
}; 