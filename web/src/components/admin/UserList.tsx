"use client";

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { getRoleName, formatDate } from '@/lib/utils';
import { UserRoleStatus } from '@/lib/types';

export function UserList() {
  const { isConnected, address, web3Service } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRoleStatus[]>([]);

  const roles = useMemo(() => [
    getRoleConstants().FABRICANTE_ROLE,
    getRoleConstants().AUDITOR_HW_ROLE,
    getRoleConstants().TECNICO_SW_ROLE,
    getRoleConstants().ESCUELA_ROLE
  ], []);

useEffect(() => {
    const fetchUsers = async () => {
      if (!isConnected || !address || !web3Service) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const usersWithRoles: UserRoleStatus[] = [];

        // Check for pending requests by listening to events or checking common addresses
        // For now, we'll check the connected user's address
        for (const role of roles) {
          try {
            const status = await web3Service.getRoleStatus(role, address);
            if (status.state > 0 && status.account !== '0x0000000000000000000000000000000000000000') { // Only add if approved and account is valid
              usersWithRoles.push({
                role,
                account: status.account,
                state: Number(status.state),
                approvalTimestamp: status.approvalTimestamp,
                approvedBy: status.approvedBy
              });
            }
          } catch (error) {
            // Log error but continue with other roles
            console.error(`Error fetching status for role ${role}:`, error);
            continue;
          }
        }

        setUsers(usersWithRoles);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isConnected, address, web3Service, roles]);

  // Remove auto-refresh to prevent excessive requests

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Conéctate con tu wallet para ver la lista de usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Necesitas estar conectado para ver esta información.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios del Sistema</CardTitle>
        <CardDescription>
          Lista de usuarios con roles asignados en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : users.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dirección</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Asignado por</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">
                    {user.account}
                  </TableCell>
                  <TableCell>{getRoleName(user.role)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Aprobado
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {user.approvedBy}
                  </TableCell>
                  <TableCell>{formatDate(Number(user.approvalTimestamp))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No hay usuarios con roles asignados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}