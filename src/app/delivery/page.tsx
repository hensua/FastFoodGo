'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collectionGroup, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import type { Order, AppUser } from '@/lib/types';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Truck, CheckCircle2, Navigation, History, BarChart2, Gift, CircleDollarSign, Calendar, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

const OrderCard = ({ order, onAccept, isUpdating }: { order: Order; onAccept: (order: Order) => void; isUpdating: boolean }) => {
  return (
    <Card className="shadow-md animate-fade-in border-l-4 border-green-500">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start text-base">
          <div>
            <span className="font-bold text-lg">#{order.id.slice(-6).toUpperCase()}</span>
            <p className="text-xs text-muted-foreground font-normal">{order.customerName}</p>
          </div>
          <Badge variant="secondary">Asignado a ti</Badge>
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
         <div className="text-sm mt-2 space-y-1 text-green-700">
            <div className="flex justify-between items-center">
                <span className="font-semibold flex items-center gap-1"><Truck size={14}/> Domicilio:</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="font-semibold flex items-center gap-1"><Gift size={14}/> Propina:</span>
                <span>{formatCurrency(order.tip)}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onAccept(order)} className="w-full" disabled={isUpdating}>
          {isUpdating ? <Loader2 className="mr-2 animate-spin" /> : <Truck className="mr-2" />}
           Iniciar Entrega
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
};

const PinDialog = ({ open, onOpenChange, onSubmit, isSubmitting, orderId }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (pin: string) => void; isSubmitting: boolean; orderId: string | null }) => {
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(pin);
  };

  useEffect(() => {
    if (open) {
      setPin('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Entrega</DialogTitle>
          <DialogDescription>
            Pídele al cliente el PIN de 4 dígitos para confirmar que el pedido #{orderId?.slice(-6).toUpperCase()} ha sido entregado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Introduce el PIN"
            maxLength={4}
            className="text-center text-2xl tracking-widest font-bold h-16"
          />
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting || pin.length !== 4}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const StatsPanel = ({ deliveries }: { deliveries: Order[] }) => {
    const stats = useMemo(() => {
        if (!deliveries || deliveries.length === 0) {
            return {
                totalEarnings: 0,
                totalTips: 0,
                totalDeliveryFees: 0,
                totalDeliveries: 0,
                avgEarningsPerDelivery: 0,
                weeklyEarnings: 0,
                monthlyEarnings: 0,
                yearlyEarnings: 0,
                weeklyAverageDeliveries: 0,
                monthlyAverageDeliveries: 0,
            };
        }

        const now = new Date();
        const last7Days = { start: subDays(now, 6), end: now };
        const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
        const thisYear = { start: startOfYear(now), end: endOfYear(now) };

        const deliveriesInLast7Days = deliveries.filter(d => d.orderDate.toDate() && isWithinInterval(d.orderDate.toDate(), last7Days));
        const deliveriesThisMonth = deliveries.filter(d => d.orderDate.toDate() && isWithinInterval(d.orderDate.toDate(), thisMonth));
        const deliveriesThisYear = deliveries.filter(d => d.orderDate.toDate() && isWithinInterval(d.orderDate.toDate(), thisYear));

        const totalEarnings = deliveries.reduce((acc, d) => acc + (d.deliveryFee || 0) + (d.tip || 0), 0);
        const totalTips = deliveries.reduce((acc, d) => acc + (d.tip || 0), 0);
        const totalDeliveryFees = deliveries.reduce((acc, d) => acc + (d.deliveryFee || 0), 0);
        const totalDeliveries = deliveries.length;
        
        const weeklyEarnings = deliveriesInLast7Days.reduce((acc, d) => acc + (d.deliveryFee || 0) + (d.tip || 0), 0);
        const monthlyEarnings = deliveriesThisMonth.reduce((acc, d) => acc + (d.deliveryFee || 0) + (d.tip || 0), 0);
        const yearlyEarnings = deliveriesThisYear.reduce((acc, d) => acc + (d.deliveryFee || 0) + (d.tip || 0), 0);
        
        const avgEarningsPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;
        
        return {
            totalEarnings,
            totalTips,
            totalDeliveryFees,
            totalDeliveries,
            avgEarningsPerDelivery,
            weeklyEarnings,
            monthlyEarnings,
            yearlyEarnings,
            weeklyAverageDeliveries: deliveriesInLast7Days.length, // Total in last 7 days, could be averaged
            monthlyAverageDeliveries: deliveriesThisMonth.length,
        };

    }, [deliveries]);

    if (!deliveries || deliveries.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Estadísticas</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-10">Aún no has completado ninguna entrega para mostrar estadísticas.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ingresos Totales */}
            <Card className="lg:col-span-3 bg-primary/5 border-primary">
                <CardHeader>
                    <CardTitle className="text-primary">Ingresos Totales</CardTitle>
                    <CardDescription>Suma de todos los domicilios y propinas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                </CardContent>
            </Card>

            {/* Desglose de Ingresos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Truck size={18}/> Ingresos por Domicilios</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatCurrency(stats.totalDeliveryFees)}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift size={18}/> Total en Propinas</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatCurrency(stats.totalTips)}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CircleDollarSign size={18}/> Ingreso Promedio / Entrega</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatCurrency(stats.avgEarningsPerDelivery)}</p>
                </CardContent>
            </Card>
            
            {/* Ingresos por Periodo */}
             <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Calendar size={18}/> Ingresos por Período</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div>
                        <p className="text-sm text-muted-foreground">Últimos 7 días</p>
                        <p className="text-2xl font-semibold">{formatCurrency(stats.weeklyEarnings)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Este Mes</p>
                        <p className="text-2xl font-semibold">{formatCurrency(stats.monthlyEarnings)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Este Año</p>
                        <p className="text-2xl font-semibold">{formatCurrency(stats.yearlyEarnings)}</p>
                    </div>
                </CardContent>
             </Card>

            {/* Promedio de Entregas */}
            <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Star size={18}/> Entregas Realizadas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div>
                        <p className="text-sm text-muted-foreground">Últimos 7 días</p>
                        <p className="text-2xl font-semibold">{stats.weeklyAverageDeliveries}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Este Mes</p>
                        <p className="text-2xl font-semibold">{stats.monthlyAverageDeliveries}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Histórico</p>
                        <p className="text-2xl font-semibold">{stats.totalDeliveries}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default function DeliveryPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('deliveries');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<string | null>(null);

  const [pinOrder, setPinOrder] = useState<Order | null>(null);

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userDoc, isLoading: isRoleLoading } = useDoc<AppUser>(userDocRef);
  const isDriver = useMemo(() => userDoc?.role === 'driver', [userDoc]);

  useEffect(() => {
    if (!isUserLoading && !isRoleLoading && user && !isDriver) {
      toast({ variant: 'destructive', title: 'Acceso Denegado', description: 'No tienes permisos de repartidor.' });
      router.push('/');
    }
  }, [user, userDoc, isUserLoading, isRoleLoading, router, toast, isDriver]);

  const assignedOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isDriver) return null;
    return query(collectionGroup(firestore, 'orders'), where('status', '==', 'ready'), where('driverId', '==', user.uid));
  }, [firestore, user, isDriver]);

  const myDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isDriver) return null;
    return query(collectionGroup(firestore, 'orders'), where('driverId', '==', user.uid), where('status', '==', 'delivering'));
  }, [firestore, user, isDriver]);
  
  const myPastDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isDriver) return null;
    return query(collectionGroup(firestore, 'orders'), where('driverId', '==', user.uid), where('status', '==', 'delivered'), orderBy('orderDate', 'desc'));
  }, [firestore, user, isDriver]);

  const { data: assignedOrders, isLoading: assignedOrdersLoading } = useCollection<Order>(assignedOrdersQuery);
  const { data: myDeliveries, isLoading: myDeliveriesLoading } = useCollection<Order>(myDeliveriesQuery);
  const { data: pastDeliveries, isLoading: pastDeliveriesLoading } = useCollection<Order>(myPastDeliveriesQuery);

  const handleStartDelivery = async (order: Order) => {
    if (!firestore || !user || !userDoc) return;
    setIsUpdatingOrder(order.id);
    const orderRef = doc(firestore, 'users', order.customerId, 'orders', order.id);
    try {
      await updateDoc(orderRef, {
        status: 'delivering'
      });
      toast({ title: '¡Entrega iniciada!', description: 'El cliente será notificado que estás en camino.' });
    } catch (error) {
      console.error("Error starting delivery:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo iniciar la entrega.' });
    } finally {
      setIsUpdatingOrder(null);
    }
  };
  
  const handleOpenPinDialog = (order: Order) => {
    setPinOrder(order);
  };

  const handleMarkAsDelivered = async (pin: string) => {
    if (!firestore || !pinOrder) return;
    if (pin !== pinOrder.pin) {
      toast({ variant: 'destructive', title: 'PIN Incorrecto', description: 'El PIN no coincide. Inténtalo de nuevo.' });
      return;
    }

    setIsUpdatingOrder(pinOrder.id);
    const orderRef = doc(firestore, 'users', pinOrder.customerId, 'orders', pinOrder.id);
    try {
      await updateDoc(orderRef, { status: 'delivered' });
      toast({ title: '¡Pedido Entregado!', description: '¡Buen trabajo!' });
      setPinOrder(null);
    } catch (error) {
      console.error("Error delivering order:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la entrega.' });
    } finally {
      setIsUpdatingOrder(null);
    }
  };

  const isLoading = isUserLoading || isRoleLoading;

  if (isLoading || (!isUserLoading && !user)) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Verificando...</div>;
  }
  
  if(!isUserLoading && user && !isDriver) {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} showCart={false} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl shadow-sm border mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="text-primary" /> Panel de Repartidor
          </h1>
          <div className="flex gap-1 p-1 bg-muted rounded-lg flex-wrap">
              <button onClick={() => setActiveTab('deliveries')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'deliveries' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Truck size={16} /> Entregas</button>
              <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><History size={16} /> Historial</button>
              <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'stats' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart2 size={16} /> Estadísticas</button>
          </div>
        </div>

        {activeTab === 'deliveries' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mis Entregas */}
            <div className="bg-muted/50 rounded-xl p-4">
              <h2 className="font-bold text-muted-foreground uppercase tracking-wider mb-4">Mis Entregas ({myDeliveries?.length || 0})</h2>
              <div className="space-y-4">
                {myDeliveriesLoading ? <Loader2 className="animate-spin mx-auto mt-10" /> :
                  myDeliveries && myDeliveries.length > 0 ? (
                    myDeliveries.map(order => <DeliveringCard key={order.id} order={order} onDeliver={handleOpenPinDialog} isUpdating={isUpdatingOrder === order.id} />)
                  ) : (
                    <p className="text-center text-muted-foreground py-10">No tienes entregas activas.</p>
                  )}
              </div>
            </div>

            {/* Pedidos Asignados */}
            <div className="bg-muted/50 rounded-xl p-4">
              <h2 className="font-bold text-muted-foreground uppercase tracking-wider mb-4">Pedidos Asignados ({assignedOrders?.length || 0})</h2>
              <div className="space-y-4">
                {assignedOrdersLoading ? <Loader2 className="animate-spin mx-auto mt-10" /> :
                  assignedOrders && assignedOrders.length > 0 ? (
                    assignedOrders.map(order => <OrderCard key={order.id} order={order} onAccept={handleStartDelivery} isUpdating={isUpdatingOrder === order.id} />)
                  ) : (
                    <p className="text-center text-muted-foreground py-10">No tienes pedidos asignados por ahora.</p>
                  )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <Card>
            <CardHeader><CardTitle>Historial de Entregas</CardTitle></CardHeader>
            <CardContent>
              {pastDeliveriesLoading ? <div className="flex justify-center"><Loader2 className="animate-spin"/></div> : 
               pastDeliveries && pastDeliveries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className='border-b'><tr className='text-left text-sm text-muted-foreground'><th className='p-2'>Pedido</th><th className='p-2'>Fecha</th><th className='p-2'>Cliente</th><th className='p-2'>Propina</th><th className='p-2 text-right'>Ganancia Total</th></tr></thead>
                    <tbody>
                      {pastDeliveries.map(order => (
                        <tr key={order.id} className='border-b'>
                          <td className='p-2 font-mono text-primary'>#{order.id.slice(-6).toUpperCase()}</td>
                          <td className='p-2 text-muted-foreground'>{order.orderDate?.toDate ? new Date(order.orderDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                          <td className='p-2'>{order.customerName}</td>
                          <td className='p-2 text-green-600 font-medium'>{formatCurrency(order.tip || 0)}</td>
                          <td className='p-2 text-right font-semibold'>{formatCurrency((order.deliveryFee || 0) + (order.tip || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
               ) : <p className="text-center text-muted-foreground py-10">No has completado ninguna entrega.</p>
              }
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'stats' && (
            <StatsPanel deliveries={pastDeliveries || []} />
        )}
      </main>

       <PinDialog 
          open={!!pinOrder} 
          onOpenChange={() => setPinOrder(null)} 
          onSubmit={handleMarkAsDelivered}
          isSubmitting={!!isUpdatingOrder && isUpdatingOrder === pinOrder?.id}
          orderId={pinOrder?.id || null}
        />
    </div>
  );
}

    