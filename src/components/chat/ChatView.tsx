
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { Order, AppUser, ChatMessage } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { BrandingConfig } from '@/lib/branding-config';

interface ChatViewProps {
  order: Order;
  currentUser: AppUser;
  brandingConfig: BrandingConfig;
}

export function ChatView({ order, currentUser, brandingConfig }: ChatViewProps) {
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users', order.customerId, 'orders', order.id, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, order.customerId, order.id]);

  const { data: messages, isLoading } = useCollection<ChatMessage>(messagesQuery);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !firestore || !currentUser) return;

    setIsSending(true);
    try {
      const messageData: Omit<ChatMessage, 'timestamp'> = {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Usuario',
        senderRole: currentUser.role || 'customer',
      };
      
      const messagesCol = collection(firestore, 'users', order.customerId, 'orders', order.id, 'messages');
      await addDoc(messagesCol, {
          ...messageData,
          timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="h-full flex flex-col border rounded-md">
      {isLoading && (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      )}
      {!isLoading && (
        <ScrollArea className="flex-grow" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {messages?.map((msg, index) => {
              const isCurrentUser = msg.senderId === currentUser.uid;
              const senderRole = msg.senderRole;
              let avatarColor = 'bg-gray-300';
              if(senderRole === 'admin') avatarColor = 'bg-primary/20 text-primary-foreground';
              if(senderRole === 'driver') avatarColor = 'bg-blue-300';
              if(senderRole === 'customer') avatarColor = 'bg-green-300';

              return (
                 <div
                  key={index}
                  className={cn(
                    'flex items-end gap-2',
                    isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <Avatar className={cn("h-8 w-8", isCurrentUser ? 'hidden' : '')}>
                    <AvatarFallback className={cn("text-xs", avatarColor)}>
                      {getInitials(msg.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'max-w-xs rounded-lg p-3 text-sm lg:max-w-md',
                      isCurrentUser
                        ? 'rounded-br-none bg-primary text-primary-foreground'
                        : 'rounded-bl-none bg-muted'
                    )}
                  >
                    {!isCurrentUser && <p className="font-bold text-xs mb-1">{msg.senderName} ({msg.senderRole})</p>}
                    <p>{msg.text}</p>
                     <p className={cn("text-xs mt-1", isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending || newMessage.trim() === ''}>
            {isSending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </div>
    </div>
  );
}
