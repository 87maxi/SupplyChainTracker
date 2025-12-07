"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { Web3Service } from '@/lib/services/Web3Service';
import { toast } from 'sonner';
import { Netbook } from '@/lib/types';

interface NetbookSearchProps {
  onNetbookFound: (netbook: Netbook | null) => void;
}

export function NetbookSearch({ onNetbookFound }: NetbookSearchProps) {
  const { isConnected } = useWeb3();
  const [web3Service] = useState(() => new Web3Service());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      toast.error('Por favor ingresa un número de serie');
      return;
    }

    setLoading(true);
    try {
      const report = await web3Service.getNetbookReport(searchTerm.trim()) as Netbook;
      onNetbookFound(report);
      toast.success('Netbook encontrada', {
        description: `Número de serie: ${searchTerm}`
      });
    } catch (error: unknown) {
      console.error('Error searching netbook:', error);
      toast.error('Netbook no encontrada', {
        description: 'No se encontró una netbook con ese número de serie'
      });
      onNetbookFound(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-2">
        <Label>Buscar Netbook</Label>
        <p className="text-sm text-muted-foreground">
          Conéctate con tu wallet para buscar netbooks en el sistema
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSearch} className="space-y-2">
      <Label htmlFor="search">Buscar Netbook por Número de Serie</Label>
      <div className="flex space-x-2">
        <Input
          id="search"
          placeholder="Ingresa el número de serie"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>
    </form>
  );
}