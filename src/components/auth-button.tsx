
'use client';

import { useAuth, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, Shield, User as UserIcon, Truck, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { getAvatarUrl } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AuthButton() {
  const auth = useAuth();
  const { user, userDoc, isLoading } = useUser();
  const router = useRouter();
  
  const userRole = useMemo(() => userDoc?.role, [userDoc]);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      // Use window.location.href to force a full redirect to the homepage,
      // preventing redirection conflicts on protected routes.
      window.location.href = '/';
    }
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user) {
    return (
      <Button asChild>
        <Link href="/login">Ingresar</Link>
      </Button>
    );
  }

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const avatarUrl = getAvatarUrl(user, userDoc);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
           <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl} alt={user.displayName ?? 'User'} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </Link>
        </DropdownMenuItem>
        {userRole === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="mr-2 h-4 w-4" />
              <span>Panel de Admin</span>
            </Link>
          </DropdownMenuItem>
        )}
        {userRole === 'host' && (
          <DropdownMenuItem asChild>
            <Link href="/host">
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              <span>Panel de Anfitrión</span>
            </Link>
          </DropdownMenuItem>
        )}
        {userRole === 'driver' && (
           <DropdownMenuItem asChild>
            <Link href="/delivery">
              <Truck className="mr-2 h-4 w-4" />
              <span>Panel de Repartidor</span>
            </Link>
          </DropdownMenuItem>
        )}
        {userRole === 'customer' && (
           <DropdownMenuItem asChild>
            <Link href="/my-orders">
              <Truck className="mr-2 h-4 w-4" />
              <span>Mis Pedidos</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
