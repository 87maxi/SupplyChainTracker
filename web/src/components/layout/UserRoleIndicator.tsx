"use client";

import { useWeb3 } from '@/lib/contexts/Web3Context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, Crown } from 'lucide-react';

const roleColors = {
  'Admin Principal': 'bg-purple-100 text-purple-800 border-purple-200',
  'Fabricante': 'bg-blue-100 text-blue-800 border-blue-200',
  'Auditor HW': 'bg-green-100 text-green-800 border-green-200',
  'Técnico SW': 'bg-orange-100 text-orange-800 border-orange-200',
  'Escuela': 'bg-pink-100 text-pink-800 border-pink-200',
};

export function UserRoleIndicator() {
  const { address, isConnected, isAdmin, isDefaultAdmin } = useWeb3();

  if (!isConnected || !address) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Conecta tu wallet para ver tus permisos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Mis Permisos
        </CardTitle>
        <CardDescription>
          Dirección: {address.slice(0, 6)}...{address.slice(-4)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isDefaultAdmin && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <Crown className="w-5 h-5 text-purple-600" />
              <div>
                <Badge className={`${roleColors['Admin Principal']} font-medium`}>
                  Admin Principal
                </Badge>
                <p className="text-xs text-purple-700 mt-1">
                  Control total del sistema
                </p>
              </div>
            </div>
          )}

          {isAdmin && !isDefaultAdmin && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <Badge className={`${roleColors['Admin Principal']} font-medium`}>
                  Usuario con Roles
                </Badge>
                <p className="text-xs text-blue-700 mt-1">
                  Acceso a funciones específicas
                </p>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <Badge variant="outline" className="font-medium">
                  Usuario Regular
                </Badge>
                <p className="text-xs text-gray-700 mt-1">
                  Acceso limitado - solicita roles para más funciones
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}