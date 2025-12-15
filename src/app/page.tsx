
'use client';

import { useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Product, AppUser } from '@/lib/types';
import OrderPage from './order-page';
import { products as initialProducts } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function HomePageContent() {
  const firestore = useFirestore();
  
  const productsCollection = useMemoFirebase(() => 
    firestore ? collection(firestore, 'products') : null, 
    [firestore]
  );
  
  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsCollection);

  useEffect(() => {
    const seedDatabase = async () => {
      if (firestore && products?.length === 0 && !isProductsLoading) {
        const batch = writeBatch(firestore);
        initialProducts.forEach((productData) => {
          const newDocRef = doc(collection(firestore, 'products'));
          const productWithId = { ...productData, id: newDocRef.id };
          batch.set(newDocRef, productWithId);
        });
        try {
          await batch.commit();
        } catch (error) {
          console.error('Error seeding database:', error);
        }
      }
    };
    
    if (products !== null && !isProductsLoading && firestore) {
      seedDatabase();
    }
  }, [products, isProductsLoading, firestore]);

  const productList = useMemo(() => {
    return products || [];
  }, [products]);

  const isLoading = isProductsLoading || products === null;

  return <OrderPage products={productList || []} loading={isLoading} />;
}

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userDocRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null,
    [firestore, user]
  );
  const { data: userDoc, isLoading: isUserDocLoading } = useDoc<AppUser>(userDocRef);
  
  const isCheckingAuth = isUserLoading || (user && isUserDocLoading);

  useEffect(() => {
    // No tomar decisiones hasta que la carga haya terminado
    if (isCheckingAuth) return;
    
    // Si hay un usuario y un documento de usuario, podemos redirigir
    if (user && userDoc) {
        if (userDoc.role === 'admin' || userDoc.role === 'host') {
            router.push('/admin');
        } else if (userDoc.role === 'driver') {
            router.push('/delivery');
        }
    }
  }, [isCheckingAuth, user, userDoc, router]);

  // Si estamos autenticando y sabemos quién es el usuario, mostramos una pantalla de carga
  // para evitar el parpadeo de la página del cliente.
  if (isCheckingAuth && user) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo a tu panel...</div>;
  }

  // Renderizar la página principal solo si no se está autenticando o si el usuario
  // es un cliente (o no está logueado).
  return <HomePageContent />;
}
