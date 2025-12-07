"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getNetbookStateInfo } from '@/lib/utils';

interface NetbookStatus {
  state: number;
  count: number;
  percentage: number;
}

interface NetbookStatusChartProps {
  statuses: NetbookStatus[];
}

export function NetbookStatusChart({ statuses }: NetbookStatusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Netbooks</CardTitle>
        <CardDescription>Distribución por etapa del ciclo de vida</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {statuses.map((status) => {
          const stateInfo = getNetbookStateInfo(status.state);
          return (
            <div key={stateInfo.id} className="flex items-center">
              <div className="ml-4 space-y-1 flex-1">
                <p className="text-sm font-medium leading-none">{stateInfo.label}</p>
                <p className="text-sm text-muted-foreground">{stateInfo.description}</p>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-medium">{status.count}</p>
                <p className="text-xs text-muted-foreground">{status.percentage}%</p>
              </div>
              <Progress value={status.percentage} className="h-2 w-32 ml-4" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}