"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Web3Service, getRoleConstants } from '../services/Web3Service';
import { Web3ContextType } from '../types';

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected, connectWallet, disconnectWallet, isLoading, signer, provider } = useWallet();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isDefaultAdmin, setIsDefaultAdmin] = useState<boolean>(false);
  const [hasAnyRole, setHasAnyRole] = useState<boolean>(false);
  
  

  // Create Web3Service instance, passing the current signer
  const web3Service = useMemo(() => {
    return new Web3Service(signer);
  }, [signer]);

  // Function to check and refresh user roles
  const checkRoles = useCallback(async () => {
    console.log('=== CHECKING ADMIN ROLE ===');
    console.log('Connected address:', address);
    console.log('Address is valid:', !!address);
    console.log('Web3Service available:', !!web3Service);

    if (isConnected && address && web3Service) {
      try {
        const adminRole = getRoleConstants().DEFAULT_ADMIN_ROLE;
        console.log('Admin role hash:', adminRole);

        // First check if we're on Anvil network and connected address is the expected admin
        const anvilAdmin = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
        const isAnvilAdmin = address?.toLowerCase() === anvilAdmin.toLowerCase();
        console.log('Is connected address the Anvil admin?', isAnvilAdmin);
        console.log('Expected Anvil admin:', anvilAdmin);
        console.log('Connected address (lowercase):', address?.toLowerCase());

        const isDefaultAdminResult = await web3Service.hasRole(adminRole, address);
        console.log('hasRole result for DEFAULT_ADMIN_ROLE:', isDefaultAdminResult);
        console.log('Type of result:', typeof isDefaultAdminResult);

        // Check operational roles
        const operationalRoles = [
          getRoleConstants().FABRICANTE_ROLE,
          getRoleConstants().AUDITOR_HW_ROLE,
          getRoleConstants().TECNICO_SW_ROLE,
          getRoleConstants().ESCUELA_ROLE,
        ];

        console.log('Checking operational roles...');
        const operationalResults = await Promise.all(
          operationalRoles.map(async (role) => {
            try {
              const hasRole = await web3Service.hasRole(role, address);
              console.log(`Role ${role}: ${hasRole}`);
              return hasRole;
            } catch (error) {
              console.error(`Error checking role ${role}:`, error);
              return false;
            }
          })
        );
        const hasOperationalRole = operationalResults.some(result => result);
        console.log('Has operational role:', hasOperationalRole);

        const finalHasAnyRole = isDefaultAdminResult || hasOperationalRole;
        console.log('Final hasAnyRole:', finalHasAnyRole);

        setIsDefaultAdmin(isDefaultAdminResult);
        setIsAdmin(isDefaultAdminResult || hasOperationalRole);
        setHasAnyRole(finalHasAnyRole);

        // If connected address is Anvil admin but hasRole returns false, there might be an issue
        if (isAnvilAdmin && !isDefaultAdminResult) {
          console.warn('WARNING: Anvil admin address detected but hasRole returned false!');
          console.warn('This suggests a problem with the contract deployment or connection');
          console.warn('Contract address:', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
          console.warn('RPC URL:', process.env.NEXT_PUBLIC_RPC_URL);
        }

      } catch (error) {
        console.error('Error during role checking:', error);
        setIsDefaultAdmin(false);
        setIsAdmin(false);
        setHasAnyRole(false);
      }
    } else {
      setIsAdmin(false);
      setIsDefaultAdmin(false);
      setHasAnyRole(false);
    }
  }, [isConnected, address, web3Service]);

  // Effect to check user roles on mount and when dependencies change
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      checkRoles();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkRoles]);

  // Function to manually refresh roles (useful after role approvals)
  const refreshRoles = useCallback(async () => {
    await checkRoles();
  }, [checkRoles]);

  const contextValue: Web3ContextType = {
    address,
    isConnected,
    chainId: null, // Chain ID is managed in useWallet but not strictly needed in context for now
    provider,
    signer,
    error: null, // Error is managed in useWallet but not strictly needed in context for now
    isLoading,
    connectWallet,
    disconnectWallet,
    isAdmin,
    isDefaultAdmin,
    hasAnyRole,
    refreshRoles,
    web3Service,
  };

  return (
    <Web3Context.Provider value={contextValue}>
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
