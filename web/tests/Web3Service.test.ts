"use client";

import { Web3Service, getRoleConstants } from '@/lib/services/Web3Service';
import { ethers } from 'ethers';

// Mock de ethers
jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn().mockImplementation(() => ({
      getRoleStatus: jest.fn(),
      approveRole: jest.fn(),
      rejectRole: jest.fn(),
      revokeRoleApproval: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      getNetbookReport: jest.fn(),
      hasRole: jest.fn()
    })),
    JsonRpcProvider: jest.fn().mockImplementation(() => ({})),
    getAddress: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890')
  }
}));

describe('Web3Service', () => {
  let web3Service: Web3Service;
  let mockSigner: any;
  let mockContract: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock del signer
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
    };
    
    // Mock del contrato
    mockContract = {
      getRoleStatus: jest.fn(),
      approveRole: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) }),
      rejectRole: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) }),
      revokeRoleApproval: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) }),
      on: jest.fn(),
      off: jest.fn(),
      getNetbookReport: jest.fn(),
      hasRole: jest.fn()
    };
    
    // Mock de ethers.Contract
    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);
    
    web3Service = new Web3Service(mockSigner);
  });

  it('debería inicializarse correctamente', () => {
    expect(web3Service).toBeInstanceOf(Web3Service);
    expect(ethers.Contract).toHaveBeenCalled();
  });

  it('debería validar permisos antes de ejecutar transacciones', async () => {
    // Mock para que el usuario tenga el rol
    mockContract.hasRole.mockResolvedValue(true);
    
    await web3Service.approveRole(getRoleConstants().FABRICANTE_ROLE, '0x123...');
    
    expect(mockContract.hasRole).toHaveBeenCalledWith(getRoleConstants().FABRICANTE_ROLE, '0x1234567890123456789012345678901234567890');
    expect(mockContract.approveRole).toHaveBeenCalledWith(getRoleConstants().FABRICANTE_ROLE, '0x123...');
  });

  it('debería lanzar un error si el usuario no tiene permisos', async () => {
    // Mock para que el usuario no tenga el rol
    mockContract.hasRole.mockResolvedValue(false);
    
    await expect(
      web3Service.approveRole(getRoleConstants().FABRICANTE_ROLE, '0x123...')
    ).rejects.toThrow('User does not have the required role to perform this action.');
    
    expect(mockContract.approveRole).not.toHaveBeenCalled();
  });

  it('debería configurar listeners de eventos', () => {
    const callback = jest.fn();
    web3Service.setupEventListener('RoleStatusUpdated', callback);
    
    expect(mockContract.on).toHaveBeenCalledWith('RoleStatusUpdated', callback);
  });

  it('debería remover listeners de eventos', () => {
    const callback = jest.fn();
    web3Service.setupEventListener('RoleStatusUpdated', callback);
    web3Service.removeAllEventListeners();
    
    expect(mockContract.off).toHaveBeenCalledWith('RoleStatusUpdated', callback);
  });

  it('debería manejar errores en transacciones', async () => {
    // Mock para error en transacción
    mockContract.hasRole.mockResolvedValue(true);
    mockContract.approveRole.mockRejectedValue(new Error('Error de red'));
    
    await expect(
      web3Service.approveRole(getRoleConstants().FABRICANTE_ROLE, '0x123...')
    ).rejects.toThrow('Error de red');
  });

  it('debería obtener el reporte de una netbook', async () => {
    const mockNetbook = {
      serialNumber: 'NB-001-ABC',
      state: 2
    };
    mockContract.getNetbookReport.mockResolvedValue(mockNetbook);
    
    const result = await web3Service.getNetbookReport('NB-001-ABC');
    
    expect(result).toEqual(mockNetbook);
    expect(mockContract.getNetbookReport).toHaveBeenCalledWith('NB-001-ABC');
  });
});