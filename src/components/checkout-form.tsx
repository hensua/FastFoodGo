'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import CartItem from './cart/cart-item';
import { ScrollArea } from './ui/scroll-area';

export default function CheckoutForm() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    // Simular una llamada a la API
    await new Promise(resolve => setTimeout(resolve, 1500));

    const orderId = `FFG-${Date.now()}`;
    
    // Redirigir a la página de confirmación
    router.push(`/order-confirmation?orderId=${orderId}&paymentMethod=${paymentMethod}&total=${totalPrice}`);
    
    clearCart();
    setIsSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {cartItems.map(item => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between font-bold text-xl">
          <span>Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Método de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2 p-4 border rounded-md">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex-grow cursor-pointer">Efectivo</Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-md">
              <RadioGroupItem value="transfer" id="transfer" />
              <Label htmlFor="transfer" className="flex-grow cursor-pointer">Transferencia Bancaria</Label>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button 
            size="lg" 
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Confirmar Pedido'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
