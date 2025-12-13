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
  const productsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsCollection);

  useEffect(() => {
    const seedDatabase = async () => {
      if (firestore && products?.length === 0 && !isProductsLoading) {
        console.log('No products found, seeding database...');
        const batch = writeBatch(firestore);
        initialProducts.forEach((productData) => {
          const docRef = doc(collection(firestore, 'products'));
          const productWithId = { ...productData, id: docRef.id };
          batch.set(docRef, productWithId);
        });
        try {
          await batch.commit();
          console.log('Database seeded successfully!');
        } catch (error) {
          console.error('Error seeding database:', error);
        }
      }
    };
    
    if (products !== null && !isProductsLoading && firestore) {
      seedDatabase();
    }
  }, [products, isProductsLoading, firestore]);

  const isLoading = isProductsLoading || products === null;

  return <OrderPage products={products || []} loading={isLoading} />;
}

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userDocRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null,
    [firestore, user]
  );
  const { data: userDoc, isLoading: isRoleLoading } = useDoc<AppUser>(userDocRef);
  
  const isAdmin = useMemo(() => userDoc?.role === 'admin', [userDoc]);

  // Combined loading state
  const isLoading = isUserLoading || !firestore || (user && isRoleLoading);

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        router.push('/admin');
      }
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Cargando...</div>;
  }
  
  // If the user is an admin, we show a redirecting message while Next.js router kicks in.
  // This avoids rendering the customer page for a fraction of a second.
  if (isAdmin) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo al panel de control...</div>;
  }

  // Only render the customer-facing page if we are sure the user is not an admin
  return <HomePageContent />;
}
