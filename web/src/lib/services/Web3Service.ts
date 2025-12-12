'use client';

import { ethers } from 'ethers';
import SupplyChainTrackerABI from '@/contracts/SupplyChainTrackerABI.json';

// Define the Role constants
export const FABRICANTE_ROLE = ethers.keccak256(ethers.toUtf8Bytes('FABRICANTE_ROLE'));
export const DISTRIBUIDOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('DISTRIBUIDOR_ROLE'));
export const ESCUELA_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ESCUELA_ROLE'));
export const REPARADOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('REPARADOR_ROLE'));
export const AUDITOR_HW_ROLE = ethers.keccak256(ethers.toUtf8Bytes('AUDITOR_HW_ROLE'));
export const TECNICO_SW_ROLE = ethers.keccak256(ethers.toUtf8Bytes('TECNICO_SW_ROLE'));
export const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export class Web3Service {
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  constructor(signer?: ethers.Signer | null) {
    console.log('Creating Web3Service instance...');
    this.signer = signer || null;

    if (this.signer) {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (contractAddress) {
        this.contract = new ethers.Contract(
          contractAddress,
          SupplyChainTrackerABI.abi,
          this.signer
        );
      }
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
      return false;
    }
  }

  async getRoleStatus(role: string, address: string): Promise<any> {
    if (!this.contract) {
      console.warn('Contract not initialized');
      return null;
    }

    try {
      const result = await this.contract.getRoleStatus(role, address);
      return result;
    } catch (error) {
      console.error('Error getting role status:', error);
      throw error;
    }
  }

  async requestRoleApproval(role: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.requestRoleApproval(role);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error requesting role approval:', error);
      throw error;
    }
  }

  async getAllPendingRoleRequests(): Promise<any[]> {
    if (!this.contract) {
      console.warn('Contract not initialized');
      return [];
    }

    try {
      const result = await this.contract.getAllPendingRoleRequests();
      return result;
    } catch (error) {
      console.error('Error getting pending role requests:', error);
      return [];
    }
  }

  async cancelRoleRequest(role: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.cancelRoleRequest(role);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error canceling role request:', error);
      throw error;
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