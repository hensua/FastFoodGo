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

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToCart } = useCart();
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se abra el diálogo de detalles
    addToCart(product);
  }

  return (
    <Card 
      className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
      onClick={onClick}
    >
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          data-ai-hint={product.imageHint}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
          <span className="font-bold text-orange-600">{formatCurrency(product.price)}</span>
        </div>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{product.description}</p>
        <Button 
          onClick={handleAddToCart} 
          className="w-full"
        >
          Agregar
        </Button>
      </CardContent>
    </Card>
  );
}