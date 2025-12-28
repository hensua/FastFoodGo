
import { getBrandingConfig, type BrandingConfig } from '@/lib/branding-config';
import OrderPage from './order-page';
import { products as initialProducts } from '@/lib/data';
import 'server-only';
import { useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';


// This is now a Server Component
export default async function Home() {
  // Fetch branding config on the server
  const brandingConfig = await getBrandingConfig();

  // The content of the page is a client component
  // that will handle redirection and data fetching for products.
  return <HomePageClient brandingConfig={brandingConfig} />;
}

// All client-side logic is now encapsulated in this component.
// It must be defined in the same file or imported dynamically.
function HomePageClient({ brandingConfig }: { brandingConfig: BrandingConfig }) {
  'use client';
  const { user, userDoc, isLoading: isUserLoading } = useUser();
  const router = useRouter();
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

  useEffect(() => {
    if (isUserLoading) {
      return;
    }
    
    if (user && userDoc) {
      if (userDoc.role === 'admin') {
        router.push('/admin');
      } else if (userDoc.role === 'host') {
        router.push('/host');
      } else if (userDoc.role === 'driver') {
        router.push('/delivery');
      } else if (userDoc.role === 'developer') {
        router.push('/developer');
      }
    }
  }, [isUserLoading, user, userDoc, router]);

  const isLoading = isUserLoading || isProductsLoading || products === null;
  const isPrivilegedUser = userDoc && userDoc.role && userDoc.role !== 'customer';

  if (isLoading || isPrivilegedUser) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> {isPrivilegedUser && "Redirigiendo a tu panel..."}</div>;
  }

  return <OrderPage products={productList || []} loading={isLoading} brandingConfig={brandingConfig} />;
}
