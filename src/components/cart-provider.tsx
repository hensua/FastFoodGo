
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import type { Product, CartItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setItemQuantity: (product: Product, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const localData = window.localStorage.getItem('fastfoodgo-cart');
      if (localData) {
        setCartItems(JSON.parse(localData));
      }
    } catch (error) {
      console.error("Error loading cart from localStorage", error);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Don't save during the initial load, wait until state is rehydrated.
    if (!isInitialLoad) {
      try {
        window.localStorage.setItem('fastfoodgo-cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error("Error saving cart to localStorage", error);
      }
    }
  }, [cartItems, isInitialLoad]);


  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        // If item exists, map over the array and update its quantity
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      // If item doesn't exist, add it as a new item
      return [...prevItems, { product, quantity }];
    });
    
    toast({
      title: "Añadido al carrito",
      description: `${product.name} ha sido añadido a tu carrito.`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
        removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
            ? { ...item, quantity }
            : item
      )
    );
  };
  
  const setItemQuantity = (product: Product, quantity: number) => {
     if (quantity <= 0) {
        removeFromCart(product.id);
        return;
     }

     setCartItems((prevItems) => {
        const existingItem = prevItems.find(item => item.product.id === product.id);
        if(existingItem) {
          return prevItems.map(item => 
            item.product.id === product.id 
            ? { ...item, quantity: quantity } 
            : item
          );
        }
        // If it doesn't exist, add it.
        return [...prevItems, { product, quantity }];
     });
     
     toast({
      title: "Carrito actualizado",
      description: `Ahora tienes ${quantity} x ${product.name}.`,
    });
  }

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    setItemQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }
  return context;
}
