'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, setDoc, collectionGroup, query, writeBatch, serverTimestamp, getDocs, where } from 'firebase/firestore';
import type { Order, Product, AppUser, Role } from '@/lib/types';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ChefHat, Package, Trash2, Edit, X, Users, Loader2, UtensilsCrossed, TrendingUp, Download, BarChart, ShoppingBag, Ban, Ticket, CircleDollarSign, XCircle, PackageCheck, Banknote, Landmark, Star, Crown, Trophy, UserRound, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, subMonths, isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { OrderList } from '@/components/order-list';
import Image from 'next/image';
import { FirestorePermissionError, errorEmitter } from '@/firebase';

// Inventory View Components
const ProductForm = ({ product, onSave, onCancel, isSaving }: { product: Product | null, onSave: (product: Omit<Product, 'id'> | Product) => void, onCancel: () => void, isSaving: boolean }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'imageHint'>>(
    product || { name: '', description: '', price: 0, imageUrl: '', category: 'Otros', stockQuantity: 0 }
  );

  useEffect(() => {
    if (product) {
      const { imageHint, ...rest } = product;
      setFormData(rest as Omit<Product, 'id' | 'imageHint'>);
    } else {
      setFormData({ name: '', description: '', price: 0, imageUrl: '', category: 'Otros', stockQuantity: 0 });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stockQuantity' ? Number(value) : value }));
  };
  
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Omit<Product, 'id'> | Product);
  };

  return (
    <Card className="h-fit sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {product ? 'Editar Producto' : 'Añadir Producto'}
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre del producto" required />
          <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descripción" required />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Stock</Label>
              <Input id="stockQuantity" name="stockQuantity" type="number" value={formData.stockQuantity || 0} onChange={handleChange} placeholder="" />
            </div>
          </div>
          <Select name="category" value={formData.category} onValueChange={handleCategoryChange}>
            <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              {['Hamburguesas', 'Pizzas', 'Acompañamientos', 'Bebidas', 'Otros'].map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de la imagen</Label>
              <Input id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/image.png" required />
          </div>
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : (product ? 'Guardar Cambios' : 'Crear Producto')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};


// Team Management View
const TeamManagement = () => {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isRoleChanging, setIsRoleChanging] = useState<string | null>(null);
  const [roleChangeData, setRoleChangeData] = useState<{ user: AppUser; newRole: Role; } | null>(null);
  
  const staffCollection = useMemoFirebase(() => 
      firestore 
          ? query(collection(firestore, 'users'), where('role', 'in', ['admin', 'host', 'driver'])) 
          : null,
      [firestore]
  );
  const { data: staff, isLoading: staffLoading } = useCollection<AppUser>(staffCollection);

  const { admins, hosts, drivers } = useMemo(() => {
    const admins: AppUser[] = [];
    const hosts: AppUser[] = [];
    const drivers: AppUser[] = [];
    
    staff?.forEach(user => {
        if (user.role === 'admin') admins.push(user);
        else if (user.role === 'host') hosts.push(user);
        else if (user.role === 'driver') drivers.push(user);
    });

    return { admins, hosts, drivers };
  }, [staff]);

  const handleRoleChangeRequest = (user: AppUser, newRole: Role) => {
    if (user.role === newRole) return;
    setRoleChangeData({ user, newRole });
  };

  const confirmRoleChange = async () => {
    if (!firestore || !roleChangeData) return;
  
    const { user, newRole } = roleChangeData;
  
    setIsRoleChanging(user.uid);
    setRoleChangeData(null);
  
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, { role: newRole });
      
      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido cambiado a ${newRole}.`
      });
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Error al cambiar rol",
        description: error.message || "No se pudo actualizar el rol. Permiso denegado."
      });
    } finally {
      setIsRoleChanging(null);
    }
  };
  
  const filterUsers = (users: AppUser[] | null) => {
    if (!users) return [];
    return users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }

  const UserTable = ({ users, title, isLoading }: { users: AppUser[] | null, title: string, isLoading: boolean }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div> : 
        !users || users.length === 0 ? <div className="text-center text-muted-foreground py-4">No hay usuarios en este grupo.</div> :
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className='border-b'>
              <tr className='text-left text-sm text-muted-foreground'>
                <th className='pb-2 font-medium'>Usuario</th>
                <th className='pb-2 font-medium'>Email</th>
                <th className='pb-2 font-medium text-right w-48'>Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.uid} className='border-b'>
                  <td className='py-3 font-medium flex items-center gap-2'>
                    {user.displayName || "Sin Nombre"}
                  </td>
                  <td className="py-3 text-muted-foreground">{user.email}</td>
                  <td className='py-3 text-right'>
                    {isRoleChanging === user.uid ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> :
                      <Select value={user.role} onValueChange={(newRole) => handleRoleChangeRequest(user, newRole as Role)}>
                        <SelectTrigger className="w-40 ml-auto h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="host">Anfitrión</SelectItem>
                          <SelectItem value="driver">Repartidor</SelectItem>
                          <SelectItem value="customer">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </CardContent>
    </Card>
  );

  return (
    <div className='space-y-8'>
       <Card>
        <CardHeader>
          <CardTitle>Gestión de Equipo</CardTitle>
          <CardDescription>Busca y administra los roles de los usuarios en la plataforma.</CardDescription>
          <Input 
            placeholder="Buscar por nombre o correo electrónico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
       </Card>

        <div className="space-y-6">
          <UserTable users={filterUsers(admins)} title="Administradores" isLoading={staffLoading} />
          <UserTable users={filterUsers(hosts)} title="Anfitriones" isLoading={staffLoading} />
          <UserTable users={filterUsers(drivers)} title="Repartidores" isLoading={staffLoading}/>
        </div>

      <AlertDialog open={!!roleChangeData} onOpenChange={() => setRoleChangeData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio de rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cambiar el rol de <span className='font-bold'>{roleChangeData?.user.displayName || roleChangeData?.user.email}</span> a <span className='font-bold uppercase'>{roleChangeData?.newRole}</span>. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


type TimeFilter = 'day' | 'week' | 'month' | 'year' | 'all';

const useOrderStats = (filter: TimeFilter) => {
    const firestore = useFirestore();
    
    const allOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collectionGroup(firestore, 'orders');
    }, [firestore]);

    const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(allOrdersQuery);
    
    const isLoading = !firestore || isOrdersLoading;

    const stats = useMemo(() => {
        if (isLoading || !orders) {
            const zeroStats = { totalSales: 0, totalOrders: 0, deliveredOrders: 0, cancelledOrders: 0, avgTicket: 0, };
            const zeroMonthly = Array.from({ length: 12 }, (_, i) => ({ name: format(subMonths(new Date(), i), 'MMM yyyy', { locale: es }), Ventas: 0 })).reverse();
            return { generalStats: zeroStats, monthlySales: zeroMonthly, paymentStats: { cashOrdersCount: 0, transferOrdersCount: 0, cashTotalAmount: 0, transferTotalAmount: 0, mostUsedPaymentMethod: '-' }, productStats: { topSeller: null, top5: [] }, customerStats: { top5: [] }, };
        }

        const filteredByTime = orders.filter(o => {
            if (!o.orderDate?.toDate) return false;
            const date = o.orderDate.toDate();
            if (filter === 'day') return isToday(date);
            if (filter === 'week') return isThisWeek(date, { weekStartsOn: 1 });
            if (filter === 'month') return isThisMonth(date);
            if (filter === 'year') return isThisYear(date);
            return true;
        });

        const deliveredOrders = filteredByTime.filter(o => o.status === 'delivered');
        
        const totalSales = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const avgTicket = deliveredOrders.length > 0 ? totalSales / deliveredOrders.length : 0;

        const generalStats = { totalSales, totalOrders: filteredByTime.length, deliveredOrders: deliveredOrders.length, cancelledOrders: filteredByTime.filter(o => o.status === 'cancelled').length, avgTicket, };

        const salesByMonth: { [key: string]: number } = {};
        const last12Months = Array.from({ length: 12 }, (_, i) => subMonths(new Date(), i));
        last12Months.forEach(date => { salesByMonth[format(date, 'MMM yyyy', { locale: es })] = 0; });
        orders.filter(o => o.status === 'delivered').forEach(order => {
            if (order.orderDate?.toDate) {
                const monthKey = format(order.orderDate.toDate(), 'MMM yyyy', { locale: es });
                if (monthKey in salesByMonth) {
                    salesByMonth[monthKey] += order.totalAmount;
                }
            }
        });
        const monthlySales = Object.entries(salesByMonth).map(([name, sales]) => ({ name, Ventas: sales })).reverse();
        
        const cashOrders = deliveredOrders.filter(o => o.paymentMethod === 'cash');
        const transferOrders = deliveredOrders.filter(o => o.paymentMethod === 'transfer');
        const paymentStats = {
            cashOrdersCount: cashOrders.length,
            transferOrdersCount: transferOrders.length,
            cashTotalAmount: cashOrders.reduce((sum, o) => sum + o.totalAmount, 0),
            transferTotalAmount: transferOrders.reduce((sum, o) => sum + o.totalAmount, 0),
            mostUsedPaymentMethod: cashOrders.length >= transferOrders.length ? 'Efectivo' : 'Transferencia',
        };

        const productCounts: { [name: string]: { count: number; imageUrl?: string } } = {};
        deliveredOrders.forEach(order => {
            order.items.forEach(item => {
                const name = item.product.name;
                if (!productCounts[name]) productCounts[name] = { count: 0, imageUrl: item.product.imageUrl };
                productCounts[name].count += item.quantity;
            });
        });
        const sortedProducts = Object.entries(productCounts).map(([name, data]) => ({ name, count: data.count, imageUrl: data.imageUrl })).sort((a, b) => b.count - a.count);
        
        const productStats = { topSeller: sortedProducts.length > 0 ? sortedProducts[0] : null, top5: sortedProducts.slice(0, 5), };

        const customerSpending: { [name: string]: number } = {};
        deliveredOrders.forEach(order => {
            const name = order.customerName || 'Cliente Anónimo';
            if (!customerSpending[name]) customerSpending[name] = 0;
            customerSpending[name] += order.totalAmount;
        });
        const topCustomers = Object.entries(customerSpending).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5);

        const customerStats = { top5: topCustomers };

        return { generalStats, monthlySales, paymentStats, productStats, customerStats };
    }, [orders, filter, isLoading]);

    return { stats, isLoading };
};

const TimeFilterControls = ({ filter, setFilter }: { filter: TimeFilter; setFilter: (f: TimeFilter) => void }) => {
    const filters: { label: string, value: TimeFilter }[] = [
        { label: 'Día', value: 'day' },
        { label: 'Semana', value: 'week' },
        { label: 'Mes', value: 'month' },
        { label: 'Año', value: 'year' },
        { label: 'Todos', value: 'all' },
    ];
    return (
        <div className="flex justify-center gap-1 p-1 bg-muted rounded-lg flex-wrap mb-6">
            {filters.map(f => (
                <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === f.value ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}

// Simplified dashboard for hosts
const HostStatsDashboard = () => {
    const [filter, setFilter] = useState<TimeFilter>('day');
    const { stats, isLoading } = useOrderStats(filter);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /> Cargando reportes...</div>;
    }
    
    const { generalStats } = stats;

    return (
        <div className="space-y-6">
            <TimeFilterControls filter={filter} setFilter={setFilter} />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{generalStats.totalOrders}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos por Domicilio</CardTitle>
                        <PackageCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{generalStats.deliveredOrders}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos en Tienda</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Próximamente</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Cancelados</CardTitle>
                        <Ban className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{generalStats.cancelledOrders}</div></CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Acceso Limitado a Reportes</CardTitle>
                    <CardDescription>Contacta a un administrador para ver el desglose completo de ventas, productos y clientes.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
};


// Full dashboard for admins
const StatsDashboard = () => {
    const [filter, setFilter] = useState<TimeFilter>('day');
    const { stats, isLoading } = useOrderStats(filter);

    const downloadCSV = () => {
        const { monthlySales } = stats;
        const headers = ["Mes", "Ventas"];
        const rows = monthlySales.map(item => [item.name, item.Ventas]);
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reporte_ventas_mensuales.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /> Cargando reportes...</div>;
    }
    
    const { generalStats, monthlySales, paymentStats, productStats, customerStats } = stats;

    return (
        <div className="space-y-6">
            <TimeFilterControls filter={filter} setFilter={setFilter} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(generalStats.totalSales)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(generalStats.avgTicket)}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{generalStats.totalOrders}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos por Domicilio</CardTitle>
                        <PackageCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{generalStats.deliveredOrders}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos en Tienda</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Próximamente</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Ventas en los Últimos 12 Meses</CardTitle>
                            <CardDescription>Un resumen de los ingresos generados mensualmente (no afectado por el filtro).</CardDescription>
                        </div>
                        <Button onClick={downloadCSV} variant="outline"><Download className="mr-2 h-4 w-4" />Descargar CSV</Button>
                    </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={monthlySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value as number)}`} />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), "Ventas"]} cursor={{ fill: 'hsl(var(--muted))' }}/>
                            <Bar dataKey="Ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>Estadísticas de Pago</CardTitle><CardDescription>Análisis de los métodos de pago ({filter === 'all' ? 'total' : `último ${filter}`}).</CardDescription></CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div className='flex items-center gap-2'><Banknote className="h-5 w-5 text-muted-foreground" /><div><p className='font-semibold'>Total en Efectivo</p><p className="text-xs text-muted-foreground">{paymentStats.cashOrdersCount} transacciones</p></div></div>
                            <div className="font-bold">{formatCurrency(paymentStats.cashTotalAmount)}</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div className='flex items-center gap-2'><Landmark className="h-5 w-5 text-muted-foreground" /><div><p className='font-semibold'>Total en Transferencia</p><p className="text-xs text-muted-foreground">{paymentStats.transferOrdersCount} transacciones</p></div></div>
                            <div className="font-bold">{formatCurrency(paymentStats.transferTotalAmount)}</div>
                        </div>
                         <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                            <div className='flex items-center gap-2'><Star className="h-5 w-5 text-muted-foreground" /><div><p className='font-semibold'>Método Preferido</p><p className="text-xs text-muted-foreground">{Math.round(Math.max(paymentStats.cashOrdersCount, paymentStats.transferOrdersCount) / (generalStats.deliveredOrders || 1) * 100)}% de los pedidos</p></div></div>
                            <div className="font-bold">{paymentStats.mostUsedPaymentMethod}</div>
                        </div>
                    </CardContent>
                </Card>

                 {productStats.topSeller && (
                    <Card className="flex flex-col lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Producto Estrella</CardTitle>
                            <CardDescription>El producto más vendido en el período seleccionado.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col md:flex-row gap-6 items-center justify-center text-center md:text-left">
                            <Image src={productStats.topSeller.imageUrl || '/placeholder.png'} alt={productStats.topSeller.name} width={128} height={128} className="rounded-lg object-cover w-32 h-32"/>
                            <div className='space-y-1'>
                                <p className='text-sm font-semibold text-primary'>Top #1</p>
                                <h3 className="text-2xl font-bold">{productStats.topSeller.name}</h3>
                                <p className="text-3xl font-bold text-muted-foreground">{productStats.topSeller.count} <span className="text-base font-normal">unidades vendidas</span></p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500"/> Top 5 Productos Más Vendidos</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {productStats.top5.map((p, index) => (
                                <li key={p.name} className="flex items-center gap-4">
                                    <span className="font-bold text-lg text-muted-foreground w-6">#{index+1}</span>
                                    <Image src={p.imageUrl || '/placeholder.png'} alt={p.name} width={40} height={40} className="rounded-md object-cover w-10 h-10"/>
                                    <p className="font-semibold flex-grow">{p.name}</p>
                                    <Badge variant="secondary" className="font-mono">{p.count} und.</Badge>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Crown className="text-amber-500"/> Top 5 Clientes</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {customerStats.top5.map((c, index) => (
                                <li key={c.name} className="flex items-center gap-4">
                                    <span className="font-bold text-lg text-muted-foreground w-6">#{index+1}</span>
                                    <div className='p-2 rounded-full bg-muted'><UserRound className='w-5 h-5 text-muted-foreground'/></div>
                                    <p className="font-semibold flex-grow">{c.name}</p>
                                    <Badge variant="secondary" className="font-mono">{formatCurrency(c.total)}</Badge>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


// Main Admin Dashboard Component
const AdminDashboard = ({ userDoc }: { userDoc: AppUser }) => {
  const [activeTab, setActiveTab] = useState('kitchen');
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const productsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsCollection);

  const isFullAdmin = userDoc.role === 'admin';
  const hasStoreAccess = userDoc.role === 'admin' || userDoc.role === 'host';
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const handleSaveProduct = async (productData: Omit<Product, 'id'> | Product) => {
    if (!firestore || !isFullAdmin) {
      toast({ variant: "destructive", title: "Acción no permitida", description: "No tienes permisos para guardar productos."});
      return;
    };
    setIsSavingProduct(true);
    try {
      if ('id' in productData && productData.id) {
        const productRef = doc(firestore, 'products', productData.id);
        const { id, ...dataToUpdate } = productData;
        await updateDoc(productRef, dataToUpdate);
        toast({ title: "Producto actualizado", description: `${productData.name} fue actualizado con éxito.`});
      } else {
        const newDocRef = doc(collection(firestore, 'products'));
        await setDoc(newDocRef, { ...productData, id: newDocRef.id });
        toast({ title: "Producto creado", description: `Se ha añadido un nuevo producto al catálogo.`});
      }
      setEditingProduct(null);
    } catch (error: any) {
      console.error("Error saving product:", error);
      const permissionError = new FirestorePermissionError({
        path: 'id' in productData ? `/products/${productData.id}`: '/products',
        operation: 'write',
        requestResourceData: productData
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: "destructive", title: "Error al guardar", description: "No se pudo guardar el producto."});
    } finally {
      setIsSavingProduct(false);
    }
  };

  const openDeleteDialog = (productId: string) => {
    if (!isFullAdmin) return;
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!firestore || !productToDelete || !isFullAdmin) return;
    
    try {
      const productRef = doc(firestore, 'products', productToDelete);
      await deleteDoc(productRef);
      toast({ title: "Producto eliminado", description: "El producto se ha eliminado con éxito." });
    } catch(e: any) {
       const permissionError = new FirestorePermissionError({
        path: `/products/${productToDelete}`,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar el producto."});
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl shadow-sm border mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="text-primary" /> Panel de Control
        </h2>
        <div className="flex gap-1 p-1 bg-muted rounded-lg flex-wrap">
            <button onClick={() => setActiveTab('kitchen')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'kitchen' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><ChefHat size={16} /> Comandas</button>
            {isFullAdmin && (
              <>
                <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'inventory' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Package size={16} /> Inventario</button>
                <button onClick={() => setActiveTab('team')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'team' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Users size={16} /> Equipo</button>
              </>
            )}
             {hasStoreAccess && (
                 <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'stats' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><TrendingUp size={16} /> Reportes</button>
             )}
        </div>
      </div>

      {activeTab === 'kitchen' && userDoc && <OrderList userDoc={userDoc} />}
      
      {isFullAdmin && activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Productos</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className='border-b'><tr className='text-left text-sm text-muted-foreground'><th className='p-2'>Producto</th><th className='p-2'>Categoría</th><th className='p-2'>Precio</th><th className='p-2'>Stock</th><th className='p-2 text-right'>Acciones</th></tr></thead>
                    <tbody>
                      {productsLoading ? <tr><td colSpan={5} className="text-center p-4"><Loader2 className="animate-spin inline-block" /></td></tr> : (
                        products?.map(p => (
                          <tr key={p.id} className='border-b'>
                            <td className='p-2 font-medium'>{p.name}</td>
                            <td className="p-2"><Badge variant="secondary">{p.category}</Badge></td>
                            <td className="p-2">{formatCurrency(p.price)}</td>
                            <td className="p-2">{p.stockQuantity}</td>
                            <td className='flex justify-end gap-1 p-2'>
                              <Button variant="ghost" size="icon" onClick={() => setEditingProduct(p)}><Edit className='h-4 w-4'/></Button>
                              <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(p.id)}><Trash2 className='h-4 w-4 text-destructive'/></Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          <div><ProductForm product={editingProduct} onSave={handleSaveProduct} onCancel={() => setEditingProduct(null)} isSaving={isSavingProduct} /></div>
        </div>
      )}
      
      {isFullAdmin && activeTab === 'team' && <TeamManagement />}
      
      {activeTab === 'stats' && hasStoreAccess && (
          isFullAdmin ? <StatsDashboard /> : <HostStatsDashboard />
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutely seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
              de tu base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProduct} className='bg-destructive hover:bg-destructive/80'>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userDoc, isLoading: isUserDocLoading } = useDoc<AppUser>(userDocRef);
  
  const isLoading = isUserLoading || isUserDocLoading;
  const hasAccess = userDoc?.role === 'admin' || userDoc?.role === 'host';
  
  useEffect(() => {
    // Solo actuar cuando la carga haya terminado.
    if (!isLoading) {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "Debes iniciar sesión para ver esta página.",
        });
        router.push('/login?redirect=/admin');
      } else if (!hasAccess) {
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "Debes ser un administrador o anfitrión para ver esta página.",
        });
        router.push('/');
      }
    }
  }, [isLoading, user, hasAccess, router, toast]);

  if (isLoading || !userDoc || !hasAccess) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Verificando acceso...</div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} showCart={false} />
      <main className="container mx-auto px-4 py-8">
        <AdminDashboard userDoc={userDoc} />
      </main>
    </div>
  );
}
