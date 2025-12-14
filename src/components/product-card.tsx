
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
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToCart, updateQuantity, cartItems } = useCart();
  
  const [quantityInCart, setQuantityInCart] = useState(0);

  useEffect(() => {
    const itemInCart = cartItems.find(item => item.product.id === product.id);
    setQuantityInCart(itemInCart ? itemInCart.quantity : 0);
  }, [cartItems, product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    addToCart(product);
  }

  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, quantityInCart + 1);
  }

  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, quantityInCart - 1);
  }

  return (
    <Card 
      className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
      onClick={onClick}
    >
      <div className="bg-gray-100 relative overflow-hidden aspect-[4/3]">
        <Image
          src={product.imageUrl}
          alt={product.name}
          data-ai-hint={product.imageHint}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.tag && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full shadow-md">
            {product.tag}
          </div>
        )}
      </div>
      <CardContent className="p-3 flex-1 flex flex-col">
        <h3 className="font-bold text-base leading-tight truncate">{product.name}</h3>
        <p className="text-gray-500 text-xs mb-2 line-clamp-2 flex-1 h-8">{product.description}</p>
        <div className="flex justify-between items-center mt-auto">
          <span className="font-bold text-base text-orange-600">{formatCurrency(product.price)}</span>
          {quantityInCart === 0 ? (
            <Button 
              onClick={handleAddToCart} 
              size="icon"
              className="h-8 w-8 bg-yellow-400 text-gray-900 hover:bg-yellow-500"
            >
              <Plus />
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleDecreaseQuantity}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold w-6 text-center">{quantityInCart}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleIncreaseQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
