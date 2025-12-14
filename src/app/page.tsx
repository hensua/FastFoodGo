
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
  const { data: userDoc, isLoading: isRoleLoading } = useDoc<AppUser>(userDocRef);
  
  const userRole = useMemo(() => userDoc?.role, [userDoc]);
  
  const isCheckingAuth = isUserLoading || (user && isRoleLoading);

  useEffect(() => {
    if (isCheckingAuth) return;
    
    if (user && userRole) {
        if (userRole === 'admin' || userRole === 'host') {
            router.push('/admin');
        } else if (userRole === 'driver') {
            router.push('/delivery');
        }
    }
  }, [isCheckingAuth, user, userRole, router]);

  // If we are checking auth and we know who the user is, show a loading screen
  // instead of the customer page to prevent flicker.
  if (isCheckingAuth && user) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo a tu panel...</div>;
  }

  // Only render the main content if we're done checking and the user is a customer or not logged in.
  if (!isCheckingAuth && (userRole === 'customer' || !user)) {
    return <HomePageContent />;
  }

  // Fallback, should ideally not be reached if logic is sound. Render loading.
  return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
}
