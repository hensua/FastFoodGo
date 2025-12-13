'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import OrderPage from './order-page';
import { products as initialProducts } from '@/lib/data';
import { useRouter } from 'next/navigation';

export default function Home() {
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  
  // Admin role check
  const adminRoleRef = useMemoFirebase(() => 
    firestore && user ? doc(firestore, 'roles_admin', user.uid) : null,
    [firestore, user]
  );
  const { data: adminRoleDoc, isLoading: isRoleLoading } = useDoc(adminRoleRef);
  const isAdmin = !!adminRoleDoc;

  // Products collection
  const productsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading: isProductsLoading } = useCollection<Product>(productsCollection);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    // If user is admin, redirect to admin page
    if (!isUserLoading && !isRoleLoading && isAdmin) {
      router.push('/admin');
    }
  }, [user, isUserLoading, isAdmin, isRoleLoading, router]);

  useEffect(() => {
    const seedDatabase = async () => {
      if (firestore && products?.length === 0 && !isProductsLoading && !isSeeding) {
        setIsSeeding(true);
        console.log('No products found, seeding database...');
        const batch = writeBatch(firestore);
        initialProducts.forEach((product) => {
          const docRef = doc(collection(firestore, 'products'));
          const { id, ...productData } = product;
          batch.set(docRef, productData);
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

    if (!isAdmin && products !== null && products.length === 0 && !isProductsLoading) {
      seedDatabase();
    }
  }, [products, isProductsLoading, firestore, isSeeding, isAdmin]);

  // Loading state for non-admins
  const isLoading = isUserLoading || isRoleLoading || isProductsLoading || isSeeding;

  // Render nothing or a loader while checking for admin and redirecting
  if (isAdmin || isUserLoading || isRoleLoading) {
    return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  // Render order page for regular users
  return <OrderPage products={products || []} loading={isLoading || products === null} />;
}
