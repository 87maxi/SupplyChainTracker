"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Factory, HardDrive, Cpu, School, Clock } from 'lucide-react';
import { UserRoleStatus } from '@/lib/types';

interface PendingRequest extends UserRoleStatus {
  roleName: string;
  roleIcon: React.ComponentType<{ className?: string }>;
}

const roleInfo: Record<string, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
  [getRoleConstants().FABRICANTE_ROLE]: { name: 'Fabricante', icon: Factory },
  [getRoleConstants().AUDITOR_HW_ROLE]: { name: 'Auditor HW', icon: HardDrive },
  [getRoleConstants().TECNICO_SW_ROLE]: { name: 'Técnico SW', icon: Cpu },
  [getRoleConstants().ESCUELA_ROLE]: { name: 'Escuela', icon: School }
};

export function PendingRequests() {
  const { web3Service, address: adminAddress, refreshRoles } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<PendingRequest[]>([]);

  // Fetch all pending requests
  const fetchPendingRequests = useCallback(async () => {
    if (!web3Service) return;

    setLoading(true);
    try {
      const roles = [
        getRoleConstants().FABRICANTE_ROLE,
        getRoleConstants().AUDITOR_HW_ROLE,
        getRoleConstants().TECNICO_SW_ROLE,
        getRoleConstants().ESCUELA_ROLE
      ];

      // In a real implementation, we would use events or a more efficient method
      // For now, we'll simulate by checking some common addresses
      const commonAddresses = [
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44f',
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44g',
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44h',
        adminAddress || ''
      ].filter(addr => addr !== '');

      const allRequests: PendingRequest[] = [];

      for (const address of commonAddresses) {
        for (const role of roles) {
          try {
            const status = await web3Service.getRoleStatus(role, address);
            
            // Only add pending requests (state === 0) with valid accounts
            if (status.state === 0 && status.account !== '0x0000000000000000000000000000000000000000') {
              const roleData = roleInfo[role];
              allRequests.push({
                ...status,
                roleName: roleData.name,
                roleIcon: roleData.icon
              });
            }
          } catch (error) {
            // Continue with other addresses/roles
            continue;
          }
        }
      }

      setRequests(allRequests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Error al cargar solicitudes pendientes');
    } finally {
      setLoading(false);
    }
  }, [web3Service, adminAddress]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleApprove = async (role: string, account: string, roleName: string) => {
    if (!web3Service) return;

    setLoading(true);
    try {
      await web3Service.approveRole(role, account);
      toast.success('Solicitud aprobada', {
        description: `Rol ${roleName} aprobado para ${account.slice(0, 6)}...${account.slice(-4)}`
      });
      
      // Refresh the requests list
      await fetchPendingRequests();
      // Refresh global user roles
      await refreshRoles();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al aprobar solicitud', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (role: string, account: string, roleName: string) => {
    if (!web3Service) return;

    setLoading(true);
    try {
      await web3Service.rejectRole(role, account);
      toast.success('Solicitud rechazada', {
        description: `Rol ${roleName} rechazado para ${account.slice(0, 6)}...${account.slice(-4)}`
      });
      
      // Refresh the requests list
      await fetchPendingRequests();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al rechazar solicitud', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
        <span>Cargando solicitudes pendientes...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="w-5 h-5" />
          Solicitudes Pendientes
        </CardTitle>
        <CardDescription>
          Revisa y aprueba las solicitudes de roles pendientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Factory className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay solicitudes pendientes</p>
            <p className="text-sm">Todas las solicitudes han sido procesadas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const IconComponent = request.roleIcon;
              
              return (
                <Card key={`${request.role}-${request.account}`} className="border-l-4 border-l-yellow-400">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          {IconComponent && <IconComponent className="w-6 h-6 text-yellow-600" />}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <h3 className="font-semibold text-lg">{request.roleName}</h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              {request.account}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Solicitado: {new Date(Number(request.approvalTimestamp) * 1000).toLocaleString()}</span>
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(request.role, request.account, request.roleName)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          Aprobar
                        </Button>
                        <Button
                          onClick={() => handleReject(request.role, request.account, request.roleName)}
                          disabled={loading}
                          variant="destructive"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}