"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/lib/hooks/useWallet';
import { truncateAddress } from '@/lib/utils';

import { useRouter } from 'next/navigation';

export function Header() {
  const { address, isConnected, connect, disconnect } = useWallet();
  const router = useRouter();

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <h1 className="text-2xl font-bold">SupplyChainTracker</h1>
        </Link>
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Inicio
          </Link>
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/users" className="text-sm font-medium hover:text-primary transition-colors">
            Usuarios
          </Link>
          <Link href="/admin/netbooks" className="text-sm font-medium hover:text-primary transition-colors">
            Netbooks
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {truncateAddress(address || '')}
              </span>
              <Button variant="outline" onClick={handleDisconnect}>
                Desconectar
              </Button>
            </div>
          ) : (
            <Button onClick={connect}>Conectar Wallet</Button>
          )}
        </div>
      </div>
    </header>
  );
};