
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ChatView } from './ChatView';
import type { Order, AppUser } from '@/lib/types';
import { MessageSquare } from 'lucide-react';
import type { BrandingConfig } from '@/lib/branding-config';

interface ChatDialogProps {
  order: Order;
  user: AppUser;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  brandingConfig: BrandingConfig;
}

export function ChatDialog({ order, user, isOpen, onOpenChange, brandingConfig }: ChatDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-lg h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare /> Chat del Pedido #{order.id.slice(-6).toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Comunícate con la tienda o el repartidor.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden px-6 pb-6">
          <ChatView order={order} currentUser={user} brandingConfig={brandingConfig} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
