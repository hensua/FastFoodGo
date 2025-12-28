
'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Truck, Gift } from 'lucide-react';
import CartItem from './cart/cart-item';
import { ScrollArea } from './ui/scroll-area';
import { formatCurrency, DELIVERY_FEE } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import type { BrandingConfig } from '@/lib/branding-config';

export default function CheckoutForm({ brandingConfig }: { brandingConfig: BrandingConfig }) {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tip, setTip] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  const { user, userDoc, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();

  const finalTotal = totalPrice + DELIVERY_FEE + tip;
  const suggestedTips = [2000, 3000, 5000];

  const handlePlaceOrder = async () => {
    if (!user || !firestore || !userDoc) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo verificar el usuario.' });
      return;
    }
    
    if (!userDoc.deliveryAddress) {
      toast({ variant: 'destructive', title: 'Falta dirección', description: 'Por favor, añade una dirección de entrega en tu perfil antes de continuar.' });
      router.push('/profile?redirect=/checkout');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newOrderRef = doc(collection(firestore, 'users', user.uid, 'orders'));
      const pin = Math.floor(1000 + Math.random() * 9000).toString();

      const orderData = {
        id: newOrderRef.id,
        customerId: user.uid,
        customerName: userDoc.displayName || 'Cliente Anónimo',
        customerPhoneNumber: userDoc.phoneNumber || '',
        deliveryAddress: userDoc.deliveryAddress,
        orderDate: serverTimestamp(),
        totalAmount: finalTotal,
        deliveryFee: DELIVERY_FEE,
        tip: tip,
        paymentMethod: paymentMethod,
        status: 'pending',
        pin: pin,
        items: cartItems.map(item => ({
          productId: item.product.id,
          product: {
             name: item.product.name,
             price: item.product.price,
             imageUrl: item.product.imageUrl
          },
          quantity: item.quantity,
        })),
      };

      await setDoc(newOrderRef, orderData);
      
      router.push(`/order-confirmation?orderId=${orderData.id}&paymentMethod=${paymentMethod}&total=${finalTotal}`);
      
      clearCart();

    } catch (error) {
      console.error("Error al realizar el pedido:", error);
      toast({ variant: 'destructive', title: 'Error Inesperado', description: 'No se pudo completar el pedido. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isAddressMissing = !isUserLoading && userDoc && !userDoc.deliveryAddress;

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
           <Separator className="my-4" />
           <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><Truck size={16}/> Tarifa de Domicilio</span>
              <span>{formatCurrency(DELIVERY_FEE)}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><Gift size={16}/> Propina</span>
              <span>{formatCurrency(tip)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between font-bold text-xl bg-muted/50 py-4">
          <span>Total:</span>
          <span>{formatCurrency(finalTotal)}</span>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pago y Entrega</CardTitle>
          <CardDescription>Confirma tu método de pago y dirección de entrega.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isUserLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" />Cargando datos de perfil...</div>}
          
          {isAddressMissing && (
             <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 rounded-md flex gap-3">
               <AlertTriangle className="h-5 w-5 mt-0.5"/>
               <div>
                  <h4 className="font-bold">Falta la dirección de entrega</h4>
                  <p className="text-sm">Por favor, <Link href="/profile?redirect=/checkout" className="underline font-semibold">ve a tu perfil</Link> para añadir una dirección antes de realizar el pedido.</p>
               </div>
            </div>
          )}

          {userDoc?.deliveryAddress && (
             <div className="space-y-2">
                <Label>Se entregará en:</Label>
                <p className="text-sm border p-3 rounded-md bg-muted/50">{userDoc.deliveryAddress}</p>
                <Link href="/profile?redirect=/checkout" className="text-sm text-primary hover:underline">Cambiar dirección</Link>
             </div>
          )}
          
          <div className="space-y-3">
            <Label>Propina para el repartidor</Label>
            <div className="flex gap-2">
              {suggestedTips.map(amount => (
                <Button key={amount} variant="outline" size="sm" onClick={() => setTip(amount)}>
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
            <Input 
              type="number"
              placeholder="O ingresa un monto personalizado"
              value={tip || ''}
              onChange={(e) => setTip(Number(e.target.value))}
              className="mt-2"
            />
          </div>

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
            disabled={isSubmitting || isUserLoading || isAddressMissing || cartItems.length === 0}
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
