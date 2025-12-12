"use client";

import React, { useState } from 'react';
import type { Product } from '@/lib/types';
import Header from '@/components/header';
import ProductList from '@/components/product-list';
import CartSheet from '@/components/cart/cart-sheet';

interface OrderPageProps {
  products: Product[];
}

export default function OrderPage({ products }: OrderPageProps) {
  const [isCartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => setCartOpen(true)} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-8 text-center text-primary drop-shadow-sm">
          Our Menu
        </h1>
        <ProductList products={products} />
      </main>
      <CartSheet open={isCartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
