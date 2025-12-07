"use client";

import { ethers } from 'ethers';
import SupplyChainTrackerABI from '../../contracts/SupplyChainTrackerABI.json';
import { getNetbookStateInfo } from '../utils';
import { EthereumProvider } from '../types';

// Contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';

interface ContractError {
  message: string;
  data?: unknown;
}

export class Web3Service {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      // Browser environment with Injected Provider (MetaMask, Rabby, etc.)
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
    } else {
      // Fallback to default provider
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
    }
  }

  async connect() {
    try {
      // Re-initialize provider to ensure we catch the injected provider if it wasn't ready during constructor
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        this.provider = new ethers.BrowserProvider((window as any).ethereum);
      }

      if (!this.provider) {
        throw new Error('No Ethereum provider found. Please install a wallet like Rabby or MetaMask.');
      }

      // Request account access
      if (this.provider instanceof ethers.BrowserProvider) {
        await this.provider.send('eth_requestAccounts', []);
      }
      this.signer = await this.provider.getSigner();

      if (this.signer) {
        if (!CONTRACT_ADDRESS) {
          throw new Error('Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your environment variables.');
        }

        // Verify contract exists
        const code = await this.provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
          let chainId = 'unknown';
          try {
            if ((window as any).ethereum) {
              chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
            }
          } catch (e) {
            console.error('Error getting chainId:', e);
          }
          throw new Error(`No contract found at ${CONTRACT_ADDRESS} on chain ID ${chainId}. Please check that your wallet is connected to the correct network.`);
        }

        this.contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          SupplyChainTrackerABI,
          this.signer
        );
      }

      return this.signer?.getAddress();
    } catch (error) {
      console.error('Error connecting:', error);
      throw this.handleError(error);
    }
  }

  async getAddress(): Promise<string | null> {
    if (this.signer) {
      return this.signer.getAddress();
    }
    return null;
  }

  // Contract interaction methods

  async grantRole(role: string, account: string): Promise<string> {
    try {
      if (!this.contract) await this.connect();

      const tx = await this.contract?.grantRole(role, account);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error('Error granting role:', error);
      throw this.handleError(error);
    }
  }

  async revokeRole(role: string, account: string): Promise<string> {
    try {
      if (!this.contract) await this.connect();

      const tx = await this.contract?.revokeRole(role, account);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error('Error revoking role:', error);
      throw this.handleError(error);
    }
  }

  async hasRole(role: string, account: string): Promise<boolean> {
    try {
      if (!this.contract) await this.connect();

      return await this.contract?.hasRole(role, account);
    } catch (error) {
      console.error('Error checking role:', error);
      throw this.handleError(error);
    }
  }

  async getRoleStatus(role: string, account: string): Promise<unknown> {
    try {
      if (!this.contract) await this.connect();

      return await this.contract?.getRoleStatus(role, account);
    } catch (error) {
      console.error('Error getting role status:', error);
      throw this.handleError(error);
    }
  }

  async getNetbookReport(serialNumber: string): Promise<unknown> {
    try {
      if (!this.contract) await this.connect();

      return await this.contract?.getNetbookReport(serialNumber);
    } catch (error) {
      console.error('Error getting netbook report:', error);
      throw this.handleError(error);
    }
  }

  async getNetbookState(serialNumber: string): Promise<number> {
    try {
      if (!this.contract) await this.connect();

      return await this.contract?.getNetbookState(serialNumber);
    } catch (error) {
      console.error('Error getting netbook state:', error);
      throw this.handleError(error);
    }
  }

  async registerNetbooks(
    serialNumbers: string[],
    batchIds: string[],
    modelSpecs: string[]
  ): Promise<string> {
    try {
      if (!this.contract) await this.connect();

      const tx = await this.contract?.registerNetbooks(serialNumbers, batchIds, modelSpecs);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error('Error registering netbooks:', error);
      throw this.handleError(error);
    }
  }

  async auditHardware(
    serialNumber: string,
    integrityPassed: boolean,
    reportHash: string
  ): Promise<string> {
    try {
      if (!this.contract) await this.connect();

      const tx = await this.contract?.auditHardware(serialNumber, integrityPassed, reportHash);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error('Error auditing hardware:', error);
      throw this.handleError(error);
    }
  }

  async validateSoftware(
    serialNumber: string,
    osVersion: string,
    validationPassed: boolean
  ): Promise<string> {
    try {
      if (!this.contract) await this.connect();

      const tx = await this.contract?.validateSoftware(serialNumber, osVersion, validationPassed);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error('Error validating software:', error);
      throw this.handleError(error);
    }
  }

  async assignToStudent(
    serialNumber: string,
    schoolHash: string,
    studentHash: string
  ): Promise<string> {
    try {
      if (!this.contract) await this.connect();

      const tx = await this.contract?.assignToStudent(serialNumber, schoolHash, studentHash);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error('Error assigning to student:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): ContractError {
    if (error instanceof Error) {
      return {
        message: error.message
      };
    }

    if (typeof error === 'object' && error !== null) {
      if ('message' in error) {
        return {
          message: (error as ContractError).message,
          data: error
        };
      }
    }

    return {
      message: 'Unknown error occurred'
    };
  }
}

// Helper function to get contract role constants
export const getRoleConstants = () => ({
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  FABRICANTE_ROLE: '0x98fc1341304b523375cd3a25cf3ad20857bdc79b4f3d9840965408e183229a5e',
  AUDITOR_HW_ROLE: '0x1ae41bc4402a4837bfe8f6d64908e31d2df7fcdf0e17b3d76ed0974e6eb1325e',
  TECNICO_SW_ROLE: '0xe1e7d626b0388606bd19894ab2a84c78416c5196d842ff58d27a646d12f2429c',
  ESCUELA_ROLE: '0x7b2721288b8eedd4036a78399b4e86844f712d69493f32437bcc722e59a39e7d'
});

// Helper function to get netbook state labels
export const getNetbookState = getNetbookStateInfo;