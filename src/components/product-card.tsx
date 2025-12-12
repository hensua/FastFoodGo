"use client";

import Image from "next/image";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full">
          <Image
            src={product.imageUrl}
            alt={product.name}
            data-ai-hint={product.imageHint}
            fill
            className="object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="font-headline text-lg">{product.name}</CardTitle>
        <CardDescription className="mt-2 text-sm">
          {product.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <p className="text-xl font-bold text-primary">
          {formatCurrency(product.price)}
        </p>
        <Button
          variant="outline"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={handleAddToCart}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Añadir
        </Button>
      </CardFooter>
    </Card>
  );
}
