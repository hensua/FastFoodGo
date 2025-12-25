
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collectionGroup, query, where, doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { Order, OrderStatus, AppUser, ChatMessage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Clock, ChefHat, PackageCheck, Loader2, Truck, XCircle, Info, MessageSquare, UserCheck } from 'lucide-react';
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
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ChatDialog } from './chat/ChatDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const statusConfig: Record<string, { title: string; icon: React.ElementType; color: string }> = {
  pending: { title: 'Pendientes', icon: Clock, color: 'border-l-4 border-yellow-500' },
  cooking: { title: 'En Preparación', icon: ChefHat, color: 'border-l-4 border-orange-500' },
  ready: { title: 'Listos', icon: PackageCheck, color: 'border-l-4 border-green-500' },
  delivering: { title: 'En Entrega', icon: Truck, color: 'border-l-4 border-blue-500' },
  cancelled: { title: 'Cancelados', icon: XCircle, color: 'border-l-4 border-red-500' },
};

const OrderCard = ({ order, onStatusChange, onCancel, onChat, onAssignDriver, drivers, isUpdating }: { order: Order; onStatusChange: (order: Order, newStatus: OrderStatus, reason?: string) => void; onCancel: (order: Order) => void; onChat: (order: Order) => void; onAssignDriver: (order: Order, driverId: string) => void; drivers: AppUser[]; isUpdating: boolean }) => {
  const currentStatusConfig = statusConfig[order.status as keyof typeof statusConfig];
  const nextStatusMap: Record<string, OrderStatus | null> = { pending: 'cooking', cooking: 'ready', ready: null };
  const nextStatus = nextStatusMap[order.status];
  const actionTextMap: Record<string, string> = { cooking: "Empezar a Cocinar", ready: "Marcar como Listo" };
  const canChat = ['cooking', 'ready', 'delivering'].includes(order.status);

  const [selectedDriver, setSelectedDriver] = useState('');

  return (
    <Card className={`shadow-md animate-fade-in ${currentStatusConfig.color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start text-base">
          <div>
            <span className='font-bold text-lg'>#{order.id.slice(-6).toUpperCase()}</span>
            <p className="text-xs text-muted-foreground font-normal">{order.customerName || 'Cliente Anónimo'}</p>
            <p className="text-xs text-muted-foreground font-normal">
                 {order.orderDate?.toDate ? new Date(order.orderDate.toDate()).toLocaleTimeString('es-CO', {
                    hour: '2-digit', minute: '2-digit'
                  }) : ''}
            </p>
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
        
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div className='space-y-2'>
            {nextStatus && (
              <Button onClick={() => onStatusChange(order, nextStatus)} className="w-full text-sm" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="animate-spin mr-2"/> : null}
                {actionTextMap[nextStatus]}
              </Button>
            )}
            
            {order.status === 'ready' && !order.driverId && (
              <div className='space-y-2'>
                <p className='text-xs font-semibold text-muted-foreground text-center'>Asignar repartidor para continuar:</p>
                <div className="flex gap-2">
                    <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar Repartidor..." /></SelectTrigger>
                        <SelectContent>
                            {drivers.map(d => <SelectItem key={d.uid} value={d.uid}>{d.displayName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button size="icon" onClick={() => onAssignDriver(order, selectedDriver)} disabled={isUpdating || !selectedDriver}>
                        <UserCheck size={16}/>
                    </Button>
                </div>
              </div>
            )}
            
             <div className='flex gap-2 w-full'>
                <Button variant="outline" className="w-full text-sm hover:bg-destructive/10 hover:text-destructive" onClick={() => onCancel(order)} disabled={isUpdating}>
                  Cancelar
                </Button>
                 {canChat && (
                    <Button variant='outline' className='w-full text-sm' onClick={() => onChat(order)} disabled={isUpdating}>
                        <MessageSquare size={14} className='mr-2' /> Chat
                    </Button>
                )}
             </div>
          </div>
        )}

        {order.driverId && (order.status === 'ready' || order.status === 'delivering') && (
           <div className="text-center text-sm text-blue-600 font-semibold p-2 bg-blue-50 rounded-md mt-2">
            <p>Repartidor: {order.driverName || 'Asignado'}</p>
          </div>
        )}

        {order.status === 'cancelled' && (
            <div className="text-sm text-red-600 p-2 bg-red-50/80 rounded-md">
                <div className='flex items-start gap-2'>
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Pedido Cancelado</p>
                        {order.cancellationReason && <p className="text-xs">{order.cancellationReason}</p>}
                    </div>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

const CancelOrderDialog = ({
    order,
    isOpen,
    onOpenChange,
    onConfirm,
    isCancelling,
}: {
    order: Order | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    isCancelling: boolean;
}) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setReason('');
        }
    }, [isOpen]);

    return (
         <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Cancelar Pedido #{order?.id.slice(-6).toUpperCase()}</AlertDialogTitle>
                <AlertDialogDescription>
                    Por favor, especifica el motivo de la cancelación. Esta nota será guardada en el registro del pedido.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="cancellation-reason">Motivo de la cancelación</Label>
                <Textarea
                    id="cancellation-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Se acabó el stock del producto, el cliente lo solicitó, etc."
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => onConfirm(reason)}
                    disabled={isCancelling || reason.trim().length < 5}
                    className="bg-destructive hover:bg-destructive/90"
                >
                    {isCancelling ? <Loader2 className='animate-spin mr-2'/> : null}
                    Confirmar Cancelación
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function KitchenView({ userDoc }: { userDoc: AppUser }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);

  const isFullAdmin = userDoc.role === 'admin';
  const hasStoreAccess = userDoc.role === 'admin' || userDoc.role === 'host';

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !hasStoreAccess) return null;
    return query(collectionGroup(firestore, 'orders'), where('status', 'in', ['pending', 'cooking', 'ready', 'delivering', 'cancelled']));
  }, [firestore, hasStoreAccess]);
  
  // This query is specific for hosts, to only fetch drivers, which is allowed by security rules
  const driversQuery = useMemoFirebase(() => {
    if (!firestore || !hasStoreAccess) return null;
    if (isFullAdmin) {
      // Admins can get all staff
      return query(collection(firestore, 'users'), where('role', 'in', ['admin', 'host', 'driver']));
    }
    // Hosts can only get drivers
    return query(collection(firestore, 'users'), where('role', '==', 'driver'));
  }, [firestore, hasStoreAccess, isFullAdmin]);


  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);
  const { data: staff, isLoading: driversLoading } = useCollection<AppUser>(driversQuery);
  
  const drivers = useMemo(() => {
    return staff?.filter(s => s.role === 'driver') || [];
  }, [staff]);

  const sendAutoChatMessage = async (order: Order) => {
    if (!firestore || !userDoc || !order.customerName) return;

    const messageData: Omit<ChatMessage, 'timestamp'> = {
      text: `Hola ${order.customerName}, ¿deseas agregar una nota general de tu pedido?`,
      senderId: userDoc.uid,
      senderName: 'FastFoodGo',
      senderRole: 'admin',
    };
    
    const messagesCol = collection(firestore, 'users', order.customerId, 'orders', order.id, 'messages');
    try {
        await addDoc(messagesCol, {
            ...messageData,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        throw error;
    }
  };

  const handleStatusChange = async (order: Order, newStatus: OrderStatus, reason?: string) => {
    if (!firestore) return;
    setUpdatingOrderId(order.id);
    const orderRef = doc(firestore, 'users', order.customerId, 'orders', order.id);
    
    const updateData: { status: OrderStatus; cancellationReason?: string } = { status: newStatus };
    if (newStatus === 'cancelled' && reason) {
        updateData.cancellationReason = reason;
    }

    try {
      await updateDoc(orderRef, updateData);

      if (newStatus === 'cooking') {
        await sendAutoChatMessage(order);
      }
      
      let toastDescription = `El pedido #${order.id.slice(-6).toUpperCase()} ha sido actualizado.`;
      if (newStatus === 'cancelled') {
        toastDescription = `El pedido #${order.id.slice(-6).toUpperCase()} ha sido cancelado.`
      }

      toast({
        title: "Estado actualizado",
        description: toastDescription,
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

  const handleAssignDriver = async (order: Order, driverId: string) => {
      if (!firestore || !driverId || !drivers) return;
      setUpdatingOrderId(order.id);

      const driver = drivers.find(d => d.uid === driverId);
      if (!driver) {
          toast({ variant: "destructive", title: "Error", description: "Repartidor no encontrado." });
          setUpdatingOrderId(null);
          return;
      }
      
      const orderRef = doc(firestore, 'users', order.customerId, 'orders', order.id);
      try {
          await updateDoc(orderRef, {
              driverId: driver.uid,
              driverName: driver.displayName || 'Repartidor sin nombre',
          });
          toast({ title: "Repartidor Asignado", description: `${driver.displayName} ha sido asignado al pedido.` });
      } catch (error) {
          console.error("Error assigning driver:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo asignar el repartidor." });
      } finally {
          setUpdatingOrderId(null);
      }
  };

  const handleConfirmCancel = (reason: string) => {
    if (!orderToCancel) return;
    handleStatusChange(orderToCancel, 'cancelled', reason);
    setOrderToCancel(null);
  }

  const ordersByStatus = useMemo(() => ({
    pending: orders?.filter(o => o.status === 'pending') || [],
    cooking: orders?.filter(o => o.status === 'cooking') || [],
    ready: orders?.filter(o => o.status === 'ready') || [],
    delivering: orders?.filter(o => o.status === 'delivering') || [],
    cancelled: orders?.filter(o => o.status === 'cancelled') || [],
  }), [orders]);

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
              {ordersLoading || driversLoading ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin" /></div>
              ) : ordersByStatus[statusKey as keyof typeof ordersByStatus].length > 0 ? (
                ordersByStatus[statusKey as keyof typeof ordersByStatus].map(order => (
                  <OrderCard 
                      key={order.id} 
                      order={order} 
                      onStatusChange={handleStatusChange}
                      onCancel={setOrderToCancel}
                      onChat={setChatOrder}
                      onAssignDriver={handleAssignDriver}
                      drivers={drivers || []}
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
       <CancelOrderDialog
        order={orderToCancel}
        isOpen={!!orderToCancel}
        onOpenChange={() => setOrderToCancel(null)}
        onConfirm={handleConfirmCancel}
        isCancelling={!!updatingOrderId && updatingOrderId === orderToCancel?.id}
       />
        {chatOrder && userDoc && (
          <ChatDialog
              order={chatOrder}
              user={userDoc}
              isOpen={!!chatOrder}
              onOpenChange={() => setChatOrder(null)}
          />
      )}
    </>
  );
}

export function OrderList({ userDoc }: { userDoc: AppUser | null | undefined }) {
  if (!userDoc) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin" /></div>;
  }
  
  const hasStoreAccess = userDoc.role === 'admin' || userDoc.role === 'host';

  if (!hasStoreAccess) {
    return null; // Don't render if not admin or host
  }
  
  return <KitchenView userDoc={userDoc} />;
}
