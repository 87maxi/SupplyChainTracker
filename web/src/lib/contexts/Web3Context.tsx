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
  const [isManufacturer, setIsManufacturer] = useState<boolean>(false);
  const [isAuditor, setIsAuditor] = useState<boolean>(false);
  const [isTechnician, setIsTechnician] = useState<boolean>(false);
  const [isSchool, setIsSchool] = useState<boolean>(false);
  const [hasAnyRole, setHasAnyRole] = useState<boolean>(false);



  // Create Web3Service instance, passing the current signer
  const web3Service = useMemo(() => {
    return new Web3Service(signer);
  }, [signer]);

  // Function to check and refresh user roles
  const checkRoles = useCallback(async () => {
    console.log('=== CHECKING ROLES ===');
    console.log('Connected address:', address);

    if (isConnected && address && web3Service) {
      try {
        const roleConstants = getRoleConstants();

        // Check all roles in parallel
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

        const anyOperationalRole = manufacturerResult || auditorResult || technicianResult || schoolResult;
        const finalHasAnyRole = defaultAdminResult || anyOperationalRole;

        setIsDefaultAdmin(defaultAdminResult);
        setIsManufacturer(manufacturerResult);
        setIsAuditor(auditorResult);
        setIsTechnician(technicianResult);
        setIsSchool(schoolResult);

        // Admin is true if Default Admin OR any operational role (legacy support)
        // You might want to refine this definition depending on requirements
        setIsAdmin(defaultAdminResult || anyOperationalRole);

        setHasAnyRole(finalHasAnyRole);

      } catch (error) {
        console.error('Error during role checking:', error);
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
