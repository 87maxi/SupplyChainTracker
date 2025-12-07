"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getNetbookStateInfo, formatDate } from '@/lib/utils';

import { Netbook } from '@/lib/types';

interface NetbookDetailsProps {
  netbook: Netbook;
}

export function NetbookDetails({ netbook }: NetbookDetailsProps) {
  if (!netbook) return null;

  const stateInfo = getNetbookStateInfo(Number(netbook.state));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles de la Netbook</CardTitle>
        <CardDescription>Información completa del dispositivo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Estado Actual</h3>
            <p className="mt-1 font-medium">{stateInfo.label}</p>
          </div>
          {Number(netbook.state) >= 3 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Distribuida en</h3>
              <p className="mt-1">{formatDate(Number(netbook.distributionTimestamp))}</p>
            </div>
          )}
        </div>

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
                <p className={netbook.hwIntegrityPassed ? "text-green-600" : "text-red-600"}>
                  {netbook.hwIntegrityPassed ? "Aprobado" : "Reprobado"}
                </p>
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
              <div>
                <span className="text-muted-foreground">Resultado:</span>
                <p className={netbook.swValidationPassed ? "text-green-600" : "text-red-600"}>
                  {netbook.swValidationPassed ? "Aprobado" : "Reprobado"}
                </p>
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