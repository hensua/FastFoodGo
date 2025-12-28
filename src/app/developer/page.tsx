'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Palette, Users, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppUser } from '@/lib/types';
import { applyTheme } from '@/app/actions/theme-actions';

// This is a simplified version of the TeamManagement component from the admin page
// For a real app, this would be a shared component.
const TeamManagement = React.lazy(() => import('@/components/team-management'));


const themeSchema = z.object({
  primary: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, { message: 'Formato HSL inválido (ej: 240 5.9% 10%)' }),
  background: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, { message: 'Formato HSL inválido' }),
  accent: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, { message: 'Formato HSL inválido' }),
});


const ThemeCustomizer = () => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // TODO: Ideally, these default values would be dynamically read from globals.css
    const form = useForm<z.infer<typeof themeSchema>>({
        resolver: zodResolver(themeSchema),
        defaultValues: {
            primary: '4 90% 58%',
            background: '0 0% 93.3%',
            accent: '36 100% 50%',
        },
    });

    const onSubmit = async (values: z.infer<typeof themeSchema>) => {
        setIsSaving(true);
        try {
            await applyTheme(values);
            toast({
                title: 'Tema Actualizado',
                description: 'Los nuevos colores han sido aplicados. Refresca para ver los cambios.',
            });
            // Optional: force a reload to see changes immediately
            // window.location.reload();
        } catch (error) {
            console.error("Error applying theme:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo guardar el tema. Revisa los permisos del servidor.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>Personalización de Apariencia</CardTitle>
                <CardDescription>
                    Cambia los colores principales de la aplicación. Usa valores HSL sin las funciones `hsl()` o `var()`.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="primary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color Primario (botones, enlaces)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: 4 90% 58%" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="background"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color de Fondo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: 0 0% 93.3%" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="accent"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color de Acento</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: 36 100% 50%" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Aplicar Cambios
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}


const DeveloperDashboard = ({ userDoc }: { userDoc: AppUser }) => {
    const [activeTab, setActiveTab] = useState('customize');

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl shadow-sm border mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Code className="text-primary" /> Panel de Desarrollador
                </h2>
                <div className="flex gap-1 p-1 bg-muted rounded-lg flex-wrap">
                    <button onClick={() => setActiveTab('customize')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'customize' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Palette size={16} /> Personalizar</button>
                    <button onClick={() => setActiveTab('team')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'team' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Users size={16} /> Equipo</button>
                </div>
            </div>

            {activeTab === 'customize' && <ThemeCustomizer />}
            {activeTab === 'team' && (
                <React.Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                    <TeamManagement userDoc={userDoc} />
                </React.Suspense>
            )}
        </div>
    );
};


export default function DeveloperPage() {
    const { user, userDoc, isLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push('/login?redirect=/developer');
            return;
        }

        const hasAccess = userDoc?.role === 'developer' || userDoc?.role === 'admin';
        if (userDoc && !hasAccess) {
            toast({
                variant: "destructive",
                title: "Acceso Denegado",
                description: "No tienes permisos para acceder a esta página.",
            });
            router.push('/');
        }
    }, [isLoading, user, userDoc, router, toast]);

    if (isLoading || !userDoc) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Verificando acceso...</div>;
    }

    const hasAccess = userDoc.role === 'developer' || userDoc.role === 'admin';
    if (!hasAccess) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header onCartClick={() => {}} showCart={false} />
            <main className="container mx-auto px-4 py-8">
                <DeveloperDashboard userDoc={userDoc} />
            </main>
        </div>
    );
}
