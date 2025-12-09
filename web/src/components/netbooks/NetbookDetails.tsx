"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getNetbookStateInfo, formatDate } from '@/lib/utils';
import { CheckCircle, Circle, Package, Wrench, Code, User } from 'lucide-react';

import { Netbook } from '@/lib/types';
import { useState } from 'react';

interface NetbookDetailsProps {
  netbook: Netbook;
}

export function NetbookDetails({ netbook }: NetbookDetailsProps) {
  if (!netbook) return null;

  const stateInfo = getNetbookStateInfo(Number(netbook.state));
  const progressValue = ((Number(netbook.state) + 1) / 4) * 100;

  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps = [
    { id: 0, label: 'Fabricada', icon: Package, completed: Number(netbook.state) >= 0 },
    { id: 1, label: 'HW Auditado', icon: Wrench, completed: Number(netbook.state) >= 1 },
    { id: 2, label: 'SW Validado', icon: Code, completed: Number(netbook.state) >= 2 },
    { id: 3, label: 'Distribuida', icon: User, completed: Number(netbook.state) >= 3 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles de la Netbook</CardTitle>
        <CardDescription>Información completa del dispositivo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Progreso del Ciclo de Vida</h3>
            <Badge variant={Number(netbook.state) === 3 ? "default" : "secondary"}>
              {stateInfo.label}
            </Badge>
          </div>
          <Progress value={progressValue} className="w-full" />
<div className="relative pt-6 pb-8">
  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2">
    <div 
      className="h-full bg-primary transition-all duration-500" 
      style={{ width: `${progressValue}%` }}
    />
  </div>
  
  <div className="relative flex justify-between">
    {steps.map((step) => (
      <div key={step.id} className="flex flex-col items-center gap-2">
        <button 
          onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100'} ${expandedStep === step.id ? 'ring-4 ring-primary/30' : ''}`}
        >
          {step.completed ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <step.icon className="w-4 h-4" />
          )}
        </button>
        <span className={`text-xs ${step.completed ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
          {step.label}
        </span>
        
        {expandedStep === step.id && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 p-4 bg-white border rounded-lg shadow-lg z-10 max-w-md min-w-48">
            {/* Contenido detallado de cada paso */}
            {step.id === 0 && netbook.initialModelSpecs && (
              <div>
                <h4 className="font-medium mb-2">Especificaciones iniciales</h4>
                <p>{netbook.initialModelSpecs}</p>
              </div>
            )}
            {step.id === 1 && (
              <div>
                <h4 className="font-medium mb-2">Auditoría de Hardware</h4>
                <p className="text-sm text-muted-foreground">Realizada por: <span className="font-mono">{netbook.hwAuditor}</span></p>
                <p className="text-sm mt-2">Resultado: 
                  <Badge variant={netbook.hwIntegrityPassed ? "default" : "destructive"} className="ml-2">
                    {netbook.hwIntegrityPassed ? "Aprobado" : "Reprobado"}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground mt-2 break-all">Reporte (Hash): <span className="font-mono">{netbook.hwReportHash}</span></p>
              </div>
            )}
            {step.id === 2 && netbook.osVersion && (
              <div>
                <h4 className="font-medium mb-2">Validación de Software</h4>
                <p className="text-sm text-muted-foreground">Instalado por: <span className="font-mono">{netbook.swTechnician}</span></p>
                <p className="text-sm mt-2">Sistema Operativo: <span className="font-semibold">{netbook.osVersion}</span></p>
                <p className="text-sm mt-2">Resultado: 
                  <Badge variant={netbook.swValidationPassed ? "default" : "destructive"} className="ml-2">
                    {netbook.swValidationPassed ? "Aprobado" : "Reprobado"}
                  </Badge>
                </p>
              </div>
            )}
            {step.id === 3 && (
              <div>
                <h4 className="font-medium mb-2">Asignación</h4>
                <p className="text-sm text-muted-foreground">Entregada a estudiante identificado por hash:</p>
                <p className="text-xs font-mono text-muted-foreground mt-1 break-all">{netbook.studentIdHash}</p>
                <p className="text-sm text-muted-foreground mt-3">Corresponde a la escuela con hash:</p>
                <p className="text-xs font-mono text-muted-foreground mt-1 break-all">{netbook.destinationSchoolHash}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(Number(netbook.distributionTimestamp))}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    ))}
  </div>
</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Número de Serie</h3>
            <p className="font-mono text-sm mt-1">{netbook.serialNumber}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">ID de Lote</h3>
            <p className="font-mono text-sm mt-1">{netbook.batchId}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Especificaciones Iniciales</h3>
          <p className="mt-1">{netbook.initialModelSpecs}</p>
        </div>

        {Number(netbook.state) >= 3 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Distribuida en</h3>
            <p className="mt-1">{formatDate(Number(netbook.distributionTimestamp))}</p>
          </div>
        )}

        {Number(netbook.state) >= 1 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3">Auditoría de Hardware</h3>
             <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <span className="text-muted-foreground">Auditor:</span>
                 <p className="font-mono mt-1">{netbook.hwAuditor}</p>
               </div>
               <div>
                 <span className="text-muted-foreground">Resultado:</span>
                 <Badge variant={netbook.hwIntegrityPassed ? "default" : "destructive"} className="mt-1">
                   {netbook.hwIntegrityPassed ? "Aprobado" : "Reprobado"}
                 </Badge>
               </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Reporte:</span>
                <p className="font-mono mt-1 text-xs">{netbook.hwReportHash}</p>
              </div>
            </div>
          </div>
        )}

        {Number(netbook.state) >= 2 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3">Validación de Software</h3>
             <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <span className="text-muted-foreground">Técnico:</span>
                 <p className="font-mono mt-1">{netbook.swTechnician}</p>
               </div>
               <div>
                 <span className="text-muted-foreground">Versión OS:</span>
                 <p className="mt-1">{netbook.osVersion}</p>
               </div>
               <div className="col-span-2">
                 <span className="text-muted-foreground">Resultado:</span>
                 <Badge variant={netbook.swValidationPassed ? "default" : "destructive"} className="mt-1">
                   {netbook.swValidationPassed ? "Aprobado" : "Reprobado"}
                 </Badge>
               </div>
             </div>
          </div>
        )}

        {Number(netbook.state) >= 3 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3">Asignación a Estudiante</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Hash de Escuela:</span>
                <p className="font-mono mt-1 text-xs">{netbook.destinationSchoolHash}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Hash de Estudiante:</span>
                <p className="font-mono mt-1 text-xs">{netbook.studentIdHash}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}