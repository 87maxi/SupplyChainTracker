"use client";

import { render, screen } from '@testing-library/react';
import { PermissionGuard } from '@/components/layout/PermissionGuard';
import { getRoleConstants } from '@/lib/services/Web3Service';

// Mock del contexto Web3
jest.mock('@/lib/contexts/Web3Context', () => ({
  useWeb3: () => ({
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    isDefaultAdmin: false,
    isManufacturer: false,
    isAuditor: false,
    isTechnician: false,
    isSchool: false
  })
}));

// Mock de getRoleConstants
jest.mock('@/lib/services/Web3Service', () => ({
  getRoleConstants: () => ({
    FABRICANTE_ROLE: 'FAB_ROLE',
    AUDITOR_HW_ROLE: 'AUD_HW_ROLE',
    TECNICO_SW_ROLE: 'TEC_SW_ROLE',
    ESCUELA_ROLE: 'ESC_ROLE'
  })
}));

describe('PermissionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div id="__next"></div>';
  });

  it('debería renderizar el contenido cuando el usuario tiene el rol requerido', () => {
    // Mock para usuario con rol de Fabricante
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isDefaultAdmin: false,
      isManufacturer: true,
      isAuditor: false,
      isTechnician: false,
      isSchool: false
    }));

    render(
      <PermissionGuard requiredRoles={[getRoleConstants().FABRICANTE_ROLE]}>
        <div>Contenido protegido</div>
      </PermissionGuard>
    );

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('debería renderizar el contenido cuando el usuario es admin por defecto', () => {
    // Mock para admin por defecto
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      isDefaultAdmin: true,
      isManufacturer: false,
      isAuditor: false,
      isTechnician: false,
      isSchool: false
    }));

    render(
      <PermissionGuard requiredRoles={[getRoleConstants().FABRICANTE_ROLE]}>
        <div>Contenido protegido</div>
      </PermissionGuard>
    );

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('debería no renderizar el contenido cuando el usuario no tiene el rol requerido', () => {
    render(
      <PermissionGuard requiredRoles={[getRoleConstants().FABRICANTE_ROLE]}>
        <div>Contenido protegido</div>
      </PermissionGuard>
    );

    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('debería mostrar el fallback cuando el usuario no tiene permisos', () => {
    render(
      <PermissionGuard
        requiredRoles={[getRoleConstants().FABRICANTE_ROLE]}
        fallback={<div>No tienes permisos</div>}
      >
        <div>Contenido protegido</div>
      </PermissionGuard>
    );

    expect(screen.getByText('No tienes permisos')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('debería mostrar mensaje de acceso denegado cuando no hay fallback', () => {
    render(
      <PermissionGuard requiredRoles={[getRoleConstants().FABRICANTE_ROLE]}>
        <div>Contenido protegido</div>
      </PermissionGuard>
    );

    expect(screen.getByText(/Acceso Denegado/i)).toBeInTheDocument();
    expect(screen.getByText(/Fabricante/i)).toBeInTheDocument();
  });

  it('debería mostrar mensaje de conexión requerida cuando no hay wallet conectada', () => {
    // Mock para usuario desconectado
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      isConnected: false,
      address: null,
      isDefaultAdmin: false,
      isManufacturer: false,
      isAuditor: false,
      isTechnician: false,
      isSchool: false
    }));

    render(
      <PermissionGuard requiredRoles={[getRoleConstants().FABRICANTE_ROLE]}>
        <div>Contenido protegido</div>
      </PermissionGuard>
    );

    expect(screen.getByText(/Conexión Requerida/i)).toBeInTheDocument();
  });
});