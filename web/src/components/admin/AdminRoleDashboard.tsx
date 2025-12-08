"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Shield,
  Factory,
  HardDrive,
  Cpu,
  School,
  RefreshCw,
  Eye,
  UserCheck
} from 'lucide-react';

interface RoleRequest {
  id: string;
  address: string;
  role: string;
  roleName: string;
  roleIcon: React.ComponentType<{ className?: string }>;
  state: number;
  requestTimestamp: number;
  approvalTimestamp?: number;
  approvedBy?: string | null;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  approvedToday: number;
  rejectedToday: number;
}

const roleInfo = {
  [getRoleConstants().FABRICANTE_ROLE]: { name: 'Fabricante', icon: Factory, color: 'bg-blue-500' },
  [getRoleConstants().AUDITOR_HW_ROLE]: { name: 'Auditor HW', icon: HardDrive, color: 'bg-green-500' },
  [getRoleConstants().TECNICO_SW_ROLE]: { name: 'Técnico SW', icon: Cpu, color: 'bg-orange-500' },
  [getRoleConstants().ESCUELA_ROLE]: { name: 'Escuela', icon: School, color: 'bg-pink-500' }
};

export function AdminRoleDashboard() {
  const { web3Service, address: adminAddress, refreshRoles } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingRequests: 0,
    approvedToday: 0,
    rejectedToday: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');

  // Fetch all role requests and stats
  const fetchData = useCallback(async () => {
    if (!web3Service) return;

    setLoading(true);
    try {
      // Fetch all pending requests from the contract
      const pendingRequestsData = await web3Service.getAllPendingRoleRequests();

      const roleRequests: RoleRequest[] = pendingRequestsData.map(status => {
        const normalizedRole = status.role.toLowerCase();
        const roleData = roleInfo[normalizedRole as keyof typeof roleInfo];

        return {
          id: `${normalizedRole}-${status.account}`,
          address: status.account,
          role: normalizedRole,
          roleName: roleData?.name || 'Rol Desconocido',
          roleIcon: roleData?.icon || Users,
          state: status.state,
          requestTimestamp: Number(status.approvalTimestamp),
          approvedBy: status.approvedBy
        };
      });

      // Calculate stats based on the requests we found
      const pendingRequests = roleRequests.filter(r => r.state === 0).length;
      const activeUsers = roleRequests.filter(r => r.state === 1).length;
      const totalUsers = roleRequests.length;

      // For demo purposes, we'll set some dummy values for today's stats
      // In a real implementation, you would check the actual approval timestamps
      const approvedToday = roleRequests.filter(r => r.state === 1).length;
      const rejectedToday = roleRequests.filter(r => r.state === 2).length;

      setStats({
        totalUsers,
        activeUsers,
        pendingRequests,
        approvedToday,
        rejectedToday
      });

      setRequests(roleRequests);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Error al cargar los datos de administración');
    } finally {
      setLoading(false);
    }
  }, [web3Service, adminAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter requests based on search and filters
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = searchTerm === '' ||
        request.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.roleName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || request.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || request.state.toString() === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [requests, searchTerm, roleFilter, statusFilter]);

  const handleApprove = async (requestId: string, userAddress: string, role: string) => {
    if (!web3Service) return;

    try {
      await web3Service.approveRole(role, userAddress);
      toast.success('Solicitud aprobada correctamente');

      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? {
              ...req,
              state: 1,
              approvalTimestamp: Date.now(),
              approvedBy: adminAddress
            }
            : req
        )
      );

      setStats(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests - 1,
        activeUsers: prev.activeUsers + 1,
        approvedToday: prev.approvedToday + 1
      }));

      // Refresh global user roles to update the approved user's status
      await refreshRoles();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al aprobar solicitud', {
        description: errorMessage
      });
    }
  };

  const handleReject = async (requestId: string, userAddress: string, role: string) => {
    if (!web3Service) return;

    try {
      await web3Service.rejectRole(role, userAddress);
      toast.success('Solicitud rechazada correctamente');

      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? {
              ...req,
              state: 2,
              approvalTimestamp: Date.now(),
              approvedBy: adminAddress
            }
            : req
        )
      );

      setStats(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests - 1,
        rejectedToday: prev.rejectedToday + 1
      }));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al rechazar solicitud', {
        description: errorMessage
      });
    }
  };

  const getStatusBadge = (state: number) => {
    switch (state) {
      case 0:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>;
      case 1:
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aprobado
        </Badge>;
      case 2:
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Rechazado
        </Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
        <span>Cargando panel de administración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Panel de Administración de Roles
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona todas las solicitudes de roles y permisos del sistema
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-muted-foreground">Total Usuarios</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
              <p className="text-sm text-muted-foreground">Usuarios Activos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingRequests}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.approvedToday}</p>
              <p className="text-sm text-muted-foreground">Aprobados Hoy</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.rejectedToday}</p>
              <p className="text-sm text-muted-foreground">Rechazados Hoy</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant={activeTab === 'pending' ? 'default' : 'outline'}
                onClick={() => setActiveTab('pending')}
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Solicitudes Pendientes ({stats.pendingRequests})
              </Button>
              <Button
                variant={activeTab === 'approved' ? 'default' : 'outline'}
                onClick={() => setActiveTab('approved')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobadas ({stats.activeUsers})
              </Button>
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveTab('all')}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Todas las Solicitudes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por dirección o rol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {Object.entries(roleInfo).map(([role, info]) => (
                    <SelectItem key={role} value={role}>
                      {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="0">Pendiente</SelectItem>
                  <SelectItem value="1">Aprobado</SelectItem>
                  <SelectItem value="2">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content based on active tab */}
        <div className="space-y-6">
          {activeTab === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Solicitudes Pendientes de Aprobación
                </CardTitle>
                <CardDescription>
                  Revisa y aprueba las solicitudes de roles pendientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRequests.filter(r => r.state === 0).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No hay solicitudes pendientes</p>
                    <p className="text-sm">Todas las solicitudes han sido procesadas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.filter(r => r.state === 0).map((request) => (
                      <Card key={request.id} className="border-l-4 border-l-yellow-400">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-lg ${roleInfo[request.role as keyof typeof roleInfo]?.color || 'bg-gray-500'} text-white`}>
                                <request.roleIcon className="w-6 h-6" />
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <h3 className="font-semibold text-lg">{request.roleName}</h3>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {request.address}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>Solicitado: {new Date(request.requestTimestamp).toLocaleDateString()}</span>
                                  {getStatusBadge(request.state)}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(request.id, request.address, request.role)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Aprobar
                              </Button>
                              <Button
                                onClick={() => handleReject(request.id, request.address, request.role)}
                                variant="destructive"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'approved' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Solicitudes Aprobadas
                </CardTitle>
                <CardDescription>
                  Historial de solicitudes aprobadas recientemente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRequests.filter(r => r.state === 1).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No hay solicitudes aprobadas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.filter(r => r.state === 1).map((request) => (
                      <Card key={request.id} className="border-l-4 border-l-green-400">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-lg ${roleInfo[request.role as keyof typeof roleInfo]?.color || 'bg-gray-500'} text-white`}>
                                <request.roleIcon className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{request.roleName}</h3>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {request.address}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span>Aprobado: {request.approvalTimestamp ? new Date(request.approvalTimestamp).toLocaleDateString() : 'N/A'}</span>
                                  {getStatusBadge(request.state)}
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                              Ver Detalles
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'all' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Todas las Solicitudes
                </CardTitle>
                <CardDescription>
                  Historial completo de todas las solicitudes de roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className={`border-l-4 ${request.state === 0 ? 'border-l-yellow-400' :
                      request.state === 1 ? 'border-l-green-400' :
                        'border-l-red-400'
                      }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${roleInfo[request.role as keyof typeof roleInfo]?.color || 'bg-gray-500'} text-white`}>
                              <request.roleIcon className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.roleName}</h3>
                              <p className="text-sm text-muted-foreground font-mono">
                                {request.address}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>Solicitado: {new Date(request.requestTimestamp).toLocaleDateString()}</span>
                                {request.approvalTimestamp && (
                                  <span>Procesado: {new Date(request.approvalTimestamp).toLocaleDateString()}</span>
                                )}
                                {getStatusBadge(request.state)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {request.state === 0 && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(request.id, request.address, request.role)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleReject(request.id, request.address, request.role)}
                                  variant="destructive"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}