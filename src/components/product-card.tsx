
"use client";

import Image from "next/image";
import type { Product } from "@/lib/types";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "./cart-provider";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
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
    <Card 
      className="flex h-full flex-col overflow-hidden transition-all duration-300 md:hover:shadow-lg md:hover:-translate-y-1 cursor-pointer group"
      onClick={onClick}
    >
      <div className="bg-gray-100 relative overflow-hidden aspect-square">
        <Image
          src={product.imageUrl}
          alt={product.name}
          data-ai-hint={product.imageHint}
          fill
          className="object-cover md:group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
        />
        {product.tag && (
          <div className="absolute top-1 right-1 bg-yellow-400 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
            {product.tag}
          </div>
        )}
      </div>
      <CardContent className="p-2 flex-1 flex flex-col justify-between">
        <div>
            <h3 className="font-bold text-sm leading-tight truncate mb-1">{product.name}</h3>
            <p className="text-gray-500 text-[11px] leading-snug line-clamp-2">{product.description}</p>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="font-bold text-sm text-orange-600 flex-grow">{formatCurrency(product.price)}</span>
          
          <div className="relative h-6 flex items-center justify-end">
            {quantityInCart === 0 ? (
                <Button 
                    onClick={handleAddToCart} 
                    size="icon"
                    className="h-6 w-6 rounded-md p-1"
                >
                    <Plus className="h-4 w-4"/>
                </Button>
            ) : (
              <div 
                className={cn(
                  "flex items-center justify-center bg-primary text-primary-foreground rounded-md transition-all duration-300 h-6 text-sm",
                   isExpanded ? 'w-[60px] px-1' : 'w-6'
                )}
                onClick={handleCompactClick}
              >
                 {isExpanded ? (
                    <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                        onClick={handleDecreaseQuantity}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-bold text-sm w-4 text-center select-none">{quantityInCart}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                        onClick={handleIncreaseQuantity}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                    </>
                 ) : (
                    <span className="font-bold cursor-pointer select-none text-xs">{quantityInCart}</span>
                 )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
