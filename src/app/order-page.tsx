"use client";

import React, { useState, useMemo } from 'react';
import type { Product } from '@/lib/types';
import Header from '@/components/header';
import ProductList from '@/components/product-list';
import CartSheet from '@/components/cart/cart-sheet';
import { Button } from '@/components/ui/button';
import ProductDetailDialog from '@/components/product-detail-dialog';
import { Sparkles, UtensilsCrossed } from 'lucide-react';

interface OrderPageProps {
  products: Product[];
  loading: boolean;
}

const categories = ['Todas', 'Hamburguesas', 'Pizzas', 'Acompañamientos', 'Bebidas', 'Otros'];

export default function OrderPage({ products, loading }: OrderPageProps) {
  const [isCartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isChefOpen, setIsChefOpen] = useState(false); // State for AI Chef

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todas') {
      return products;
    }
    return products.filter(product => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleDialogClose = () => {
    setSelectedProduct(null);
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-orange-50 text-orange-600 font-bold">Cargando SpeedyBite...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => setCartOpen(true)} />
      
      {/* Botón Flotante Chef */}
      <button 
        onClick={() => setIsChefOpen(true)}
        className="fixed bottom-6 right-6 z-30 bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-300 hover:scale-110 transition-transform animate-bounce flex items-center gap-2 font-bold"
      >
        <Sparkles size={20} className="text-yellow-300" /> Chef Virtual
      </button>

      {/* Aquí podrías añadir el AIChefModal en el futuro */}
      {/* <AIChefModal isOpen={isChefOpen} onClose={() => setIsChefOpen(false)} products={products} /> */}

      <main className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 mb-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">¡El sabor más rápido de la ciudad! 🍔</h1>
            <p className="opacity-90">Pide ahora y recibe en minutos.</p>
          </div>
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
            <UtensilsCrossed size={200} />
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          <Button
            onClick={() => setSelectedCategory('Todas')}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${selectedCategory === 'Todas' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Todas
          </Button>
          {categories.slice(1).map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${selectedCategory === category ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              {category}
            </Button>
          ))}
        </div>
        
        <ProductList products={filteredProducts} onProductClick={handleProductClick} />
      </main>
      <CartSheet open={isCartOpen} onOpenChange={setCartOpen} />
      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onOpenChange={handleDialogClose}
        />
      )}
    </div>
  );
}