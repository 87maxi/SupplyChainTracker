import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleManagement } from '@/components/admin/RoleManagement';

// Mock del contexto Web3
jest.mock('@/lib/contexts/Web3Context', () => ({
  useWeb3: () => ({
    isConnected: true,
    isLoading: false,
    connectWallet: jest.fn(),
    refreshRoles: jest.fn(),
    web3Service: {
      getRoleStatus: jest.fn().mockResolvedValue({
        role: 'FAB_ROLE',
        account: '0x1234567890123456789012345678901234567890',
        state: 0 // Pendiente
      }),
      approveRole: jest.fn().mockResolvedValue('0xabc123'),
      rejectRole: jest.fn().mockResolvedValue('0xdef456'),
      revokeRoleApproval: jest.fn().mockResolvedValue('0xghi789')
    }
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

describe('RoleManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpiar los inputs del DOM
    document.body.innerHTML = '<div id="__next"></div>';
  });

  it('debería renderizar el formulario de búsqueda de usuarios', () => {
    render(<RoleManagement />);

    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByText('Gestión de Roles')).toBeInTheDocument();
  });

  it('debería mostrar error si la dirección es inválida', async () => {
    // Mock de función de validación
    jest.spyOn(require('@/lib/utils'), 'isValidAddress').mockReturnValue(false);

    render(<RoleManagement />);

    const input = screen.getByPlaceholderText('0x...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(input, { target: { value: 'dirección-inválida' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Dirección inválida');
    });
  });

  it('debería buscar un usuario por dirección y mostrar sus estados de rol', async () => {
    // Mock de función de validación
    jest.spyOn(require('@/lib/utils'), 'isValidAddress').mockReturnValue(true);

    render(<RoleManagement />);

    const input = screen.getByPlaceholderText('0x...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890' } });
    fireEvent.click(searchButton);

    // Simulamos que se encontró un usuario con rol pendiente
    await waitFor(() => {
      expect(screen.getByText(/Estado de Roles para/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Fabricante/i)).toBeInTheDocument();
    expect(screen.getByText(/Pendiente/i)).toBeInTheDocument();
  });

  it('debería permitir aprobar una solicitud de rol pendiente', async () => {
    // Mock para que el usuario tenga un rol pendiente
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      isLoading: false,
      connectWallet: jest.fn(),
      refreshRoles: jest.fn(),
      web3Service: {
        getRoleStatus: jest
          .fn()
          .mockResolvedValueOnce({ // Para búsqueda
            role: 'FAB_ROLE',
            account: '0x1234567890123456789012345678901234567890',
            state: 0
          })
          .mockResolvedValue({ // Para refresh
            role: 'FAB_ROLE',
            account: '0x1234567890123456789012345678901234567890',
            state: 1 // Aprobado
          }),
        approveRole: jest.fn().mockResolvedValue('0xabc123'),
        rejectRole: jest.fn(),
        revokeRoleApproval: jest.fn()
      }
    }));

    // Mock validación
    jest.spyOn(require('@/lib/utils'), 'isValidAddress').mockReturnValue(true);

    render(<RoleManagement />);

    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/Pendiente/i)).toBeInTheDocument();
    });

    // Buscar botón de Aprobar
    const approveButton = screen.getByRole('button', { name: /Aprobar/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(require('@/lib/contexts/Web3Context').useWeb3().web3Service.approveRole)
        .toHaveBeenCalledWith('FAB_ROLE', '0x1234567890123456789012345678901234567890');
    });

    await waitFor(() => {
      expect(require('sonner').toast.success).toHaveBeenCalledWith('Rol aprobado con éxito');
    });

    // Después de aprobar, debería cambiar a Aprobado
    expect(await screen.findByText(/Aprobado/i)).toBeInTheDocument();
  });

  it('debería permitir rechazar una solicitud pendiente', async () => {
    // Similar al anterior, para rechazar
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      isLoading: false,
      connectWallet: jest.fn(),
      refreshRoles: jest.fn(),
      web3Service: {
        getRoleStatus: jest
          .fn()
          .mockResolvedValue({ role: 'FAB_ROLE', account: '0x123...', state: 0 }),
        rejectRole: jest.fn().mockResolvedValue('0xdef456'),
        approveRole: jest.fn(),
        revokeRoleApproval: jest.fn()
      }
    }));

    jest.spyOn(require('@/lib/utils'), 'isValidAddress').mockReturnValue(true);

    render(<RoleManagement />);

    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: '0x123...' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      const rejectButton = screen.getByRole('button', { name: /Rechazar/i });
      fireEvent.click(rejectButton);
    });

    await waitFor(() => {
      expect(require('@/lib/contexts/Web3Context').useWeb3().web3Service.rejectRole)
        .toHaveBeenCalledWith('FAB_ROLE', '0x123...');
      expect(require('sonner').toast.success).toHaveBeenCalledWith('Rol rechazado con éxito');
    });
  });

  it('debería permitir revocar un rol aprobado', async () => {
    // Mock para rol aprobado
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      isLoading: false,
      connectWallet: jest.fn(),
      refreshRoles: jest.fn(),
      web3Service: {
        getRoleStatus: jest
          .fn()
          .mockResolvedValue({ role: 'FAB_ROLE', account: '0x123...', state: 1 }), // Aprobado
        revokeRoleApproval: jest.fn().mockResolvedValue('0xghi789'),
        approveRole: jest.fn(),
        rejectRole: jest.fn()
      }
    }));

    jest.spyOn(require('@/lib/utils'), 'isValidAddress').mockReturnValue(true);

    render(<RoleManagement />);

    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: '0x123...' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      const revokeButton = screen.getByRole('button', { name: /Revocar/i });
      fireEvent.click(revokeButton);
    });

    await waitFor(() => {
      expect(require('@/lib/contexts/Web3Context').useWeb3().web3Service.revokeRoleApproval)
        .toHaveBeenCalledWith('FAB_ROLE', '0x123...');
      expect(require('sonner').toast.success).toHaveBeenCalledWith('Rol revocado con éxito');
    });
  });

  it('debería manejar errores al aprobar un rol', async () => {
    // Mock para error en aprobación
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      isLoading: false,
      connectWallet: jest.fn(),
      refreshRoles: jest.fn(),
      web3Service: {
        getRoleStatus: jest
          .fn()
          .mockResolvedValue({ role: 'FAB_ROLE', account: '0x123...', state: 0 }), // Pendiente
        approveRole: jest.fn().mockRejectedValue(new Error('Error de red')),
        rejectRole: jest.fn(),
        revokeRoleApproval: jest.fn()
      }
    }));

    jest.spyOn(require('@/lib/utils'), 'isValidAddress').mockReturnValue(true);

    render(<RoleManagement />);

    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: '0x123...' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      const approveButton = screen.getByRole('button', { name: /Aprobar/i });
      fireEvent.click(approveButton);
    });

    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Error al aprobar rol', { description: 'Error de red' });
    });
  });

  it('debería manejar errores al rechazar un rol', async () => {
    // Mock para error en rechazo
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      isLoading: false,
      connectWallet: jest.fn(),
      refreshRoles: jest.fn(),
      web3Service: {
        getRoleStatus: jest
          .fn()
          .mockResolvedValue({ role: 'FAB_ROLE', account: '0x123...', state: 0 }), // Pendiente
        rejectRole: jest.fn().mockRejectedValue(new Error('Error de red')),
        approveRole: jest.fn(),
        revokeRoleApproval: jest.fn()
      }
    }));

    jest.spyOn(require('@/lib/utils'), 'isValidAddress').mockReturnValue(true);

    render(<RoleManagement />);

    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: '0x123...' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      const rejectButton = screen.getByRole('button', { name: /Rechazar/i });
      fireEvent.click(rejectButton);
    });

    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Error al rechazar rol', { description: 'Error de red' });
    });
  });

  it('debería manejar múltiples roles para un mismo usuario', async () => {
    // Mock para múltiples roles
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      isLoading: false,
      connectWallet: jest.fn(),
      refreshRoles: jest.fn(),
      web3Service: {
        getRoleStatus: jest
          .fn()
          .mockImplementation((role) => {
            if (role === 'FAB_ROLE') {
              return { role: 'FAB_ROLE', account: '0x123...', state: 1 }; // Aprobado
            } else if (role === 'AUD_HW_ROLE') {
              return { role: 'AUD_HW_ROLE', account: '0x123...', state: 0 }; // Pendiente
            }
            return { role, account: '0x123...', state: 3 }; // Canceled
          }),
        approveRole: jest.fn().mockResolvedValue('0xabc123'),
        rejectRole: jest.fn().mockResolvedValue('0xdef456'),
        revokeRoleApproval: jest.fn().mockResolvedValue('0xghi789')
      }
    }));

    jest.spyOn(require('@/lib/utils'), 'isValidAddress').mockReturnValue(true);

    render(<RoleManagement />);

    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: '0x123...' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/Fabricante/i)).toBeInTheDocument();
      expect(screen.getByText(/Aprobado/i)).toBeInTheDocument();
      expect(screen.getByText(/Auditor de Hardware/i)).toBeInTheDocument();
      expect(screen.getByText(/Pendiente/i)).toBeInTheDocument();
    });
  });
});
