'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth, useUser, initiateGoogleSignIn } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chrome, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleRedirect = (user: any) => {
    if (!user) return;
    switch (user.email) {
      case 'administrador@peter.com':
        router.push('/admin');
        break;
      case 'repartidor@peter.com':
        router.push('/delivery');
        break;
      default:
        router.push('/');
        break;
    }
  };

  useEffect(() => {
    if (!isUserLoading && user) {
      handleRedirect(user);
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    try {
      const result = await initiateGoogleSignIn(auth);
      // Explicitly redirect after successful sign-in
      if (result.user) {
        handleRedirect(result.user);
      }
    } catch (error: any) {
      // Don't show toast for user-cancelled popups
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: "No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (values: z.infer<typeof loginSchema>) => {
    if (!auth) return;
    setIsEmailLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // onAuthStateChanged will handle redirect
    } catch (error: any) {
       if (error.code === 'auth/user-not-found') {
        // If the user doesn't exist, create them. This will only happen for the test users.
        try {
          await createUserWithEmailAndPassword(auth, values.email, values.password);
          // After creation, onAuthStateChanged will automatically sign the user in and trigger the redirect.
        } catch (creationError: any) {
          toast({
            variant: "destructive",
            title: "Error de creación de cuenta",
            description: creationError.message || "No se pudo crear la cuenta de prueba.",
          });
        }
       } else {
        let description = "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = "La contraseña es incorrecta. Por favor, verifica tus credenciales.";
        } else if (error.code === 'auth/too-many-requests') {
          description = "Demasiados intentos fallidos. Por favor, intenta de nuevo más tarde."
        }
         toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: description,
        });
       }
    } finally {
      setIsEmailLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">¡Bienvenido!</CardTitle>
          <CardDescription>Inicia sesión o crea una cuenta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={handleGoogleSignIn} className="w-full" variant="outline" disabled={isGoogleLoading || isEmailLoading}>
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continuar con Google
            </Button>
             <p className="text-center text-sm text-muted-foreground">
              ¿Eres un nuevo usuario? Usa Google para crear tu cuenta.
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O inicia sesión (solo para pruebas)
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailSignIn)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="usuario@peter.com" {...field} disabled={isEmailLoading || isGoogleLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} disabled={isEmailLoading || isGoogleLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isEmailLoading || isGoogleLoading}>
                  {isEmailLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Iniciar sesión con correo
                </Button>
              </form>
            </Form>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
