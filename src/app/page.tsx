'use client';

import { useEffect, useState, useMemo } from 'react';
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
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const seedDatabase = async () => {
      if (firestore && products?.length === 0 && !isProductsLoading && !isSeeding) {
        setIsSeeding(true);
        console.log('No products found, seeding database...');
        const batch = writeBatch(firestore);
        initialProducts.forEach((productData) => {
          const docRef = doc(collection(firestore, 'products'));
          // Ensure the product has an ID before setting it.
          const productWithId = { ...productData, id: docRef.id };
          batch.set(docRef, productWithId);
        });
        try {
          await batch.commit();
          console.log('Database seeded successfully!');
        } catch (error) {
          console.error('Error seeding database:', error);
        } finally {
          setIsSeeding(false);
        }
      }
    };
    
    if (products !== null && products.length === 0 && !isProductsLoading) {
      seedDatabase();
    }
  }, [products, isProductsLoading, firestore, isSeeding]);

  const isLoading = isProductsLoading || isSeeding || products === null;

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

  const isLoading = isUserLoading || isRoleLoading;

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
  
  if (isAdmin) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo al panel de control...</div>;
  }

  // Only render the customer-facing page if we are sure the user is not an admin
  return <HomePageContent />;
}

    