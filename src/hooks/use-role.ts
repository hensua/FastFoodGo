'use client';

import { useUser } from '@/firebase';

export function useRole() {
  const { user, isUserLoading } = useUser();

  const isAdmin = !isUserLoading && user?.email === 'administrador@peter.com';
  const isDriver = !isUserLoading && user?.email === 'repartidor@peter.com';
  
  const isRoleLoading = isUserLoading;

  return {
    user,
    isAdmin,
    isDriver,
    isRoleLoading,
  };
}
