
'use client';

import Header from '@/components/header';
import CheckoutForm from '@/components/checkout-form';
import { useCart } from '@/components/cart-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { getBrandingConfig, type BrandingConfig } from '@/lib/branding-config';

export default function CheckoutPage() {
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null);

  useEffect(() => {
    getBrandingConfig().then(setBrandingConfig);
  }, []);

  if (!brandingConfig) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }
  
  return <CheckoutPageClient brandingConfig={brandingConfig} />;
}

function CheckoutPageClient({ brandingConfig }: { brandingConfig: BrandingConfig }) {
  const { totalItems } = useCart();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/checkout');
    }
    if (!isUserLoading && totalItems === 0) {
      router.push('/');
    }
  }, [totalItems, router, user, isUserLoading]);

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>; 
  }

  if (totalItems === 0) {
    return null; // or a message telling user their cart is empty and redirecting
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} brandingConfig={brandingConfig} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-8 text-center text-primary drop-shadow-sm">
          Resumen de Compra
        </h1>
        <CheckoutForm brandingConfig={brandingConfig} />
      </main>
    </div>
  );
}
