"use client";

import { useWeb3 } from '@/lib/contexts/Web3Context';
import { UserRoleIndicator } from '../layout/UserRoleIndicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { NetbookStatusChart } from '@/components/dashboard/NetbookStatusChart';
import { RoleRequest } from '@/components/roles/RoleRequest';
import { NewUserOnboarding } from '@/components/onboarding/NewUserOnboarding';
import { RoleNotifications } from '@/components/notifications/RoleNotifications';
import { ContractDebug } from '@/components/debug/ContractDebug';
import { Crown, Factory, ArrowRight, Users, Activity, Building, AlertTriangle, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface UserAction {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  scrollToRoleRequest?: boolean;
}

const mockNetbookStatuses = [
    { state: 0, count: 24, percentage: 30 },
    { state: 1, count: 18, percentage: 22.5 },
    { state: 2, count: 22, percentage: 27.5 },
    { state: 3, count: 16, percentage: 20 }
];

const roleActions: Record<string, UserAction[]> = {
  isDefaultAdmin: [
    {
      title: 'Gestión de Roles',
      description: 'Aprobar o rechazar solicitudes de roles',
      href: '/admin/users',
      icon: Crown,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Gestión de Netbooks',
      description: 'Administrar el ciclo de vida de las netbooks',
      href: '/admin/netbooks',
      icon: Factory,
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ],
  isAdmin: [
    {
      title: 'Mis Funciones',
      description: 'Acceder a las funciones específicas de tu rol',
      href: '/profile',
      icon: Users,
      color: 'bg-green-500 hover:bg-green-600'
    }
  ],
  isRegularUser: [
    {
      title: 'Solicitar Roles',
      description: 'Solicita permisos para acceder a más funciones',
      href: '#role-request',
      icon: Activity,
      color: 'bg-orange-500 hover:bg-orange-600',
      scrollToRoleRequest: true
    }
  ]
};

export function EnhancedDashboard() {
  const { isConnected, isAdmin, isDefaultAdmin, hasAnyRole, isLoading, address } = useWeb3();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold mb-4">Bienvenido al Panel de Control</h2>
        <p className="text-muted-foreground mb-6">
          Conéctate con tu wallet para acceder al sistema de trazabilidad de netbooks educativas
        </p>
      </div>
    );
  }

  // Show loading while determining user roles
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Verificando permisos...</h2>
        <p className="text-muted-foreground">
          Estamos determinando tu nivel de acceso al sistema
        </p>
      </div>
    );
  }

  // Special case: Check if user should be admin but isn't detected
  const anvilAdmin = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const shouldBeAdmin = address?.toLowerCase() === anvilAdmin.toLowerCase();

  if (shouldBeAdmin && !isDefaultAdmin) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Panel de control del sistema de trazabilidad de netbooks educativas
            </p>
          </div>
        </div>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Problema de Detección de Admin
            </CardTitle>
            <CardDescription className="text-orange-700">
              Se detectó que estás conectado con la cuenta de administrador de Anvil, pero el sistema no reconoce tus permisos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-orange-200">
              <h4 className="font-medium mb-2">Dirección detectada:</h4>
              <p className="font-mono text-sm">{address}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Esta es la dirección del administrador por defecto de Anvil.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Posibles soluciones:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Asegúrate de estar conectado a la red Anvil (localhost:8545)</li>
                <li>Verifica que el contrato esté desplegado correctamente</li>
                <li>Recarga la página para volver a verificar los permisos</li>
                <li>Usa el componente de debug abajo para diagnosticar</li>
              </ul>
            </div>

            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Recargar Página
            </Button>
          </CardContent>
        </Card>

        {/* Debug component */}
        <ContractDebug />
      </div>
    );
  }

  // Show onboarding for users without any roles
  if (!hasAnyRole) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Panel de control del sistema de trazabilidad de netbooks educativas
            </p>
          </div>
          <Badge variant="outline">
            <Users className="w-3 h-3 mr-1" />
            Usuario Regular
          </Badge>
        </div>

        {/* Onboarding for new users */}
        <NewUserOnboarding />

        {/* Debug component for troubleshooting */}
        <ContractDebug />

        {/* Notifications */}
        <RoleNotifications />

        {/* Role Request Section for users with pending requests */}
        <div id="role-request">
          <RoleRequest />
        </div>
      </div>
    );
  }

  // Define user actions for admin dashboard
  const getUserActions = () => {
    if (isDefaultAdmin) return roleActions.isDefaultAdmin;
    if (isAdmin) return roleActions.isAdmin;
    return roleActions.isRegularUser;
  };

  const userActions = getUserActions();

  // Admin dashboard
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Panel de control del sistema de trazabilidad de netbooks educativas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDefaultAdmin && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              <Crown className="w-3 h-3 mr-1" />
              Administrador Principal
            </Badge>
          )}
          {isAdmin && !isDefaultAdmin && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <Users className="w-3 h-3 mr-1" />
              Usuario con Roles
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userActions.map((action) => (
          <Card key={action.href} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${action.color} text-white`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              {action.scrollToRoleRequest ? (
                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    const element = document.getElementById('role-request');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Ver Solicitudes de Rol
                </Button>
              ) : (
                <Link href={action.href} className="block mt-4">
                  <Button className="w-full">
                    Acceder
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Role Indicator */}
      <UserRoleIndicator />

      {/* Stats Grid - Only show for admins */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Netbooks Totales"
          value="80"
          description="Desde el inicio del programa"
          icon={<Factory className="w-5 h-5" />}
        />
        <StatsCard
          title="Usuarios Registrados"
          value="15"
          description="Con distintos roles en el sistema"
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          title="Transacciones Hoy"
          value="24"
          description="Procesos completados en las últimas 24h"
          icon={<Activity className="w-5 h-5" />}
        />
        <StatsCard
          title="Escuelas Registradas"
          value="8"
          description="Instituciones educativas participantes"
          icon={<Building className="w-5 h-5" />}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-8 md:grid-cols-2">
        <NetbookStatusChart statuses={mockNetbookStatuses} />

        <div className="space-y-8">
          <RoleRequest />

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimos procesos completados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Netbook #{1000 + item}</p>
                        <p className="text-xs text-muted-foreground">
                          Estado actualizado a {item === 1 ? 'DISTRIBUIDA' : item === 2 ? 'SW_VALIDADO' : item === 3 ? 'HW_APROBADO' : 'FABRICADA'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Hace {item} hora{item > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}