"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '../hooks/useWallet';

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected, connect, disconnect, isLoading } = useWallet();

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected,
        connect,
        disconnect,
        isLoading
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};