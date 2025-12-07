"use client";

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { NetbookStatusChart } from '@/components/dashboard/NetbookStatusChart';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { Web3Service } from '@/lib/services/Web3Service';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const mockNetbookStatuses = [
  { state: 0, count: 24, percentage: 30 },
  { state: 1, count: 18, percentage: 22.5 },
  { state: 2, count: 22, percentage: 27.5 },
  { state: 3, count: 16, percentage: 20 }
];

export default function DashboardPage() {
  const { address, isConnected } = useWeb3();
  const [web3Service] = useState(() => new Web3Service());
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (isConnected && address) {
        try {
          const { DEFAULT_ADMIN_ROLE } = getRoleConstants();
          const hasRole = await web3Service.hasRole(DEFAULT_ADMIN_ROLE, address);
          setIsAdmin(hasRole);
        } catch (error) {
          console.error('Error checking admin role:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [isConnected, address, web3Service]);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Acceso Denegado</h2>
        <p className="text-muted-foreground mb-4">
          Esta página es exclusiva para administradores del sistema.
        </p>
        <p className="text-sm text-muted-foreground">
          Tu dirección {address} no tiene permisos de administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Panel de control del sistema de trazabilidad de netbooks educativas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Netbooks Totales"
          value="80"
          description="Desde el inicio del programa"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0-2 2h7"></path><path d="m9 16 3-3 3 3"></path><path d="M12 13v9"></path></svg>}
        />
        <StatsCard
          title="Usuarios Registrados"
          value="15"
          description="Con distintos roles en el sistema"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
        />
        <StatsCard
          title="Transacciones Hoy"
          value="24"
          description="Procesos completados en las últimas 24h"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="20" height="14" x="2" y="5" rx="2"></rect><path d="M12 15v4"></path><path d="M8 15h8"></path></svg>}
        />
        <StatsCard
          title="Escuelas Registradas"
          value="8"
          description="Instituciones educativas participantes"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M2 22v-5l5-5 5 5-5 5z"></path><path d="M17 22h3v-5h-3"></path><path d="M2 7v5l5-5 5 5V7"></path><path d="M17 2h3v5h-3"></path></svg>}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <NetbookStatusChart statuses={mockNetbookStatuses} />
        
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos procesos completados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Netbook #{1000 + item}</p>
                    <p className="text-sm text-muted-foreground">Estado actualizado a {item === 1 ? 'DISTRIBUIDA' : item === 2 ? 'SW_VALIDADO' : item === 3 ? 'HW_APROBADO' : 'FABRICADA'}</p>
                  </div>
                  <div className="ml-auto font-medium">Hace {item} hora{item > 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}