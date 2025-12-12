"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem as CartItemType } from "@/lib/types";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 overflow-hidden rounded-md">
        <Image
          src={item.product.imageUrl}
          alt={item.product.name}
          data-ai-hint={item.product.imageHint}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-grow">
        <p className="font-semibold">{item.product.name}</p>
        <p className="text-sm text-muted-foreground">
          ${item.product.price.toFixed(2)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) =>
            updateQuantity(item.product.id, parseInt(e.target.value, 10) || 1)
          }
          className="h-8 w-12 text-center"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
       <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => removeFromCart(item.product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
    </div>
  );
}
