
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import type { Order, OrderStatus, AppUser, ChatMessage } from '@/lib/types';
import Header from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Loader2, ShoppingBag, Clock, ChefHat, Truck, CheckCircle2, KeyRound, Ban, Gift, Info, MessageSquare, ChevronDown } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { getBrandingConfig, type BrandingConfig } from '@/lib/branding-config';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';


export default function MyOrdersPage() {
    const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null);

    useEffect(() => {
        getBrandingConfig().then(setBrandingConfig);
    }, []);

    if (!brandingConfig) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return <MyOrdersPageClient brandingConfig={brandingConfig} />;
}

const statusConfig: Record<OrderStatus, { text: string; icon: React.ElementType; color: string; progress: string }> = {
  pending: { text: 'Pendiente', icon: Clock, color: 'text-gray-500', progress: 'w-1/6' },
  cooking: { text: 'En Preparación', icon: ChefHat, color: 'text-yellow-500', progress: 'w-2/6' },
  ready: { text: 'Listo para Retirar', icon: ShoppingBag, color: 'text-blue-500', progress: 'w-3/6' },
  delivering: { text: 'En Camino', icon: Truck, color: 'text-orange-500', progress: 'w-4/6' },
  delivered: { text: 'Entregado', icon: CheckCircle2, color: 'text-green-600', progress: 'w-full' },
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
    <Accordion type="single" collapsible className="w-full shadow-md rounded-lg border">
      <AccordionItem value={order.id} className="border-none">
        <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
           <div className="flex justify-between items-start w-full">
            <div className="text-left space-y-1">
              <h3 className="font-bold">Pedido #{order.id.slice(-6).toUpperCase()}</h3>
              <p className="text-xs text-muted-foreground">
                {order.orderDate?.toDate ? new Date(order.orderDate.toDate()).toLocaleString('es-CO', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : ''}
              </p>
               <p className="font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
            </div>
             <Badge 
                variant={order.status === 'delivered' ? 'secondary' : 'secondary'} 
                className={cn(
                  order.status === 'delivered'
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : `${config.color.replace('text-', 'bg-').replace('-500', '/10')} border ${config.color.replace('text-','border-')}`,
                  'self-start'
                )}
            >
              <config.icon className={`mr-2 ${config.color}`} size={16}/> {config.text}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <div className="p-4 space-y-4">
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
          </div>
          <div className="bg-muted/50 p-4 flex gap-2">
            {order.status === 'pending' && (
                <Button variant="destructive" size="sm" onClick={() => onCancel(order)}>Cancelar Pedido</Button>
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
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

      // This simpler query avoids needing a composite index in Firestore.
      const messagesQuery = query(
        collection(firestore, 'users', order.customerId, 'orders', order.id, 'messages'),
        orderBy('timestamp', 'desc')
      );
      
      return onSnapshot(messagesQuery, (snapshot) => {
          if (snapshot.empty) {
            setUnreadState(prev => ({ ...prev, [order.id]: false }));
            return;
          }
          // Check if the most recent message is from someone else
          const lastMessage = snapshot.docs[0].data() as ChatMessage;
          const hasUnread = lastMessage.senderId !== currentUser.uid;
          setUnreadState(prev => ({ ...prev, [order.id]: hasUnread }));
      }, (error) => {
        // This will catch permission errors or other listener failures.
        console.error(`Error listening to messages for order ${order.id}:`, error);
        setUnreadState(prev => ({ ...prev, [order.id]: false }));
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [orders, firestore, currentUser]);

  const markAsRead = (orderId: string) => {
    setUnreadState(prev => ({ ...prev, [orderId]: false }));
  };

  return { unreadState, markAsRead };
};


function MyOrdersPageClient({ brandingConfig }: { brandingConfig: BrandingConfig }) {
  const firestore = useFirestore();
  const { user, userDoc, isLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);

  const myOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'orders'), 
        orderBy('orderDate', 'desc')
    );
  }, [firestore, user]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(myOrdersQuery);

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
  
  const { unreadState, markAsRead } = useUnreadMessages(activeOrders, userDoc);

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

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
  }
  
  if (!user) {
    router.push('/login?redirect=/my-orders');
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} showCart={false} brandingConfig={brandingConfig} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>
        
        {isOrdersLoading && !orders && (
            <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        )}

        {!isOrdersLoading && orders && orders.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No has realizado pedidos</h3>
            <p className="mt-2 text-muted-foreground">¿Qué tal si ordenas algo delicioso?</p>
            <Button asChild className="mt-6">
              <Link href="/">Comenzar a Ordenar</Link>
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
            {activeOrders.length > 0 && (
                <>
                  <h2 className="text-2xl font-semibold">Pedidos Activos</h2>
                  <div className="space-y-4">
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
                <h2 className="text-2xl font-semibold mt-8 pt-4 border-t">Historial de Pedidos</h2>
                <div className="space-y-4">
                  {pastOrders.map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onCancel={() => {}} 
                      onChat={handleOpenChat} 
                      hasUnreadMessages={false}
                    />
                  ))}
                </div>
              </>
            )}
        </div>
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
              brandingConfig={brandingConfig}
          />
      )}
    </div>
  );
}
