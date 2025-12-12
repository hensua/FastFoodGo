'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import OrderPage from './order-page';
import { products as initialProducts } from '@/lib/data';

export default function Home() {
  const firestore = useFirestore();
  const productsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const { data: products, isLoading } = useCollection<Product>(productsCollection);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const seedDatabase = async () => {
      if (firestore && products?.length === 0 && !isLoading && !isSeeding) {
        setIsSeeding(true);
        console.log('No products found, seeding database...');
        const batch = writeBatch(firestore);
        initialProducts.forEach((product) => {
          const docRef = doc(collection(firestore, 'products'));
          // Firebase generates the ID, so we exclude it from the object we write.
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

    // The check for products === null is to wait for the first query result.
    // The check for products?.length === 0 is to see if the collection is empty.
    if (products !== null && products.length === 0) {
       seedDatabase();
    }
  }, [products, isLoading, firestore, isSeeding]);

  return <OrderPage products={products || []} loading={isLoading || isSeeding || products === null} />;
}
