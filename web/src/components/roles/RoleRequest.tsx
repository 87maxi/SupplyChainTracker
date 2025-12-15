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
import { Loader2, Factory, HardDrive, Cpu, School, CheckCircle2, XCircle, Clock, ArrowRight, Mail } from 'lucide-react';
import { UserRoleStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useWeb3Validation } from '@/lib/hooks/useWeb3Validation';

interface RoleStatus extends UserRoleStatus {
    roleName: string;
    description: string;
    lastTransactionHash?: string;
    lastTransactionTimestamp?: number;
}

export function RoleRequest() {
    const { address, isConnected, web3Service } = useWeb3();
    const { isNetworkValid } = useWeb3Validation();
    
    // Network validation function
    const validateNetwork = useCallback(async (): Promise<boolean> => {
        if (isNetworkValid === false) {
            toast.error('Red Incorrecta', {
                description: 'Por favor, cambie a la red local o configurada para continuar.',
                duration: 10000,
            });
            return false;
        }
        
        if (isNetworkValid === null) {
            toast.loading('Verificando red...', {
                description: 'Por favor espere mientras verificamos su conexión.',
            });
            return false;
        }
        
        return true;
    }, [isNetworkValid]);

    // Scroll to this component when mounted (for navigation from dashboard)
    useEffect(() => {
        if (window.location.hash === '#role-request') {
            const element = document.getElementById('role-request');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, []);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [roleStatuses, setRoleStatuses] = useState<RoleStatus[]>([]);
    const [fetching, setFetching] = useState(true);
    const [showContactModal, setShowContactModal] = useState(false);

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

    const [dynamicRoles, setDynamicRoles] = useState<Array<{
        value: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
        description: string;
    }>>(roles);

    // Create a stable function to fetch statuses
    const fetchStatuses = useCallback(async () => {
        if (!isConnected || !address || !web3Service) return;

        setFetching(true);
        try {
            const roleConstants = getRoleConstants();
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

    // Set up periodic refresh for role status updates
    useEffect(() => {
        if (!web3Service) return;

        // Refresh roles every 30 seconds to catch any changes
        const refreshInterval = setInterval(() => {
            fetchStatuses();
        }, 30000);

        return () => {
            clearInterval(refreshInterval);
        };
    }, [web3Service, fetchStatuses]);

    useEffect(() => {
        fetchStatuses();
    }, [fetchStatuses]);

    const handleRequest = async (role: string) => {
        if (!web3Service) {
            toast.error('Error de conexión', { description: 'Web3Service no está disponible.' });
            return;
        }

        // Check network validation
        const networkValid = await validateNetwork();
        if (!networkValid) {
            return;
        }

        // Pre-validation: check current status before attempting transaction
        const currentStatus = roleStatuses.find(s => s.role === role);

        if (currentStatus?.state === 1) {
            toast.error('Rol ya aprobado', {
                description: 'Ya tienes este rol aprobado.'
            });
            return;
        }

        setLoadingStates(prev => ({ ...prev, [role]: true }));

        try {
            // In the simplified system, users cannot request roles directly
            // Show informational message instead
            toast.info('Solicitud de Rol', {
                description: 'Los roles deben ser otorgados por un administrador. Contacta al administrador del sistema para solicitar acceso a este rol.',
                duration: 8000,
                icon: 'ℹ️'
            });

            // Simulate a small delay for UX
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: unknown) {
            console.error('Error requesting role:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

            toast.error('Error en la solicitud', {
                description: `No se pudo procesar la solicitud. \n${errorMessage}`,
                duration: 5000,
                icon: '❌'
            });
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
            // In the simplified system, there are no role requests to cancel
            toast.info('Cancelación de Solicitud', {
                description: 'No hay solicitudes de rol pendientes para cancelar en el sistema simplificado.',
                duration: 5000,
                icon: 'ℹ️'
            });

            // Simulate a small delay for UX
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: unknown) {
            console.error('Error canceling role:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

            toast.error('Error al cancelar solicitud', {
                description: errorMessage,
                duration: 5000
            });
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
            case 0: // Not approved
                return {
                    label: 'Sin Acceso',
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    icon: XCircle
                };
            case 1: // Approved
                return {
                    label: 'Rol Activo',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    icon: CheckCircle2
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
        <div id="role-request" className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Gestión de Roles</h2>
                <p className="text-muted-foreground">
                    Consulta el estado de tus roles en el sistema. Los roles deben ser otorgados 
                    por administradores del sistema. Contacta a un administrador para solicitar acceso.
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
                        const roleData = dynamicRoles.find(r => r.value === status.role);
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
                                                    Solicitar Acceso a Admin
                                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {status.state === 0 && (
                                        <div className="w-full py-2 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded-md border border-blue-100 flex items-center justify-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Esperando Aprobación de Admin
                                        </div>
                                    )}

                                    {status.state === 1 && (
                                        <div className="w-full py-2 text-center text-sm font-medium text-green-600 bg-green-50 rounded-md border border-green-100 flex items-center justify-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Acceso Concedido
                                        </div>
                                    )}


                                    
                                    {/* Transaction history */}
                                    {status.lastTransactionHash && (
                                        <div className="text-xs text-muted-foreground mt-2">
                                            Última transacción: 
                                            <a 
                                                href={`https://$${window.location.hostname}/tx/$${status.lastTransactionHash}`} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                $${status.lastTransactionHash.slice(0, 6)}...$${status.lastTransactionHash.slice(-4)}
                                            </a>
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