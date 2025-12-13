'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import CartItem from './cart/cart-item';
import { ScrollArea } from './ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';
import Link from 'next/link';

export default function CheckoutForm() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userData, isLoading: isUserDocLoading } = useDoc<AppUser>(userDocRef);

  const handlePlaceOrder = async () => {
    if (!user || !firestore || !userData) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo verificar el usuario.' });
      return;
    }
    
    if (!userData.deliveryAddress) {
      toast({ variant: 'destructive', title: 'Falta dirección', description: 'Por favor, añade una dirección de entrega en tu perfil antes de continuar.' });
      router.push('/profile?redirect=/checkout');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newOrderRef = doc(collection(firestore, 'users', user.uid, 'orders'));

      const orderData = {
        id: newOrderRef.id,
        customerId: user.uid,
        customerName: userData.displayName || 'Cliente Anónimo',
        customerPhoneNumber: userData.phoneNumber || '',
        deliveryAddress: userData.deliveryAddress,
        orderDate: serverTimestamp(),
        totalAmount: totalPrice,
        paymentMethod: paymentMethod,
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
      toast({ variant: 'destructive', title: 'Error Inesperado', description: 'No se pudo completar el pedido. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isAddressMissing = !isUserDocLoading && userData && !userData.deliveryAddress;

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
          <CardTitle>Pago y Entrega</CardTitle>
          <CardDescription>Confirma tu método de pago y dirección de entrega.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isUserDocLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" />Cargando datos de perfil...</div>}
          
          {isAddressMissing && (
             <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 rounded-md flex gap-3">
               <AlertTriangle className="h-5 w-5 mt-0.5"/>
               <div>
                  <h4 className="font-bold">Falta la dirección de entrega</h4>
                  <p className="text-sm">Por favor, <Link href="/profile?redirect=/checkout" className="underline font-semibold">ve a tu perfil</Link> para añadir una dirección antes de realizar el pedido.</p>
               </div>
            </div>
          )}

          {userData?.deliveryAddress && (
             <div className="space-y-2">
                <Label>Se entregará en:</Label>
                <p className="text-sm border p-3 rounded-md bg-muted/50">{userData.deliveryAddress}</p>
                <Link href="/profile?redirect=/checkout" className="text-sm text-primary hover:underline">Cambiar dirección</Link>
             </div>
          )}

          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex-grow cursor-pointer">Efectivo</Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="transfer" id="transfer" />
                <Label htmlFor="transfer" className="flex-grow cursor-pointer">Transferencia Bancaria</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            size="lg" 
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={isSubmitting || isUserDocLoading || isAddressMissing}
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
