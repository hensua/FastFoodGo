
'use client';

import { useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
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
  const { user, userDoc, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until the loading is complete before making any decisions.
    if (isLoading) {
      return;
    }
    
    // If we have a user and their role document, decide where to redirect.
    if (user && userDoc) {
      if (userDoc.role === 'admin' || userDoc.role === 'host') {
        router.push('/admin');
      } else if (userDoc.role === 'driver') {
        router.push('/delivery');
      }
    }
    // If none of the above, the user is either not logged in or is a 'customer',
    // so we'll let the component render the customer view.
  }, [isLoading, user, userDoc, router]);

  // While we are checking auth and roles, show a loading screen.
  // This is crucial to prevent showing the customer UI to an admin/driver before redirecting.
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }
  
  // If the user is logged in and has a non-customer role, show a loading screen while the
  // useEffect above triggers the redirect. This avoids the flicker of the customer UI.
  if (userDoc && userDoc.role && userDoc.role !== 'customer') {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo a tu panel...</div>;
  }

  // If we've finished loading and the user is a customer or not logged in, show the main page.
  return <HomePageContent />;
}
