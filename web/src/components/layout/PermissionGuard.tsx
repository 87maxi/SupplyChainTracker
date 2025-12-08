"use client";

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/lib/contexts/Web3Context';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'defaultAdmin' | 'manufacturer' | 'auditor' | 'technician' | 'school';
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  requiredRole = 'admin',
  fallback
}: PermissionGuardProps) {
  const {
    isConnected,
    isAdmin,
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

  let hasPermission = false;

  switch (requiredRole) {
    case 'defaultAdmin':
      hasPermission = isDefaultAdmin;
      break;
    case 'manufacturer':
      hasPermission = isManufacturer;
      break;
    case 'auditor':
      hasPermission = isAuditor;
      break;
    case 'technician':
      hasPermission = isTechnician;
      break;
    case 'school':
      hasPermission = isSchool;
      break;
    case 'admin':
    default:
      hasPermission = isAdmin;
      break;
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const getRoleName = (role: string) => {
      switch (role) {
        case 'defaultAdmin': return 'Administrador Principal';
        case 'manufacturer': return 'Fabricante';
        case 'auditor': return 'Auditor de Hardware';
        case 'technician': return 'Técnico de Software';
        case 'school': return 'Escuela';
        default: return 'Administrador';
      }
    };

    return (
      <Card className="w-full border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            Acceso Denegado
          </CardTitle>
          <CardDescription className="text-red-700">
            Necesitas el rol de <strong>{getRoleName(requiredRole)}</strong> para acceder a esta sección.
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