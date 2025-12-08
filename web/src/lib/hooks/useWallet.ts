import { useState, useEffect, useCallback } from 'react';
import { ethers, Signer } from 'ethers';
import { WalletState, EthereumProvider } from '../types';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Helper function to get the Ethereum provider from the window object
const getEthereumProvider = (): EthereumProvider | undefined => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }
  return undefined;
};

const initialState: WalletState = {
  address: null,
  isConnected: false,
  chainId: null,
  provider: null,
  signer: null,
  error: null,
  isLoading: true,
};

/**
 * @description Hook to manage the connection and state of the user's Ethereum wallet (MetaMask).
 * It handles connection, disconnection, and listening for account/chain changes.
 */
export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>(initialState);
  const ethereum = getEthereumProvider();

  const updateWalletState = useCallback(async (accounts: string[], chainId: string | null) => {
    if (!ethereum) {
      setWalletState(s => ({ ...s, error: 'MetaMask not detected.', isLoading: false }));
      return;
    }

    const provider = new ethers.BrowserProvider(ethereum as ethers.Eip1193Provider);
    const address = accounts.length > 0 ? accounts[0] : null;
    const isConnected = !!address;
    const numericChainId = chainId ? parseInt(chainId, 16) : null;
    let signer: Signer | null = null;

    if (isConnected) {
      try {
        // Only get signer if connected
        signer = await provider.getSigner();
      } catch (e) {
        console.error('Error getting signer:', e);
        // This can happen if the user is connected but locked their wallet
        setWalletState(s => ({ ...s, error: 'Could not get signer. Wallet might be locked.', isLoading: false }));
        return;
      }
    }

    setWalletState({
      address,
      isConnected,
      chainId: numericChainId,
      provider,
      signer,
      error: null,
      isLoading: false,
    });
  }, [ethereum]);

  const connectWallet = useCallback(async () => {
    if (!ethereum) {
      setWalletState(s => ({ ...s, error: 'MetaMask not detected.' }));
      return;
    }

    setWalletState(s => ({ ...s, isLoading: true, error: null }));
    try {
      // Request accounts and chainId in parallel
      const [accounts, chainId] = await Promise.all([
        ethereum.request({ method: 'eth_requestAccounts' }) as Promise<string[]>,
        ethereum.request({ method: 'eth_chainId' }) as Promise<string>,
      ]);
      
      // Remove local storage flag for manual disconnection
      localStorage.removeItem('isDisconnected');

      await updateWalletState(accounts, chainId);
    } catch (e) {
      console.error('Connection error:', e);
      setWalletState(s => ({ ...s, error: 'Failed to connect wallet. User rejected connection or an error occurred.', isLoading: false }));
    }
  }, [ethereum, updateWalletState]);

  const disconnectWallet = useCallback(() => {
    // Set local storage flag for manual disconnection
    localStorage.setItem('isDisconnected', 'true');
    // Clear local state
    setWalletState(initialState);
  }, []);

  useEffect(() => {
    // Initialize loading state based on ethereum availability
    if (!ethereum) {
      // Use a timeout to avoid synchronous setState in effect
      setTimeout(() => setWalletState(initialState), 0);
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      // When accounts change, we re-fetch chainId and update state
      ethereum.request({ method: 'eth_chainId' }).then((chainId) => {
        updateWalletState(accounts, chainId as string);
      });
    };

    const handleChainChanged = (chainId: string) => {
      // When chain changes, we re-fetch accounts and update state
      ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
        updateWalletState(accounts as string[], chainId);
      });
    };

    // Initial load: check current state only if not manually disconnected
    const isDisconnected = localStorage.getItem('isDisconnected') === 'true';
    if (!isDisconnected) {
      Promise.all([
        ethereum.request({ method: 'eth_accounts' }) as Promise<string[]>,
        ethereum.request({ method: 'eth_chainId' }) as Promise<string>,
      ]).then(([accounts, chainId]) => {
        updateWalletState(accounts, chainId);
      }).catch((e) => {
        console.error('Initial load error:', e);
        setWalletState(s => ({ ...s, error: 'Failed to load initial wallet state.', isLoading: false }));
      });
    } else {
      // Use timeout to avoid synchronous setState in effect
      setTimeout(() => setWalletState(s => ({ ...s, isLoading: false })), 0);
    }

    // Set up listeners
    ethereum.on('accountsChanged', handleAccountsChanged as unknown as (...args: unknown[]) => void);
    ethereum.on('chainChanged', handleChainChanged as unknown as (...args: unknown[]) => void);

    // Cleanup listeners
    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged as unknown as (...args: unknown[]) => void);
        ethereum.removeListener('chainChanged', handleChainChanged as unknown as (...args: unknown[]) => void);
      }
    };
  }, [ethereum, updateWalletState]);

  return { ...walletState, connectWallet, disconnectWallet };
};
