import { ethers, Signer } from 'ethers';
import { Web3Service } from '../services/Web3Service';

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

export { Web3Service } from '../services/Web3Service';
