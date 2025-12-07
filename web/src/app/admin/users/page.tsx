"use client";

import { useState } from 'react';
import { UserRoleForm } from '@/components/admin/UserRoleForm';
import { UserList } from '@/components/admin/UserList';
import { useWeb3 } from '@/lib/contexts/Web3Context';

export default function AdminUsersPage() {
  const { address, isConnected } = useWeb3();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRoleUpdated = () => {
    // Force refresh of UserList component
    setRefreshKey(prev => prev + 1);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold mb-4">Bienvenido al Panel de Administración</h2>
        <p className="text-muted-foreground mb-6">
          Conéctate con tu wallet para acceder al sistema de trazabilidad de netbooks educativas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground mt-2">
          Administra los roles de los usuarios en el sistema de trazabilidad
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UserRoleForm onRoleUpdated={handleRoleUpdated} />
        <UserList key={refreshKey} />
      </div>
    </div>
  );
}