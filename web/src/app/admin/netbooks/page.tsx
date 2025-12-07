"use client";

import { useState } from 'react';
import { NetbookSearch } from '@/components/netbooks/NetbookSearch';
import { NetbookStatus } from '@/components/netbooks/NetbookStatus';
import { NetbookDetails } from '@/components/netbooks/NetbookDetails';
import { useWeb3 } from '@/lib/contexts/Web3Context';

import { Netbook } from '@/lib/types';

// ...

export default function AdminNetbooksPage() {
  const { isConnected } = useWeb3();
  const [selectedNetbook, setSelectedNetbook] = useState<Netbook | null>(null);

  const handleNetbookFound = (netbook: Netbook | null) => {
    setSelectedNetbook(netbook);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold mb-4">Bienvenido al Panel de Administración</h2>
        <p className="text-muted-foreground mb-6">
          Conéctate con tu wallet para acceder al sistema de trazabilidad de netbooks educativas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Trazabilidad de Netbooks</h1>
        <p className="text-muted-foreground mt-2">
          Busca y verifica el estado de cualquier netbook en el sistema
        </p>
      </div>

      <NetbookSearch onNetbookFound={handleNetbookFound} />

      {selectedNetbook && (
        <div className="grid gap-6 md:grid-cols-2">
          <NetbookStatus state={Number(selectedNetbook.state)} />
          <NetbookDetails netbook={selectedNetbook} />
        </div>
      )}
    </div>
  );
}