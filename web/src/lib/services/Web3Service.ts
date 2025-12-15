'use client';

import { ethers } from 'ethers';
import SupplyChainTrackerABI from '@/contracts/SupplyChainTrackerABI.json';
import { toast } from 'sonner';

// Define the Role constants
export const FABRICANTE_ROLE = ethers.keccak256(ethers.toUtf8Bytes('FABRICANTE_ROLE'));
export const DISTRIBUIDOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('DISTRIBUIDOR_ROLE'));
export const ESCUELA_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ESCUELA_ROLE'));
export const REPARADOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('REPARADOR_ROLE'));
export const AUDITOR_HW_ROLE = ethers.keccak256(ethers.toUtf8Bytes('AUDITOR_HW_ROLE'));
export const TECNICO_SW_ROLE = ethers.keccak256(ethers.toUtf8Bytes('TECNICO_SW_ROLE'));

// OpenZeppelin's AccessControl uses bytes32(0) as the DEFAULT_ADMIN_ROLE
export const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

import { CONTRACT_ERROR_MAP, handleError } from '../utils/contractErrors';

export class Web3Service {
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;
  private provider: ethers.Provider | null = null;
  private contractAddress: string;

  constructor(signer?: ethers.Signer | null) {
    console.log('Creating Web3Service instance...');
    this.signer = signer || null;
    this.provider = signer?.provider || null;
    
    this.contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
    if (!this.contractAddress) {
      console.error('Contract address not configured');
      throw new Error('Contract address not configured. Please check your environment variables.');
    }
    
    if (this.signer) {
      try {
        this.contract = new ethers.Contract(
          this.contractAddress,
          SupplyChainTrackerABI.abi,
          this.signer
        );
        console.log('Contract initialized successfully at:', this.contractAddress);
      } catch (error) {
        console.error('Failed to initialize contract:', error);
        throw new Error('Failed to initialize contract. Please check the ABI and address.');
      }
    } else {
      console.warn('No signer provided to Web3Service');
    }
    console.log('Web3Service initialized');
  }

  async hasRole(role: string, address: string): Promise<boolean> {
    if (!this.contract) {
      console.warn('Contract not initialized');
      return false;
    }

    try {
      const result = await this.contract.hasRole(role, address);
      return result;
    } catch (error) {
      console.error('Error checking role:', error);
      // Show user-friendly error
      toast.error('Error de conexión', {
        description: 'No se pudo verificar tu rol. Por favor, verifica tu conexión a la red.'
      });
      return false;
    }
  }

  async getRoleStatus(role: string, address: string): Promise<any> {
    if (!this.contract) {
      console.warn('Contract not initialized');
      return null;
    }

    try {
      // With the simplified role system, we just check if the address has the role
      const hasRole = await this.contract.hasRole(role, address);
      return {
        state: hasRole ? 1 : 0, // 1 = Approved, 0 = Not approved
        account: address,
        role: role,
        approvedBy: hasRole ? address : '0x0000000000000000000000000000000000000000',
        approvalTimestamp: hasRole ? Date.now() : 0
      };
    } catch (error) {
      console.error('Error getting role status:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo obtener el estado de tu rol. Por favor, verifica tu conexión a la red.'
      });
      throw error;
    }
  }

  async requestRoleApproval(role: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.requestRoleApproval(role);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error requesting role approval:', error);
      throw handleError(error, 'requestRoleApproval');
    }
  }

  async getAllPendingRoleRequests(): Promise<any[]> {
    if (!this.contract) {
      console.warn('Contract not initialized');
      return [];
    }

    try {
      const roleConstants = getRoleConstants();
      const allRequests: any[] = [];
      
      // Get pending requests for all roles
      for (const [roleName, role] of Object.entries(roleConstants)) {
        if (roleName === 'DEFAULT_ADMIN_ROLE') continue;
        
        const requests = await this.contract.getRoleRequests(role);
        const pendingRequests = requests.filter(
          (req: any) => req.state === 0 // Pending state
        );
        
        pendingRequests.forEach((req: any) => {
          allRequests.push({
            role: roleName,
            address: req.account,
            requestTimestamp: req.requestTimestamp,
            state: req.state
          });
        });
      }
      
      return allRequests;
    } catch (error) {
      console.error('Error getting pending role requests:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo obtener las solicitudes pendientes. Por favor, verifica tu conexión a la red.'
      });
      return [];
    }
  }

  async cancelRoleRequest(role: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.cancelRoleRequest(role);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error canceling role request:', error);
      throw handleError(error, 'cancelRoleRequest');
    }
  }

  async approveRole(role: string, account: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.approveRole(role, account);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error approving role:', error);
      throw handleError(error, 'approveRole');
    }
  }

  async rejectRole(role: string, account: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.rejectRole(role, account);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error rejecting role:', error);
      throw handleError(error, 'rejectRole');
    }
  }

  setupEventListener(eventName: string, callback: (event: any) => void): void {
    if (!this.contract) {
      console.warn('Contract not initialized');
      return;
    }

    try {
      this.contract.on(eventName, callback);
    } catch (error) {
      console.error(`Error setting up event listener for ${eventName}:`, error);
    }
  }

  removeAllEventListeners(): void {
    if (!this.contract) {
      console.warn('Contract not initialized');
      return;
    }

    try {
      this.contract.removeAllListeners();
    } catch (error) {
      console.error('Error removing event listeners:', error);
    }
  }
}

export function getRoleConstants() {
  return {
    FABRICANTE_ROLE,
    DISTRIBUIDOR_ROLE,
    ESCUELA_ROLE,
    REPARADOR_ROLE,
    AUDITOR_HW_ROLE,
    TECNICO_SW_ROLE,
    DEFAULT_ADMIN_ROLE
  };
}

export function fetchRoleConstants() {
  return Promise.resolve(getRoleConstants());
}