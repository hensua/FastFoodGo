'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, where, onSnapshot } from 'firebase/firestore';
import type { Order, OrderStatus, AppUser, ChatMessage } from '@/lib/types';
import Header from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Loader2, ShoppingBag, Clock, ChefHat, Truck, CheckCircle2, KeyRound, Ban, Gift, Info, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ChatDialog } from '@/components/chat/ChatDialog';


const statusConfig: Record<OrderStatus, { text: string; icon: React.ElementType; color: string; progress: string }> = {
  pending: { text: 'Pendiente', icon: Clock, color: 'text-gray-500', progress: 'w-1/6' },
  cooking: { text: 'En Preparación', icon: ChefHat, color: 'text-yellow-500', progress: 'w-2/6' },
  ready: { text: 'Listo para Retirar', icon: ShoppingBag, color: 'text-blue-500', progress: 'w-3/6' },
  delivering: { text: 'En Camino', icon: Truck, color: 'text-orange-500', progress: 'w-4/6' },
  delivered: { text: 'Entregado', icon: CheckCircle2, color: 'text-green-500', progress: 'w-full' },
  cancelled: { text: 'Cancelado', icon: Ban, color: 'text-red-500', progress: 'w-full bg-red-500' },
};

const OrderCard = ({ 
  order, 
  onCancel, 
  onChat, 
  hasUnreadMessages 
}: { 
  order: Order, 
  onCancel: (order: Order) => void, 
  onChat: (order: Order) => void, 
  hasUnreadMessages: boolean 
}) => {
  const config = statusConfig[order.status];
  const subtotal = order.totalAmount - (order.deliveryFee || 0) - (order.tip || 0);
  const canChat = ['cooking', 'ready', 'delivering'].includes(order.status);

  return (
    <Card className="shadow-md animate-fade-in w-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Pedido #{order.id.slice(-6).toUpperCase()}</CardTitle>
            <CardDescription>
              {order.orderDate?.toDate ? new Date(order.orderDate.toDate()).toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric'
              }) : ''}
            </CardDescription>
          </div>
          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className={`${config.color.replace('text-', 'bg-').replace('-500', '/10')} border ${config.color.replace('text-','border-')}`}>
            <config.icon className={`mr-2 ${config.color}`} size={16}/> {config.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className={`h-2.5 rounded-full transition-all duration-500 ${order.status === 'cancelled' ? 'bg-red-500' : 'bg-primary'} ${config.progress}`} />
          </div>
        </div>

        {order.status === 'cancelled' && order.cancellationReason && (
             <div className="text-sm text-destructive-foreground bg-destructive/80 p-3 rounded-md flex items-start gap-3">
                 <Info className="h-5 w-5 mt-0.5 shrink-0"/>
                 <div>
                    <p className="font-semibold">Motivo de cancelación:</p>
                    <p>{order.cancellationReason}</p>
                 </div>
             </div>
        )}

        {order.status !== 'pending' && order.status !== 'cooking' && order.status !== 'cancelled' && (
          <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-md flex items-center gap-3">
             {order.status === 'delivering' ? <Truck className="text-primary h-8 w-8"/> : <KeyRound className="text-primary h-8 w-8"/>}
             <div>
                {order.status === 'delivering' && order.driverName && (
                  <><span className="font-semibold">{order.driverName}</span> está en camino con tu pedido.</>
                )}
                 {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <>
                    <p className="font-semibold mt-1">Tu PIN de entrega es:</p>
                    <p className="font-bold text-lg text-primary tracking-widest">{order.pin}</p>
                  </>
                )}
                 {order.status === 'delivered' && (
                  <p className="font-semibold">¡Tu pedido fue entregado con éxito!</p>
                )}
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
           <Separator className="my-2"/>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Truck size={14}/> Domicilio</span>
                    <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Gift size={14}/> Propina</span>
                    <span>{formatCurrency(order.tip)}</span>
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
         <div className='flex gap-2'>
            {order.status === 'pending' && (
                <Button variant="destructive" size="sm" onClick={() => onCancel(order)}>Cancelar</Button>
            )}
             {canChat && (
                <Button variant="outline" size="sm" onClick={() => onChat(order)} className="relative">
                    {hasUnreadMessages && (
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                    <MessageSquare className='mr-2' size={14} /> Chat
                </Button>
            )}
         </div>
        <div className="flex flex-col items-end flex-grow">
          <span className="text-sm">Total del Pedido</span>
          <span className="font-bold text-lg">{formatCurrency(order.totalAmount)}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

// Custom hook to manage unread messages
const useUnreadMessages = (orders: Order[] | undefined, currentUser: AppUser | null) => {
  const firestore = useFirestore();
  const [unreadState, setUnreadState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!orders || !firestore || !currentUser) return;

    const unsubscribers = orders.map(order => {
      const canChat = ['cooking', 'ready', 'delivering'].includes(order.status);
      if (!canChat) return () => {};

      const messagesQuery = query(
        collection(firestore, 'users', order.customerId, 'orders', order.id, 'messages'),
        orderBy('timestamp', 'desc'),
        where('senderId', '!=', currentUser.uid)
      );

      return onSnapshot(messagesQuery, (snapshot) => {
        setUnreadState(prev => ({ ...prev, [order.id]: !snapshot.empty }));
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [orders, firestore, currentUser]);

  const markAsRead = (orderId: string) => {
    setUnreadState(prev => ({ ...prev, [orderId]: false }));
  };

  return { unreadState, markAsRead };
};


export default function MyOrdersPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userDoc, isLoading: isUserDocLoading } = useDoc<AppUser>(userDocRef);

  const myOrdersQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'orders'), 
        orderBy('orderDate', 'desc')
    );
  }, [firestore, user]);

  const { data: orders, isLoading } = useCollection<Order>(myOrdersQuery);

  const { activeOrders, pastOrders } = useMemo(() => {
    const active: Order[] = [];
    const past: Order[] = [];
    orders?.forEach(order => {
      if (order.status === 'delivered' || order.status === 'cancelled') {
        past.push(order);
      } else {
        active.push(order);
      }
    });
    return { activeOrders: active, pastOrders: past };
  }, [orders]);
  
  const { unreadState, markAsRead } = useUnreadMessages(orders, userDoc);

  const handleOpenChat = (order: Order) => {
    markAsRead(order.id);
    setChatOrder(order);
  };


  const handleCancelOrder = async () => {
    if (!firestore || !orderToCancel) return;
    const orderRef = doc(firestore, 'users', orderToCancel.customerId, 'orders', orderToCancel.id);
    try {
        await updateDoc(orderRef, { status: 'cancelled' });
        toast({
            title: 'Pedido Cancelado',
            description: `Tu pedido #${orderToCancel.id.slice(-6).toUpperCase()} ha sido cancelado.`,
        });
    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo cancelar el pedido. Inténtalo de nuevo.'
        });
        console.error("Error cancelling order:", error);
    } finally {
        setOrderToCancel(null);
    }
  };

  const pageLoading = isUserLoading || isUserDocLoading || !userDoc;

  if (pageLoading) {
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
            <h3 className="mt-4 text-xl font-semibold">No has realizado pedidos</h3>
            <p className="mt-2 text-muted-foreground">¿Qué tal si ordenas algo delicioso?</p>
            <Button asChild className="mt-6">
              <Link href="/">Comenzar a Ordenar</Link>
            </Button>
          </div>
        )}
        
        {activeOrders.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold mb-4">Pedidos Activos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onCancel={setOrderToCancel} 
                    onChat={handleOpenChat}
                    hasUnreadMessages={unreadState[order.id] || false}
                  />
                ))}
              </div>
            </>
        )}

        {pastOrders.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold my-8 pt-4 border-t">Historial de Pedidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onCancel={() => {}} 
                  onChat={handleOpenChat} 
                  hasUnreadMessages={unreadState[order.id] || false}
                />
              ))}
            </div>
          </>
        )}
      </main>
      <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de cancelar este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Tu pedido será cancelado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive hover:bg-destructive/90">
                Sí, cancelar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {chatOrder && userDoc && (
          <ChatDialog
              order={chatOrder}
              user={userDoc}
              isOpen={!!chatOrder}
              onOpenChange={() => setChatOrder(null)}
              onMessageSent={() => { /* Mark as read is handled internally now */ }}
          />
      )}
    </div>
  );
}
