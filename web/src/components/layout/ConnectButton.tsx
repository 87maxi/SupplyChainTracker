"use client";

import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { truncateAddress } from '@/lib/utils';

export const ConnectButton = () => {
  const { address, connect, isLoading } = useWeb3();

  if (address) {
    return (
      <Button variant="outline" size="sm" disabled>
        {truncateAddress(address)}
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={connect} disabled={isLoading}>
      {isLoading ? 'Conectando...' : 'Conectar Wallet'}
    </Button>
  );
};