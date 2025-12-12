"use client";

import React, { useState, useMemo } from 'react';
import type { Product } from '@/lib/types';
import Header from '@/components/header';
import ProductList from '@/components/product-list';
import CartSheet from '@/components/cart/cart-sheet';
import { Button } from '@/components/ui/button';

interface OrderPageProps {
  products: Product[];
}

const categories = ['Todas', 'Hamburguesas', 'Pizzas', 'Acompañamientos', 'Bebidas', 'Otros'];

export default function OrderPage({ products }: OrderPageProps) {
  const [isCartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todas') {
      return products;
    }
    return products.filter(product => product.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => setCartOpen(true)} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold">
            ¡El sabor más rápido de la ciudad! 🍔
          </h1>
          <p className="mt-2 text-lg">Pide ahora y recibe en minutos.</p>
        </div>
        
        <div className="mb-8">
          <ScrollableCategoryFilters 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} 
          />
        </div>
        
        <ProductList products={filteredProducts} />
      </main>
      <CartSheet open={isCartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}


function ScrollableCategoryFilters({ selectedCategory, setSelectedCategory }: { selectedCategory: string, setSelectedCategory: (category: string) => void }) {
  return (
    <div className="relative">
      <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors
              ${selectedCategory === category
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card text-card-foreground hover:bg-muted'
              }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
