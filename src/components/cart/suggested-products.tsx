
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Minus, Plus, PlusCircle, Sparkles } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { getSimilarItems } from "@/app/actions/product-actions";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SuggestedProductsProps {
  currentProduct?: Product;
  allProducts?: Product[];
}

const SuggestedProductItem = ({ product }: { product: Product }) => {
  const { addToCart, updateQuantity, cartItems } = useCart();
  
  const itemInCart = cartItems.find(item => item.product.id === product.id);
  const quantityInCart = itemInCart ? itemInCart.quantity : 0;

  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 3000);
  };

  useEffect(() => {
    if (quantityInCart === 0) {
      setIsExpanded(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      if(isExpanded) {
        resetTimer();
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [quantityInCart, isExpanded]);

  const handleInteraction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setIsExpanded(true);
    resetTimer();
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    handleInteraction(e, () => addToCart(product));
  }

  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    handleInteraction(e, () => updateQuantity(product.id, quantityInCart + 1));
  }

  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    handleInteraction(e, () => updateQuantity(product.id, quantityInCart - 1));
  }
  
  const handleCompactClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
        setIsExpanded(true);
        resetTimer();
    }
  }
  
  return (
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            data-ai-hint={product.imageHint}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-sm">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(product.price)}
          </p>
        </div>
        <div className="relative h-8 flex items-center justify-end">
            {quantityInCart === 0 ? (
                <Button 
                    onClick={handleAddToCart} 
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                >
                    <PlusCircle className="mr-1 h-4 w-4"/> Añadir
                </Button>
            ) : (
              <div 
                className={cn(
                  "flex items-center justify-center bg-primary text-primary-foreground rounded-md transition-all duration-300 h-8 text-sm",
                   isExpanded ? 'w-[70px] px-1' : 'w-8'
                )}
                onClick={handleCompactClick}
              >
                 {isExpanded ? (
                    <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                        onClick={handleDecreaseQuantity}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-sm w-4 text-center select-none">{quantityInCart}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                        onClick={handleIncreaseQuantity}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    </>
                 ) : (
                    <span className="font-bold cursor-pointer select-none text-sm">{quantityInCart}</span>
                 )}
              </div>
            )}
          </div>
      </div>
  );
};


export default function SuggestedProducts({ currentProduct, allProducts = [] }: SuggestedProductsProps) {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = () => {
      setIsLoading(true);
      let contextProduct: Product | undefined = currentProduct;
      
      if (!contextProduct && allProducts.length > 0) {
        contextProduct = allProducts[0];
      }

      if (contextProduct) {
        const suggestedProducts = getSimilarItems(contextProduct, allProducts);
        const filteredSuggestions = suggestedProducts.filter(p => p.id !== contextProduct!.id);
        setSuggestions(filteredSuggestions.slice(0, 3));
      } else {
        setSuggestions([]);
      }
      setIsLoading(false);
    };

    fetchSuggestions();
  }, [currentProduct, allProducts]);

  if (isLoading) {
    return (
      <div className="mt-4">
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
             <div key={`skeleton-${i}`} className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className='font-bold mt-4 mb-2'>También te podría gustar</h4>
      <div className="flex flex-col gap-3">
        {suggestions.map((product) => (
          <SuggestedProductItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
