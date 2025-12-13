'use client';

import React, { useMemo } from 'react';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collectionGroup, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Clock, ChefHat, PackageCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusConfig = {
  pending: { title: 'Pendientes', icon: Clock, color: 'border-l-4 border-red-500' },
  cooking: { title: 'En Preparación', icon: ChefHat, color: 'border-l-4 border-yellow-500' },
  ready: { title: 'Listos para Servir', icon: PackageCheck, color: 'border-l-4 border-green-500' },
};

const OrderCard = ({ order, onStatusChange }: { order: Order, onStatusChange: (orderId: string, customerId: string, newStatus: OrderStatus) => void }) => {
  const currentStatusConfig = statusConfig[order.status as keyof typeof statusConfig];
  const nextStatusMap: Record<string, OrderStatus | null> = { pending: 'cooking', cooking: 'ready', ready: 'delivered' };
  const nextStatus = nextStatusMap[order.status];
  const actionTextMap: Record<string, string> = { cooking: "Empezar a Cocinar", ready: "Marcar como Listo", delivered: "Entregar Pedido" };

  return (
    <Card className={`shadow-md animate-fade-in ${currentStatusConfig.color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start text-base">
          <div>
            <span className='font-bold text-lg'>#{order.id.slice(-6).toUpperCase()}</span>
            <p className="text-xs text-muted-foreground font-normal">{order.customerName || 'Cliente Anónimo'}</p>
          </div>
          <Badge className={order.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
            {order.paymentMethod === 'cash' ? 'Efectivo' : (order.paymentMethod === 'transfer' ? 'Transferencia' : 'Tarjeta')}
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
          <Button onClick={() => onStatusChange(order.id, order.customerId, nextStatus)} className="w-full text-sm">
            {actionTextMap[nextStatus]}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export function OrderList() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'), where('status', 'in', ['pending', 'cooking', 'ready']));
  }, [firestore]);

  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  const handleStatusChange = async (orderId: string, customerId: string, newStatus: OrderStatus) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'users', customerId, 'orders', orderId);
    try {
      await updateDoc(orderRef, { status: newStatus });
      toast({
        title: "Estado actualizado",
        description: `El pedido #${orderId.slice(-6).toUpperCase()} ahora está ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating order status: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado del pedido.",
      });
    }
  };

  const ordersByStatus = useMemo(() => ({
    pending: orders?.filter(o => o.status === 'pending') || [],
    cooking: orders?.filter(o => o.status === 'cooking') || [],
    ready: orders?.filter(o => o.status === 'ready') || [],
  }), [orders]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(statusKey => (
        <div key={statusKey} className="bg-muted/50 rounded-xl p-4 min-h-[500px]">
          <h3 className="font-bold text-muted-foreground uppercase tracking-wider mb-4 flex justify-between items-center">
            {statusConfig[statusKey].title}
            <span className="bg-background px-2 py-1 rounded-full text-xs shadow-sm">{ordersByStatus[statusKey].length}</span>
          </h3>
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin" /></div>
            ) : ordersByStatus[statusKey].length > 0 ? (
              ordersByStatus[statusKey].map(order => (
                <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
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

    