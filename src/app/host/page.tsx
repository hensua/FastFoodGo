
'use client';

import React, { useState } from 'react';
import Header from '@/components/header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, UtensilsCrossed, TrendingUp, ChefHat, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppUser } from '@/lib/types';
import { OrderList } from '@/components/order-list';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useOrderStats } from '@/app/admin/page';

// Simplified dashboard for hosts
const HostStatsDashboard = ({userDoc}: {userDoc: AppUser}) => {
    const [filter, setFilter] = useState < 'day' | 'week' | 'month' | 'year' | 'all' > ('day');
    const { stats, isLoading } = useOrderStats(filter, userDoc.role === 'admin');

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /> Cargando reportes...</div>;
    }

    const { generalStats } = stats;

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
                        <ChefHat className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{generalStats.deliveredOrders}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos en Tienda</CardTitle>
                        <Loader2 className="h-4 w-4 text-muted-foreground" />
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
            <Card>
                <CardHeader>
                    <CardTitle>Acceso Limitado a Reportes</CardTitle>
                    <CardDescription>Contacta a un administrador para ver el desglose completo de ventas, productos y clientes.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
};


const HostDashboard = ({ userDoc }: { userDoc: AppUser }) => {
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

            {activeTab === 'kitchen' && <OrderList userDoc={userDoc} />}
            {activeTab === 'stats' && <HostStatsDashboard userDoc={userDoc}/>}
        </div>
    );
}


export default function HostPage() {
    const { user, userDoc, isLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push('/login?redirect=/host');
            return;
        }

        if (userDoc && userDoc.role !== 'admin' && userDoc.role !== 'host') {
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

    const hasAccess = userDoc.role === 'admin' || userDoc.role === 'host';
    if (!hasAccess) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /> Redirigiendo...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header onCartClick={() => { }} showCart={false} />
            <main className="container mx-auto px-4 py-8">
                <HostDashboard userDoc={userDoc} />
            </main>
        </div>
    );
}
