
'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Order, OrderStatus } from '@/lib/types';
import Header from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Loader2, ShoppingBag, Clock, ChefHat, Truck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<OrderStatus, { text: string; icon: React.ElementType; color: string; progress: string }> = {
  pending: { text: 'Pendiente', icon: Clock, color: 'text-gray-500', progress: 'w-1/5' },
  cooking: { text: 'En Preparación', icon: ChefHat, color: 'text-yellow-500', progress: 'w-2/5' },
  ready: { text: 'Listo para Retirar', icon: ShoppingBag, color: 'text-blue-500', progress: 'w-3/5' },
  delivering: { text: 'En Camino', icon: Truck, color: 'text-orange-500', progress: 'w-4/5' },
  delivered: { text: 'Entregado', icon: CheckCircle2, color: 'text-green-500', progress: 'w-full' },
  cancelled: { text: 'Cancelado', icon: CheckCircle2, color: 'text-red-500', progress: 'w-full bg-red-500' },
};

const OrderCard = ({ order }: { order: Order }) => {
  const config = statusConfig[order.status];
  
  return (
    <Card className="shadow-md animate-fade-in w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Pedido #{order.id.slice(-6).toUpperCase()}</CardTitle>
            <CardDescription>
              {new Date(order.orderDate?.toDate()).toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </CardDescription>
          </div>
          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className={config.color.replace('text-', 'bg-').replace('-500', '/10')}>
            <config.icon className={`mr-2 ${config.color}`} size={16}/> {config.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className={`bg-primary h-2.5 rounded-full transition-all duration-500 ${config.progress}`} />
          </div>
        </div>
        {order.status === 'delivering' && order.driverName && (
          <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-md flex items-center gap-2">
            <Truck className="text-primary" size={20}/>
            <div>
              <span className="font-semibold">{order.driverName}</span> está en camino con tu pedido.
            </div>
          </div>
        )}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Resumen del pedido:</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantity}x {item.product.name}</span>
                <span>{formatCurrency(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
        <span className="text-sm">Total del Pedido</span>
        <span className="font-bold text-lg">{formatCurrency(order.totalAmount)}</span>
      </CardFooter>
    </Card>
  );
};


export default function MyOrdersPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const myOrdersQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'orders'), 
        orderBy('orderDate', 'desc'),
        // Use 'in' operator to query for multiple valid, non-delivered statuses.
        // This is supported by Firestore and avoids the multi-field inequality error.
        where('status', 'in', ['pending', 'cooking', 'ready', 'delivering', 'cancelled'])
    );
  }, [firestore, user]);

  const { data: orders, isLoading } = useCollection<Order>(myOrdersQuery);

  if (isUserLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>
        
        {isLoading && !orders && (
            <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        )}

        {!isLoading && orders && orders.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No tienes pedidos activos</h3>
            <p className="mt-2 text-muted-foreground">¿Qué tal si ordenas algo delicioso?</p>
            <Button asChild className="mt-6">
              <Link href="/">Comenzar a Ordenar</Link>
            </Button>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
