"use client";

import { useState, useEffect } from 'react';
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
import { Loader2, Check, X, UserPlus, Factory, HardDrive, Cpu, School, Info } from 'lucide-react';


// ApprovalState enum values
const APPROVAL_STATES = {
    PENDING: 0,
    APPROVED: 1,
    REJECTED: 2,
    CANCELED: 3
};

// Role constants
const roleConstants = getRoleConstants();

// Mapping of role hashes to readable names and icons
const roleInfo: Record<string, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
    [roleConstants.FABRICANTE_ROLE]: { name: 'Fabricante', icon: Factory },
    [roleConstants.AUDITOR_HW_ROLE]: { name: 'Auditor HW', icon: HardDrive },
    [roleConstants.TECNICO_SW_ROLE]: { name: 'Técnico SW', icon: Cpu },
    [roleConstants.ESCUELA_ROLE]: { name: 'Escuela', icon: School }
};

interface RoleRequest {
    role: string;
    roleName: string;
    account: string;
    state: number;
    requestTimestamp: number;
}

export function RoleApproval() {
    const { isConnected, address, web3Service } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<Record<string, RoleRequest[]>>({});
    const [activeUsers, setActiveUsers] = useState<Record<string, {role: string, roleName: string, account: string}[]>>({});

// Initialize component state
    useEffect(() => {
        if (!isConnected) {
            setPendingRequests({});
            setActiveUsers({});
        }
    }, [isConnected]);

    // Fetch role status for all addresses and roles
    useEffect(() => {
        if (!isConnected || !address || !web3Service) {
            setLoading(false);
            return;
        }

        const fetchAllStatuses = async () => {
            setLoading(true);
            try {
                const pending: Record<string, RoleRequest[]> = {};
                const active: Record<string, {role: string, roleName: string, account: string}[]> = {};

                const roles = [
                    roleConstants.FABRICANTE_ROLE,
                    roleConstants.AUDITOR_HW_ROLE,
                    roleConstants.TECNICO_SW_ROLE,
                    roleConstants.ESCUELA_ROLE
                ];

                // Check for pending requests by listening to events or checking common addresses
                // For now, we'll check the connected user's address
                for (const role of roles) {
                    try {
                        const status = await web3Service.getRoleStatus(role, address);

                        // Only process if account is not zero address
                        if (status.account !== '0x0000000000000000000000000000000000000000') {
                            const roleData = roleInfo[role];

                            if (status.state === APPROVAL_STATES.PENDING) {
                                pending[address] = pending[address] || [];
                                pending[address].push({
                                    role,
                                    roleName: roleData.name,
                                    account: address,
                                    state: Number(status.state),
                                    requestTimestamp: Number(status.approvalTimestamp)
                                });
                            } else if (status.state === APPROVAL_STATES.APPROVED) {
                                active[address] = active[address] || [];
                                active[address].push({
                                    role: role,
                                    roleName: roleData.name,
                                    account: address
                                });
                            }
                        }
                    } catch (error) {
                        // Log error but continue with other roles
                        console.error(`Error fetching status for role ${role}:`, error);
                        continue;
                    }
                }

                setPendingRequests(pending);
                setActiveUsers(active);

            } catch (error) {
                console.error('Error fetching all statuses:', error);
                toast.error('Error al cargar estados de roles');
            } finally {
                setLoading(false);
            }
        };

        fetchAllStatuses();
    }, [isConnected, address, web3Service]);

    const handleApprove = async (account: string, role: string, roleName: string) => {
        if (!web3Service) {
            toast.error('Servicio Web3 no disponible');
            return;
        }

        setLoading(true);
        try {
            await web3Service.approveRole(role, account);
            toast.success('Solicitud aprobada', {
                description: `Rol ${roleName} aprobado para ${account}`
            });
            // Refresh data
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al aprobar solicitud', { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (account: string, role: string, roleName: string) => {
        if (!web3Service) {
            toast.error('Servicio Web3 no disponible');
            return;
        }

        setLoading(true);
        try {
            await web3Service.rejectRole(role, account);
            toast.success('Solicitud rechazada', {
                description: `Rol ${roleName} rechazado para ${account}`
            });
            // Refresh data
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al rechazar solicitud', { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Aprobación de Roles</CardTitle>
                    <CardDescription>
                        Gestiona las solicitudes pendientes de asignación de roles
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    )}
                    
                    {!loading && Object.keys(pendingRequests).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay solicitudes pendientes
                        </div>
                    )}
                    
                    {!loading && Object.keys(pendingRequests).length > 0 && (
                        <div className="space-y-4">
                            {Object.entries(pendingRequests).map(([address, requests]) => (
                                <div key={address} className="border rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <UserPlus className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-medium">{address.slice(0, 6)}...{address.slice(-4)}</h3>
                                        <Badge variant="secondary" className="ml-auto">
                                            {requests.length} solicitud{requests.length > 1 ? 'es' : ''}
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {requests.map((request) => {
                                            const roleData = roleInfo[request.role];
                                            const IconComponent = roleData?.icon;

                                            return (
                                                <div key={`${request.role}-${request.account}`} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                                                    <div className="flex items-center gap-3">
                                                        {IconComponent && (
                                                            <div className="p-2 bg-white rounded-lg border">
                                                                <IconComponent className="w-5 h-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium">{request.roleName}</div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Info className="w-3 h-3" />
                                                                Solicitado: {new Date(request.requestTimestamp * 1000).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(request.account, request.role, request.roleName)}
                                                            disabled={loading}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            <Check className="w-4 h-4 mr-1" /> Aprobar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleReject(request.account, request.role, request.roleName)}
                                                            disabled={loading}
                                                        >
                                                            <X className="w-4 h-4 mr-1" /> Rechazar
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Usuarios Activos</CardTitle>
                    <CardDescription>
                        Usuarios con roles aprobados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!loading && Object.keys(activeUsers).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay usuarios con roles aprobados
                        </div>
                    )}
                    
                    {!loading && Object.keys(activeUsers).length > 0 && (
                        <div className="space-y-4">
                            {Object.entries(activeUsers).map(([address, userRoles]) => (
                                <div key={address} className="border rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-green-600" />
                                        </div>
                                        <h3 className="font-medium">{address.slice(0, 6)}...{address.slice(-4)}</h3>
                                        <Badge variant="default" className="ml-auto bg-green-100 text-green-800">
                                            Activo
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {userRoles.map((userRole) => {
                                            const roleData = roleInfo[userRole.role];
                                            const IconComponent = roleData?.icon;

                                            return (
                                                <Badge key={`${userRole.role}-${userRole.account}`} variant="outline" className="flex items-center gap-1">
                                                    {IconComponent && <IconComponent className="w-3 h-3" />}
                                                    {userRole.roleName}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}