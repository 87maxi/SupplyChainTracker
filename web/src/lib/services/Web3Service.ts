"use client";

import { ethers, Signer } from 'ethers';
import SupplyChainTrackerABI from '../../contracts/SupplyChainTrackerABI.json';
import { getNetbookStateInfo } from '../utils';
import { ContractError, UserRoleStatus, NetbookReport, LifecycleStep } from '../types';

// Contract configuration
const CONTRACT_ADDRESS: string = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const RPC_URL: string = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';

/**
 * @description Service class for interacting with the SupplyChainTracker smart contract.
 * It uses the provided signer for transactions and a read-only provider for view functions.
 */
export class Web3Service {
  public readOnlyContract: ethers.Contract;
  private signer: Signer | null;
  private eventListeners: Map<string, (event: any) => void> = new Map();

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
   * @description Gets all pending role requests from the contract.
   * @returns Array of RoleApproval objects for all pending requests.
   */
  async getAllPendingRoleRequests(): Promise<UserRoleStatus[]> {
    try {
      console.log('Fetching all pending role requests...');
      const result = await this.readOnlyContract.getAllPendingRoleRequests();
      console.log('Raw pending requests result:', result);
      
      // Map the array result to UserRoleStatus objects
      const mappedResult = result.map((item: [string, string, bigint, bigint, string]) => ({
        role: item[0] as string,
        account: item[1] as string,
        state: Number(item[2]), // Convert BigInt to number
        approvalTimestamp: item[3].toString(), // Convert BigInt timestamp to string
        approvedBy: item[4] as string,
      }));
      
      console.log('Mapped pending requests:', mappedResult);
      return mappedResult;
    } catch (error) {
      console.error('Error getting all pending role requests:', error);
      throw this.handleError(error);
    }
  }

  /**
   * @description Fetches the full report for a netbook by serial number.
   * @param serialNumber The netbook's serial number.
   * @returns The netbook report object.
   */
  async fetchNetbookReport(serialNumber: string): Promise<NetbookReport> {
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
        state: this.mapStateToLifecycleStep(result[12]), // BigInt to LifecycleStep
      };
    } catch (error) {
      console.error('Error fetching netbook report:', error);
      throw this.handleError(error);
    }
  }

  /**
   * @description Fetches the current lifecycle step of a netbook.
   * @param serialNumber The netbook's serial number.
   * @returns The lifecycle step (LifecycleStep enum).
   */
  async fetchNetbookLifecycleStep(serialNumber: string): Promise<LifecycleStep> {
    try {
      const stateBigInt = await this.readOnlyContract.getNetbookState(serialNumber);
      return this.mapStateToLifecycleStep(stateBigInt);
    } catch (error) {
      console.error('Error fetching netbook lifecycle step:', error);
      throw this.handleError(error);
    }
  }

  /**
   * @description Maps a state value from the contract to LifecycleStep.
   * @param state The state value as BigInt or number.
   * @returns The mapped LifecycleStep.
   * @throws Error if the state is invalid.
   */
  private mapStateToLifecycleStep(state: bigint | number): LifecycleStep {
    const stateNumber = Number(state);
    if (!Object.values(LifecycleStep).includes(stateNumber as LifecycleStep)) {
      throw new Error(`Invalid netbook state: ${stateNumber}`);
    }
    return stateNumber as LifecycleStep;
  }

  async getRoleAdmin(role: string): Promise<string> {
    try {
      const result = await this.readOnlyContract.getRoleAdmin(role);
      return result as string;
    } catch (error) {
      console.error('Error getting role admin:', error);
      throw this.handleError(error);
    }
  }

  async getPendingRequestIndex(role: string, account: string): Promise<number> {
    try {
      const result = await this.readOnlyContract.pendingRequestIndex(role, account);
      return Number(result);
    } catch (error) {
      console.error('Error getting pending request index:', error);
      throw this.handleError(error);
    }
  }

  async getPendingRequest(index: number): Promise<{ role: string; account: string }> {
    try {
      const result = await this.readOnlyContract.pendingRequests(index);
      return {
        role: result[0] as string,
        account: result[1] as string
      };
    } catch (error) {
      console.error('Error getting pending request:', error);
      throw this.handleError(error);
    }
  }

  async getRoleApproval(role: string, account: string): Promise<UserRoleStatus> {
    try {
      const result = await this.readOnlyContract.roleApprovals(role, account);
      
      // Explicitly convert BigInts to string/number for frontend compatibility
      return {
        role: result[0] as string,
        account: result[1] as string,
        state: Number(result[2]), // Convert BigInt to number (0: Pending, 1: Approved, 2: Rejected, 3: Canceled)
        approvalTimestamp: result[3].toString(), // Convert BigInt timestamp to string
        approvedBy: result[4] as string,
      };
    } catch (error) {
      console.error('Error getting role approval:', error);
      throw this.handleError(error);
    }
  }

  async supportsInterface(interfaceId: string): Promise<boolean> {
    try {
      const result = await this.readOnlyContract.supportsInterface(interfaceId);
      return Boolean(result);
    } catch (error) {
      console.error('Error checking interface support:', error);
      throw this.handleError(error);
    }
  }

  // --- Contract interaction methods (Transaction/Write) ---

  async grantRole(role: string, account: string): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.grantRole(role, account);
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
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
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
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
      const address = await this.signer?.getAddress();
      if (!address) throw new Error('Signer address not available.');
      
      await this.validateRole(getRoleConstants().FABRICANTE_ROLE, address);
      const tx = await contract.registerNetbooks(serialNumbers, batchIds, modelSpecs);
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
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
      const address = await this.signer?.getAddress();
      if (!address) throw new Error('Signer address not available.');
      
      await this.validateRole(getRoleConstants().AUDITOR_HW_ROLE, address);
      // Convert string to bytes32 if needed
      const formattedReportHash = reportHash.startsWith('0x') ? reportHash : `0x${reportHash}`;
      const tx = await contract.auditHardware(serialNumber, integrityPassed, formattedReportHash);
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
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
      const address = await this.signer?.getAddress();
      if (!address) throw new Error('Signer address not available.');
      
      await this.validateRole(getRoleConstants().TECNICO_SW_ROLE, address);
      const tx = await contract.validateSoftware(serialNumber, osVersion, validationPassed);
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
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
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
      return tx.hash;
    } catch (error) {
      console.error('Error requesting role approval:', error);
      throw this.handleError(error);
    }
  }

  async approveRole(role: string, account: string): Promise<string> {
    try {
      console.log('Approving role in Web3Service:', { role, account });
      
      // Validate parameters
      if (!role || role === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        throw new Error('Invalid role: Role cannot be empty or default admin role');
      }

      if (!account || account === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid account: Account cannot be empty or zero address');
      }

      const contract = await this.getContractWithSigner();
      console.log('Contract address:', await contract.getAddress());
      console.log('Signer address:', await contract.runner?.getAddress?.());
      
      const tx = await contract.approveRole(role, account);
      console.log('Transaction sent:', tx.hash);
      
      // Log transaction details
      console.log('Transaction details:', {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        data: tx.data,
        value: tx.value?.toString()
      });
      
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
      console.log('Transaction confirmed:', tx.hash);
      return tx.hash;
    } catch (error: any) {
      console.error('Error approving role:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        reason: error?.reason,
        stack: error?.stack,
        role,
        account
      });
      
      // Log additional error details if available
      if (error?.error) {
        console.error('Nested error:', error.error);
      }
      
      if (error?.data) {
        console.error('Error data:', error.data);
      }
      
      throw this.handleError(error);
    }
  }

  async rejectRole(role: string, account: string): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.rejectRole(role, account);
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
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
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
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
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
      return tx.hash;
    } catch (error) {
      console.error('Error revoking role approval:', error);
      throw this.handleError(error);
    }
  }

  async renounceRole(role: string, callerConfirmation: string): Promise<string> {
    try {
      const contract = await this.getContractWithSigner();
      const tx = await contract.renounceRole(role, callerConfirmation);
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
      return tx.hash;
    } catch (error) {
      console.error('Error renouncing role:', error);
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
      const address = await this.signer?.getAddress();
      if (!address) throw new Error('Signer address not available.');
      
      await this.validateRole(getRoleConstants().ESCUELA_ROLE, address);
      // Convert strings to bytes32 if needed
      const formattedSchoolHash = schoolHash.startsWith('0x') ? schoolHash : `0x${schoolHash}`;
      const formattedStudentHash = studentHash.startsWith('0x') ? studentHash : `0x${studentHash}`;
      const tx = await contract.assignToStudent(serialNumber, formattedSchoolHash, formattedStudentHash);
      // Wait for transaction with custom polling interval to reduce RPC calls
      await tx.wait(1, 2000); // 1 confirmation, 2000ms polling interval
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

  /**
   * @description Sets up event listeners for contract events.
   * @param eventName The name of the event to listen for.
   * @param callback The callback function to execute when the event is emitted.
   */
  public setupEventListener(eventName: string, callback: (event: any) => void): void {
    if (this.eventListeners.has(eventName)) {
      this.readOnlyContract.off(eventName, this.eventListeners.get(eventName));
    }
    this.eventListeners.set(eventName, callback);
    this.readOnlyContract.on(eventName, callback);
  }

  /**
   * @description Removes all event listeners.
   */
  public removeAllEventListeners(): void {
    this.eventListeners.forEach((callback, eventName) => {
      this.readOnlyContract.off(eventName, callback);
    });
    this.eventListeners.clear();
  }

  /**
   * @description Validates if the user has the required role before executing a transaction.
   * @param role The role hash to validate.
   * @param account The account address to check.
   * @throws Error if the user does not have the required role.
   */
  private async validateRole(role: string, account: string): Promise<void> {
    const hasRole = await this.hasRole(role, account);
    if (!hasRole) {
      throw new Error('User does not have the required role to perform this action.');
    }
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

// Async function to fetch role constants from contract
export const fetchRoleConstants = async (web3Service: Web3Service) => {
  try {
    const [
      DEFAULT_ADMIN_ROLE,
      FABRICANTE_ROLE,
      AUDITOR_HW_ROLE,
      TECNICO_SW_ROLE,
      ESCUELA_ROLE
    ] = await Promise.all([
      web3Service.readOnlyContract.DEFAULT_ADMIN_ROLE(),
      web3Service.readOnlyContract.FABRICANTE_ROLE(),
      web3Service.readOnlyContract.AUDITOR_HW_ROLE(),
      web3Service.readOnlyContract.TECNICO_SW_ROLE(),
      web3Service.readOnlyContract.ESCUELA_ROLE()
    ]);
    
    return {
      DEFAULT_ADMIN_ROLE,
      FABRICANTE_ROLE,
      AUDITOR_HW_ROLE,
      TECNICO_SW_ROLE,
      ESCUELA_ROLE
    };
  } catch (error) {
    console.error('Error fetching role constants from contract:', error);
    // Fallback to hardcoded values
    return getRoleConstants();
  }
};

// Helper function to get netbook state labels
export const getNetbookState = getNetbookStateInfo;