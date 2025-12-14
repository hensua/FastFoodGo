'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Minus, Heart } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import SuggestedProducts from './cart/suggested-products';
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
      <DialogContent className="sm:max-w-md p-0 max-h-[90vh] flex flex-col rounded-lg overflow-hidden">
        <ScrollArea className="flex-grow">
          <div className="relative bg-muted rounded-t-lg">
            <div className="relative aspect-video w-full overflow-hidden p-6">
              <Image
                src={product.imageUrl}
                alt={product.name}
                data-ai-hint={product.imageHint}
                fill
                className="object-contain"
              />
            </div>
             <Button variant="ghost" size="icon" className="absolute bottom-[-20px] right-6 h-12 w-12 rounded-full bg-white shadow-lg hover:bg-gray-100">
                <Heart className="h-6 w-6 text-gray-500" />
            </Button>
          </div>
          
          <div className="p-6 space-y-4">
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="text-3xl font-bold">{product.name}</DialogTitle>
            </DialogHeader>

            <div className="flex justify-between items-center mt-4">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(product.price)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-bold w-10 text-center">{quantity}</span>
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
                <h4 className='font-bold mt-4 mb-1'>Acerca del producto</h4>
                <DialogDescription className="text-base">{product.description}</DialogDescription>
            </div>

            <SuggestedProducts currentProduct={product} allProducts={allProducts} />
          </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t bg-background">
          <Button size="lg" className="w-full h-12 text-base" onClick={handleAddToCart}>
            Añadir {formatCurrency(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
