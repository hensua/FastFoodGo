'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, setDoc, collectionGroup, query, getDocs } from 'firebase/firestore';
import type { Order, Product, AppUser, Role } from '@/lib/types';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ChefHat, Package, Trash2, Edit, X, Users, Loader2, UtensilsCrossed, TrendingUp, Download, BarChart, ShoppingBag, Ban, Ticket, CircleDollarSign, XCircle, PackageCheck } from 'lucide-react';
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
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { OrderList } from '@/components/order-list';

// Inventory View Components
const ProductForm = ({ product, onSave, onCancel, isSaving }: { product: Product | null, onSave: (product: Omit<Product, 'id'> | Product) => void, onCancel: () => void, isSaving: boolean }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'imageHint'>>(
    product || { name: '', description: '', price: 0, imageUrl: '', category: 'Otros', stock: 0 }
  );

  useEffect(() => {
    if (product) {
      const { imageHint, ...rest } = product;
      setFormData(rest as Omit<Product, 'id' | 'imageHint'>);
    } else {
      setFormData({ name: '', description: '', price: 0, imageUrl: '', category: 'Otros', stock: 0 });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' ? Number(value) : value }));
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
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" name="stock" type="number" value={formData.stock || 0} onChange={handleChange} placeholder="" />
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

  const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<AppUser>(usersCollection);

  const [searchTerm, setSearchTerm] = useState('');
  const [isRoleChanging, setIsRoleChanging] = useState<string | null>(null);

  const [roleChangeData, setRoleChangeData] = useState<{ uid: string; newRole: Role; userName: string } | null>(null);

  const handleRoleChangeRequest = (uid: string, newRole: Role, user: AppUser) => {
    if (user.role === newRole) return;
    setRoleChangeData({ uid, newRole, userName: user.displayName || user.email || 'Usuario' });
  };

  const confirmRoleChange = async () => {
    if (!firestore || !roleChangeData) return;

    const { uid, newRole } = roleChangeData;
    setIsRoleChanging(uid);
    setRoleChangeData(null); // Close dialog

    const userRef = doc(firestore, "users", uid);

    try {
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
  
  const groupedUsers = useMemo(() => {
    const groups: { admins: AppUser[], drivers: AppUser[], customers: AppUser[] } = {
      admins: [],
      drivers: [],
      customers: [],
    };

    const filtered = users?.filter(user =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    filtered.forEach(user => {
      if (user.role === 'admin') groups.admins.push(user);
      else if (user.role === 'driver') groups.drivers.push(user);
      else groups.customers.push(user);
    });

    return groups;
  }, [users, searchTerm]);

  const UserTable = ({ users, title }: { users: AppUser[], title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? <div className="text-center text-muted-foreground py-4">No hay usuarios en este grupo.</div> :
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
                      <Select value={user.role} onValueChange={(newRole) => handleRoleChangeRequest(user.uid, newRole as Role, user)}>
                        <SelectTrigger className="w-40 ml-auto h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
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

      {usersLoading || !firestore ? <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div> :
        <div className="space-y-6">
          <UserTable users={groupedUsers.admins} title="Administradores" />
          <UserTable users={groupedUsers.drivers} title="Repartidores" />
          <UserTable users={groupedUsers.customers} title="Clientes" />
        </div>
      }

      <AlertDialog open={!!roleChangeData} onOpenChange={() => setRoleChangeData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio de rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cambiar el rol de <span className='font-bold'>{roleChangeData?.userName}</span> a <span className='font-bold uppercase'>{roleChangeData?.newRole}</span>. ¿Estás seguro?
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

// Stats Dashboard View
const StatsDashboard = () => {
    const firestore = useFirestore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!firestore) return;
            setIsLoading(true);
            try {
                const ordersQuery = query(collectionGroup(firestore, 'orders'));
                const querySnapshot = await getDocs(ordersQuery);
                const fetchedOrders = querySnapshot.docs.map(doc => doc.data() as Order);
                setOrders(fetchedOrders);
            } catch (error) {
                console.error("Error fetching orders for stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [firestore]);

    const stats = useMemo(() => {
        const totalOrders = orders.length;
        const deliveredOrders = orders.filter(o => o.status === 'delivered');
        const cancelledOrders = orders.filter(o => o.status === 'cancelled');
        const totalSales = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const avgTicket = deliveredOrders.length > 0 ? totalSales / deliveredOrders.length : 0;

        return {
            totalSales,
            totalOrders,
            deliveredOrders: deliveredOrders.length,
            cancelledOrders: cancelledOrders.length,
            avgTicket,
        };
    }, [orders]);

    const monthlySales = useMemo(() => {
        const salesByMonth: { [key: string]: number } = {};
        const last12Months = Array.from({ length: 12 }, (_, i) => subMonths(new Date(), i));

        last12Months.forEach(date => {
            const monthKey = format(date, 'MMM yyyy', { locale: es });
            salesByMonth[monthKey] = 0;
        });

        orders.forEach(order => {
            if (order.status === 'delivered' && order.orderDate) {
                const orderDate = new Date(order.orderDate.seconds * 1000);
                const monthKey = format(orderDate, 'MMM yyyy', { locale: es });
                if (monthKey in salesByMonth) {
                    salesByMonth[monthKey] += order.totalAmount;
                }
            }
        });
        
        return Object.entries(salesByMonth).map(([name, sales]) => ({ name, Ventas: sales })).reverse();
    }, [orders]);

    const downloadCSV = () => {
        const headers = ["Mes", "Ventas"];
        const rows = monthlySales.map(item => [item.name, item.Ventas]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        
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

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.avgTicket)}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Entregados</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.deliveredOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Cancelados</CardTitle>
                        <Ban className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.cancelledOrders}</div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Ventas en los Últimos 12 Meses</CardTitle>
                            <CardDescription>Un resumen de los ingresos generados mensualmente.</CardDescription>
                        </div>
                        <Button onClick={downloadCSV} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Descargar CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={monthlySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis 
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${formatCurrency(value as number)}`}
                             />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), "Ventas"]} cursor={{ fill: 'hsl(var(--muted))' }}/>
                            <Bar dataKey="Ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};


// Main Admin Dashboard Component
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('kitchen');
  const firestore = useFirestore();
  const { toast } = useToast();

  const productsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsCollection);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  
  // State for the delete confirmation dialog
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);


  const handleSaveProduct = async (productData: Omit<Product, 'id'> | Product) => {
    if (!firestore) return;
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
    } catch (error) {
      console.error("Error saving product:", error);
      toast({ variant: "destructive", title: "Error al guardar", description: "No se pudo guardar el producto."});
    } finally {
      setIsSavingProduct(false);
    }
  };

  const openDeleteDialog = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (!firestore || !productToDelete) return;
    
    const productRef = doc(firestore, 'products', productToDelete);
    deleteDocumentNonBlocking(productRef);
    
    toast({ title: "Producto eliminado", description: "El producto se ha eliminado con éxito." });
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl shadow-sm border mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="text-primary" /> Panel de Control
        </h2>
        <div className="flex gap-1 p-1 bg-muted rounded-lg flex-wrap">
            <button onClick={() => setActiveTab('kitchen')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'kitchen' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><ChefHat size={16} /> Comandas</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'inventory' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Package size={16} /> Inventario</button>
            <button onClick={() => setActiveTab('team')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'team' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Users size={16} /> Equipo</button>
            <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'stats' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><TrendingUp size={16} /> Reportes</button>
        </div>
      </div>

      {activeTab === 'kitchen' && <OrderList />}
      {activeTab === 'inventory' && (
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
                            <td className="p-2">{p.stock}</td>
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
      {activeTab === 'team' && <TeamManagement />}
      {activeTab === 'stats' && <StatsDashboard />}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
              de tu base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProduct}>Confirmar</AlertDialogAction>
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
  const { data: userDoc, isLoading: isRoleLoading } = useDoc<AppUser>(userDocRef);
  
  const isAdmin = useMemo(() => userDoc?.role === 'admin', [userDoc]);

  // This is the loading state for the initial check.
  const isLoading = isUserLoading || isRoleLoading;
  
  useEffect(() => {
    // Don't do anything until loading is complete
    if (isLoading || !firestore) return;

    // Once loading is done, check for access.
    if (!user || !isAdmin) {
      toast({
        variant: "destructive",
        title: "Acceso denegado",
        description: "Debes ser un administrador para ver esta página.",
      });
      router.push('/login?redirect=/admin');
    }
  }, [user, isAdmin, isLoading, router, toast, firestore]);

  if (isLoading || !firestore) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Verificando acceso...</div>;
  }

  // If we are not loading and the user is an admin, render the dashboard.
  // The useEffect above handles the redirection for non-admins.
  // We add an explicit check here to prevent flashing the content for non-admins before redirection.
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header onCartClick={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <AdminDashboard />
        </main>
      </div>
    );
  }

  // If the user is not an admin, we show a loading spinner while redirecting.
  return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo...</div>;
}
