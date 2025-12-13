
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collectionGroup, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Order, AppUser } from '@/lib/types';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Truck, CheckCircle2, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const OrderCard = ({ order, onAccept, isUpdating }: { order: Order; onAccept: (order: Order) => void; isUpdating: boolean }) => {

  return (
    <Card className="shadow-md animate-fade-in border-l-4 border-green-500">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start text-base">
          <div>
            <span className="font-bold text-lg">#{order.id.slice(-6).toUpperCase()}</span>
            <p className="text-xs text-muted-foreground font-normal">{order.customerName}</p>
          </div>
          <Badge variant="secondary">Listo para Retirar</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mb-2">
          {(order.items || []).slice(0, 2).map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="font-medium">{item.quantity}x {item.product.name}</span>
            </div>
          ))}
          {(order.items?.length || 0) > 2 && <p className="text-sm text-muted-foreground">+ {(order.items?.length || 0) - 2} más...</p>}
        </div>
        <div className="font-bold border-t pt-2">
          <span>Total: {formatCurrency(order.totalAmount)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onAccept(order)} className="w-full" disabled={isUpdating}>
          {isUpdating ? <Loader2 className="mr-2 animate-spin" /> : <Truck className="mr-2" />}
           Aceptar Pedido
        </Button>
      </CardFooter>
    </Card>
  );
};

const DeliveringCard = ({ order, onDeliver, isUpdating }: { order: Order; onDeliver: (order: Order) => void; isUpdating: boolean; }) => {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`;

  return (
    <Card className="shadow-md animate-fade-in border-l-4 border-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start text-base">
          <div>
            <span className="font-bold text-lg">#{order.id.slice(-6).toUpperCase()}</span>
            <p className="text-xs text-muted-foreground font-normal">Cliente: {order.customerName}</p>
          </div>
          <Badge>En Camino</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="font-semibold">Dirección de Entrega:</p>
          <p className="text-muted-foreground">{order.deliveryAddress}</p>
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:underline">
            <Navigation className="mr-2" size={16} /> Ver en Mapa
          </a>
        </div>
        <div className="mt-4 border-t pt-2">
          <p className="font-semibold">Contacto:</p>
          <p className="text-muted-foreground">{order.customerPhoneNumber || 'No disponible'}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onDeliver(order)} className="w-full bg-green-600 hover:bg-green-700" disabled={isUpdating}>
          {isUpdating ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 className="mr-2" />}
           Marcar como Entregado
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function DeliveryPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isUpdatingOrder, setIsUpdatingOrder] = useState<string | null>(null);

  // Redirect if not a driver
  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userDoc, isLoading: isRoleLoading } = useDoc<AppUser>(userDocRef);
  const isDriver = userDoc?.role === 'driver';

  useEffect(() => {
    if (!isUserLoading && !isRoleLoading && userDoc && !isDriver) {
      toast({ variant: 'destructive', title: 'Acceso Denegado', description: 'No tienes permisos de repartidor.' });
      router.push('/');
    }
  }, [user, userDoc, isUserLoading, isRoleLoading, router, toast, isDriver]);

  const readyOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isDriver) return null; // FIX: Only query if user is a driver
    return query(collectionGroup(firestore, 'orders'), where('status', '==', 'ready'));
  }, [firestore, user, isDriver]);

  const myDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isDriver) return null; // FIX: Only query if user is a driver
    return query(collectionGroup(firestore, 'orders'), where('status', '==', 'delivering'), where('driverId', '==', user.uid));
  }, [firestore, user, isDriver]);

  const { data: readyOrders, isLoading: readyOrdersLoading } = useCollection<Order>(readyOrdersQuery);
  const { data: myDeliveries, isLoading: myDeliveriesLoading } = useCollection<Order>(myDeliveriesQuery);


  const handleAcceptOrder = async (order: Order) => {
    if (!firestore || !user || !userDoc) return;
    setIsUpdatingOrder(order.id);
    const orderRef = doc(firestore, 'users', order.customerId, 'orders', order.id);
    try {
      await updateDoc(orderRef, {
        status: 'delivering',
        driverId: user.uid,
        driverName: userDoc.displayName || 'Repartidor Anónimo'
      });
      toast({ title: '¡Pedido aceptado!', description: 'El cliente será notificado.' });
    } catch (error) {
      console.error("Error accepting order:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo aceptar el pedido.' });
    } finally {
      setIsUpdatingOrder(null);
    }
  };

  const handleMarkAsDelivered = async (order: Order) => {
    if (!firestore) return;
    setIsUpdatingOrder(order.id);
    const orderRef = doc(firestore, 'users', order.customerId, 'orders', order.id);
    try {
      await updateDoc(orderRef, { status: 'delivered' });
      toast({ title: '¡Pedido Entregado!', description: '¡Buen trabajo!' });
    } catch (error) {
      console.error("Error delivering order:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la entrega.' });
    } finally {
      setIsUpdatingOrder(null);
    }
  };

  const isLoading = isUserLoading || isRoleLoading || !firestore;

  if (isLoading || !userDoc) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Verificando...</div>;
  }
  
  if(!isDriver) {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Panel de Repartidor</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mis Entregas */}
          <div className="bg-muted/50 rounded-xl p-4">
            <h2 className="font-bold text-muted-foreground uppercase tracking-wider mb-4">Mis Entregas ({myDeliveries?.length || 0})</h2>
            <div className="space-y-4">
              {myDeliveriesLoading ? <Loader2 className="animate-spin mx-auto mt-10" /> :
                myDeliveries && myDeliveries.length > 0 ? (
                  myDeliveries.map(order => <DeliveringCard key={order.id} order={order} onDeliver={handleMarkAsDelivered} isUpdating={isUpdatingOrder === order.id} />)
                ) : (
                  <p className="text-center text-muted-foreground py-10">No tienes entregas activas.</p>
                )}
            </div>
          </div>

          {/* Pedidos Disponibles */}
          <div className="bg-muted/50 rounded-xl p-4">
            <h2 className="font-bold text-muted-foreground uppercase tracking-wider mb-4">Pedidos para Retirar ({readyOrders?.length || 0})</h2>
            <div className="space-y-4">
              {readyOrdersLoading ? <Loader2 className="animate-spin mx-auto mt-10" /> :
                readyOrders && readyOrders.length > 0 ? (
                  readyOrders.map(order => <OrderCard key={order.id} order={order} onAccept={handleAcceptOrder} isUpdating={isUpdatingOrder === order.id} />)
                ) : (
                  <p className="text-center text-muted-foreground py-10">No hay pedidos listos por ahora.</p>
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
