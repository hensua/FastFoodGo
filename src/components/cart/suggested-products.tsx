
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PlusCircle, Sparkles } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { getSuggestedItems } from "@/app/actions/order-actions";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

interface SuggestedProductsProps {
  currentProduct?: Product;
}

export default function SuggestedProducts({ currentProduct }: SuggestedProductsProps) {
  const { cartItems, addToCart } = useCart();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      let contextItems: string[] = [];
      if (currentProduct) {
        contextItems.push(currentProduct.name);
      } else {
        contextItems = cartItems.map((item) => item.product.name);
      }
      
      if (contextItems.length > 0) {
        setIsLoading(true);
        const mockOrderHistory: string[] = [];
        
        try {
          // Pass context items (either current product or cart) to get suggestions
          const suggestedProducts = await getSuggestedItems(contextItems, mockOrderHistory);
          // Filter out the current product from suggestions if it exists
          const filteredSuggestions = currentProduct
            ? suggestedProducts.filter(p => p.id !== currentProduct.id)
            : suggestedProducts;

          setSuggestions(filteredSuggestions);
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300); // Debounce
    return () => clearTimeout(timer);

  }, [cartItems, currentProduct]);

  if (isLoading) {
    return (
      <div className="mt-4">
        {!currentProduct && <Separator className="my-4" />}
        {!currentProduct && (
          <h4 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Sparkles className="h-5 w-5 text-accent" />
            <span>También te podría gustar...</span>
          </h4>
        )}
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
      {!currentProduct && <Separator className="my-4" />}
      {!currentProduct && (
        <h4 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <Sparkles className="h-5 w-5 text-accent" />
          <span>También te podría gustar...</span>
        </h4>
      )}
      <div className="flex flex-col gap-4">
        {suggestions.map((product) => (
          <div key={product.id} className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-md">
              <Image
                src={product.imageUrl}
                alt={product.name}
                data-ai-hint={product.imageHint}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-grow">
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(product.price)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addToCart(product)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
