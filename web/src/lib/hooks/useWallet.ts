"use client";

import { useState, useEffect } from 'react';
import { EthereumProvider } from '../types';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isLoading: true
  });

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setWalletState({
        address: accounts[0],
        isConnected: true,
        isLoading: false
      });
    } else {
      setWalletState({
        address: null,
        isConnected: false,
        isLoading: false
      });
    }
  };

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Check if MetaMask is installed
        if (typeof window !== 'undefined' && (window as unknown as { ethereum: EthereumProvider }).ethereum) {
          const ethereum = (window as unknown as { ethereum: EthereumProvider }).ethereum;

          // Check for existing connection
          const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];

          if (accounts.length > 0) {
            setWalletState({
              address: accounts[0],
              isConnected: true,
              isLoading: false
            });
          } else {
            setWalletState(prev => ({ ...prev, isLoading: false }));
          }

          // Listen for account changes
          ethereum.on('accountsChanged', handleAccountsChanged as unknown as (...args: unknown[]) => void);

          return () => {
            ethereum.removeListener('accountsChanged', handleAccountsChanged as unknown as (...args: unknown[]) => void);
          };
        } else {
          setWalletState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error initializing wallet:', error);
        setWalletState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeWallet();
  }, []);

  const connect = async () => {
    try {
      if (typeof window !== 'undefined' && (window as unknown as { ethereum: EthereumProvider }).ethereum) {
        const accounts = await (window as unknown as { ethereum: EthereumProvider }).ethereum.request({
          method: 'eth_requestAccounts'
        }) as string[];

        setWalletState({
          address: accounts[0],
          isConnected: true,
          isLoading: false
        });
      } else {
        throw new Error('MetaMask is not installed');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setWalletState({
      address: null,
      isConnected: false,
      isLoading: false
    });
  };

  return {
    address: walletState.address,
    isConnected: walletState.isConnected,
    connect,
    disconnect,
    isLoading: walletState.isLoading
  };
};