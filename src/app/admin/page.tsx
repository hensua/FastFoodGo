'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collectionGroup, query, where, onSnapshot, doc, updateDoc, writeBatch, collection, addDoc, deleteDoc } from 'firebase/firestore';
import type { Order, OrderStatus, Product } from '@/lib/types';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Clock, ChefHat, PackageCheck, UtensilsCrossed, Package, TrendingUp, Trash2, Edit, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusConfig = {
  pending: {
    title: 'Pendientes',
    icon: Clock,
    color: 'border-l-4 border-red-500',
    badgeColor: 'bg-red-100 text-red-800',
    nextStatus: 'cooking',
    actionText: 'A Cocinar',
  },
  cooking: {
    title: 'En Preparación',
    icon: ChefHat,
    color: 'border-l-4 border-yellow-500',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    nextStatus: 'ready',
    actionText: 'Terminar',
  },
  ready: {
    title: 'Listos para Servir',
    icon: PackageCheck,
    color: 'border-l-4 border-green-500',
    badgeColor: 'bg-green-100 text-green-800',
    nextStatus: 'delivered',
    actionText: 'Entregar',
  },
};

const OrderCard = ({ order, onStatusChange }: { order: Order, onStatusChange: (orderId: string, customerId: string, newStatus: OrderStatus) => void }) => {
  const currentStatusConfig = statusConfig[order.status as keyof typeof statusConfig];

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
        {currentStatusConfig.nextStatus && (
          <Button 
            onClick={() => onStatusChange(order.id, order.customerId, currentStatusConfig.nextStatus as OrderStatus)} 
            className="w-full text-sm"
            variant={order.status === 'cooking' ? 'default' : 'outline'}
          >
            {currentStatusConfig.actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};


const ProductForm = ({ product, onSave, onCancel }: { product: Product | null, onSave: (product: Omit<Product, 'id'>) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(
    product || { name: '', description: '', price: 0, imageUrl: '', imageHint: '', category: 'Otros', stock: 0 }
  );

  useEffect(() => {
    setFormData(product || { name: '', description: '', price: 0, imageUrl: '', imageHint: '', category: 'Otros', stock: 0 });
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
    onSave(formData);
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
            <Input name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="Stock" />
          </div>
          <Select name="category" value={formData.category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {['Hamburguesas', 'Pizzas', 'Acompañamientos', 'Bebidas', 'Otros'].map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="URL de la imagen" required />
          <Button type="submit" className="w-full">{product ? 'Guardar Cambios' : 'Crear Producto'}</Button>
        </form>
      </CardContent>
    </Card>
  );
};


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('kitchen');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  // Product state
  const productsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsCollection);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);

    const q = query(
      collectionGroup(firestore, 'orders'),
      where('status', 'in', ['pending', 'cooking', 'ready'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Order);
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Original error:", error); // Keep original for reference
      const contextualError = new FirestorePermissionError({
        path: 'orders (collectionGroup)',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', contextualError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleStatusChange = async (orderId: string, customerId: string, newStatus: OrderStatus) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'customers', customerId, 'orders', orderId);
    try {
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order status: ", error);
      const contextualError = new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: { status: newStatus }
      });
      errorEmitter.emit('permission-error', contextualError);
    }
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'>) => {
    if (!firestore) return;
    try {
      if (editingProduct) {
        const productRef = doc(firestore, 'products', editingProduct.id);
        await updateDoc(productRef, productData);
      } else {
        await addDoc(collection(firestore, 'products'), productData);
      }
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
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
    pending: orders.filter(o => o.status === 'pending'),
    cooking: orders.filter(o => o.status === 'cooking'),
    ready: orders.filter(o => o.status === 'ready'),
  }), [orders]);

  return (
    <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="text-primary" /> Panel de Control
            </h2>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                    onClick={() => setActiveTab('kitchen')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'kitchen' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ChefHat size={16} /> Comandas
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'inventory' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Package size={16} /> Inventario
                </button>
                 <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'stats' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <TrendingUp size={16} /> Reportes
                </button>
            </div>
        </div>

      {activeTab === 'kitchen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(statusKey => (
            <div key={statusKey} className="bg-gray-50 rounded-xl p-4 min-h-[500px]">
              <h3 className="font-bold text-gray-500 uppercase tracking-wider mb-4 flex justify-between items-center">
                {statusConfig[statusKey].title}
                <span className="bg-white px-2 py-1 rounded-full text-xs shadow-sm">{ordersByStatus[statusKey].length}</span>
              </h3>
              <div className="space-y-4">
                {loading ? (
                  <p>Cargando pedidos...</p>
                ) : ordersByStatus[statusKey].length > 0 ? (
                  ordersByStatus[statusKey].map(order => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-10 italic text-sm">No hay pedidos en esta etapa</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead className='border-b'>
                    <tr className='text-left text-sm text-muted-foreground'>
                      <th className='pb-2'>Producto</th>
                      <th className='pb-2'>Categoría</th>
                      <th className='pb-2'>Precio</th>
                      <th className='pb-2'>Stock</th>
                      <th className='pb-2 text-right'>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsLoading ? (
                      <tr><td colSpan={5}>Cargando...</td></tr>
                    ) : (
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
          <div>
            <ProductForm
              product={editingProduct}
              onSave={handleSaveProduct}
              onCancel={() => setEditingProduct(null)}
            />
          </div>
        </div>
      )}

      {activeTab === 'stats' && <div className="text-center p-8 bg-white rounded-lg shadow-sm">Reportes Próximamente...</div>}
    </div>
  );
};


export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (!user || user.email !== 'administrador@peter.com') {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <div className="h-screen flex items-center justify-center">Cargando...</div>;
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
