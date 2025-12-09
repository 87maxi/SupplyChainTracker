"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Factory, 
  HardDrive, 
  Cpu, 
  School, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Calendar,
  Hash,
  X
} from 'lucide-react';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { UserRoleStatus } from '@/lib/types';
import { toast } from 'sonner';

interface RoleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    address: string;
    role: string;
    roleName: string;
    state: number;
    requestTimestamp: number;
    approvalTimestamp?: number;
    approvedBy?: string | null;
  } | null;
}

const roleInfo: Record<string, { name: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  [getRoleConstants().FABRICANTE_ROLE]: { name: 'Fabricante', icon: Factory, color: 'bg-blue-500' },
  [getRoleConstants().AUDITOR_HW_ROLE]: { name: 'Auditor HW', icon: HardDrive, color: 'bg-green-500' },
  [getRoleConstants().TECNICO_SW_ROLE]: { name: 'Técnico SW', icon: Cpu, color: 'bg-orange-500' },
  [getRoleConstants().ESCUELA_ROLE]: { name: 'Escuela', icon: School, color: 'bg-pink-500' }
};

const getStateInfo = (state: number) => {
  switch (state) {
    case 0:
      return { label: 'Pendiente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' };
    case 1:
      return { label: 'Aprobado', icon: CheckCircle, color: 'bg-green-100 text-green-800' };
    case 2:
      return { label: 'Rechazado', icon: XCircle, color: 'bg-red-100 text-red-800' };
    case 3:
      return { label: 'Cancelado', icon: XCircle, color: 'bg-gray-100 text-gray-800' };
    default:
      return { label: 'Desconocido', icon: XCircle, color: 'bg-gray-100 text-gray-800' };
  }
};

export function RoleDetailsModal({ isOpen, onClose, request }: RoleDetailsModalProps) {
  const { web3Service, refreshRoles } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [roleStatus, setRoleStatus] = useState<UserRoleStatus | null>(null);

  useEffect(() => {
    if (isOpen && request && web3Service) {
      fetchRoleStatus();
    }
  }, [isOpen, request, web3Service]);

  const fetchRoleStatus = async () => {
    if (!web3Service || !request) return;
    
    try {
      const status = await web3Service.getRoleStatus(request.role, request.address);
      setRoleStatus(status);
    } catch (error) {
      console.error('Error fetching role status:', error);
      toast.error('Error al obtener detalles del rol');
    }
  };

  const handleApprove = async () => {
    if (!web3Service || !request) return;
    
    setLoading(true);
    try {
      await web3Service.approveRole(request.role, request.address);
      toast.success('Solicitud aprobada correctamente');
      // Don't refresh roles to prevent recursive calls
      await fetchRoleStatus();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al aprobar solicitud', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!web3Service || !request) return;
    
    setLoading(true);
    try {
      await web3Service.rejectRole(request.role, request.address);
      toast.success('Solicitud rechazada correctamente');
      // Don't refresh roles to prevent recursive calls
      await fetchRoleStatus();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al rechazar solicitud', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const roleData = roleInfo[request.role];
  const stateInfo = getStateInfo(request.state);
  const StateIcon = stateInfo.icon;
  const RoleIcon = roleData?.icon || User;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className={`p-2 rounded-lg ${roleData?.color || 'bg-gray-500'} text-white`}>
              <RoleIcon className="w-5 h-5" />
            </div>
            Detalles del Rol
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Rol Solicitado</h3>
              <p className="font-medium">{request.roleName}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Dirección del Usuario</h3>
              <p className="font-mono text-sm break-all">{request.address}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
              <Badge className={`${stateInfo.color} flex items-center gap-1`}>
                <StateIcon className="w-3 h-3" />
                {stateInfo.label}
              </Badge>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha de Solicitud</h3>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p>{new Date(request.requestTimestamp).toLocaleString()}</p>
              </div>
            </div>
            
            {request.approvalTimestamp && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha de Procesamiento</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p>{new Date(request.approvalTimestamp).toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {request.approvedBy && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Procesado por</h3>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="font-mono text-sm">{request.approvedBy}</p>
                </div>
              </div>
            )}
          </div>
          
          {request.state === 0 && (
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Procesando...' : 'Aprobar'}
              </Button>
              <Button 
                onClick={handleReject}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? 'Procesando...' : 'Rechazar'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}