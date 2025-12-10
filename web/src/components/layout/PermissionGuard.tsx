"use client";

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { ReactNode } from 'react';

interface PermissionGuardProps {
  children: ReactNode;
  requiredRoles?: string[]; // Array of role hashes
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  requiredRoles = [],
  fallback
}: PermissionGuardProps) {
  const {
    isConnected,
    isDefaultAdmin,
    isManufacturer,
    isAuditor,
    isTechnician,
    isSchool,
    connectWallet,
    isLoading
  } = useWeb3();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Conexión Requerida
          </CardTitle>
          <CardDescription>
            Necesitas conectar tu wallet para acceder a esta sección
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => connectWallet()} className="w-full">
            Conectar Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default admin has access to everything
  if (isDefaultAdmin) {
    return <>{children}</>;
  }

  // Check if the user has any of the required roles
  const hasPermission = requiredRoles.length === 0 || requiredRoles.some(role => {
    const roleConstants = getRoleConstants();
    switch (role) {
      case roleConstants.FABRICANTE_ROLE:
        return isManufacturer;
      case roleConstants.AUDITOR_HW_ROLE:
        return isAuditor;
      case roleConstants.TECNICO_SW_ROLE:
        return isTechnician;
      case roleConstants.ESCUELA_ROLE:
        return isSchool;
      default:
        return false;
    }
  });

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const getRoleName = (role: string) => {
      const roleConstants = getRoleConstants();
      switch (role) {
        case roleConstants.FABRICANTE_ROLE: return 'Fabricante';
        case roleConstants.AUDITOR_HW_ROLE: return 'Auditor de Hardware';
        case roleConstants.TECNICO_SW_ROLE: return 'Técnico de Software';
        case roleConstants.ESCUELA_ROLE: return 'Escuela';
        default: return 'Rol Desconocido';
      }
    };

    const requiredRoleNames = requiredRoles.map(getRoleName).join(', ');

    return (
      <Card className="w-full border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            Acceso Denegado
          </CardTitle>
          <CardDescription className="text-red-700">
            Necesitas uno de los siguientes roles para acceder a esta sección: <strong>{requiredRoleNames}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-red-600">
              Si crees que deberías tener acceso, solicita el rol correspondiente desde el dashboard.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="/dashboard">Ir al Dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}