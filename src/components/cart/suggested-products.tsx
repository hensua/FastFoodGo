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

export default function SuggestedProducts() {
  const { cartItems, addToCart } = useCart();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (cartItems.length > 0) {
        setIsLoading(true);
        const itemNames = cartItems.map((item) => item.product.name);
        const mockOrderHistory: string[] = [];
        
        try {
          const suggestedProducts = await getSuggestedItems(itemNames, mockOrderHistory);
          setSuggestions(suggestedProducts);
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

    const timer = setTimeout(fetchSuggestions, 500); // Debounce to avoid rapid calls
    return () => clearTimeout(timer);

  }, [cartItems]);

  if (isLoading) {
    return (
      <div className="mt-6">
        <Separator className="my-4" />
        <h4 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-accent" />
          <span>You might also like...</span>
        </h4>
        <div className="mt-4 space-y-4">
          {[...Array(2)].map((_, i) => (
             <div key={i} className="flex items-center gap-4">
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
    <div className="mt-6">
      <Separator className="my-4" />
      <h4 className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="h-5 w-5 text-accent" />
        <span>You might also like...</span>
      </h4>
      <div className="mt-4 flex flex-col gap-4">
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
                ${product.price.toFixed(2)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addToCart(product)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
