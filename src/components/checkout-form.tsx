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
import { formatCurrency } from '@/lib/utils';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';

export default function CheckoutForm() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const handlePlaceOrder = async () => {
    if (!user || !firestore) {
      router.push('/login?redirect=/checkout');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use Firestore's auto-generated ID for the order document
      const newOrderRef = doc(collection(firestore, 'customers', user.uid, 'orders'));

      const orderData = {
        id: newOrderRef.id, // Use the generated ID
        customerId: user.uid,
        customerName: user.displayName || 'Cliente Anónimo',
        orderDate: serverTimestamp(),
        totalAmount: totalPrice,
        paymentMethod: paymentMethod,
        deliveryAddress: 'Por definir en mapa',
        status: 'pending',
        items: cartItems.map(item => ({
          productId: item.product.id,
          product: {
             name: item.product.name,
             price: item.product.price,
             imageUrl: item.product.imageUrl
          },
          quantity: item.quantity,
          note: item.note || null,
        })),
      };

      await setDoc(newOrderRef, orderData);
      
      router.push(`/order-confirmation?orderId=${orderData.id}&paymentMethod=${paymentMethod}&total=${totalPrice}`);
      
      clearCart();

    } catch (error) {
      console.error("Error al realizar el pedido:", error);
      // Here you might want to show a toast to the user
    } finally {
      setIsSubmitting(false);
    }
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
                <CartItem key={`${item.product.id}-${item.note}`} item={item} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between font-bold text-xl">
          <span>Total:</span>
          <span>{formatCurrency(totalPrice)}</span>
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
            disabled={isSubmitting || !user}
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
    