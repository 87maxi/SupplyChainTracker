"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Loader2, Factory, HardDrive, Cpu, School, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { UserRoleStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RoleStatus extends UserRoleStatus {
    roleName: string;
    description: string;
}

export function RoleRequest() {
    const { address, isConnected, web3Service } = useWeb3();
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [roleStatuses, setRoleStatuses] = useState<RoleStatus[]>([]);
    const [fetching, setFetching] = useState(true);

    const roles = useMemo(() => [
        {
            value: getRoleConstants().FABRICANTE_ROLE,
            label: 'Fabricante',
            icon: Factory,
            description: 'Registra productos, crea lotes y gestiona la cadena de suministro inicial.'
        },
        {
            value: getRoleConstants().AUDITOR_HW_ROLE,
            label: 'Auditor de Hardware',
            icon: HardDrive,
            description: 'Verifica la integridad física de los dispositivos y certifica componentes.'
        },
        {
            value: getRoleConstants().TECNICO_SW_ROLE,
            label: 'Técnico de Software',
            icon: Cpu,
            description: 'Instala, actualiza y audita el software educativo en los equipos.'
        },
        {
            value: getRoleConstants().ESCUELA_ROLE,
            label: 'Escuela',
            icon: School,
            description: 'Receptora final de los equipos. Confirma recepción y estado.'
        }
    ], []);

    // Create a stable function to fetch statuses
    const fetchStatuses = useCallback(async () => {
        if (!isConnected || !address || !web3Service) return;

        setFetching(true);
        try {
            const statuses = await Promise.all(
                roles.map(async (role) => {
                    const status: UserRoleStatus = await web3Service.getRoleStatus(role.value, address);
                    return {
                        ...status,
                        role: role.value,
                        roleName: role.label,
                        description: role.description
                    } as RoleStatus;
                })
            );
            setRoleStatuses(statuses);
        } catch (error) {
            console.error('Error fetching role statuses:', error);
            toast.error('Error al obtener estados de roles');
        } finally {
            setFetching(false);
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
        setLoadingStates(prev => ({ ...prev, [role]: true }));
        try {
            const txHash = await web3Service.requestRoleApproval(role);
            console.log('Role request transaction hash:', txHash);
            toast.success('Solicitud enviada con éxito', {
                description: `Transacción: ${txHash.slice(0, 10)}...`
            });
            await fetchStatuses();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al enviar solicitud', { description: errorMessage });
        } finally {
            setLoadingStates(prev => ({ ...prev, [role]: false }));
        }
    };

    const handleCancel = async (role: string) => {
        if (!web3Service) {
            toast.error('Error de conexión', { description: 'Web3Service no está disponible.' });
            return;
        }
        setLoadingStates(prev => ({ ...prev, [role]: true }));
        try {
            await web3Service.cancelRoleRequest(role);
            toast.success('Solicitud cancelada con éxito');
            await fetchStatuses();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al cancelar solicitud', { description: errorMessage });
        } finally {
            setLoadingStates(prev => ({ ...prev, [role]: false }));
        }
    };

    const getStatusInfo = (status: RoleStatus) => {
        const isZeroAddress = status.account === '0x0000000000000000000000000000000000000000';

        if (isZeroAddress) {
            return {
                label: 'No Solicitado',
                color: 'text-muted-foreground',
                bgColor: 'bg-muted/50',
                borderColor: 'border-border',
                icon: null
            };
        }

        switch (status.state) {
            case 0: // Pending
                return {
                    label: 'Pendiente de Aprobación',
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    icon: Clock
                };
            case 1: // Approved
                return {
                    label: 'Rol Activo',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    icon: CheckCircle2
                };
            case 2: // Rejected
                return {
                    label: 'Solicitud Rechazada',
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    icon: XCircle
                };
            case 3: // Canceled
                return {
                    label: 'Cancelado',
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    borderColor: 'border-border',
                    icon: XCircle
                };
            default:
                return {
                    label: 'Desconocido',
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    borderColor: 'border-border',
                    icon: null
                };
        }
    };

    if (!isConnected) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Solicitar Roles</h2>
                <p className="text-muted-foreground">
                    Selecciona el rol que mejor se adapte a tu función en la cadena de suministro.
                    Los administradores revisarán tu solicitud.
                </p>
            </div>

            {fetching ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="h-[200px] animate-pulse bg-muted/50" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {roleStatuses.map((status) => {
                        const roleData = roles.find(r => r.value === status.role);
                        const IconComponent = roleData?.icon;
                        const statusInfo = getStatusInfo(status);
                        const StatusIcon = statusInfo.icon;
                        const isLoading = loadingStates[status.role] || false;
                        const isZeroAddress = status.account === '0x0000000000000000000000000000000000000000';

                        return (
                            <Card
                                key={status.role}
                                className={cn(
                                    "relative overflow-hidden transition-all duration-200 hover:shadow-md",
                                    statusInfo.borderColor,
                                    "border-2"
                                )}
                            >
                                <div className={cn("absolute inset-0 opacity-[0.03]", statusInfo.bgColor)} />

                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {IconComponent && (
                                                <div className={cn("p-2.5 rounded-xl bg-background shadow-sm border", statusInfo.borderColor)}>
                                                    <IconComponent className="w-6 h-6 text-primary" />
                                                </div>
                                            )}
                                            <div>
                                                <CardTitle className="text-lg">{status.roleName}</CardTitle>
                                                <div className={cn("flex items-center gap-1.5 mt-1 text-sm font-medium", statusInfo.color)}>
                                                    {StatusIcon && <StatusIcon className="w-4 h-4" />}
                                                    {statusInfo.label}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pb-2">
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {status.description}
                                    </p>
                                </CardContent>

                                <CardFooter className="pt-4">
                                    {(isZeroAddress || status.state === 3) && (
                                        <Button
                                            className="w-full gap-2 group"
                                            onClick={() => handleRequest(status.role)}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>
                                                    Solicitar Acceso
                                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {status.state === 0 && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => handleCancel(status.role)}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancelar Solicitud'}
                                        </Button>
                                    )}

                                    {status.state === 1 && (
                                        <div className="w-full py-2 text-center text-sm font-medium text-green-600 bg-green-50 rounded-md border border-green-100">
                                            Acceso Concedido
                                        </div>
                                    )}

                                    {status.state === 2 && (
                                        <div className="w-full py-2 text-center text-sm font-medium text-red-600 bg-red-50 rounded-md border border-red-100">
                                            Acceso Denegado Permanentemente
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}