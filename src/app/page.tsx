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
          const newDocRef = doc(collection(firestore, 'products'));
          // Ensure correct field name 'stockQuantity' is used from the start
          const productWithId = { ...productData, id: newDocRef.id };
          batch.set(newDocRef, productWithId);
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
  
  // This combined loading state is the single source of truth.
  const isCheckingAuth = isUserLoading || (user && isRoleLoading);

  useEffect(() => {
    // Don't do anything until all authentication and role checks are complete.
    if (isCheckingAuth) return;
    
    // Once loading is done, if we have a user and a role, decide where to redirect.
    if (user && userRole) {
        if (userRole === 'admin' || userRole === 'host') {
            router.push('/admin');
        } else if (userRole === 'driver') {
            router.push('/delivery');
        }
    }
    // If there's no user or the role is 'customer', this effect does nothing,
    // and the component will proceed to render HomePageContent.
  }, [isCheckingAuth, user, userRole, router]);

  // While we are checking for auth/role, show a full-screen loader.
  // This prevents the customer view from flashing before a redirect.
  if (isCheckingAuth && user) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo a tu panel...</div>;
  }

  // If loading is finished and the user is NOT a special role (or not logged in), show the customer page.
  // The useEffect handles redirection for special roles, so we don't need to check here again.
  return <HomePageContent />;
}
