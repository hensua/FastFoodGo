'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import type { Order, Product, AppUser, Role } from '@/lib/types';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ChefHat, Package, Trash2, Edit, X, Users, Loader2, UtensilsCrossed, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { OrderList } from '@/components/order-list';
import { addDoc } from 'firebase/firestore';

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

// Team Management View
const TeamManagement = () => {
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<AppUser>(usersCollection);

  const [searchTerm, setSearchTerm] = useState('');
  const [isRoleChanging, setIsRoleChanging] = useState<string | null>(null);

  const handleRoleChange = async (uid: string, newRole: Role) => {
    if (!firestore) return;
    setIsRoleChanging(uid);

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

  const filteredUsers = users?.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {usersLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div> :
         !filteredUsers || filteredUsers.length === 0 ? <div className="text-center text-muted-foreground py-8">No se encontraron usuarios.</div> :
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
              {filteredUsers.map(user => (
                <tr key={user.uid} className='border-b'>
                  <td className='py-3 font-medium flex items-center gap-2'>
                    {user.displayName || "Sin Nombre"}
                  </td>
                  <td className="py-3 text-muted-foreground">{user.email}</td>
                  <td className='py-3 text-right'>
                    {isRoleChanging === user.uid ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> :
                      <Select value={user.role} onValueChange={(newRole) => handleRoleChange(user.uid, newRole as Role)}>
                        <SelectTrigger className="w-40 ml-auto h-9"><SelectValue /></SelectTrigger>
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
          </table>
        </div>}
      </CardContent>
    </Card>
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

  const handleDeleteProduct = async (productId: string) => {
    if (!firestore) return;
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteDoc(doc(firestore, 'products', productId));
        toast({ title: "Producto eliminado" });
      } catch (error) {
        console.error("Error deleting product:", error);
        toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar el producto."});
      }
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
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)}><Trash2 className='h-4 w-4 text-destructive'/></Button>
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
      {activeTab === 'stats' && <div className="text-center p-8 bg-card rounded-lg shadow-sm">Reportes Próximamente...</div>}
    </div>
  );
};

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userDoc, isLoading: isRoleLoading } = useDoc<AppUser>(userDocRef);
  
  const isAdmin = useMemo(() => userDoc?.role === 'admin', [userDoc]);

  useEffect(() => {
    const checkAuth = () => {
      if (!isUserLoading && !isRoleLoading) {
        if (!user || !isAdmin) {
          router.push('/login?redirect=/admin');
        }
      }
    };
    checkAuth();
  }, [user, isUserLoading, isAdmin, isRoleLoading, router]);

  if (isUserLoading || isRoleLoading || !user || !isAdmin) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Verificando acceso...</div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
    