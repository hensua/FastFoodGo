'use client';

import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Panel de Administrador</h1>
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido, Administrador</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Aquí podrás gestionar los productos, ver los pedidos y más.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
