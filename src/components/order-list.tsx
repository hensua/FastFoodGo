'use client';

import React, { useMemo, useState } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collectionGroup, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Order, OrderStatus, AppUser } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Clock, ChefHat, PackageCheck, Loader2, Truck, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const statusConfig: Record<string, { title: string; icon: React.ElementType; color: string }> = {
  pending: { title: 'Pendientes', icon: Clock, color: 'border-l-4 border-yellow-500' },
  cooking: { title: 'En Preparación', icon: ChefHat, color: 'border-l-4 border-orange-500' },
  ready: { title: 'Listos', icon: PackageCheck, color: 'border-l-4 border-green-500' },
  delivering: { title: 'En Entrega', icon: Truck, color: 'border-l-4 border-blue-500' },
  cancelled: { title: 'Cancelados', icon: XCircle, color: 'border-l-4 border-red-500' },
};

const OrderCard = ({ order, onStatusChange, onCancel, isUpdating }: { order: Order; onStatusChange: (orderId: string, customerId: string, newStatus: OrderStatus) => void; onCancel: (order: Order) => void; isUpdating: boolean }) => {
  const currentStatusConfig = statusConfig[order.status as keyof typeof statusConfig];
  const nextStatusMap: Record<string, OrderStatus | null> = { pending: 'cooking', cooking: 'ready', ready: null };
  const nextStatus = nextStatusMap[order.status];
  const actionTextMap: Record<string, string> = { cooking: "Empezar a Cocinar", ready: "Marcar como Listo" };

  return (
    <Card className={`shadow-md animate-fade-in ${currentStatusConfig.color}`}>
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
        
        {order.status !== 'cancelled' && (
          <div className='space-y-2'>
            {nextStatus && (
              <Button onClick={() => onStatusChange(order.id, order.customerId, nextStatus)} className="w-full text-sm" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="animate-spin mr-2"/> : null}
                {actionTextMap[nextStatus]}
              </Button>
            )}
            <Button variant="destructive" outline className="w-full text-sm" onClick={() => onCancel(order)} disabled={isUpdating}>
              Cancelar Pedido
            </Button>
          </div>
        )}

        {order.status === 'delivering' && (
           <div className="text-center text-sm text-blue-600 font-semibold p-2 bg-blue-50 rounded-md">
            <p>Repartidor: {order.driverName || 'Asignado'}</p>
          </div>
        )}
        {order.status === 'cancelled' && (
            <div className="text-center text-sm text-red-600 font-semibold p-2 bg-red-50 rounded-md">
                <p>Este pedido ha sido cancelado.</p>
            </div>
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
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userDoc } = useDoc<AppUser>(userDocRef);
  const isAdmin = userDoc?.role === 'admin';

  const ordersQuery = useMemo(() => {
    if (!firestore || !isAdmin) return null; // Only run query if user is admin
    return query(collectionGroup(firestore, 'orders'), where('status', 'in', ['pending', 'cooking', 'ready', 'delivering', 'cancelled']));
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

  const confirmCancelOrder = async () => {
    if (!firestore || !orderToCancel) return;
    handleStatusChange(orderToCancel.id, orderToCancel.customerId, 'cancelled');
    setOrderToCancel(null);
  }

  const ordersByStatus = useMemo(() => ({
    pending: orders?.filter(o => o.status === 'pending') || [],
    cooking: orders?.filter(o => o.status === 'cooking') || [],
    ready: orders?.filter(o => o.status === 'ready') || [],
    delivering: orders?.filter(o => o.status === 'delivering') || [],
    cancelled: orders?.filter(o => o.status === 'cancelled') || [],
  }), [orders]);
  
  if (!isAdmin) {
    return null; // Don't render if not admin
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(statusKey => (
          <div key={statusKey} className="bg-muted/50 rounded-xl p-4 min-h-[500px]">
            <h3 className="font-bold text-muted-foreground uppercase tracking-wider mb-4 flex justify-between items-center">
              {statusConfig[statusKey].title}
              <span className="bg-background px-2 py-1 rounded-full text-xs shadow-sm">{ordersByStatus[statusKey as keyof typeof ordersByStatus].length}</span>
            </h3>
            <div className="space-y-4">
              {ordersLoading ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin" /></div>
              ) : ordersByStatus[statusKey as keyof typeof ordersByStatus].length > 0 ? (
                ordersByStatus[statusKey as keyof typeof ordersByStatus].map(order => (
                  <OrderCard 
                      key={order.id} 
                      order={order} 
                      onStatusChange={handleStatusChange}
                      onCancel={setOrderToCancel} 
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
       <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Seguro que quieres cancelar este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible y el pedido se marcará como cancelado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelOrder} className="bg-destructive hover:bg-destructive/90">Sí, Cancelar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
