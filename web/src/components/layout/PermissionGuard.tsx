"use client";

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/lib/contexts/Web3Context';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'defaultAdmin';
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  requiredRole = 'admin',
  fallback
}: PermissionGuardProps) {
  const { isConnected, isAdmin, isDefaultAdmin, connectWallet, isLoading } = useWeb3();

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

  const hasPermission = requiredRole === 'defaultAdmin' ? isDefaultAdmin : isAdmin;

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="w-full border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            Acceso Denegado
          </CardTitle>
          <CardDescription className="text-red-700">
            {requiredRole === 'defaultAdmin'
              ? 'Solo el administrador principal puede acceder a esta sección.'
              : 'Necesitas permisos de administrador para acceder a esta sección.'
            }
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