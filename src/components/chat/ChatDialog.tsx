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

interface ChatDialogProps {
  order: Order;
  user: AppUser;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMessageSent: () => void;
}

export function ChatDialog({ order, user, isOpen, onOpenChange, onMessageSent }: ChatDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare /> Chat del Pedido #{order.id.slice(-6).toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Comunícate con la tienda o el repartidor.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden px-6 pb-6">
          <ChatView order={order} currentUser={user} onMessageSent={onMessageSent} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
