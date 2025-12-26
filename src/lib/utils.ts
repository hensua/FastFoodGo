import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AppUser } from "./types";
import type { User } from "firebase/auth";

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

export function getAvatarUrl(user: User | null | undefined, userDoc: AppUser | null | undefined): string {
  if (userDoc?.photoURL) {
    return userDoc.photoURL;
  }
  if (user?.photoURL) {
    return user.photoURL;
  }

  // Use simple, role-based SVG icons as placeholders
  const role = userDoc?.role || 'customer';
  
  // Using simple SVG icons from an open-source library, URL-encoded.
  const icons: Record<string, string> = {
    admin: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-shield'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'%3E%3C/path%3E%3C/svg%3E`,
    host: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-store'%3E%3Cpath d='m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7'%3E%3C/path%3E%3Cpath d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8'%3E%3C/path%3E%3Cpath d='M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4'%3E%3C/path%3E%3Cpath d='M2 7h20'%3E%3C/path%3E%3Cpath d='M22 7v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7'%3E%3C/path%3E%3C/svg%3E`,
    driver: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-truck'%3E%3Cpath d='M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2'%3E%3C/path%3E%3Cpath d='M15 18H9'%3E%3C/path%3E%3Cpath d='M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14'%3E%3C/path%3E%3Ccircle cx='6' cy='18' r='2'%3E%3C/circle%3E%3Ccircle cx='18' cy='18' r='2'%3E%3C/circle%3E%3C/svg%3E`,
    customer: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-user-round'%3E%3Ccircle cx='12' cy='8' r='5'/%3E%3Cpath d='M20 21a8 8 0 0 0-16 0'/%3E%3C/svg%3E`,
  };
  
  return icons[role] || icons['customer'];
}
