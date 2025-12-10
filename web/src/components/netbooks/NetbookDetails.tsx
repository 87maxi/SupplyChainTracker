"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getNetbookStateInfo, formatDate } from '@/lib/utils';
import { LifecycleProgress } from './LifecycleProgress';
import { LifecycleStep, LifecycleStepDetails, Netbook } from '@/lib/types';
import { useState, useEffect } from 'react';
import { TraceabilityService } from '@/lib/services/TraceabilityService';
import { useWeb3 } from '@/lib/hooks/useWeb3';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Web3Service } from '@/lib/services/Web3Service';


interface NetbookDetailsProps {
  serialNumber: string;
  web3Service: Web3Service;
}

export function NetbookDetails({ serialNumber, web3Service }: NetbookDetailsProps) {
  const [netbook, setNetbook] = useState<NetbookReport | null>(null);
  const [lifecycleDetails, setLifecycleDetails] = useState<LifecycleStepDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoading: isTxLoading, error, executeTx } = useWeb3();

  useEffect(() => {
    const fetchNetbookData = async () => {
      try {
        setIsLoading(true);
        const traceabilityService = new TraceabilityService(web3Service);
        const report = await traceabilityService.fetchNetbookReport(serialNumber);
        setNetbook(report);
        
        // Fetch details for each step
        const detailsPromises = Object.values(LifecycleStep).map((step) =>
          traceabilityService.getLifecycleStepDetails(serialNumber, step as LifecycleStep)
        );
        const details = await Promise.all(detailsPromises);
        setLifecycleDetails(details);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch netbook details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (serialNumber) {
      fetchNetbookData();
    }
  }, [serialNumber, web3Service]);

  if (isLoading) {
    return <NetbookDetailsSkeleton />;
  }

  if (!netbook) return null;

  const stateInfo = getNetbookStateInfo(Number(netbook.state));
  const progressValue = ((Number(netbook.state) + 1) / 4) * 100;

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
          
          <LifecycleProgress
            currentStep={netbook.state}
            details={lifecycleDetails}
          />
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
      </CardContent>
    </Card>
const NetbookDetailsSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full mt-1" />
        </div>
        <div>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full mt-1" />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-20 w-full mt-1" />
      </div>
    </CardContent>
  </Card>
);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles de la Netbook</CardTitle>
        <CardDescription>Información completa del dispositivo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isTxLoading && <p className="text-sm text-blue-500">Processing transaction...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {netbook && (
          <>
            {/* Progress Section */}
            {isLoading ? <NetbookDetailsSkeleton /> : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Progreso del Ciclo de Vida</h3>
                    <Badge variant={Number(netbook.state) === 3 ? "default" : "secondary"}>
                      {stateInfo.label}
                    </Badge>
                  </div>
                  <Progress value={progressValue} className="w-full" />
                  
                  <LifecycleProgress
                    currentStep={netbook.state}
                    details={lifecycleDetails}
                  />
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
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}