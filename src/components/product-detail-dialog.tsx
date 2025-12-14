'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { useCart } from '@/components/cart-provider';
import { formatCurrency } from '@/lib/utils';
import { Plus, Minus, Sparkles } from 'lucide-react';
import SuggestedProducts from './cart/suggested-products';
import { ScrollArea } from './ui/scroll-area';
import { products as allProducts } from '@/lib/data';


interface ProductDetailDialogProps {
  product: Product;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ProductDetailDialog({
  product,
  isOpen,
  onOpenChange,
}: ProductDetailDialogProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Reset quantity to 1 every time the dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onOpenChange(false);
  };

  const totalPrice = product.price * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md grid-rows-[auto_1fr_auto] p-0 max-h-[90vh] flex flex-col rounded-lg">
        <div className="relative aspect-square w-full overflow-hidden -m-px">
          <Image
            src={product.imageUrl}
            alt={product.name}
            data-ai-hint={product.imageHint}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>

        <ScrollArea className="overflow-y-auto">
          <div className="p-6 space-y-4">
              <DialogHeader className="p-0 text-left">
                  <DialogTitle className="text-3xl font-bold">{product.name}</DialogTitle>
                  <DialogDescription className="text-base pt-2">{product.description}</DialogDescription>
              </DialogHeader>

              <div>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </p>
              </div>
              
              <div className="mt-2">
                <h4 className="flex items-center gap-2 text-lg font-semibold">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <span>También te podría gustar...</span>
                </h4>
                <div className="pr-2">
                  <SuggestedProducts currentProduct={product} allProducts={allProducts} />
                </div>
              </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 pt-0 border-t sticky bottom-0 bg-background z-10 flex-row items-center justify-center gap-2">
           <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
               <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setQuantity(q => q + 1)}
              >
                <Plus className="h-5 w-5" />
              </Button>
           </div>
          <Button size="lg" className="w-full h-12 text-base" onClick={handleAddToCart}>
             Añadir {formatCurrency(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
