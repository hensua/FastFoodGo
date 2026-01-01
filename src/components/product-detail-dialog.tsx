
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
  const { setItemQuantity, cartItems } = useCart();
  const [quantity, setQuantity] = useState(1);

  const itemInCart = cartItems.find(item => item.product.id === product.id);

  // Reset quantity every time the dialog opens, considering if item is already in cart
  useEffect(() => {
    if (isOpen) {
      const itemInCart = cartItems.find(item => item.product.id === product.id);
      setQuantity(itemInCart ? itemInCart.quantity : 1);
    }
  }, [isOpen, product, cartItems]);

  const handleUpdateCart = () => {
    setItemQuantity(product, quantity);
    onOpenChange(false);
  };

  const totalPrice = product.price * quantity;
  const buttonText = itemInCart 
    ? `Actualizar Carrito (${quantity}) - ${formatCurrency(totalPrice)}` 
    : `Añadir ${quantity} por ${formatCurrency(totalPrice)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
      onOpenAutoFocus={(e) => e.preventDefault()} 
      className="
        p-0 gap-0 flex flex-col overflow-hidden

        /* MÓVIL */
        h-[100dvh] max-h-[100dvh] w-full

        /* DESKTOP */
        md:w-[500px]
        md:max-w-[90vw]
        md:h-auto
        md:max-h-[90vh]
        md:rounded-2xl">

        {/* Imagen (sección auto) */}
        <div className="relative bg-muted shrink-0">
          <div className="relative w-full aspect-[4/3] max-h-[35dvh] overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              data-ai-hint={product.imageHint}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="
              absolute bottom-[-20px] right-6
              h-12 w-12 rounded-full
              bg-white shadow-lg
              hover:bg-gray-100

              z-50
            "
          >
            <Heart className="h-6 w-6 text-gray-500" />
          </Button>
        </div>

        {/* CONTENIDO SCROLL (sección 1fr) */}
        <ScrollArea className="min-h-0 flex-grow overscroll-contain">
          <div className="pb-4">
            <DialogHeader className="px-6 pt-4 pb-2 space-y-1 text-left">
              <DialogTitle className="text-2xl font-bold">
                {product.name}
              </DialogTitle>

              <div className="flex justify-between items-center pt-2">
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(product.price)}
                </p>

                <div className="flex items-center gap-1">
                  <Button
                    //variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <span className="text-base font-bold w-6 text-center">
                    {quantity}
                  </span>

                  <Button
                    //variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 space-y-3">
              <div>
                <h4 className="font-semibold text-xs mb-0.5">
                  Acerca del producto
                </h4>
                <DialogDescription className="text-sm leading-snug">
                  {product.description}
                </DialogDescription>
              </div>

              {/* SUGERIDOS */}
              <SuggestedProducts currentProduct={product} />
            </div>
          </div>
        </ScrollArea>

        {/* FOOTER FIJO (sección auto) */}
        <DialogFooter className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t bg-background shrink-0">
          <Button
            size="lg"
            className="w-full h-10 text-base"
            onClick={handleUpdateCart}
          >
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
