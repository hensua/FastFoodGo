
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PlusCircle, Sparkles } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { getSimilarItems } from "@/app/actions/product-actions";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

interface SuggestedProductsProps {
  currentProduct?: Product;
  allProducts?: Product[];
}

export default function SuggestedProducts({ currentProduct, allProducts = [] }: SuggestedProductsProps) {
  const { addToCart } = useCart();
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
      {currentProduct && <Separator className="my-4" />}
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
