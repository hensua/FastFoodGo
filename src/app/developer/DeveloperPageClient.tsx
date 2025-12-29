
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Palette, Users, Code, Link as LinkIcon, CaseSensitive, Bot, Image as ImageIcon, Type, PaintBucket, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppUser } from '@/lib/types';
import { applyTheme } from '@/app/actions/theme-actions';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { BrandingConfig, SocialLink } from '@/lib/branding-config';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { hslStringToHex } from '@/lib/utils';

const TeamManagement = React.lazy(() => import('@/components/team-management'));

const socialLinkSchema = z.object({
  name: z.string().min(1, { message: 'Selecciona una red social.' }),
  url: z.string().url({ message: 'URL inválida.' }),
});

const brandingSchema = z.object({
  appName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  logoSvg: z.string().startsWith('<svg', { message: 'Debe ser un código SVG válido.'}),
  logoColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido' }),
  primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido (ej: #RRGGBB)' }),
  background: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido' }),
  accent: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido' }),
  bannerAccent: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Formato HEX inválido' }),
  social: z.array(socialLinkSchema),
  fontFamily: z.string(),
});

const BrandingCustomizer = ({ initialConfig }: { initialConfig: BrandingConfig }) => {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [socialLinkToDelete, setSocialLinkToDelete] = useState<number | null>(null);

    const form = useForm<z.infer<typeof brandingSchema>>({
        resolver: zodResolver(brandingSchema),
        // Default values are set once. We will use form.reset() in a useEffect to update them.
        defaultValues: {
          appName: initialConfig.appName,
          logoSvg: initialConfig.logoSvg,
          social: initialConfig.social,
          fontFamily: initialConfig.fontFamily || 'PT Sans',
          // Convert HSL back to HEX for color pickers
          logoColor: initialConfig.theme.logoColor, // Stays HEX
          primary: hslStringToHex(initialConfig.theme.primary),
          background: hslStringToHex(initialConfig.theme.background),
          accent: hslStringToHex(initialConfig.theme.accent),
          bannerAccent: initialConfig.theme.bannerAccent, // Stays HEX
        },
    });

    // This effect listens for changes in initialConfig and resets the form,
    // ensuring the UI always reflects the latest saved state after a refresh.
    useEffect(() => {
        form.reset({
            appName: initialConfig.appName,
            logoSvg: initialConfig.logoSvg,
            social: initialConfig.social,
            fontFamily: initialConfig.fontFamily,
            logoColor: initialConfig.theme.logoColor,
            primary: hslStringToHex(initialConfig.theme.primary),
            background: hslStringToHex(initialConfig.theme.background),
            accent: hslStringToHex(initialConfig.theme.accent),
            bannerAccent: initialConfig.theme.bannerAccent,
        });
    }, [initialConfig, form]);

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "social",
    });

    const handleConfirmDelete = () => {
        if (socialLinkToDelete !== null) {
            remove(socialLinkToDelete);
            setSocialLinkToDelete(null);
        }
    };

    const onSubmit = async (values: z.infer<typeof brandingSchema>) => {
        setIsSaving(true);
        const themeData = {
            primary: values.primary,
            background: values.background,
            accent: values.accent,
            logoColor: values.logoColor,
            bannerAccent: values.bannerAccent,
        };
        const brandingData = {
          appName: values.appName,
          social: values.social,
          logoSvg: values.logoSvg,
          fontFamily: values.fontFamily,
        }

        try {
            await applyTheme({ theme: themeData, branding: brandingData });
            toast({
                title: 'Configuración Actualizada',
                description: 'La apariencia y los datos de la marca han sido guardados. Puede que necesites refrescar la página para ver todos los cambios.',
            });
            // Force a reload to see changes immediately
            window.location.reload();
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

    const ColorField = ({ name, label }: { name: 'primary' | 'background' | 'accent' | 'logoColor' | 'bannerAccent', label: string }) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
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

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Personalización de la Marca</CardTitle>
                    <CardDescription>
                        Cambia el nombre, logo, colores y tipografía de la aplicación.
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

                            {/* Font */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium flex items-center gap-2"><Type /> Tipografía</h3>
                                 <FormField
                                    control={form.control}
                                    name="fontFamily"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fuente Principal</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona una fuente" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PT Sans">PT Sans</SelectItem>
                                                    <SelectItem value="Lato">Lato</SelectItem>
                                                    <SelectItem value="Roboto">Roboto</SelectItem>
                                                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                                                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                La fuente se cargará desde Google Fonts.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>


                           <Separator />

                           {/* Logo */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium flex items-center gap-2"><ImageIcon /> Logo SVG</h3>
                                 <ColorField name="logoColor" label="Color del Logo" />
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
                                <ColorField name="primary" label="Color Primario" />
                                <ColorField name="background" label="Color de Fondo" />
                                <ColorField name="accent" label="Color Secundario" />
                                <ColorField name="bannerAccent" label="Color Logo del Anuncio" />
                            </div>
                            
                            <Separator />

                            {/* Social Links */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium flex items-center gap-2"><LinkIcon /> Enlaces de Redes Sociales</h3>
                                <div className='space-y-4'>
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg">
                                            <div className="grid grid-cols-2 gap-2 flex-grow">
                                                 <FormField
                                                    control={form.control}
                                                    name={`social.${index}.name`}
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Red Social</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona..." />
                                                            </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="twitter">Twitter / X</SelectItem>
                                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                                <SelectItem value="facebook">Facebook</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`social.${index}.url`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>URL</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="https://..." {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => setSocialLinkToDelete(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ name: '', url: '' })}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir Red Social
                                </Button>
                            </div>
                            
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <AlertDialog open={socialLinkToDelete !== null} onOpenChange={() => setSocialLinkToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta acción eliminará el enlace de la red social. No se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSocialLinkToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/80">
                        Sí, eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default function DeveloperPageClient({ brandingConfig }: { brandingConfig: BrandingConfig }) {
    const { user, userDoc, isLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('customize');

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
            <Header onCartClick={() => {}} showCart={false} brandingConfig={brandingConfig} />
            <main className="container mx-auto px-4 py-8">
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

                    {activeTab === 'customize' && <BrandingCustomizer initialConfig={brandingConfig} />}
                    {activeTab === 'team' && (
                        <React.Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                            <TeamManagement userDoc={userDoc} />
                        </React.Suspense>
                    )}
                </div>
            </main>
        </div>
    );
}
