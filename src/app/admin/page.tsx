'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirestore, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError, useDoc } from '@/firebase';
import { collectionGroup, query, where, doc, updateDoc, addDoc, deleteDoc, collection, setDoc } from 'firebase/firestore';
import type { Order, OrderStatus, Product, AppUser, Role } from '@/lib/types';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Clock, ChefHat, PackageCheck, UtensilsCrossed, Package, TrendingUp, Trash2, Edit, X, Users, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Kitchen View Components
const statusConfig = {
  pending: { title: 'Pendientes', icon: Clock, color: 'border-l-4 border-red-500' },
  cooking: { title: 'En Preparación', icon: ChefHat, color: 'border-l-4 border-yellow-500' },
  ready: { title: 'Listos para Servir', icon: PackageCheck, color: 'border-l-4 border-green-500' },
};

const OrderCard = ({ order, onStatusChange }: { order: Order, onStatusChange: (orderId: string, customerId: string, newStatus: OrderStatus) => void }) => {
  const currentStatusConfig = statusConfig[order.status as keyof typeof statusConfig];
  const nextStatusMap: Record<OrderStatus, OrderStatus | null> = { pending: 'cooking', cooking: 'ready', ready: 'delivered', delivered: null };
  const nextStatus = nextStatusMap[order.status];
  const actionTextMap: Record<string, string> = { cooking: "A Cocinar", ready: "Terminar", delivered: "Entregar" };

  return (
    <Card className={`shadow-md animate-fade-in ${currentStatusConfig.color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start text-base">
          <div>
            <span className='font-bold text-lg'>#{order.id.slice(-6)}</span>
            <p className="text-xs text-gray-500 font-normal">{order.customerName || 'Cliente Anónimo'}</p>
          </div>
          <Badge className={order.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
            {order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mb-4 border-t pt-2">
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


// Inventory View Components
const ProductForm = ({ product, onSave, onCancel, isSaving }: { product: Product | null, onSave: (product: Omit<Product, 'id'> | Product) => void, onCancel: () => void, isSaving: boolean }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'imageHint'>>(
    product || { name: '', description: '', price: 0, imageUrl: '', category: 'Otros', stock: 0 }
  );

  useEffect(() => {
    if (product) {
      const { imageHint, ...rest } = product;
      setFormData(rest);
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
            <Input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Precio" required />
            <Input name="stock" type="number" value={formData.stock || 0} onChange={handleChange} placeholder="Stock" />
          </div>
          <Select name="category" value={formData.category} onValueChange={handleCategoryChange}>
            <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              {['Hamburguesas', 'Pizzas', 'Acompañamientos', 'Bebidas', 'Otros'].map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="URL de la imagen" required />
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : (product ? 'Guardar Cambios' : 'Crear Producto')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

type UserWithRole = AppUser & { role: Role; };

// Team Management View
const TeamManagement = () => {
  const firestore = useFirestore();
  const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<AppUser>(usersCollection);

  const [usersWithRoles, setUsersWithRoles] = useState<UserWithRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [isRoleChanging, setIsRoleChanging] = useState<string | null>(null);

  useEffect(() => {
    if (!users || !firestore) return;
  
    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      const usersWithRolesPromises = users.map(async (user) => {
        const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
        const driverRoleRef = doc(firestore, 'roles_driver', user.uid);
        const [adminDoc, driverDoc] = await Promise.all([
          getDoc(adminRoleRef),
          getDoc(driverRoleRef)
        ]);

        let role: Role = 'customer';
        if (adminDoc.exists()) role = 'admin';
        else if (driverDoc.exists()) role = 'driver';
        
        return { ...user, role };
      });
      
      const resolvedUsers = await Promise.all(usersWithRolesPromises);
      setUsersWithRoles(resolvedUsers);
      setIsLoadingRoles(false);
    };

    fetchRoles();

  }, [users, firestore]);
  
  const handleRoleChange = async (uid: string, newRole: Role) => {
    if(!firestore) return;
    setIsRoleChanging(uid);
    
    const adminRoleRef = doc(firestore, "roles_admin", uid);
    const driverRoleRef = doc(firestore, "roles_driver", uid);

    try {
      if (newRole === 'admin') {
        await setDoc(adminRoleRef, { assignedAt: new Date() });
        await deleteDoc(driverRoleRef);
      } else if (newRole === 'driver') {
        await setDoc(driverRoleRef, { assignedAt: new Date() });
        await deleteDoc(adminRoleRef);
      } else { // customer
        await deleteDoc(adminRoleRef);
        await deleteDoc(driverRoleRef);
      }
      // Update local state to reflect change immediately
      setUsersWithRoles(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error: any) {
      console.error("Error setting user role:", error);
      alert(`Error al cambiar el rol: ${error.message}`);
    } finally {
      setIsRoleChanging(null);
    }
  };

  const filteredUsers = usersWithRoles.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = usersLoading || isLoadingRoles;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Equipo</CardTitle>
        <Input 
          placeholder="Buscar por correo electrónico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div> :
         filteredUsers.length === 0 ? <div className="text-center text-muted-foreground py-8">No se encontraron usuarios.</div> :
        <table className="w-full">
          <thead className='border-b'>
            <tr className='text-left text-sm text-muted-foreground'>
              <th className='pb-2'>Usuario</th>
              <th className='pb-2'>Email</th>
              <th className='pb-2 w-48 text-right'>Rol</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.uid} className='border-b'>
                <td className='py-2 font-medium flex items-center gap-2'>
                   {user.displayName || "Sin Nombre"}
                </td>
                <td>{user.email}</td>
                <td className='py-2 text-right'>
                  {isRoleChanging === user.uid ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> :
                    <Select value={user.role} onValueChange={(newRole) => handleRoleChange(user.uid, newRole as Role)}>
                      <SelectTrigger className="w-40 ml-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Cliente</SelectItem>
                        <SelectItem value="driver">Repartidor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </CardContent>
    </Card>
  );
};


// Main Admin Dashboard Component
const AdminDashboard = ({ isAdmin }: { isAdmin: boolean }) => {
  const [activeTab, setActiveTab] = useState('kitchen');
  const firestore = useFirestore();

  // Product state
  const productsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsCollection);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Orders state
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collectionGroup(firestore, 'orders'), where('status', 'in', ['pending', 'cooking', 'ready']));
  }, [firestore, isAdmin]);
  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  const handleStatusChange = async (orderId: string, customerId: string, newStatus: OrderStatus) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'customers', customerId, 'orders', orderId);
    try {
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order status: ", error);
      const contextualError = new FirestorePermissionError({ path: orderRef.path, operation: 'update', requestResourceData: { status: newStatus } });
      errorEmitter.emit('permission-error', contextualError);
    }
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'> | Product) => {
    if (!firestore) return;
    setIsSavingProduct(true);
    try {
      if ('id' in productData && productData.id) {
        const productRef = doc(firestore, 'products', productData.id);
        const { id, ...dataToUpdate } = productData;
        await updateDoc(productRef, dataToUpdate);
      } else {
        const { id, ...dataToAdd } = productData as Product;
        await addDoc(collection(firestore, 'products'), dataToAdd);
      }
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error al guardar el producto.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!firestore) return;
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteDoc(doc(firestore, 'products', productId));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const ordersByStatus = useMemo(() => ({
    pending: orders?.filter(o => o.status === 'pending') || [],
    cooking: orders?.filter(o => o.status === 'cooking') || [],
    ready: orders?.filter(o => o.status === 'ready') || [],
  }), [orders]);

  return (
    <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="text-primary" /> Panel de Control
            </h2>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button onClick={() => setActiveTab('kitchen')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'kitchen' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}><ChefHat size={16} /> Comandas</button>
                <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'inventory' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}><Package size={16} /> Inventario</button>
                <button onClick={() => setActiveTab('team')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'team' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}><Users size={16} /> Equipo</button>
                <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'stats' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}><TrendingUp size={16} /> Reportes</button>
            </div>
        </div>

      {activeTab === 'kitchen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(statusKey => (
            <div key={statusKey} className="bg-gray-50 rounded-xl p-4 min-h-[500px]">
              <h3 className="font-bold text-gray-500 uppercase tracking-wider mb-4 flex justify-between items-center">{statusConfig[statusKey].title}<span className="bg-white px-2 py-1 rounded-full text-xs shadow-sm">{ordersByStatus[statusKey].length}</span></h3>
              <div className="space-y-4">
                {ordersLoading ? <p>Cargando pedidos...</p> : ordersByStatus[statusKey].length > 0 ? (
                  ordersByStatus[statusKey].map(order => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))
                ) : <div className="text-center text-gray-400 py-10 italic text-sm">No hay pedidos en esta etapa</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Productos</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead className='border-b'><tr className='text-left text-sm text-muted-foreground'><th className='pb-2'>Producto</th><th className='pb-2'>Categoría</th><th className='pb-2'>Precio</th><th className='pb-2'>Stock</th><th className='pb-2 text-right'>Acciones</th></tr></thead>
                  <tbody>
                    {productsLoading ? <tr><td colSpan={5}>Cargando...</td></tr> : (
                      products?.map(p => (
                        <tr key={p.id} className='border-b'>
                          <td className='py-2 font-medium'>{p.name}</td>
                          <td><Badge variant="secondary">{p.category}</Badge></td>
                          <td>{formatCurrency(p.price)}</td>
                          <td>{p.stock}</td>
                          <td className='flex justify-end gap-2 py-2'>
                            <Button variant="ghost" size="icon" onClick={() => setEditingProduct(p)}><Edit className='h-4 w-4'/></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)}><Trash2 className='h-4 w-4 text-destructive'/></Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
          <div><ProductForm product={editingProduct} onSave={handleSaveProduct} onCancel={() => setEditingProduct(null)} isSaving={isSavingProduct} /></div>
        </div>
      )}

      {activeTab === 'team' && <TeamManagement />}
      {activeTab === 'stats' && <div className="text-center p-8 bg-white rounded-lg shadow-sm">Reportes Próximamente...</div>}
    </div>
  );
};


export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const adminRoleRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'roles_admin', user.uid) : null, [firestore, user]);
  const { data: adminRoleDoc, isLoading: isRoleLoading } = useDoc(adminRoleRef);
  
  const isAdmin = useMemo(() => !!adminRoleDoc, [adminRoleDoc]);

  useEffect(() => {
    if (!isUserLoading && !isRoleLoading) {
      if (!user || !isAdmin) {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, isAdmin, isRoleLoading, router]);

  if (isUserLoading || isRoleLoading || !isAdmin) {
    return <div className="h-screen flex items-center justify-center">Verificando acceso...</div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <AdminDashboard isAdmin={isAdmin} />
      </main>
    </div>
  );
}
