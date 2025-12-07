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
import { Web3Service, getRoleConstants } from '@/lib/services/Web3Service';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface RoleStatus {
    role: string;
    roleName: string;
    state: number; // 0: Pending, 1: Approved, 2: Rejected, 3: Canceled
}

export function RoleRequest() {
    const { address, isConnected } = useWeb3();
    const [web3Service] = useState(() => new Web3Service());
    const [loading, setLoading] = useState(false);
    const [roleStatuses, setRoleStatuses] = useState<RoleStatus[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const roles = [
        { value: getRoleConstants().FABRICANTE_ROLE, label: 'Fabricante' },
        { value: getRoleConstants().AUDITOR_HW_ROLE, label: 'Auditor HW' },
        { value: getRoleConstants().TECNICO_SW_ROLE, label: 'Técnico SW' },
        { value: getRoleConstants().ESCUELA_ROLE, label: 'Escuela' }
    ];

    useEffect(() => {
        const fetchStatuses = async () => {
            if (!isConnected || !address) return;

            try {
                const statuses = await Promise.all(
                    roles.map(async (role) => {
                        const status = await web3Service.getRoleStatus(role.value, address) as any;
                        // If state is 0 (Pending) but approvalTimestamp is 0, it means it doesn't exist (default value)
                        // Wait, enum is Pending=0. So default struct value is Pending?
                        // Let's check the contract. 
                        // RoleApproval struct: state is ApprovalState enum.
                        // If mapping doesn't exist, all fields are 0.
                        // So state 0 is Pending.
                        // But we can distinguish "Not Requested" from "Pending" by checking if approvalTimestamp is 0 AND state is 0?
                        // Or maybe we should check if we have the role?
                        // Actually, if a request is made, state is Pending (0).
                        // If it's never been made, it's also 0.
                        // We need a way to know if a request exists.
                        // The contract sets approvalTimestamp to 0 on init? No, struct default is 0.
                        // When requestRoleApproval is called: state=Pending(0), timestamp=0.
                        // Wait, if timestamp is 0, how do we know?
                        // Actually, the contract emits RoleStatusUpdated.
                        // Let's look at `requestRoleApproval`:
                        // roleApprovals[role][msg.sender] = RoleApproval({ ..., state: Pending, approvalTimestamp: 0, ... })
                        // So a "Pending" request has timestamp 0? That's bad design in the contract if we can't distinguish.
                        // BUT, `requestRoleApproval` requires:
                        // require(roleApprovals[role][msg.sender].state == ApprovalState.Pending || roleApprovals[role][msg.sender].state == ApprovalState.Canceled)
                        // Wait, if it's default (0), it IS Pending.
                        // So anyone can "cancel" a non-existent request?
                        // Let's assume for UI:
                        // If state is Pending (0) and we DON'T have the role (AccessControl), it might be "Not Requested" OR "Pending".
                        // Actually, if we use `hasRole`, we know if we are approved.
                        // But `approveRole` sets state to Approved (1).
                        // So:
                        // State 1: Approved.
                        // State 2: Rejected.
                        // State 3: Canceled.
                        // State 0: Pending (or Not Requested).

                        // For this UI, we will assume State 0 is "Available to Request" if we don't have the role?
                        // But if we requested it, it's also 0.
                        // This is tricky.
                        // Let's assume the user knows if they requested it?
                        // Or maybe we can check if `account` in the struct is non-zero?
                        // If `roleApprovals[role][account].account` is address(0), then it doesn't exist.
                        return {
                            role: role.value,
                            roleName: role.label,
                            state: Number(status.state),
                            account: status.account
                        };
                    })
                );
                setRoleStatuses(statuses);
            } catch (error) {
                console.error('Error fetching role statuses:', error);
            }
        };

        fetchStatuses();
    }, [isConnected, address, web3Service, refreshKey]);

    const handleRequest = async (role: string) => {
        setLoading(true);
        try {
            await web3Service.requestRoleApproval(role);
            toast.success('Solicitud enviada con éxito');
            setRefreshKey(prev => prev + 1);
        } catch (error: any) {
            toast.error('Error al enviar solicitud', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (role: string) => {
        setLoading(true);
        try {
            await web3Service.cancelRoleRequest(role);
            toast.success('Solicitud cancelada con éxito');
            setRefreshKey(prev => prev + 1);
        } catch (error: any) {
            toast.error('Error al cancelar solicitud', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: any) => {
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

    const getAction = (status: any) => {
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

        // If Approved (1) or Rejected (2), no action (or maybe re-request if rejected? contract might not allow)
        // Contract says: require(state == Pending || state == Canceled) for requestRoleApproval.
        // So if Rejected, user is stuck?
        // Let's check contract:
        // require(state == Pending || state == Canceled)
        // So if Rejected, they CANNOT request again.
        // This seems to be a strict contract rule.
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
                    Gestiona tus permisos para acceder a funciones avanzadas
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {roleStatuses.map((status) => (
                        <div key={status.role} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex flex-col">
                                <span className="font-medium">{status.roleName}</span>
                                <div className="mt-1">{getStatusBadge(status)}</div>
                            </div>
                            <div>
                                {getAction(status)}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
