"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWeb3 } from '@/lib/hooks/useWeb3';
import { toast } from '@/components/ui/use-toast';
import { Netbook } from '@/lib/types';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { TraceabilityService } from '@/lib/services/TraceabilityService';
import { Skeleton } from '@/components/ui/skeleton';


interface NetbookSearchProps {
  onNetbookFound: (netbook: Netbook | null) => void;
}

export function NetbookSearch({ onNetbookFound }: NetbookSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const { web3Service } = useWeb3();

  useEffect(() => {
    const fetchSerialNumbers = async () => {
      if (!web3Service) return;
      
      try {
        setAutocompleteLoading(true);
        // Simular la obtención de números de serie (el contrato no expone esta función)
        // En un entorno real, se podría usar eventos o un índice fuera de la cadena
        const mockSerials = await getMockSerialNumbers();
        setSerialNumbers(mockSerials);
      } catch (error) {
        console.error("Error fetching serial numbers:", error);
        toast({
          title: "Error",
          description: "Failed to load serial numbers for autocomplete.",
          variant: "destructive",
        });
      } finally {
        setAutocompleteLoading(false);
      }
    };

    fetchSerialNumbers();
  }, [web3Service]);

  // Función temporal para simular la obtención de números de serie
  const getMockSerialNumbers = async (): Promise<string[]> => {
    // En un entorno real, esto se reemplazaría con una llamada al contrato o índice
    return ["SN12345678", "SN87654321", "SN11223344", "SN55667788"];
  };

  const handleSearch = async (serial?: string) => {
    const searchValue = serial || searchTerm.trim();
    if (!searchValue) {
      toast({
        title: "Error",
        description: "Please enter a serial number.",
        variant: "destructive",
      });
      return;
    }

    if (!web3Service) {
      toast({
        title: "Error",
        description: "Web3 service not available.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const traceabilityService = new TraceabilityService(web3Service);
      const report = await traceabilityService.fetchNetbookReport(searchValue);
      onNetbookFound(report);
      toast({
        title: "Netbook found",
        description: `Serial number: ${searchValue}`,
      });
    } catch (error: unknown) {
      console.error('Error searching netbook:', error);
      toast({
        title: "Netbook not found",
        description: "No netbook found with that serial number.",
        variant: "destructive",
      });
      onNetbookFound(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSerial = (serial: string) => {
    setSearchTerm(serial);
    setOpen(false);
    handleSearch(serial);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="search">Buscar Netbook por Número de Serie</Label>
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          id="search"
          placeholder="Ingresa el número de serie..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          onFocus={() => setOpen(true)}
          disabled={loading}
        />
        {open && (
          <CommandList>
            {autocompleteLoading ? (
              <CommandItem>
                <Skeleton className="h-4 w-full" />
              </CommandItem>
            ) : (
              serialNumbers
                .filter((serial) => serial.includes(searchTerm))
                .map((serial) => (
                  <CommandItem
                    key={serial}
                    onSelect={() => handleSelectSerial(serial)}
                  >
                    {serial}
                  </CommandItem>
                ))
            )}
            {searchTerm && !serialNumbers.includes(searchTerm) && (
              <CommandItem onSelect={() => handleSearch()}>Buscar: {searchTerm}</CommandItem>
            )}
          </CommandList>
        )}
      </Command>
      {loading && <p className="text-sm text-muted-foreground">Buscando...</p>}
    </div>
  );
}