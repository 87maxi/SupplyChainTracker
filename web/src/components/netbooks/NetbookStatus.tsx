"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getNetbookStateInfo } from '@/lib/utils';

interface NetbookStatusProps {
  state: number;
}

export function NetbookStatus({ state }: NetbookStatusProps) {
  const stateInfo = getNetbookStateInfo(state);
  const progress = (state + 1) * 25; // Each state is 25% of the progress

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado Actual: {stateInfo.label}</CardTitle>
        <CardDescription>{stateInfo.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Progreso del Ciclo de Vida</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          {Array.from({ length: 4 }, (_, i) => {
            const info = getNetbookStateInfo(i);
            const completed = i <= state;
            
            return (
              <div key={info.id} className="space-y-1">
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                  completed 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <p className="text-xs font-medium">{info.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}