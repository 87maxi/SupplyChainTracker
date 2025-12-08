"use client";

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { getRoleConstants } from '@/lib/services/Web3Service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  UserPlus,
  Factory,
  HardDrive,
  Cpu,
  School,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface RoleOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requirements: string;
  responsibilities: string[];
}

const roleOptions: RoleOption[] = [
  {
    id: getRoleConstants().FABRICANTE_ROLE,
    name: 'Fabricante',
    description: 'Responsable de registrar nuevas netbooks en el sistema',
    icon: Factory,
    requirements: 'Empresa fabricante de netbooks educativas',
    responsibilities: [
      'Registrar netbooks con números de serie únicos',
      'Proporcionar especificaciones técnicas',
      'Asegurar trazabilidad desde fabricación'
    ]
  },
  {
    id: getRoleConstants().AUDITOR_HW_ROLE,
    name: 'Auditor de Hardware',
    description: 'Verifica la integridad del hardware de las netbooks',
    icon: HardDrive,
    requirements: 'Especialista en hardware certificado',
    responsibilities: [
      'Inspeccionar componentes físicos',
      'Validar especificaciones técnicas',
      'Generar reportes de auditoría'
    ]
  },
  {
    id: getRoleConstants().TECNICO_SW_ROLE,
    name: 'Técnico de Software',
    description: 'Instala y valida el software en las netbooks',
    icon: Cpu,
    requirements: 'Técnico especializado en software educativo',
    responsibilities: [
      'Instalar sistema operativo',
      'Configurar aplicaciones educativas',
      'Validar funcionamiento del software'
    ]
  },
  {
    id: getRoleConstants().ESCUELA_ROLE,
    name: 'Escuela',
    description: 'Recibe y administra las netbooks para estudiantes',
    icon: School,
    requirements: 'Institución educativa registrada',
    responsibilities: [
      'Recibir netbooks asignadas',
      'Distribuir a estudiantes',
      'Reportar estado de equipos'
    ]
  }
];

export function NewUserOnboarding() {
  const { address, isConnected, web3Service } = useWeb3();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRoleName, setPendingRoleName] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'welcome' | 'select-role' | 'confirm' | 'submitted'>('welcome');

  // Check if user has any pending requests
  useEffect(() => {
    const checkExistingRequests = async () => {
      if (!isConnected || !address || !web3Service) return;

      try {
        // Find the first pending request
        for (const role of roleOptions) {
          try {
            const status = await web3Service.getRoleStatus(role.id, address);
            // Check if there's a pending request (state === 0) and the account is not zero address
            if (status.state === 0 && status.account !== '0x0000000000000000000000000000000000000000') {
              setPendingRoleName(role.name);
              return; // Stop after finding the first one
            }
          } catch (error) {
            console.error(`Error checking status for ${role.name}:`, error);
          }
        }
        setPendingRoleName(null);
      } catch (error) {
        console.error('Error checking existing requests:', error);
      }
    };

    checkExistingRequests();
  }, [isConnected, address, web3Service]);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setCurrentStep('confirm');
  };

  const handleSubmitRequest = async () => {
    if (!selectedRole || !web3Service) return;

    setIsSubmitting(true);
    setTransactionHash(null);
    try {
      // Check current status before submitting request
      const currentStatus = await web3Service.getRoleStatus(selectedRole, address || '');

      // Only allow requesting if no previous request or if canceled
      if (currentStatus.account !== '0x0000000000000000000000000000000000000000' &&
        currentStatus.state !== 3) { // 3 = Canceled
        toast.error('No puedes solicitar este rol', {
          description: 'Ya tienes una solicitud pendiente o aprobada para este rol.'
        });
        setIsSubmitting(false);
        return;
      }

      const txHash = await web3Service.requestRoleApproval(selectedRole);
      setTransactionHash(txHash);

      toast.success('Solicitud enviada correctamente', {
        description: `Transacción: ${txHash.slice(0, 10)}...`
      });
      setCurrentStep('submitted');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al enviar solicitud', { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setSelectedRole(null);
    setTransactionHash(null);
    setCurrentStep('welcome');
  };

  if (pendingRoleName) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Clock className="w-5 h-5" />
            Solicitud Pendiente
          </CardTitle>
          <CardDescription className="text-orange-700">
            Ya tienes una solicitud de rol pendiente de aprobación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-orange-100 rounded-lg border border-orange-200">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Solicitud para: <span className="font-bold">{pendingRoleName}</span>
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Tu solicitud está siendo revisada por un administrador. Recibirás una notificación cuando sea aprobada o rechazada.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 'welcome') {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-blue-900">
            ¡Bienvenido a SupplyChainTracker!
          </CardTitle>
          <CardDescription className="text-blue-700">
            Para comenzar, necesitas solicitar un rol específico en el sistema.
            Selecciona el rol que mejor describe tu función.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={() => setCurrentStep('select-role')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Comenzar Solicitud de Rol
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 'select-role') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Selecciona tu Rol
          </CardTitle>
          <CardDescription>
            Elige el rol que mejor describe tu función en el sistema de trazabilidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {roleOptions.map((role) => (
              <Card
                key={role.id}
                className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-blue-200"
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <role.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{role.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {role.description}
                      </p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Requisitos:
                          </p>
                          <p className="text-xs">{role.requirements}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Responsabilidades:
                          </p>
                          <ul className="text-xs space-y-1">
                            {role.responsibilities.map((resp, index) => (
                              <li key={index} className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {resp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 'confirm') {
    const selectedRoleData = roleOptions.find(r => r.id === selectedRole);

    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Confirmar Solicitud
          </CardTitle>
          <CardDescription className="text-green-700">
            Revisa los detalles antes de enviar tu solicitud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedRoleData && (
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <selectedRoleData.icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">{selectedRoleData.name}</h3>
                  <p className="text-sm text-green-700">{selectedRoleData.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Rol Solicitado
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Dirección:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                  <p><strong>Estado:</strong> Pendiente de aprobación</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('select-role')}
              className="flex-1"
            >
              Cambiar Rol
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 'submitted') {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-800">
            ¡Solicitud Enviada!
          </CardTitle>
          <CardDescription className="text-green-700">
            Tu solicitud de rol ha sido enviada correctamente y está pendiente de aprobación.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-white rounded-lg border border-green-200 text-left">
            <p className="text-sm text-green-800 font-medium mb-2">Detalles de la transacción:</p>
            {transactionHash ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded border">
                <span className="font-mono truncate">{transactionHash}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Procesando transacción...</p>
            )}
            <p className="text-sm text-muted-foreground mt-3">
              Un administrador revisará tu solicitud. Recibirás una notificación cuando sea aprobada.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleStartOver}
            className="w-full"
          >
            Solicitar Otro Rol
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}