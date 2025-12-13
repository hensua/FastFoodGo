'use client';

import React, { useMemo, useState } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collectionGroup, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Order, OrderStatus, AppUser } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Clock, ChefHat, PackageCheck, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusConfig = {
  pending: { title: 'Pendientes', icon: Clock, color: 'border-l-4 border-red-500' },
  cooking: { title: 'En Preparación', icon: ChefHat, color: 'border-l-4 border-yellow-500' },
  ready: { title: 'Listos para Retirar', icon: PackageCheck, color: 'border-l-4 border-green-500' },
  delivering: { title: 'En Camino', icon: PackageCheck, color: 'border-l-4 border-blue-500' },
  delivered: { title: 'Entregados', icon: CheckCircle, color: 'border-l-4 border-gray-400' },
};

const OrderCard = ({ order, onStatusChange, isUpdating }: { order: Order; onStatusChange: (orderId: string, customerId: string, newStatus: OrderStatus) => void; isUpdating: boolean }) => {
  const currentStatusConfig = statusConfig[order.status as keyof typeof statusConfig];
  const nextStatusMap: Record<string, OrderStatus | null> = { pending: 'cooking', cooking: 'ready', ready: null };
  const nextStatus = nextStatusMap[order.status];
  const actionTextMap: Record<string, string> = { cooking: "Empezar a Cocinar", ready: "Marcar como Listo" };

  return (
    <Card className={`shadow-md animate-fade-in ${currentStatusConfig?.color || 'border-l-4 border-gray-400'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start text-base">
          <div>
            <span className='font-bold text-lg'>#{order.id.slice(-6).toUpperCase()}</span>
            <p className="text-xs text-muted-foreground font-normal">{order.customerName || 'Cliente Anónimo'}</p>
          </div>
          <Badge className={order.paymentMethod === 'transfer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
            {order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mb-4 border-t pt-2 max-h-32 overflow-y-auto">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{item.quantity}x {item.product.name}</span>
              <span className="text-gray-600">{formatCurrency(item.product.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold border-t pt-2 mb-4">
          <span>Total:</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
        {nextStatus && (
          <Button onClick={() => onStatusChange(order.id, order.customerId, nextStatus)} className="w-full text-sm" disabled={isUpdating}>
            {isUpdating ? <Loader2 className="animate-spin mr-2"/> : null}
            {actionTextMap[nextStatus]}
          </Button>
        )}
        {order.status === 'delivering' && (
          <p className="text-sm text-center text-blue-600 font-semibold">Repartidor en camino...</p>
        )}
        {order.status === 'delivered' && (
          <p className="text-sm text-center text-green-600 font-semibold">¡Pedido Entregado!</p>
        )}
      </CardContent>
    </Card>
  );
};

export function OrderList() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userDoc } = useDoc<AppUser>(userDocRef);
  const isAdmin = userDoc?.role === 'admin';

  const ordersQuery = useMemo(() => {
    if (!firestore || !isAdmin) return null; 
    return query(collectionGroup(firestore, 'orders'), where('status', 'in', ['pending', 'cooking', 'ready', 'delivering', 'delivered']));
  }, [firestore, isAdmin]);

  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  const handleStatusChange = async (orderId: string, customerId: string, newStatus: OrderStatus) => {
    if (!firestore) return;
    setUpdatingOrderId(orderId);
    const orderRef = doc(firestore, 'users', customerId, 'orders', orderId);
    try {
      await updateDoc(orderRef, { status: newStatus });
      toast({
        title: "Estado actualizado",
        description: `El pedido #${orderId.slice(-6).toUpperCase()} ahora está ${newStatus === 'cooking' ? 'en preparación' : 'listo para retirar'}.`,
      });
    } catch (error) {
      console.error("Error updating order status: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado del pedido.",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const ordersByStatus = useMemo(() => ({
    pending: orders?.filter(o => o.status === 'pending') || [],
    cooking: orders?.filter(o => o.status === 'cooking') || [],
    ready: orders?.filter(o => o.status === 'ready') || [],
    delivering: orders?.filter(o => o.status === 'delivering') || [],
    delivered: orders?.filter(o => o.status === 'delivered') || [],
  }), [orders]);
  
  if (!isAdmin) {
    return null; // Don't render if not admin
  }

  const statusColumns: (keyof typeof statusConfig)[] = ['pending', 'cooking', 'ready', 'delivering', 'delivered'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
      {statusColumns.map(statusKey => (
        <div key={statusKey} className="bg-muted/50 rounded-xl p-4 min-h-[500px]">
          <h3 className="font-bold text-muted-foreground uppercase tracking-wider mb-4 flex justify-between items-center">
            {statusConfig[statusKey].title}
            <span className="bg-background px-2 py-1 rounded-full text-xs shadow-sm">{ordersByStatus[statusKey]?.length || 0}</span>
          </h3>
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin" /></div>
            ) : ordersByStatus[statusKey] && ordersByStatus[statusKey].length > 0 ? (
              ordersByStatus[statusKey].map(order => (
                <OrderCard 
                    key={order.id} 
                    order={order} 
                    onStatusChange={handleStatusChange} 
                    isUpdating={updatingOrderId === order.id}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground/70 py-10 italic text-sm">No hay pedidos en esta etapa</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
