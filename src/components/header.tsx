"use client";

import { ShoppingCart, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart-provider";
import AuthButton from "./auth-button";
import Link from "next/link";

interface HeaderProps {
  onCartClick: () => void;
}

export default function Header({ onCartClick }: HeaderProps) {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            FastFoodGo
          </h1>
        </Link>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onCartClick}
            aria-label={`Open cart with ${totalItems} items`}
          >
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full p-0"
              >
                {totalItems}
              </Badge>
            )}
          </Button>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
