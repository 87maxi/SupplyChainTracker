import { describe, it, beforeEach, afterEach, jest } from '@jest/globals';
import { Web3Service, getRoleConstants } from '@/lib/services/Web3Service';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Mock ethers
jest.mock('ethers', () => {
  const mockContract = {
    registerNetbook: jest.fn(),
    auditHardware: jest.fn(),
    validateSoftware: jest.fn(),
    assignToStudent: jest.fn(),
    getVerificationReport: jest.fn(),
    getDeviceHistory: jest.fn(),
    getAllNetbooks: jest.fn(),
    devices: jest.fn(),
    getDeviceStatus: jest.fn(),
    nextDeviceId: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn(),
    hasRole: jest.fn(),
    getRoleMember: jest.fn()
  };

  return {
    ...jest.requireActual('ethers'),
    ethers: {
      JsonRpcProvider: jest.fn(() => ({
        getSigner: jest.fn(() => ({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          provider: { send: jest.fn() }
        }))
      })),
      Contract: jest.fn(() => mockContract),
      id: jest.fn((role) => `0x${role.toLowerCase().replace('_', '').padEnd(64, '0')}`)
    }
  };
});

// Setup mock window.ethereum
const mockEthereum = {
  request: jest.fn()
};

Object.defineProperty(global, 'window', {
  value: {
    ethereum: mockEthereum
  },
  writable: true
});

describe('Web3Service', () => {
  let web3Service: Web3Service;
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    web3Service = new Web3Service();
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  describe('Initialization', () => {
    it('should initialize with default provider when no signer is provided', () => {
      expect(web3Service).toBeInstanceOf(Web3Service);
      // The service should use the default provider from window.ethereum
      expect(mockEthereum.request).not.toHaveBeenCalled();
    });

    it('should initialize with provided signer', () => {
      const mockSigner = 'mockSigner';
      const web3ServiceWithSigner = new Web3Service(mockSigner as any);
      expect(web3ServiceWithSigner).toBeInstanceOf(Web3Service);
    });
  });

  describe('Contract Interaction Methods', () => {
    it('should call registerNetbook on the contract with correct parameters', async () => {
      const batchId = 'batch-001';
      const serialNumber = 'SN001';
      
      const mockTx = { wait: jest.fn().mockResolvedValue('transaction-receipt') };
      (global as any).ethers.Contract.mock.results[0].value.registerNetbook.mockResolvedValue(mockTx);
      
      const result = await web3Service.registerNetbook(batchId, serialNumber);
      
      expect((global as any).ethers.Contract.mock.results[0].value.registerNetbook).toHaveBeenCalledWith(batchId, serialNumber);
      expect(result).toBe('transaction-receipt');
    });

    it('should call auditHardware on the contract with correct parameters', async () => {
      const deviceId = 1;
      const report = 'Hardware audit report';
      
      const mockTx = { wait: jest.fn().mockResolvedValue('transaction-receipt') };
      (global as any).ethers.Contract.mock.results[0].value.auditHardware.mockResolvedValue(mockTx);
      
      const result = await web3Service.auditHardware(deviceId, report);
      
      expect((global as any).ethers.Contract.mock.results[0].value.auditHardware).toHaveBeenCalledWith(deviceId, report);
      expect(result).toBe('transaction-receipt');
    });

    it('should call validateSoftware on the contract with correct parameters', async () => {
      const deviceId = 1;
      const report = 'Software validation report';
      
      const mockTx = { wait: jest.fn().mockResolvedValue('transaction-receipt') };
      (global as any).ethers.Contract.mock.results[0].value.validateSoftware.mockResolvedValue(mockTx);
      
      const result = await web3Service.validateSoftware(deviceId, report);
      
      expect((global as any).ethers.Contract.mock.results[0].value.validateSoftware).toHaveBeenCalledWith(deviceId, report);
      expect(result).toBe('transaction-receipt');
    });

    it('should call assignToStudent on the contract with correct parameters', async () => {
      const deviceId = 1;
      const studentId = 'student-001';
      const studentName = 'John Doe';
      
      const mockTx = { wait: jest.fn().mockResolvedValue('transaction-receipt') };
      (global as any).ethers.Contract.mock.results[0].value.assignToStudent.mockResolvedValue(mockTx);
      
      const result = await web3Service.assignToStudent(deviceId, studentId, studentName);
      
      expect((global as any).ethers.Contract.mock.results[0].value.assignToStudent).toHaveBeenCalledWith(deviceId, studentId, studentName);
      expect(result).toBe('transaction-receipt');
    });
  });

  describe('Read Methods', () => {
    it('should call getVerificationReport on the contract and return formatted report', async () => {
      const reportId = 1;
      const mockReport = {
        id: { toNumber: jest.fn().mockReturnValue(reportId) },
        deviceId: { toNumber: jest.fn().mockReturnValue(1) },
        status: 'AUDITED',
        comments: 'Hardware audit passed',
        timestamp: { toNumber: jest.fn().mockReturnValue(1234567890) },
        verifier: '0x1234567890123456789012345678901234567890'
      };
      
      (global as any).ethers.Contract.mock.results[0].value.getVerificationReport.mockResolvedValue(mockReport);
      
      const result = await web3Service.getVerificationReport(reportId);
      
      expect((global as any).ethers.Contract.mock.results[0].value.getVerificationReport).toHaveBeenCalledWith(reportId);
      expect(result).toEqual({
        id: reportId,
        deviceId: 1,
        status: 'AUDITED',
        comments: 'Hardware audit passed',
        timestamp: 1234567890,
        verifier: '0x1234567890123456789012345678901234567890'
      });
    });

    it('should call getDeviceHistory on the contract', async () => {
      const deviceId = 1;
      const mockHistory = [{
        id: { toNumber: jest.fn().mockReturnValue(1) },
        action: 'REGISTERED',
        timestamp: { toNumber: jest.fn().mockReturnValue(1234567890) },
        actor: '0x1234567890123456789012345678901234567890'
      }];
      
      (global as any).ethers.Contract.mock.results[0].value.getDeviceHistory.mockResolvedValue(mockHistory);
      
      const result = await web3Service.getDeviceHistory(deviceId);
      
      expect((global as any).ethers.Contract.mock.results[0].value.getDeviceHistory).toHaveBeenCalledWith(deviceId);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        action: 'REGISTERED',
        timestamp: 12345678