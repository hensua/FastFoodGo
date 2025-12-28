
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrandingConfig, type BrandingConfig } from '@/lib/branding-config';

export default function ProfilePage() {
    const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null);

    useEffect(() => {
        getBrandingConfig().then(setBrandingConfig);
    }, []);

    if (!brandingConfig) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return <ProfilePageClient brandingConfig={brandingConfig} />;
}

const profileSchema = z.object({
  displayName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }).max(50),
  phoneNumber: z.string().optional(),
  deliveryAddress: z.string().min(10, { message: 'La dirección debe tener al menos 10 caracteres.' }),
});

function ProfilePageClient({ brandingConfig }: { brandingConfig: BrandingConfig }) {
  const firestore = useFirestore();
  const { user, userDoc, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: useMemo(() => ({
        displayName: userDoc?.displayName || user?.displayName || '',
        phoneNumber: userDoc?.phoneNumber || '',
        deliveryAddress: userDoc?.deliveryAddress || '',
    }), [userDoc, user]),
  });
  
  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !firestore) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userDocRef, values);
      toast({
        title: 'Perfil Actualizado',
        description: 'Tu información ha sido guardada con éxito.',
      });
      const redirectPath = searchParams.get('redirect');
      if (redirectPath) {
        router.push(redirectPath);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar tu perfil. Inténtalo de nuevo.',
      });
    }
  }

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8"/> Cargando perfil...</div>;
  }

  if (!user) {
    router.replace('/login?redirect=/profile');
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8"/> Redirigiendo...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => {}} showCart={false} brandingConfig={brandingConfig} />
      <main className="container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Mi Perfil</CardTitle>
            <CardDescription>
              Mantén tu información actualizada para una mejor experiencia de entrega.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Peter Parker" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 3001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección de Entrega Principal</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: Carrera 5 #10-20, Apartamento 301, Barrio Central"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
