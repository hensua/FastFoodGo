'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chrome, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleRedirect = () => {
    const intendedPath = searchParams.get('redirect') || '/';
    router.push(intendedPath);
  };
  
  const handleUserSetup = async (firebaseUser: User) => {
    if (!firestore || !firebaseUser) return;
    
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    
    try {
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const { displayName, email, photoURL, uid } = firebaseUser;
        await setDoc(userRef, {
          uid,
          displayName: displayName || email?.split('@')[0] || 'Usuario Anónimo',
          email,
          photoURL,
          createdAt: serverTimestamp(),
          role: 'customer', // Default role for new users
        });
      }
    } catch (e) {
      console.error("Error creating user document:", e);
      // Optional: Show a toast to the user about the profile creation failure
    }
    
    handleRedirect();
  };

  useEffect(() => {
    if (!isUserLoading && user) {
       handleRedirect();
    }
  }, [user, isUserLoading]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await handleUserSetup(userCredential.user);
    } catch (error: any) {
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
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await handleUserSetup(userCredential.user);
    } catch (error: any) {
      let description = "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        description = "Correo o contraseña incorrectos. Por favor, verifica tus credenciales.";
      } else if (error.code === 'auth/too-many-requests') {
        description = "Demasiados intentos fallidos. Por favor, intenta de nuevo más tarde."
      }
       toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: description,
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEmailSignUp = async (values: z.infer<typeof loginSchema>) => {
    if (!auth) return;
    setIsSigningUp(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await handleUserSetup(userCredential.user);
    } catch (error: any) {
        let description = "Ocurrió un error inesperado al registrar la cuenta.";
        if (error.code === 'auth/email-already-in-use') {
          description = "Este correo electrónico ya está en uso. Por favor, inicia sesión o usa un correo diferente.";
        }
        toast({
            variant: "destructive",
            title: "Error de Registro",
            description,
        });
    } finally {
        setIsSigningUp(false);
    }
  };


  if (isUserLoading || (!isUserLoading && user)) {
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
          <CardTitle className="text-2xl font-bold">{isSigningUp ? 'Crear Cuenta' : '¡Bienvenido!'}</CardTitle>
          <CardDescription>{isSigningUp ? 'Ingresa tus datos para registrarte.' : 'Inicia sesión para continuar'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={handleGoogleSignIn} className="w-full" variant="outline" disabled={isGoogleLoading || isEmailLoading || isSigningUp}>
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continuar con Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  O {isSigningUp ? 'regístrate con tu correo' : 'inicia sesión con correo'}
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(isSigningUp ? handleEmailSignUp : handleEmailSignIn)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="usuario@peter.com" {...field} disabled={isEmailLoading || isGoogleLoading || isSigningUp} />
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
                        <Input type="password" placeholder="********" {...field} disabled={isEmailLoading || isGoogleLoading || isSigningUp} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isEmailLoading || isGoogleLoading || isSigningUp}>
                  {(isEmailLoading || isSigningUp) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSigningUp ? 'Registrarse' : 'Iniciar sesión'}
                </Button>
              </form>
            </Form>
             <p className="px-8 text-center text-sm text-muted-foreground">
              {isSigningUp ? "Ya tienes una cuenta? " : "No tienes una cuenta? "}
              <button
                onClick={() => setIsSigningUp(!isSigningUp)}
                className="underline underline-offset-4 hover:text-primary"
              >
                {isSigningUp ? "Inicia Sesión" : "Regístrate"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    