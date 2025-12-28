"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart-provider";
import AuthButton from "./auth-button";
import Link from "next/link";
import { defaultBranding } from "@/lib/branding-config";
import Image from "next/image";

interface HeaderProps {
  onCartClick: () => void;
  showCart?: boolean;
}

export default function Header({ onCartClick, showCart = true }: HeaderProps) {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" width={32} height={32} className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            {defaultBranding.appName}
          </h1>
        </Link>
        <div className="flex items-center gap-4">
          {showCart && (
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
          )}
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
