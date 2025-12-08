"use client";

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { isValidAddress } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Search, Check, X, Ban, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserRoleStatus } from '@/lib/types';

interface RoleStatus extends UserRoleStatus {
    roleName: string;
}

export function RoleManagement() {
    const { isConnected, connectWallet, isLoading, web3Service, refreshRoles } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [searchAddress, setSearchAddress] = useState('');
    const [userStatuses, setUserStatuses] = useState<RoleStatus[] | null>(null);

    const roles = useMemo(() => [
        { value: getRoleConstants().FABRICANTE_ROLE, label: 'Fabricante' },
        { value: getRoleConstants().AUDITOR_HW_ROLE, label: 'Auditor HW' },
        { value: getRoleConstants().TECNICO_SW_ROLE, label: 'Técnico SW' },
        { value: getRoleConstants().ESCUELA_ROLE, label: 'Escuela' }
    ], []);

    const handleSearch = useCallback(async () => {
        if (!isValidAddress(searchAddress)) {
            toast.error('Dirección inválida');
            return;
        }

        if (!web3Service) {
            toast.error('Servicio Web3 no disponible');
            return;
        }

        setLoading(true);
        try {
            // Check if the address has any roles by querying the contract
            const userHasAnyRole = await Promise.all(
                roles.map(async (role) => {
                    try {
                        const status: UserRoleStatus = await web3Service.getRoleStatus(role.value, searchAddress);
                        // Only return roles where the account is not zero address
                        return status.account !== '0x0000000000000000000000000000000000000000' ? status : null;
                    } catch (error) {
                        // Ignore errors for addresses that don't have roles
                        return null;
                    }
                })
            );

            // Filter out null values and map to RoleStatus
            const validStatuses = userHasAnyRole
                .filter((status): status is UserRoleStatus => status !== null)
                .map((status) => {
                    const role = roles.find(r => r.value === status.role);
                    return {
                        ...status,
                        roleName: role ? role.label : 'Rol Desconocido',
                    };
                });

            setUserStatuses(validStatuses);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al buscar usuario', { 
                description: errorMessage 
            });
        } finally {
            setLoading(false);
        }
    }, [searchAddress, web3Service, roles]);

    const handleAction = async (role: string, action: 'approve' | 'reject' | 'revoke') => {
        if (!searchAddress || !web3Service) {
            toast.error('Dirección o servicio no disponible');
            return;
        }

        setLoading(true);
        try {
            if (action === 'approve') {
                await web3Service.approveRole(role, searchAddress);
                toast.success('Rol aprobado con éxito');
            } else if (action === 'reject') {
                await web3Service.rejectRole(role, searchAddress);
                toast.success('Rol rechazado con éxito');
            } else if (action === 'revoke') {
                await web3Service.revokeRoleApproval(role, searchAddress);
                toast.success('Rol revocado con éxito');
            }
            // Refresh
            await handleSearch();
            // Refresh global roles
            await refreshRoles();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al procesar acción', { 
                description: errorMessage 
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: RoleStatus) => {
        if (status.account === '0x0000000000000000000000000000000000000000') {
            return <Badge variant="outline">No Solicitado</Badge>;
        }
        switch (status.state) {
            case 0: return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
            case 1: return <Badge variant="default" className="bg-green-100 text-green-800">Aprobado</Badge>;
            case 2: return <Badge variant="destructive">Rechazado</Badge>;
            case 3: return <Badge variant="outline">Cancelado</Badge>;
            default: return <Badge variant="outline">Desconocido</Badge>;
        }
    };

    const getActions = (status: RoleStatus) => {
        const isZeroAddress = status.account === '0x0000000000000000000000000000000000000000';
        if (isZeroAddress) return null;

        if (status.state === 0) { // Pending
            return (
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        onClick={() => handleAction(status.role, 'approve')} 
                        disabled={loading} 
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Check className="w-4 h-4 mr-1" /> Aprobar
                    </Button>
                    <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleAction(status.role, 'reject')} 
                        disabled={loading}
                    >
                        <X className="w-4 h-4 mr-1" /> Rechazar
                    </Button>
                </div>
            );
        }

        if (status.state === 1) { // Approved
            return (
                <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleAction(status.role, 'revoke')} 
                    disabled={loading} 
                    className="text-red-600 hover:bg-red-50"
                >
                    <Ban className="w-4 h-4 mr-1" /> Revocar
                </Button>
            );
        }

        return null;
    };

    if (!isConnected) {
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Gestión de Roles</CardTitle>
            <CardDescription>
              Conecta tu wallet de administrador para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Wallet className="w-12 h-12 text-muted-foreground" />
            <Button
              onClick={async () => {
                try {
                  await connectWallet();
                  toast.success('Wallet conectada correctamente');
                } catch (error) {
                  toast.error('Error al conectar', {
                    description: error instanceof Error ? error.message : 'Usuario rechazó la conexión'
                  });
                }
              }}
              disabled={isLoading}
              className="w-full max-w-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Conectar Wallet
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Gestión de Roles</CardTitle>
                <CardDescription>
                    Busca un usuario por dirección para gestionar sus permisos
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Label htmlFor="search" className="sr-only">Dirección</Label>
                        <Input
                            id="search"
                            placeholder="0x..."
                            value={searchAddress}
                            onChange={(e) => setSearchAddress(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                </div>

                {userStatuses && (
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
                        <h3 className="font-semibold text-sm text-muted-foreground mb-4">Estado de Roles para {searchAddress.slice(0, 6)}...{searchAddress.slice(-4)}</h3>
                        {userStatuses.map((status) => (
                            <div key={status.role} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div className="flex items-center gap-4">
                                    <span className="font-medium w-32">{status.roleName}</span>
                                    {getStatusBadge(status)}
                                </div>
                                <div>
                                    {getActions(status)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
