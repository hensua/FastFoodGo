'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/lib/types';
import { useCart } from '@/components/cart-provider';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, Sparkles } from 'lucide-react';
import SuggestedProducts from './cart/suggested-products';
import { ScrollArea } from './ui/scroll-area';


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
  const [note, setNote] = useState('');

  const handleAddToCart = () => {
    addToCart(product, 1);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md grid-rows-[auto_1fr_auto] p-0 max-h-[90svh] flex flex-col">
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            data-ai-hint={product.imageHint}
            fill
            className="object-cover"
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
                  <SuggestedProducts currentProduct={product}/>
                </div>
              </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-0 border-t sticky bottom-0 bg-background z-10">
          <Button size="lg" className="w-full" onClick={handleAddToCart}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Añadir al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
