"use client";

import { ethers, Signer } from 'ethers';
import SupplyChainTrackerABI from '../../contracts/SupplyChainTrackerABI.json';
import { getNetbookStateInfo } from '../utils';
import { ContractError, UserRoleStatus, NetbookReport } from '../types';

// Contract configuration
const CONTRACT_ADDRESS: string = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const RPC_URL: string = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';

/**
 * @description Service class for interacting with the SupplyChainTracker smart contract.
 * It uses the provided signer for transactions and a read-only provider for view functions.
 */
export class Web3Service {
  private readOnlyContract: ethers.Contract;
  private signer: Signer | null;

  /**
   * @param signer The connected wallet signer for transactions. Null for read-only.
   */
  constructor(signer: Signer | null) {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS.');
    }

    this.signer = signer;

    

    // Dedicated read-only contract using JsonRpcProvider for efficiency
    const readOnlyProvider = new ethers.JsonRpcProvider(RPC_URL);
    this.readOnlyContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      SupplyChainTrackerABI,
      readOnlyProvider
    );
  }

  private async getContractWithSigner(): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error('Wallet not connected or signer not available for transaction.');
    }
    // Re-instantiate contract with the current signer for transactions
    return new ethers.Contract(
      CONTRACT_ADDRESS,
      SupplyChainTrackerABI,
      this.signer
    );
  }

  // --- Contract interaction methods (View/Read) ---

  /**
   * @description Checks if an account has a specific role.
   * @param role The role hash (e.g., DEFAULT_ADMIN_ROLE).
   * @param account The address to check.
   * @returns True if the account has the role, false otherwise.
   */
  async hasRole(role: string, account: string): Promise<boolean> {
    try {
      console.log(`Web3Service.hasRole called with role: ${role}, account: ${account}`);
      console.log(`Contract address: ${CONTRACT_ADDRESS}`);
      console.log(`RPC URL: ${RPC_URL}`);
      console.log(`ReadOnlyContract address:`, await this.readOnlyContract.getAddress?.() || 'N/A');

      const result = await this.readOnlyContract.hasRole(role, account);
      console.log(`Web3Service.hasRole result: ${result}, type: ${typeof result}`);

      // Ensure we return a boolean
      return Boolean(result);
    } catch (error) {
      console.error('Error checking role:', error);
      throw this.handleError(error);
    }
  }

  /**
   * @description Gets the role status for a specific account.
   * @param role The role hash.
   * @param account The address to check.
   * @returns The role status object.
   */
  async getRoleStatus(role: string, account: string): Promise<UserRoleStatus> {
    try {
      const result = await this.readOnlyContract.getRoleStatus(role, account);
      
      // Explicitly convert BigInts to string/number for frontend compatibility
      return {
        role: result[0] as string,
        account: result[1] as string,
        state: Number(result[2]), // Convert BigInt to number (0: Pending, 1: Approved, 2: Rejected, 3: Canceled)
        approvalTimestamp: result[3].toString(), // Convert BigInt timestamp to string
        approvedBy: result[4] as string,
      };
    } catch (error) {
      console.error('Error getting role status:', error);
      throw this.handleError(error);
    }
  }

  /**
   * @description Gets the full report for a netbook by serial number.
   * @param serialNumber The netbook's serial number.
   * @returns The netbook report object.
   */
  async getNetbookReport(serialNumber: string): Promise<NetbookReport> {
    try {
      const result = await this.readOnlyContract.getNetbookReport(serialNumber);
      
      // Map the array result to the NetbookReport interface
      return {
        serialNumber: result[0] as string,
        batchId: result[1] as string,
        initialModelSpecs: result[2] as string,
        hwAuditor: result[3] as string,
        hwIntegrityPassed: result[4] as boolean,
        hwReportHash: result[5] as string,
        swTechnician: result[6] as string,
        osVersion: result[7] as string,
        swValidationPassed: result[8] as boolean,
        destinationSchoolHash: result[9] as string,
        studentIdHash: result[10] as string,
        distributionTimestamp: result[11].toString(), // BigInt to string
        state: Number(result[12]), // BigInt to number
      };
    } catch (error) {
      console.error('Error getting netbook report:', error);
      throw this.handleError(error);
    }
  }

  /**
   * @description Gets the current state ID of a netbook.
   * @param serialNumber The netbook's serial number.
   * @returns The state ID (number).
   */
  async getNetbookState(serialNumber: string): Promise<number> {
    try {
      const stateBigInt = await this.readOnlyContract.getNetbookState(serialNumber);
      return Number(stateBigInt);
    } catch (error) {
      console.error('Error getting netbook state:', error);
      throw this.handleError(error);
    }
  }

  // --- Contract interaction methods (Transaction/Write) ---

  async grantRole(role: string, account: string): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.grantRole(role, account);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error granting role:', error);
      throw this.handleError(error);
    }
  }

  async revokeRole(role: string, account: string): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.revokeRole(role, account);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error revoking role:', error);
      throw this.handleError(error);
    }
  }

  async registerNetbooks(
    serialNumbers: string[],
    batchIds: string[],
    modelSpecs: string[]
  ): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.registerNetbooks(serialNumbers, batchIds, modelSpecs);
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
      const contract = await this.getContractWithSigner();
      const tx = await contract.auditHardware(serialNumber, integrityPassed, reportHash);
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
      const contract = await this.getContractWithSigner();
      const tx = await contract.validateSoftware(serialNumber, osVersion, validationPassed);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error validating software:', error);
      throw this.handleError(error);
    }
  }

  async requestRoleApproval(role: string): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.requestRoleApproval(role);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error requesting role approval:', error);
      throw this.handleError(error);
    }
  }

  async approveRole(role: string, account: string): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.approveRole(role, account);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error approving role:', error);
      throw this.handleError(error);
    }
  }

  async rejectRole(role: string, account: string): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.rejectRole(role, account);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error rejecting role:', error);
      throw this.handleError(error);
    }
  }

  async cancelRoleRequest(role: string): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.cancelRoleRequest(role);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error canceling role request:', error);
      throw this.handleError(error);
    }
  }

  async revokeRoleApproval(role: string, account: string): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.revokeRoleApproval(role, account);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error revoking role approval:', error);
      throw this.handleError(error);
    }
  }

  async assignToStudent(
    serialNumber: string,
    schoolHash: string,
    studentHash: string
  ): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.assignToStudent(serialNumber, schoolHash, studentHash);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error assigning to student:', error);
      throw this.handleError(error);
    }
  }

  /**
   * @description Standardized error handling for contract calls.
   * @param error The raw error object.
   * @returns A structured ContractError object.
   */
  private handleError(error: unknown): ContractError {
    if (error instanceof Error) {
      // Attempt to parse Ethers error for better message
      const reason = (error as { reason?: string }).reason;
      if (reason) {
        return { message: reason };
      }
      return { message: error.message };
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      return {
        message: (error as { message: string }).message,
        data: error
      };
    }

    return {
      message: 'Unknown error occurred'
    };
  }
}

// Helper function to get contract role constants
export const getRoleConstants = () => ({
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  FABRICANTE_ROLE: '0xbe0c84bfff967b2deb88bd0540d4a796d0ebfdcb72262ced26f1892b419e6457',
  AUDITOR_HW_ROLE: '0x49c0376dc7caa3eab0c186e9bc20bf968b0724fea74a37706c35f59bc5d8b15b',
  TECNICO_SW_ROLE: '0xeeb4ddf6a0e2f06cb86713282a0b88ee789709e92a08b9e9b4ce816bbb13fcaf',
  ESCUELA_ROLE: '0xa8f5858ea94a9ede7bc5dd04119dcc24b3b02a20be15d673993d8b6c2a901ef9'
});

// Helper function to get netbook state labels
export const getNetbookState = getNetbookStateInfo;
