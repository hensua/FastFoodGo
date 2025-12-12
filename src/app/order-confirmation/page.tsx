'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentMethod = searchParams.get('paymentMethod');
  const total = searchParams.get('total');

  if (!orderId) {
    // router.push('/'); // Comentado para evitar el bucle de renderizado en el servidor
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold mt-4">¡Pedido Confirmado!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Gracias por tu compra.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg">Tu número de pedido es:</p>
            <p className="text-2xl font-mono font-bold text-primary">{orderId}</p>
          </div>
          <div className="border-t pt-4 text-center">
            <p className="font-semibold">Resumen del Pago</p>
            <p>Método de pago: <span className="font-medium">{paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}</span></p>
            <p>Total a pagar: <span className="font-medium">${parseFloat(total || '0').toFixed(2)}</span></p>
          </div>
           {paymentMethod === 'transfer' && (
            <div className="bg-muted p-4 rounded-md text-sm text-center">
              <p className="font-bold">Instrucciones para la transferencia:</p>
              <p>Por favor, transfiere el monto total a la siguiente cuenta:</p>
              <p className="font-mono mt-2">CBU: 1234567890123456789012</p>
              <p className="font-mono">Alias: mi.negocio.alias</p>
              <p className="mt-2">No te olvides de incluir tu número de pedido en la referencia.</p>
            </div>
          )}
          {paymentMethod === 'cash' && (
            <div className="bg-muted p-4 rounded-md text-sm text-center">
              <p className="font-bold">Instrucciones para el pago en efectivo:</p>
              <p>Por favor, ten el monto exacto listo para cuando llegue tu pedido.</p>
            </div>
          )}
          <Button asChild size="lg" className="w-full">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
