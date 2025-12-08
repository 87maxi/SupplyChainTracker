import { ethers, Signer } from 'ethers';

export interface Role {
  name: string;
  role: string;
  description: string;
}

export interface UserRoleStatus {
  role: string;
  account: string;
  // State is a number (0: Pending, 1: Approved, 2: Rejected, 3: Canceled)
  state: number;
  approvalTimestamp: string;
  approvedBy: string;
}

export interface Netbook {
  serialNumber: string;
  batchId: string;
  initialModelSpecs: string;
  hwAuditor: string;
  hwIntegrityPassed: boolean;
  hwReportHash: string;
  swTechnician: string;
  osVersion: string;
  swValidationPassed: boolean;
  destinationSchoolHash: string;
  studentIdHash: string;
  distributionTimestamp: string;
  state: number;
}

export interface NetbookState {
  id: number;
  name: string;
  label: string;
  description: string;
}

export interface TransactionHash {
  hash: string;
}

export interface ContractError {
  message: string;
  data?: unknown;
}

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (eventName: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: Signer | null;
  error: string | null;
  isLoading: boolean;
}

export interface Web3ContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isAdmin: boolean;
  isDefaultAdmin: boolean;
  isManufacturer: boolean;
  isAuditor: boolean;
  isTechnician: boolean;
  isSchool: boolean;
  hasAnyRole: boolean;
  refreshRoles: () => Promise<void>;
  web3Service: Web3Service | null;
}

// Define the structure for the contract's NetbookReport return value
export interface NetbookReport {
  serialNumber: string;
  batchId: string;
  initialModelSpecs: string;
  hwAuditor: string;
  hwIntegrityPassed: boolean;
  hwReportHash: string;
  swTechnician: string;
  osVersion: string;
  swValidationPassed: boolean;
  destinationSchoolHash: string;
  studentIdHash: string;
  distributionTimestamp: string;
  state: number;
}

// Forward declaration for Web3Service to avoid circular dependency
// The actual class will be imported in Web3Context.tsx
export declare class Web3Service {
  constructor(signer: Signer | null);
  hasRole(role: string, account: string): Promise<boolean>;
  getRoleStatus(role: string, account: string): Promise<UserRoleStatus>;
  getAllPendingRoleRequests(): Promise<UserRoleStatus[]>;
  grantRole(role: string, account: string): Promise<string>;
  revokeRole(role: string, account: string): Promise<string>;
  getNetbookReport(serialNumber: string): Promise<NetbookReport>;
  getNetbookState(serialNumber: string): Promise<number>;
  registerNetbooks(serialNumbers: string[], batchIds: string[], modelSpecs: string[]): Promise<string>;
  auditHardware(serialNumber: string, integrityPassed: boolean, reportHash: string): Promise<string>;
  validateSoftware(serialNumber: string, osVersion: string, validationPassed: boolean): Promise<string>;
  requestRoleApproval(role: string): Promise<string>;
  approveRole(role: string, account: string): Promise<string>;
  rejectRole(role: string, account: string): Promise<string>;
  cancelRoleRequest(role: string): Promise<string>;
  revokeRoleApproval(role: string, account: string): Promise<string>;
  assignToStudent(serialNumber: string, schoolHash: string, studentHash: string): Promise<string>;
}
