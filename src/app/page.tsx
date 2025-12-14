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
  
  const userRole = useMemo(() => userDoc?.role, [userDoc]);
  
  const isCheckingRole = isUserLoading || isRoleLoading;

  useEffect(() => {
    // Don't do anything until we're done loading user and role.
    if (isCheckingRole) return;
    
    // Only redirect if a user is logged in and has a specific role.
    if (user && userRole) {
        if (userRole === 'admin' || userRole === 'host') {
            router.push('/admin');
        } else if (userRole === 'driver') {
            router.push('/delivery');
        }
    }
    // If no user or no specific role, do nothing and let the customer page render.
  }, [isCheckingRole, user, userRole, router]);

  // Show loading spinner only on initial load when we are actively checking a logged-in user's role.
  // When a user logs out, `user` becomes null, `isCheckingRole` becomes false, and we render HomePageContent immediately.
  if (isCheckingRole && user) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo a tu panel...</div>;
  }

  // For customers, guests, or after logging out, show the customer-facing page directly.
  return <HomePageContent />;
}
