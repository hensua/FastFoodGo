
"use client";

import React, { useState, useMemo } from 'react';
import type { Product } from '@/lib/types';
import Header from '@/components/header';
import ProductList from '@/components/product-list';
import CartSheet from '@/components/cart/cart-sheet';
import { Button } from '@/components/ui/button';
import ProductDetailDialog from '@/components/product-detail-dialog';
import Footer from '@/components/footer';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import type { BrandingConfig } from '@/lib/branding-config';

interface OrderPageProps {
  products: Product[];
  loading: boolean;
  brandingConfig: BrandingConfig;
}

const categories = ['Todas', 'Hamburguesas', 'Pizzas', 'Acompañamientos', 'Bebidas', 'Otros'];

export default function OrderPage({ products, loading, brandingConfig }: OrderPageProps) {
  const [isCartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const filteredProducts = useMemo(() => {
    if (loading) return [];
    if (selectedCategory === 'Todas') {
      return products;
    }
    return products.filter(product => product.category === selectedCategory);
  }, [products, selectedCategory, loading]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleDialogClose = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onCartClick={() => setCartOpen(true)} brandingConfig={brandingConfig} />

      <main className="container mx-auto px-4 py-8 flex-grow">
        <div 
          className="bg-gradient-to-r rounded-2xl p-8 mb-8 text-white shadow-lg relative overflow-hidden"
          style={{
            '--tw-gradient-from': `hsl(var(--primary)) var(--tw-gradient-from-position)`,
            '--tw-gradient-to': `hsl(var(--accent)) var(--tw-gradient-to-position)`,
            '--tw-gradient-stops': `var(--tw-gradient-from), var(--tw-gradient-to)`,
          } as React.CSSProperties}
        >
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">¡El sabor más rápido de la ciudad! 🍔</h1>
            <p className="opacity-90">Pide ahora y recibe en minutos.</p>
          </div>
          <div
            className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10 w-[200px] h-[200px]"
            style={{ color: brandingConfig.theme.bannerAccent }}
            dangerouslySetInnerHTML={{ __html: brandingConfig.logoSvg }}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={isSelected ? 'default' : 'secondary'}
                className={cn(
                  "px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all duration-300",
                  !isSelected && "text-secondary-foreground/80 hover:text-secondary-foreground"
                )}
              >
                {category}
              </Button>
            )
          })}
        </div>
        
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        ) : (
            <ProductList products={filteredProducts} onProductClick={handleProductClick} />
        )}
      </main>
      <CartSheet open={isCartOpen} onOpenChange={setCartOpen} />
      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onOpenChange={handleDialogClose}
        />
      )}
       <Footer brandingConfig={brandingConfig}/>
    </div>
  );
}

    