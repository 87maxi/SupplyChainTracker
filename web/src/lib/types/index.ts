export interface Role {
  name: string;
  role: string;
  description: string;
}

export interface UserRoleStatus {
  role: string;
  account: string;
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