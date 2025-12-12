'use client';

import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Panel de Repartidor</h1>
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido, Repartidor</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Aquí verás los pedidos asignados para la entrega.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
