"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { Web3Service, getRoleConstants } from '@/lib/services/Web3Service';
import { isValidAddress } from '@/lib/utils';
import { toast } from 'sonner';

interface UserRoleFormProps {
  onRoleUpdated: () => void;
}

export function UserRoleForm({ onRoleUpdated }: UserRoleFormProps) {
  const { address, isConnected } = useWeb3();
  const [web3Service] = useState(() => new Web3Service());
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    userAddress: '',
    action: 'grant' as 'grant' | 'revoke'
  });

  const roles = [
    { value: getRoleConstants().FABRICANTE_ROLE, label: 'Fabricante' },
    { value: getRoleConstants().AUDITOR_HW_ROLE, label: 'Auditor HW' },
    { value: getRoleConstants().TECNICO_SW_ROLE, label: 'Técnico SW' },
    { value: getRoleConstants().ESCUELA_ROLE, label: 'Escuela' }
  ];

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.role) {
      return 'Por favor selecciona un rol';
    }
    if (!formData.userAddress) {
      return 'Por favor ingresa la dirección del usuario';
    }
    if (!isValidAddress(formData.userAddress)) {
      return 'La dirección Ethereum ingresada no es válida';
    }
    if (formData.userAddress.toLowerCase() === address?.toLowerCase()) {
      return 'No puedes modificar tu propio rol';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      if (formData.action === 'grant') {
        await web3Service.grantRole(formData.role, formData.userAddress);
        toast.success('Rol asignado con éxito', {
          description: `El rol ha sido asignado a la dirección ${formData.userAddress}`
        });
      } else {
        await web3Service.revokeRole(formData.role, formData.userAddress);
        toast.success('Rol revocado con éxito', {
          description: `El rol ha sido revocado de la dirección ${formData.userAddress}`
        });
      }

      setFormData({
        role: '',
        userAddress: '',
        action: 'grant'
      });

      onRoleUpdated();
    } catch (error: unknown) {
      console.error('Error updating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al procesar la solicitud';
      toast.error('Error al actualizar el rol', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Roles</CardTitle>
          <CardDescription>
            Conéctate con tu wallet para gestionar roles en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Necesitas estar conectado para realizar esta acción.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Roles</CardTitle>
          <CardDescription>
            Asigna o revoca roles a usuarios del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="action">Acción</Label>
              <Select
                value={formData.action}
                onValueChange={(value) => handleInputChange('action', value)}
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="Selecciona una acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grant">Asignar Rol</SelectItem>
                  <SelectItem value="revoke">Revocar Rol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userAddress">Dirección del Usuario</Label>
            <Input
              id="userAddress"
              placeholder="0x..."
              value={formData.userAddress}
              onChange={(e) => handleInputChange('userAddress', e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Procesando...' : formData.action === 'grant' ? 'Asignar Rol' : 'Revocar Rol'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}