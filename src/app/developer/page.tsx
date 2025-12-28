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
import { hslStringToHex, hexToHslString } from '@/lib/utils';

// This is a simplified version of the TeamManagement component from the admin page
// For a real app, this would be a shared component.
const TeamManagement = React.lazy(() => import('@/components/team-management'));

const themeSchema = z.object({
  primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido (ej: #RRGGBB)' }),
  background: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido' }),
  accent: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido' }),
});

const ThemeCustomizer = () => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Default HSL values from globals.css
    const defaultHsl = {
        primary: '4 90% 58%',
        background: '0 0% 93.3%',
        accent: '36 100% 50%',
    };

    // Convert default HSL to HEX for the form
    const defaultHex = {
        primary: hslStringToHex(defaultHsl.primary),
        background: hslStringToHex(defaultHsl.background),
        accent: hslStringToHex(defaultHsl.accent),
    };

    const form = useForm<z.infer<typeof themeSchema>>({
        resolver: zodResolver(themeSchema),
        defaultValues: defaultHex,
    });

    const onSubmit = async (values: z.infer<typeof themeSchema>) => {
        setIsSaving(true);
        const hslValues = {
            primary: hexToHslString(values.primary),
            background: hexToHslString(values.background),
            accent: hexToHslString(values.accent),
        };

        try {
            await applyTheme(hslValues);
            toast({
                title: 'Tema Actualizado',
                description: 'Los nuevos colores han sido aplicados. Puede que necesites refrescar la página para ver todos los cambios.',
            });
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
                    Cambia los colores principales de la aplicación usando valores hexadecimales.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {['primary', 'background', 'accent'].map((colorName) => {
                            const name = colorName as 'primary' | 'background' | 'accent';
                            const labels = { primary: 'Color Primario', background: 'Color de Fondo', accent: 'Color de Acento' };

                            return (
                                <FormField
                                    key={name}
                                    control={form.control}
                                    name={name}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{labels[name]}</FormLabel>
                                            <div className="flex items-center gap-4">
                                                <FormControl>
                                                    <Input 
                                                        type="color" 
                                                        className="w-12 h-10 p-1"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="#RRGGBB" 
                                                        className="flex-1 font-mono"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            );
                        })}
                        
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
