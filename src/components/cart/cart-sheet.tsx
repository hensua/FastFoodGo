"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/components/cart-provider";
import CartItem from "./cart-item";
import SuggestedProducts from "./suggested-products";
import { ShoppingCart } from "lucide-react";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { cartItems, totalPrice, totalItems } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="pr-6">
          <SheetTitle className="font-headline text-2xl">Your Order</SheetTitle>
          <SheetDescription>
            Review your items and proceed to checkout.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        {totalItems > 0 ? (
          <>
            <ScrollArea className="flex-grow pr-6">
              <div className="flex flex-col gap-4">
                {cartItems.map((item) => (
                  <CartItem key={item.product.id} item={item} />
                ))}
              </div>
              <SuggestedProducts />
            </ScrollArea>
            <Separator className="my-4" />
            <SheetFooter className="pr-6">
              <div className="flex w-full flex-col gap-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Proceed to Checkout
                </Button>
                <Button variant="outline" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
                  Continue Shopping
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-grow flex-col items-center justify-center gap-4 text-center">
             <ShoppingCart className="h-24 w-24 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold">Your cart is empty</h3>
            <p className="text-muted-foreground">Add some delicious food to get started!</p>
             <Button className="mt-4" onClick={() => onOpenChange(false)}>Start Ordering</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
