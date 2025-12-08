"use client";

import { useEffect, useState, useMemo } from 'react';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'approved' | 'rejected' | 'pending';
  role: string;
  roleName: string;
  timestamp: number;
  message: string;
}

export function RoleNotifications() {
  const { address, isConnected, web3Service } = useWeb3();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const roles = useMemo(() => ({
    [getRoleConstants().FABRICANTE_ROLE]: 'Fabricante',
    [getRoleConstants().AUDITOR_HW_ROLE]: 'Auditor HW',
    [getRoleConstants().TECNICO_SW_ROLE]: 'Técnico SW',
    [getRoleConstants().ESCUELA_ROLE]: 'Escuela'
  }), []);

  useEffect(() => {
    const checkNotifications = async () => {
      if (!isConnected || !address || !web3Service) return;

      setLoading(true);
      try {
        const newNotifications: NotificationItem[] = [];

        for (const [roleHash, roleName] of Object.entries(roles)) {
          try {
            const status = await web3Service.getRoleStatus(roleHash, address);

            // Only show notifications for accounts that have made requests
            if (status.account !== '0x0000000000000000000000000000000000000000') {
              const notificationId = `${roleHash}-${status.state}`;

              if (status.state === 1) { // Approved
                newNotifications.push({
                  id: notificationId,
                  type: 'approved',
                  role: roleHash,
                  roleName,
                  timestamp: Number(status.approvalTimestamp),
                  message: `Tu solicitud para el rol de ${roleName} ha sido aprobada.`
                });
              } else if (status.state === 2) { // Rejected
                newNotifications.push({
                  id: notificationId,
                  type: 'rejected',
                  role: roleHash,
                  roleName,
                  timestamp: Number(status.approvalTimestamp),
                  message: `Tu solicitud para el rol de ${roleName} ha sido rechazada.`
                });
              } else if (status.state === 0) { // Pending
                newNotifications.push({
                  id: notificationId,
                  type: 'pending',
                  role: roleHash,
                  roleName,
                  timestamp: Number(status.approvalTimestamp),
                  message: `Tu solicitud para el rol de ${roleName} está pendiente de aprobación.`
                });
              }
            }
          } catch (error) {
            console.error(`Error checking role ${roleName}:`, error);
          }
        }

        // Sort by timestamp (most recent first)
        newNotifications.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(newNotifications);
      } catch (error) {
        console.error('Error checking notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    checkNotifications();
  }, [isConnected, address, web3Service, roles]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  if (!isConnected) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
          <span>Cargando notificaciones...</span>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Aquí aparecerán las actualizaciones sobre tus solicitudes de rol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay notificaciones nuevas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificaciones
          {notifications.filter(n => n.type === 'pending').length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {notifications.filter(n => n.type === 'pending').length} pendiente{notifications.filter(n => n.type === 'pending').length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Estado de tus solicitudes de rol
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{notification.roleName}</h4>
                  {getNotificationBadge(notification.type)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {notifications.some(n => n.type === 'rejected') && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-800">Solicitudes Rechazadas</span>
            </div>
            <p className="text-sm text-red-700">
              Si tu solicitud fue rechazada, puedes contactar al administrador para más información
              o intentar solicitar un rol diferente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}