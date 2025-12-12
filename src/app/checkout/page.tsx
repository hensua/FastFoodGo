'use client';

import Header from '@/components/header';
import CheckoutForm from '@/components/checkout-form';
import { useCart } from '@/components/cart-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CheckoutPage() {
  const { totalItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (totalItems === 0) {
      router.push('/');
    }
  }, [totalItems, router]);

  if (totalItems === 0) {
    return null; 
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-8 text-center text-primary drop-shadow-sm">
          Checkout
        </h1>
        <CheckoutForm />
      </main>
    </div>
  );
}
