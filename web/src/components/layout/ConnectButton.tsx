"use client";

import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { truncateAddress } from '@/lib/utils';

export const ConnectButton = () => {
  const { address, connectWallet, disconnectWallet, isLoading } = useWeb3();

  if (address) {
    return (
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" disabled>
          {truncateAddress(address)}
        </Button>
        <Button variant="secondary" size="sm" onClick={disconnectWallet}>
          Desconectar
        </Button>
      </div>
    );
  }

  return (
    <Button 
      size="sm" 
      onClick={async () => {
        try {
          await connectWallet();
        } catch (error) {
          console.error('Connection error:', error);
        }
      }} 
      disabled={isLoading}
    >
      {isLoading ? 'Conectando...' : 'Conectar Wallet'}
    </Button>
  );
};