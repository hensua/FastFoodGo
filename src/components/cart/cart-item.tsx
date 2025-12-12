"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem as CartItemType } from "@/lib/types";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const handleRemove = () => {
    // This needs to be smarter to handle items with different notes as different entries
    // For now, it will remove all items of this product ID
    removeFromCart(item.product.id);
  };

  return (
    <div className="flex flex-col">
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
            {formatCurrency(item.product.price)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.note)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            readOnly
            className="h-8 w-12 text-center"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.note)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
      </div>
      {item.note && (
        <div className="mt-2 ml-20 text-sm text-muted-foreground bg-slate-100 p-2 rounded-md">
          <span className="font-semibold">Nota:</span> {item.note}
        </div>
      )}
    </div>
  );
}
