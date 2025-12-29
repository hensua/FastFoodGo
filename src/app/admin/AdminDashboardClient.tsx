
'use client';

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
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
import type { BrandingConfig } from '@/lib/branding-config';

const TeamManagement = lazy(() => import('@/components/team-management'));

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

type TimeFilter = 'day' | 'week' | 'month' | 'year' | 'all';

export const useOrderStats = (filter: TimeFilter, hasFullAccess: boolean) => {
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

        // Common stats for both admin and host
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

        // Admin-only stats
        if (!hasFullAccess) {
             return { generalStats, monthlySales: null, paymentStats: null, productStats, customerStats };
        }

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

        return { generalStats, monthlySales, paymentStats, productStats, customerStats };
    }, [orders, filter, isLoading, hasFullAccess]);

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

// Full dashboard for admins
const StatsDashboard = ({userDoc}: {userDoc: AppUser}) => {
    const [filter, setFilter] = useState<TimeFilter>('day');
    const { stats, isLoading } = useOrderStats(filter, userDoc.role === 'admin');

    const downloadCSV = () => {
        if (!stats.monthlySales) return;
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
            
             { monthlySales && monthlySales.length > 0 && (
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
             )}


            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {paymentStats && (
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
                )}

                 {productStats?.topSeller && (
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
               {productStats?.top5 && (
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
               )}
               {customerStats?.top5 && (
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
               )}
            </div>
        </div>
    );
};


// Main Admin Dashboard Component
const AdminDashboard = ({ userDoc, brandingConfig }: { userDoc: AppUser; brandingConfig: BrandingConfig }) => {
  const [activeTab, setActiveTab] = useState('kitchen');
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const productsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsCollection);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const isFullAdmin = userDoc.role === 'admin';

  const handleSaveProduct = async (productData: Omit<Product, 'id'> | Product) => {
    if (!firestore) {
      toast({ variant: "destructive", title: "Error", description: "La base de datos no está disponible."});
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
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!firestore || !productToDelete) return;
    
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
            {isFullAdmin && <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'inventory' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Package size={16} /> Inventario</button>}
            {isFullAdmin && <button onClick={() => setActiveTab('team')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'team' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Users size={16} /> Equipo</button>}
            <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'stats' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><TrendingUp size={16} /> Reportes</button>
        </div>
      </div>

      {activeTab === 'kitchen' && <OrderList userDoc={userDoc} brandingConfig={brandingConfig} />}
      
      {activeTab === 'inventory' && isFullAdmin && (
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
      
      {activeTab === 'team' && isFullAdmin && (
         <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <TeamManagement userDoc={userDoc} />
          </Suspense>
      )}
      
      {activeTab === 'stats' && <StatsDashboard userDoc={userDoc}/>}
      
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


export default function AdminDashboardClient({ brandingConfig }: { brandingConfig: BrandingConfig }) {
  const { user, userDoc, isLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login?redirect=/admin');
      return;
    }
    
    if (userDoc && userDoc.role !== 'admin' && userDoc.role !== 'host') {
       toast({
        variant: "destructive",
        title: "Acceso denegado",
        description: "No tienes permisos para ver esta página.",
      });
      router.push('/');
    }
  }, [isLoading, user, userDoc, router, toast]);

  if (isLoading || !userDoc) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Verificando acceso...</div>;
  }
  
  if (userDoc.role !== 'admin' && userDoc.role !== 'host') {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo...</div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} showCart={false} brandingConfig={brandingConfig} />
      <main className="container mx-auto px-4 py-8">
        <AdminDashboard userDoc={userDoc} brandingConfig={brandingConfig}/>
      </main>
    </div>
  );
}

    