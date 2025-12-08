"use client";

import { useWeb3 } from '@/lib/contexts/Web3Context';
import { UserRoleIndicator } from '@/components/layout/UserRoleIndicator';
import { PermissionGuard } from '@/components/layout/PermissionGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoleRequest } from '@/components/roles/RoleRequest';
import { RoleNotifications } from '@/components/notifications/RoleNotifications';
import { User, Wallet, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function ProfilePage() {
  const { address, isConnected, isAdmin, isDefaultAdmin } = useWeb3();

  if (!isConnected) {
    return (
      <PermissionGuard>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-4">Conexión Requerida</h2>
          <p className="text-muted-foreground">
            Conecta tu wallet para acceder a tu perfil
          </p>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            Mi Perfil
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tu cuenta y permisos en el sistema
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Información de la Cuenta
              </CardTitle>
              <CardDescription>
                Detalles de tu conexión blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dirección de Wallet</p>
                    <p className="text-xs text-muted-foreground">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Conectada
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Estado</span>
                  </div>
                  <Badge
                    className={isAdmin ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                  >
                    {isAdmin ? 'Con Permisos' : 'Usuario Regular'}
                  </Badge>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tipo de Cuenta</span>
                  </div>
                  <Badge
                    className={isDefaultAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}
                  >
                    {isDefaultAdmin ? 'Admin Principal' : isAdmin ? 'Administrador' : 'Usuario'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <RoleNotifications />

          {/* Role Request Section */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Roles</CardTitle>
              <CardDescription>
                Gestiona tus solicitudes de permisos en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleRequest />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <UserRoleIndicator />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAdmin && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href="/admin/users">
                    <Shield className="w-4 h-4 mr-2" />
                    Gestionar Usuarios
                  </a>
                </Button>
              )}

              <Button className="w-full justify-start" variant="outline" asChild>
                <a href="/dashboard">
                  <User className="w-4 h-4 mr-2" />
                  Ir al Dashboard
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Wallet conectada</span>
              </div>

              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Permisos de administrador</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-sm">Permisos limitados</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Acceso al sistema</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}