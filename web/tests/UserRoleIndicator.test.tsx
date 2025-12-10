import { render, screen } from '@testing-library/react';
import { UserRoleIndicator } from '@/components/layout/UserRoleIndicator';

// Mock del contexto Web3
jest.mock('@/lib/contexts/Web3Context', () => ({
  useWeb3: () => ({
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    isAdmin: false,
    isDefaultAdmin: false
  })
}));

describe('UserRoleIndicator', () => {
  it('debería mostrar mensaje de conexión cuando no hay wallet conectada', () => {
    // Mock para usuario desconectado
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: false,
      address: null,
      isAdmin: false,
      isDefaultAdmin: false
    }));
    
    render(<UserRoleIndicator />);
    
    expect(screen.getByText(/Conecta tu wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/para ver tus permisos/i)).toBeInTheDocument();
  });

  it('debería mostrar "Admin Principal" cuando es administrador por defecto', () => {
    // Mock para administrador por defecto
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isAdmin: true,
      isDefaultAdmin: true
    }));
    
    render(<UserRoleIndicator />);
    
    expect(screen.getByText(/Admin Principal/i)).toBeInTheDocument();
    expect(screen.getByText(/Control total del sistema/i)).toBeInTheDocument();
    expect(screen.getByText(/Crown/i)).toBeInTheDocument(); // Icon
  });

  it('debería mostrar "Usuario con Roles" cuando es admin pero no por defecto', () => {
    // Mock para administrador no principal
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isAdmin: true,
      isDefaultAdmin: false
    }));
    
    render(<UserRoleIndicator />);
    
    expect(screen.getByText(/Usuario con Roles/i)).toBeInTheDocument();
    expect(screen.getByText(/Acceso a funciones específicas/i)).toBeInTheDocument();
  });

  it('debería mostrar "Usuario Regular" cuando no tiene admin', () => {
    // Mock para usuario regular
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isAdmin: false,
      isDefaultAdmin: false
    }));
    
    render(<UserRoleIndicator />);
    
    expect(screen.getByText(/Usuario Regular/i)).toBeInTheDocument();
    expect(screen.getByText(/Acceso limitado - solicita roles para más funciones/i)).toBeInTheDocument();
    expect(screen.getByText(/User/i)).toBeInTheDocument(); // Icon
  });

  it('debería mostrar la dirección truncada del usuario', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: mockAddress,
      isAdmin: false,
      isDefaultAdmin: false
    }));
    
    render(<UserRoleIndicator />);
    
    const addressDisplay = screen.getByText(new RegExp(`Dirección:\s+${mockAddress.slice(0,6)}...${mockAddress.slice(-4)}`, 'i'));
    expect(addressDisplay).toBeInTheDocument();
  });

  it('debería mostrar "Fabricante" cuando el usuario tiene ese rol', () => {
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isAdmin: false,
      isDefaultAdmin: false,
      isManufacturer: true
    }));
    
    render(<UserRoleIndicator />);
    
    expect(screen.getByText(/Fabricante/i)).toBeInTheDocument();
    expect(screen.getByText(/Registro de netbooks/i)).toBeInTheDocument();
  });

  it('debería mostrar "Auditor de Hardware" cuando el usuario tiene ese rol', () => {
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isAdmin: false,
      isDefaultAdmin: false,
      isAuditor: true
    }));
    
    render(<UserRoleIndicator />);
    
    expect(screen.getByText(/Auditor de Hardware/i)).toBeInTheDocument();
    expect(screen.getByText(/Verificación de hardware/i)).toBeInTheDocument();
  });

  it('debería mostrar "Técnico de Software" cuando el usuario tiene ese rol', () => {
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isAdmin: false,
      isDefaultAdmin: false,
      isTechnician: true
    }));
    
    render(<UserRoleIndicator />);
    
    expect(screen.getByText(/Técnico de Software/i)).toBeInTheDocument();
    expect(screen.getByText(/Validación de software/i)).toBeInTheDocument();
  });

  it('debería mostrar "Escuela" cuando el usuario tiene ese rol', () => {
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isAdmin: false,
      isDefaultAdmin: false,
      isSchool: true
    }));
    
    render(<UserRoleIndicator />);
    
    expect(screen.getByText(/Escuela/i)).toBeInTheDocument();
    expect(screen.getByText(/Asignación de netbooks/i)).toBeInTheDocument();
  });

  it('debería mostrar múltiples roles cuando el usuario tiene más de uno', () => {
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isAdmin: false,
      isDefaultAdmin: false,
      isManufacturer: true,
      isAuditor: true
    }));
    
    render(<UserRoleIndicator />);
    
    expect(screen.getByText(/Fabricante/i)).toBeInTheDocument();
    expect(screen.getByText(/Auditor de Hardware/i)).toBeInTheDocument();
  });

  it('debería actualizarse cuando cambian los roles del usuario', () => {
    // Mock inicial
    const mockWeb3 = {
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isAdmin: false,
      isDefaultAdmin: false,
      isManufacturer: false
    };
    
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => mockWeb3);
    
    const { rerender } = render(<UserRoleIndicator />);
    
    // Inicialmente muestra Usuario Regular
    expect(screen.getByText(/Usuario Regular/i)).toBeInTheDocument();
    
    // Simular cambio de roles
    mockWeb3.isManufacturer = true;
    rerender(<UserRoleIndicator />);
    
    // Ahora debería mostrar Fabricante
    expect(screen.getByText(/Fabricante/i)).toBeInTheDocument();
  });
});