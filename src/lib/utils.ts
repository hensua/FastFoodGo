import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AppUser } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const DELIVERY_FEE = 3500;

export function getAvatarUrl(user: AppUser | null | undefined): string {
  if (user?.photoURL) {
    return user.photoURL;
  }
  
  const seed = user?.role || 'customer';
  // Using different seeds for each role to get unique placeholder images
  const roleSeeds: { [key: string]: string } = {
    admin: 'ShieldAdmin',
    host: 'HomeHost',
    driver: 'TruckDriver',
    customer: 'UserCustomer',
  };
  
  return `https://picsum.photos/seed/${roleSeeds[seed] || seed}/200`;
}
