'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, updateDoc, query, where } from 'firebase/firestore';
import type { AppUser, Role } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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

// Team Management View
const TeamManagement = ({ userDoc }: { userDoc: AppUser }) => {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isRoleChanging, setIsRoleChanging] = useState<string | null>(null);
  const [roleChangeData, setRoleChangeData] = useState<{ user: AppUser; newRole: Role; } | null>(null);
  
  const isFullAdmin = userDoc.role === 'admin';
  const isDeveloper = userDoc.role === 'developer';

  // Admins and developers can list all users. The component is only rendered for them.
  const usersCollectionQuery = useMemoFirebase(() => 
      (firestore && (isFullAdmin || isDeveloper))
          ? collection(firestore, 'users')
          : null,
      [firestore, isFullAdmin, isDeveloper]
  );
  const { data: allUsers, isLoading: staffLoading } = useCollection<AppUser>(usersCollectionQuery);

  const { admins, hosts, drivers, developers, customers } = useMemo(() => {
    const admins: AppUser[] = [];
    const hosts: AppUser[] = [];
    const drivers: AppUser[] = [];
    const developers: AppUser[] = [];
    const customers: AppUser[] = [];
    
    allUsers?.forEach(user => {
        if (user.role === 'admin') admins.push(user);
        else if (user.role === 'host') hosts.push(user);
        else if (user.role === 'driver') drivers.push(user);
        else if (user.role === 'developer') developers.push(user);
        else if (user.role === 'customer') customers.push(user);
    });

    return { admins, hosts, drivers, developers, customers };
  }, [allUsers]);

  const handleRoleChangeRequest = (user: AppUser, newRole: Role) => {
    if (user.role === newRole) return;
    setRoleChangeData({ user, newRole });
  };

  const confirmRoleChange = async () => {
    if (!firestore || !roleChangeData) return;
  
    const { user, newRole } = roleChangeData;
  
    // Admins cannot be demoted by developers
    if (userDoc.role === 'developer' && user.role === 'admin') {
         toast({
            variant: "destructive",
            title: "Acción no permitida",
            description: "Los desarrolladores no pueden cambiar el rol de los administradores."
        });
        setRoleChangeData(null);
        return;
    }

    setIsRoleChanging(user.uid);
    setRoleChangeData(null);
  
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, { role: newRole });
      
      toast({
        title: "Rol actualizado",
        description: `El rol de ${user.displayName || user.email} ha sido cambiado a ${newRole}.`
      });
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Error al cambiar rol",
        description: error.message || "No se pudo actualizar el rol. Permiso denegado."
      });
    } finally {
      setIsRoleChanging(null);
    }
  };
  
  const filterUsers = (users: AppUser[] | null) => {
    if (!users) return [];
    return users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }

  const UserTable = ({ users, title, isLoading }: { users: AppUser[] | null, title: string, isLoading: boolean }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div> : 
        !users || users.length === 0 ? <div className="text-center text-muted-foreground py-4">No hay usuarios en este grupo.</div> :
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className='border-b'>
              <tr className='text-left text-sm text-muted-foreground'>
                <th className='pb-2 font-medium'>Usuario</th>
                <th className='pb-2 font-medium'>Email</th>
                <th className='pb-2 font-medium text-right w-48'>Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.uid} className='border-b'>
                  <td className='py-3 font-medium flex items-center gap-2'>
                    {user.displayName || "Sin Nombre"}
                  </td>
                  <td className="py-3 text-muted-foreground">{user.email}</td>
                  <td className='py-3 text-right'>
                    {isRoleChanging === user.uid ? <Loader2 className="h-4 w-4 animate-spin ml-auto" /> :
                      <Select 
                        value={user.role} 
                        onValueChange={(newRole) => handleRoleChangeRequest(user, newRole as Role)}
                        disabled={(userDoc.role === 'developer' && user.role === 'admin') || user.uid === userDoc.uid}
                      >
                        <SelectTrigger className="w-40 ml-auto h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           {isFullAdmin && <SelectItem value="admin">Admin</SelectItem>}
                           {isFullAdmin && <SelectItem value="developer">Developer</SelectItem>}
                          <SelectItem value="host">Anfitrión</SelectItem>
                          <SelectItem value="driver">Repartidor</SelectItem>
                          <SelectItem value="customer">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </CardContent>
    </Card>
  );

  return (
    <div className='space-y-8'>
       <Card>
        <CardHeader>
          <CardTitle>Gestión de Equipo</CardTitle>
          <CardDescription>Busca y administra los roles de los usuarios en la plataforma.</CardDescription>
          <Input 
            placeholder="Buscar por nombre o correo electrónico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
       </Card>

        <div className="space-y-6">
          <UserTable users={filterUsers(admins)} title="Administradores" isLoading={staffLoading} />
          <UserTable users={filterUsers(developers)} title="Desarrolladores" isLoading={staffLoading} />
          <UserTable users={filterUsers(hosts)} title="Anfitriones" isLoading={staffLoading} />
          <UserTable users={filterUsers(drivers)} title="Repartidores" isLoading={staffLoading}/>
          <UserTable users={filterUsers(customers)} title="Clientes" isLoading={staffLoading}/>
        </div>

      <AlertDialog open={!!roleChangeData} onOpenChange={() => setRoleChangeData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio de rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cambiar el rol de <span className='font-bold'>{roleChangeData?.user.displayName || roleChangeData?.user.email}</span> a <span className='font-bold uppercase'>{roleChangeData?.newRole}</span>. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default TeamManagement;
