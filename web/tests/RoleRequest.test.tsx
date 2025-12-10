import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleRequest } from '@/components/roles/RoleRequest';

// Mock del contexto Web3
const mockWeb3Service = {
  getRoleStatus: jest.fn(),
  requestRoleApproval: jest.fn().mockResolvedValue('0xabc123'),
  cancelRoleRequest: jest.fn().mockResolvedValue('0xdef456'),
  setupEventListener: jest.fn(),
  removeAllEventListeners: jest.fn()
};

jest.mock('@/lib/contexts/Web3Context', () => ({
  useWeb3: () => ({
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    web3Service: mockWeb3Service
  })
}));

// Mock de servicios
jest.mock('@/lib/services/Web3Service', () => ({
  getRoleConstants: () => ({
    FABRICANTE_ROLE: 'FAB_ROLE',
    AUDITOR_HW_ROLE: 'AUD_HW_ROLE',
    TECNICO_SW_ROLE: 'TEC_SW_ROLE',
    ESCUELA_ROLE: 'ESC_ROLE'
  })
}));

// Mock de toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock de router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn()
  })
}));

describe('RoleRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpiar el DOM
    document.body.innerHTML = '<div id="__next"></div>';
  });

  it('debería mostrar el formulario de solicitud de roles', async () => {
    // Configurar mock para devolver estado "No Solicitado" (3) para todos los roles
    mockWeb3Service.getRoleStatus.mockImplementation((role) => Promise.resolve({
      state: 3, // Canceled (simula "No Solicitado")
      account: '0x0000000000000000000000000000000000000000'
    }));
    
    render(<RoleRequest />);
    
    expect(await screen.findByText('Solicitar Roles')).toBeInTheDocument();
    expect(await screen.findByText('Fabricante')).toBeInTheDocument();
    expect(await screen.findByText('Auditor de Hardware')).toBeInTheDocument();
    expect(await screen.findByText('Técnico de Software')).toBeInTheDocument();
    expect(await screen.findByText('Escuela')).toBeInTheDocument();
  });

  it('debería permitir solicitar un rol que está en estado "No Solicitado"', async () => {
    // Configurar mock para devolver estado "No Solicitado" (3)
    mockWeb3Service.getRoleStatus.mockResolvedValue({
      state: 3, // Canceled (simula "No Solicitado")
      account: '0x0000000000000000000000000000000000000000'
    });
    
    render(<RoleRequest />);
    
    const requestButton = await screen.findAllByRole('button', { name: /Solicitar Acceso/i });
    fireEvent.click(requestButton[0]);
    
    await waitFor(() => {
      expect(mockWeb3Service.requestRoleApproval).toHaveBeenCalledWith('FAB_ROLE', expect.anything());
    });
    
    await waitFor(() => {
      expect(require('sonner').toast.success).toHaveBeenCalledWith('Solicitud enviada con éxito', expect.any(Object));
    });
  });

  it('debería mostrar "Rol Activo" cuando el estado es Approved (1)', async () => {
    // Configurar mock para devolver estado "Approved" (1)
    mockWeb3Service.getRoleStatus.mockResolvedValue({
      state: 1, // Approved
      account: '0x1234567890123456789012345678901234567890'
    });
    
    render(<RoleRequest />);
    
    expect(await screen.findByText(/Rol Activo/)).toBeInTheDocument();
    expect(await screen.findByText(/Acceso Concedido/)).toBeInTheDocument();
  });

  it('debería permitir cancelar una solicitud pendiente', async () => {
    // Configurar mock para devolver estado "Pending" (0)
    mockWeb3Service.getRoleStatus.mockResolvedValue({
      state: 0, // Pending
      account: '0x1234567890123456789012345678901234567890'
    });

    render(<RoleRequest />);
    
    const cancelButton = await screen.findByRole('button', { name: /Cancelar Solicitud/i });
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(mockWeb3Service.cancelRoleRequest).toHaveBeenCalledWith('FAB_ROLE');
    });

    await waitFor(() => {
      expect(require('sonner').toast.success).toHaveBeenCalledWith('Solicitud cancelada con éxito', expect.any(Object));
    });
  });

  it('debería manejar errores al solicitar un rol', async () => {
    // Configurar mock para devolver estado "No Solicitado" (3) y error en solicitud
    mockWeb3Service.getRoleStatus.mockResolvedValue({
      state: 3, // Canceled (simula "No Solicitado")
      account: '0x0000000000000000000000000000000000000000'
    });
    mockWeb3Service.requestRoleApproval.mockRejectedValue(new Error('Error de red'));

    render(<RoleRequest />);
    
    const requestButton = await screen.findAllByRole('button', { name: /Solicitar Acceso/i });
    fireEvent.click(requestButton[0]);
    
    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Error al enviar solicitud', { description: 'Error de red' });
    });
  });

  it('debería manejar errores al cancelar una solicitud', async () => {
    // Configurar mock para devolver estado "Pending" (0) y error en cancelación
    mockWeb3Service.getRoleStatus.mockResolvedValue({
      state: 0, // Pending
      account: '0x1234567890123456789012345678901234567890'
    });
    mockWeb3Service.cancelRoleRequest.mockRejectedValue(new Error('Error de red'));

    render(<RoleRequest />);
    
    const cancelButton = await screen.findByRole('button', { name: /Cancelar Solicitud/i });
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Error al cancelar solicitud', { description: 'Error de red' });
    });
  });

  it('debería actualizar los estados de roles cuando se emite un evento RoleStatusUpdated', async () => {
    // Configurar mock para devolver estado inicial "Pending" (0)
    mockWeb3Service.getRoleStatus.mockResolvedValue({
      state: 0, // Pending
      account: '0x1234567890123456789012345678901234567890'
    });

    render(<RoleRequest />);
    
    // Simular evento de actualización de rol
    const eventCallback = mockWeb3Service.setupEventListener.mock.calls[0][1];
    eventCallback({
      event: 'RoleStatusUpdated',
      args: {
        role: 'FAB_ROLE',
        account: '0x1234567890123456789012345678901234567890',
        state: 1 // Aprobado
      }
    });
    
    expect(await screen.findByText(/Rol Activo/i)).toBeInTheDocument();
  });

  it('debería permitir solicitar múltiples roles', async () => {
    // Configurar mock para múltiples roles
    mockWeb3Service.getRoleStatus.mockImplementation((role) => {
      if (role === 'FAB_ROLE') {
        return Promise.resolve({ state: 3, account: '0x0000000000000000000000000000000000000000' }); // Canceled
      } else if (role === 'AUD_HW_ROLE') {
        return Promise.resolve({ state: 0, account: '0x1234567890123456789012345678901234567890' }); // Pending
      }
      return Promise.resolve({ state: 3, account: '0x0000000000000000000000000000000000000000' });
    });

    render(<RoleRequest />);
    
    // Solicitar rol de Fabricante
    const requestButtons = await screen.findAllByRole('button', { name: /Solicitar Acceso/i });
    fireEvent.click(requestButtons[0]); // Primer botón (Fabricante)
    
    await waitFor(() => {
      expect(mockWeb3Service.requestRoleApproval).toHaveBeenCalledWith('FAB_ROLE');
    });
  });
});