'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Web3Service, getRoleConstants } from '../services/Web3Service';
import { Web3ContextType } from '../types';
import { toast } from 'sonner';

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected, connectWallet, disconnectWallet, isLoading, signer, provider, chainId } = useWallet();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isDefaultAdmin, setIsDefaultAdmin] = useState<boolean>(false);
  const [isManufacturer, setIsManufacturer] = useState<boolean>(false);
  const [isAuditor, setIsAuditor] = useState<boolean>(false);
  const [isTechnician, setIsTechnician] = useState<boolean>(false);
  const [isSchool, setIsSchool] = useState<boolean>(false);
  const [hasAnyRole, setHasAnyRole] = useState<boolean>(false);

  // Create Web3Service instance, passing the current signer
  const web3Service = useMemo(() => {
    if (!signer) {
      console.log('No signer available for Web3Service');
      return null;
    }
    
    try {
      console.log('Recreating Web3Service with new signer');
      return new Web3Service(signer);
    } catch (error) {
      console.error('Failed to create Web3Service:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con la blockchain. Verifica tu conexión a la wallet.'
      });
      return null;
    }
  }, [signer]);

// Function to check and refresh user roles
  const checkRoles = useCallback(async () => {
    console.log('=== CHECKING ROLES ===');
    console.log('Connected address:', address);
    
    // Simple debounce - prevent multiple rapid refreshes
    const now = Date.now();
    const lastRefresh = (window as any).__lastRoleRefresh || 0;
    
    if (now - lastRefresh < 1000) {
      console.log('Skipping role refresh - too soon');
      return;
    }
    
    (window as any).__lastRoleRefresh = now;

    if (isConnected && address && web3Service) {
      try {
        const roleConstants = getRoleConstants();

        // Check all roles in parallel
          // Check all roles in parallel, including admin role
        const [
          defaultAdminResult,
          manufacturerResult,
          auditorResult,
          technicianResult,
          schoolResult
        ] = await Promise.all([
          web3Service.hasRole(roleConstants.DEFAULT_ADMIN_ROLE, address),
          web3Service.hasRole(roleConstants.FABRICANTE_ROLE, address),
          web3Service.hasRole(roleConstants.AUDITOR_HW_ROLE, address),
          web3Service.hasRole(roleConstants.TECNICO_SW_ROLE, address),
          web3Service.hasRole(roleConstants.ESCUELA_ROLE, address)
        ]);

        console.log('Role results:', {
          defaultAdmin: defaultAdminResult,
          manufacturer: manufacturerResult,
          auditor: auditorResult,
          technician: technicianResult,
          school: schoolResult
        });

        setIsDefaultAdmin(defaultAdminResult);
        setIsManufacturer(manufacturerResult);
        setIsAuditor(auditorResult);
        setIsTechnician(technicianResult);
        setIsSchool(schoolResult);

        const finalHasAnyRole = defaultAdminResult || manufacturerResult || auditorResult || technicianResult || schoolResult;
        setIsAdmin(defaultAdminResult);  // Only users with DEFAULT_ADMIN_ROLE are admins
        setHasAnyRole(finalHasAnyRole);

      } catch (error) {
        console.error('Error during role checking:', error);
        toast.error('Error de conexión', {
          description: 'No se pudieron verificar tus roles. Por favor, verifica tu conexión a la red.'
        });
        setIsDefaultAdmin(false);
        setIsManufacturer(false);
        setIsAuditor(false);
        setIsTechnician(false);
        setIsSchool(false);
        setIsAdmin(false);
        setHasAnyRole(false);
      }
    } else {
      setIsDefaultAdmin(false);
      setIsManufacturer(false);
      setIsAuditor(false);
      setIsTechnician(false);
      setIsSchool(false);
      setIsAdmin(false);
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
    // Simple debounce - prevent multiple rapid refreshes
    const now = Date.now();
    const lastRefresh = (window as any).__lastRoleRefresh || 0;
    
    if (now - lastRefresh < 1000) {
      console.log('Skipping role refresh - too soon');
      // For testing, let's allow refresh but with a warning
      console.log('Bypassing debounce for testing - forcing refresh');
    }
    
    (window as any).__lastRoleRefresh = now;
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
    isManufacturer,
    isAuditor,
    isTechnician,
    isSchool,
    hasAnyRole,
    refreshRoles,
    web3Service: web3Service || undefined,
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
