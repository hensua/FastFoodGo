
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, UtensilsCrossed, TrendingUp, ChefHat, Ban, Trophy, Crown, PackageCheck, Store, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppUser, Order } from '@/lib/types';
import { OrderList } from '@/components/order-list';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useOrderStats } from '@/app/admin/AdminDashboardClient';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { UserRound } from 'lucide-react';
import { getBrandingConfig, type BrandingConfig } from '@/lib/branding-config';
import { isToday, isThisWeek, isThisMonth, isThisYear, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HostPage() {
    const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null);

    useEffect(() => {
        getBrandingConfig().then(setBrandingConfig);
    }, []);

    if (!brandingConfig) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return <HostPageClient brandingConfig={brandingConfig} />;
}


const CancelledOrdersHistory = ({ filter, orders: allCancelledOrders }: { filter: 'day' | 'week' | 'month' | 'year' | 'all'; orders: Order[] }) => {
    const filteredOrders = useMemo(() => {
        return allCancelledOrders.filter(o => {
            if (!o.orderDate?.toDate) return false;
            const date = o.orderDate.toDate();
            if (filter === 'day') return isToday(date);
            if (filter === 'week') return isThisWeek(date, { weekStartsOn: 1 });
            if (filter === 'month') return isThisMonth(date);
            if (filter === 'year') return isThisYear(date);
            return true;
        });
    }, [filter, allCancelledOrders]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><XCircle className="text-destructive"/> Historial de Pedidos Cancelados</CardTitle>
                <CardDescription>Un registro de todos los pedidos que han sido cancelados.</CardDescription>
            </CardHeader>
            <CardContent>
                {filteredOrders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">No hay pedidos cancelados en este período.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b"><tr className="text-left text-sm text-muted-foreground">
                                <th className="p-2">Pedido</th>
                                <th className="p-2">Fecha</th>
                                <th className="p-2">Cliente</th>
                                <th className="p-2">Motivo</th>
                            </tr></thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id} className="border-b">
                                        <td className="p-2 font-mono text-primary">#{order.id.slice(-6).toUpperCase()}</td>
                                        <td className="p-2 text-muted-foreground">{order.orderDate?.toDate ? format(order.orderDate.toDate(), 'dd MMM yyyy, HH:mm', { locale: es }) : 'N/A'}</td>
                                        <td className="p-2">{order.customerName}</td>
                                        <td className="p-2 text-sm italic text-destructive-foreground/80">{order.cancellationReason || 'No especificado'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Simplified dashboard for hosts
const HostStatsDashboard = ({userDoc}: {userDoc: AppUser}) => {
    const [filter, setFilter] = useState < 'day' | 'week' | 'month' | 'year' | 'all' > ('day');
    const { stats, isLoading } = useOrderStats(filter, false);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /> Cargando reportes...</div>;
    }

    const { generalStats, productStats, customerStats, cancelledOrdersHistory } = stats;

    return (
        <div className="space-y-6">
            <div className="flex justify-center gap-1 p-1 bg-muted rounded-lg flex-wrap mb-6">
                {(['day', 'week', 'month', 'year', 'all'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === f ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {{ 'day': 'Día', 'week': 'Semana', 'month': 'Mes', 'year': 'Año', 'all': 'Todos' }[f]}
                    </button>
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{generalStats.totalOrders}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos por Domicilio</CardTitle>
                        <PackageCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{generalStats.deliveredOrders}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos en Tienda</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Próximamente</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Cancelados</CardTitle>
                        <Ban className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{generalStats.cancelledOrders}</div></CardContent>
                </Card>
            </div>
            
             <div className="grid gap-6 md:grid-cols-2">
               {productStats?.top5 && (
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500"/> Top 5 Productos Más Vendidos</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {productStats.top5.map((p, index) => (
                                <li key={p.name} className="flex items-center gap-4">
                                    <span className="font-bold text-lg text-muted-foreground w-6">#{index+1}</span>
                                    <Image src={p.imageUrl || '/placeholder.png'} alt={p.name} width={40} height={40} className="rounded-md object-cover w-10 h-10"/>
                                    <p className="font-semibold flex-grow">{p.name}</p>
                                    <Badge variant="secondary" className="font-mono">{p.count} und.</Badge>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
               )}
               {customerStats?.top5 && (
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Crown className="text-amber-500"/> Top 5 Clientes</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {customerStats.top5.map((c, index) => (
                                <li key={c.name} className="flex items-center gap-4">
                                    <span className="font-bold text-lg text-muted-foreground w-6">#{index+1}</span>
                                    <div className='p-2 rounded-full bg-muted'><UserRound className='w-5 h-5 text-muted-foreground'/></div>
                                    <p className="font-semibold flex-grow">{c.name}</p>
                                    <Badge variant="secondary" className="font-mono">{formatCurrency(c.total)}</Badge>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
               )}
            </div>

            <CancelledOrdersHistory filter={filter} orders={cancelledOrdersHistory || []} />

            <Card>
                <CardHeader>
                    <CardTitle>Acceso Limitado a Reportes</CardTitle>
                    <CardDescription>Contacta a un administrador para ver el desglose completo de ventas e historial de cambios.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
};


const HostDashboard = ({ userDoc, brandingConfig }: { userDoc: AppUser; brandingConfig: BrandingConfig }) => {
    const [activeTab, setActiveTab] = useState('kitchen');

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl shadow-sm border mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <UtensilsCrossed className="text-primary" /> Panel de Anfitrión
                </h2>
                <div className="flex gap-1 p-1 bg-muted rounded-lg flex-wrap">
                    <button onClick={() => setActiveTab('kitchen')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'kitchen' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><ChefHat size={16} /> Comandas</button>
                    <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${activeTab === 'stats' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}><TrendingUp size={16} /> Reportes</button>
                </div>
            </div>

            {activeTab === 'kitchen' && <OrderList userDoc={userDoc} brandingConfig={brandingConfig} />}
            {activeTab === 'stats' && <HostStatsDashboard userDoc={userDoc}/>}
        </div>
    );
}


function HostPageClient({ brandingConfig }: { brandingConfig: BrandingConfig }) {
    const { user, userDoc, isLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push('/login?redirect=/host');
            return;
        }

        if (userDoc && userDoc.role !== 'admin' && userDoc.role !== 'host' && userDoc.role !== 'developer') {
            toast({
                variant: "destructive",
                title: "Acceso denegado",
                description: "No tienes permisos para acceder a esta página.",
            });
            router.push('/');
        }
    }, [isLoading, user, userDoc, router, toast]);

    if (isLoading || !userDoc) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Verificando acceso...</div>;
    }

    const hasAccess = userDoc.role === 'admin' || userDoc.role === 'host' || userDoc.role === 'developer';
    if (!hasAccess) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header onCartClick={() => { }} showCart={false} brandingConfig={brandingConfig} />
            <main className="container mx-auto px-4 py-8">
                <HostDashboard userDoc={userDoc} brandingConfig={brandingConfig} />
            </main>
        </div>
    );
}
