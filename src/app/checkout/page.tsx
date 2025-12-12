'use client';

import Header from '@/components/header';
import CheckoutForm from '@/components/checkout-form';
import { useCart } from '@/components/cart-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';

export default function CheckoutPage() {
  const { totalItems } = useCart();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (totalItems === 0) {
      router.push('/');
    }
  }, [totalItems, router, user, isUserLoading]);

  if (totalItems === 0 || isUserLoading || !user) {
    return null; 
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-8 text-center text-primary drop-shadow-sm">
          Resumen de Compra
        </h1>
        <CheckoutForm />
      </main>
    </div>
  );
}
