
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
  
  // This state is true if we are still waiting for auth info OR for the user's role document.
  const isCheckingAuth = isUserLoading || (user && isUserDocLoading);

  useEffect(() => {
    // Don't make any decisions until all loading is complete.
    if (isCheckingAuth) return;
    
    // Once loading is done, if we have a user and their role document, we can redirect.
    if (user && userDoc) {
        if (userDoc.role === 'admin' || userDoc.role === 'host') {
            router.push('/admin');
        } else if (userDoc.role === 'driver') {
            router.push('/delivery');
        }
        // If the user is a 'customer', we do nothing and let the HomePageContent render.
    }
    // If there's no user, we also do nothing and let the HomePageContent render.
  }, [isCheckingAuth, user, userDoc, router]);

  // While we're checking the role of a logged-in user, show a full-page loader.
  // This prevents the customer view from flickering before redirection.
  if (isCheckingAuth) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo a tu panel...</div>;
  }

  // Render the main customer-facing page only if:
  // 1. The user is not logged in.
  // 2. The user is a customer.
  // 3. The authentication check is fully complete.
  return <HomePageContent />;
}
