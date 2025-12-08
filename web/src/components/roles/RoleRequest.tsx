"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Loader2, Factory, HardDrive, Cpu, School } from 'lucide-react';
import { UserRoleStatus } from '@/lib/types';

interface RoleStatus extends UserRoleStatus {
    roleName: string;
}

export function RoleRequest() {
    const { address, isConnected, web3Service } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [roleStatuses, setRoleStatuses] = useState<RoleStatus[]>([]);

    const roles = useMemo(() => [
        { value: getRoleConstants().FABRICANTE_ROLE, label: 'Fabricante', icon: Factory },
        { value: getRoleConstants().AUDITOR_HW_ROLE, label: 'Auditor HW', icon: HardDrive },
        { value: getRoleConstants().TECNICO_SW_ROLE, label: 'Técnico SW', icon: Cpu },
        { value: getRoleConstants().ESCUELA_ROLE, label: 'Escuela', icon: School }
    ], []);

    // Create a stable function to fetch statuses
    const fetchStatuses = useCallback(async () => {
        if (!isConnected || !address || !web3Service) return;

        try {
            const statuses = await Promise.all(
                roles.map(async (role) => {
                    const status: UserRoleStatus = await web3Service.getRoleStatus(role.value, address);
                    return {
                        ...status,
                        roleName: role.label,
                    } as RoleStatus;
                })
            );
            setRoleStatuses(statuses);
        } catch (error) {
            console.error('Error fetching role statuses:', error);
            toast.error('Error al obtener estados de roles');
        }
    }, [isConnected, address, web3Service, roles]);

    useEffect(() => {
        fetchStatuses();
    }, [fetchStatuses]);

    const handleRequest = async (role: string) => {
        if (!web3Service) {
            toast.error('Error de conexión', { description: 'Web3Service no está disponible.' });
            return;
        }
        setLoading(true);
        try {
            await web3Service.requestRoleApproval(role);
            toast.success('Solicitud enviada con éxito');
            // Refresh the statuses
            await fetchStatuses();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al enviar solicitud', { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (role: string) => {
        if (!web3Service) {
            toast.error('Error de conexión', { description: 'Web3Service no está disponible.' });
            return;
        }
        setLoading(true);
        try {
            await web3Service.cancelRoleRequest(role);
            toast.success('Solicitud cancelada con éxito');
            // Refresh the statuses
            await fetchStatuses();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al cancelar solicitud', { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: RoleStatus) => {
        // If account is 0x0, it means no request exists
        if (status.account === '0x0000000000000000000000000000000000000000') {
            return <Badge variant="outline">No Solicitado</Badge>;
        }

        switch (status.state) {
            case 0: // Pending
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
            case 1: // Approved
                return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Aprobado</Badge>;
            case 2: // Rejected
                return <Badge variant="destructive">Rechazado</Badge>;
            case 3: // Canceled
                return <Badge variant="outline" className="text-muted-foreground">Cancelado</Badge>;
            default:
                return <Badge variant="outline">Desconocido</Badge>;
        }
    };

    const getAction = (status: RoleStatus) => {
        const isZeroAddress = status.account === '0x0000000000000000000000000000000000000000';

        // If not requested (zero address) or Canceled (3), show Request button
        if (isZeroAddress || status.state === 3) {
            return (
                <Button size="sm" onClick={() => handleRequest(status.role)} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Solicitar'}
                </Button>
            );
        }

        // If Pending (0), show Cancel button
        if (status.state === 0) {
            return (
                <Button size="sm" variant="outline" onClick={() => handleCancel(status.role)} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancelar'}
                </Button>
            );
        }

        // If Approved (1) or Rejected (2), no action
        // According to the contract, rejected users cannot request again
        if (status.state === 2) {
            return <span className="text-xs text-red-500 font-medium">Acceso Denegado Permanente</span>;
        }

        return null;
    };

    if (!isConnected) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mis Solicitudes de Rol</CardTitle>
                <CardDescription>
                    Gestiona tus permisos para acceder a funciones avanzadas del sistema
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {roleStatuses.map((status) => {
                        const roleData = roles.find(r => r.value === status.role);
                        const IconComponent = roleData?.icon;

                        return (
                            <div key={status.role} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    {IconComponent && (
                                        <div className="p-2 bg-muted rounded-lg">
                                            <IconComponent className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-medium">{status.roleName}</span>
                                        <div className="mt-1">{getStatusBadge(status)}</div>
                                    </div>
                                </div>
                                <div>
                                    {getAction(status)}
                                </div>
                            </div>
                        );
                    })}
                    {roleStatuses.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No tienes solicitudes de rol activas.</p>
                            <p className="text-sm mt-1">Usa el onboarding para solicitar un rol.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}