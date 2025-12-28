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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Palette, Users, Code, Link as LinkIcon, CaseSensitive, Bot, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppUser } from '@/lib/types';
import { applyTheme } from '@/app/actions/theme-actions';
import { hexToHslString } from '@/lib/utils';
import { defaultBranding, defaultLogo, rawBrandingConfig } from '@/lib/branding-config';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const TeamManagement = React.lazy(() => import('@/components/team-management'));

const brandingSchema = z.object({
  appName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  logoSvg: z.string().startsWith('<svg', { message: 'Debe ser un código SVG válido.'}),
  logoColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido' }),
  primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido (ej: #RRGGBB)' }),
  background: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido' }),
  accent: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido' }),
  social: z.object({
    twitter: z.string().url({ message: 'URL inválida' }).or(z.literal('')),
    instagram: z.string().url({ message: 'URL inválida' }).or(z.literal('')),
    facebook: z.string().url({ message: 'URL inválida' }).or(z.literal('')),
  })
});

const BrandingCustomizer = () => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof brandingSchema>>({
        resolver: zodResolver(brandingSchema),
        defaultValues: {
          appName: rawBrandingConfig.appName,
          logoSvg: rawBrandingConfig.logoSvg,
          logoColor: rawBrandingConfig.theme.logoColor,
          primary: rawBrandingConfig.theme.primary,
          background: rawBrandingConfig.theme.background,
          accent: rawBrandingConfig.theme.accent,
          social: {
            twitter: rawBrandingConfig.social.twitter,
            instagram: rawBrandingConfig.social.instagram,
            facebook: rawBrandingConfig.social.facebook,
          }
        },
    });

    const onSubmit = async (values: z.infer<typeof brandingSchema>) => {
        setIsSaving(true);
        const themeData = {
            primary: values.primary,
            background: values.background,
            accent: values.accent,
            logoColor: values.logoColor,
        };
        const brandingData = {
          appName: values.appName,
          social: values.social,
          logoSvg: values.logoSvg,
        }

        try {
            await applyTheme({ theme: themeData, branding: brandingData });
            toast({
                title: 'Configuración Actualizada',
                description: 'La apariencia y los datos de la marca han sido guardados. Puede que necesites refrescar la página para ver todos los cambios.',
            });
        } catch (error) {
            console.error("Error applying theme:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo guardar la configuración. Revisa los permisos del servidor.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>Personalización de la Marca</CardTitle>
                <CardDescription>
                    Cambia el nombre, logo, colores principales y enlaces de redes sociales de la aplicación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                       {/* General Branding */}
                       <div className="space-y-4">
                            <h3 className="text-lg font-medium flex items-center gap-2"><CaseSensitive /> Apariencia General</h3>
                             <FormField
                                control={form.control}
                                name="appName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de la Página</FormLabel>
                                        <FormControl>
                                            <Input placeholder="FastFoodGo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                       </div>
                       
                       <Separator />

                       {/* Logo */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium flex items-center gap-2"><ImageIcon /> Logo SVG</h3>
                             <FormField
                                control={form.control}
                                name="logoColor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color del Logo</FormLabel>
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
                            <FormField
                                control={form.control}
                                name="logoSvg"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Código del Logo SVG</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder='<svg>...</svg>' {...field} className="font-mono min-h-[150px]" />
                                        </FormControl>
                                        <FormDescription>
                                            Pega el código completo de tu logo en formato SVG. Para que el color se aplique, asegúrate de que los atributos `fill` o `stroke` en tu SVG estén configurados como `currentColor`.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                      <Separator />

                       {/* Theme Colors */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium flex items-center gap-2"><Palette /> Colores del Tema</h3>
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
                        </div>
                        
                        <Separator />

                        {/* Social Links */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium flex items-center gap-2"><LinkIcon /> Enlaces de Redes Sociales</h3>
                             {['twitter', 'instagram', 'facebook'].map((socialName) => {
                                const name = socialName as 'twitter' | 'instagram' | 'facebook';
                                const labels = { twitter: 'Twitter / X', instagram: 'Instagram', facebook: 'Facebook' };
                                 return (
                                     <FormField
                                        key={name}
                                        control={form.control}
                                        name={`social.${name}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{labels[name]}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={`https://...`} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                 )
                             })}
                        </div>
                        
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
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

            {activeTab === 'customize' && <BrandingCustomizer />}
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
