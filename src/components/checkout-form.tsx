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
import { collection, serverTimestamp } from 'firebase/firestore';

export default function CheckoutForm() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const handlePlaceOrder = async () => {
    if (!user) {
      // Idealmente, este caso no debería ocurrir si la página está protegida,
      // pero es una buena práctica verificarlo.
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const orderId = `FFG-${Date.now()}`;
      
      const ordersCollection = collection(firestore, 'customers', user.uid, 'orders');

      // Crear el documento del pedido
      const orderData = {
        id: orderId,
        customerId: user.uid,
        orderDate: serverTimestamp(),
        totalAmount: totalPrice,
        paymentMethod: paymentMethod,
        deliveryAddress: 'Por definir en mapa', // Placeholder
        status: 'pending', // Estado inicial del pedido
      };

      // Guardar el pedido principal de forma no bloqueante
      const orderPromise = addDocumentNonBlocking(ordersCollection, orderData);
      
      // Guardar los artículos del pedido
      // En una implementación real, esto se haría en una transacción o batch write desde el backend
      // para garantizar la atomicidad. Por ahora, los guardamos individualmente.
      const orderItemsCollection = collection(firestore, 'customers', user.uid, 'orders', orderId, 'orderItems');

      cartItems.forEach(item => {
        const orderItemData = {
          orderId: orderId,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          productName: item.product.name // Denormalizamos para facilitar la visualización
        };
        addDocumentNonBlocking(orderItemsCollection, orderItemData);
      });

      // Esperar solo si es necesario, pero en este caso, la navegación puede ser inmediata
      // await orderPromise; // Opcional

      // Redirigir a la página de confirmación
      router.push(`/order-confirmation?orderId=${orderId}&paymentMethod=${paymentMethod}&total=${totalPrice}`);
      
      clearCart();

    } catch (error) {
      console.error("Error al realizar el pedido:", error);
      // Aquí podrías mostrar un toast al usuario
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
                <CartItem key={item.product.id} item={item} />
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
