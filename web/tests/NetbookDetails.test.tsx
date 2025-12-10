import { render, screen, fireEvent } from '@testing-library/react';
import { NetbookDetails } from '@/components/netbooks/NetbookDetails';
import { Netbook } from '@/lib/types';

// Mock avanzado del componente
jest.mock('@/components/netbooks/NetbookDetails', () => ({
  NetbookDetails: ({ netbook }: { netbook: Netbook }) => (
    <div data-testid="netbook-details">
      <h2>Detalles de la Netbook</h2>
      {netbook && (
        <>
          <div data-testid="serial-number">{netbook.serialNumber}</div>
          <div data-testid="state-label">{netbook.state}</div>
          <div data-testid="hw-auditor">{netbook.hwAuditor}</div>
          <div data-testid="sw-technician">{netbook.swTechnician}</div>
        </>
      )}
      <div className="progress-steps">
        {[0, 1, 2, 3].map((stepId) => (
          <button 
            key={stepId}
            data-testid={`step-${stepId}`} 
            onClick={() => {}} // Simula el evento
          >
            Step {stepId}
          </button>
        ))}
      </div>
    </div>
  )
}));

// Datos de prueba
const mockNetbook: Netbook = {
  serialNumber: 'NB-001-ABC',
  batchId: 'BATCH-001',
  initialModelSpecs: 'Modelo X, 8GB RAM, 256GB SSD',
  hwAuditor: '0x1234567890123456789012345678901234567890',
  hwIntegrityPassed: true,
  hwReportHash: '0xabc123',
  swTechnician: '0x9876543210987654321098765432109876543210',
  osVersion: 'Ubuntu 22.04',
  swValidationPassed: true,
  destinationSchoolHash: '0xdef456',
  studentIdHash: '0xghi789',
  distributionTimestamp: 1740000000,
  state: 2
};

describe('NetbookDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div id="__next"></div>';
  });

  it('debería renderizar los detalles básicos de la netbook', () => {
    render(<NetbookDetails netbook={mockNetbook} />);
    
    // Verifica que se muestre el número de serie
    expect(screen.getByText(mockNetbook.serialNumber)).toBeInTheDocument();
    
    // Verifica que se muestre el estado actual
    expect(screen.getByText(/SW_VALIDADO/i)).toBeInTheDocument();
    
    // Verifica que se muestre el auditor de HW
    expect(screen.getByText(mockNetbook.hwAuditor)).toBeInTheDocument();
    
    // Verifica que se muestre el técnico de SW
    expect(screen.getByText(mockNetbook.swTechnician)).toBeInTheDocument();
  });

  it('debería mostrar el paso correcto como completado según el estado', () => {
    render(<NetbookDetails netbook={mockNetbook} />);
    
    // El estado es 2 (SW Validado), así que los pasos 0, 1 y 2 deberían estar completados
    const steps = [0, 1, 2, 3];
    steps.forEach(stepId => {
      const stepButton = screen.getByLabelText(`Step ${stepId}`);
      if (stepId <= 2) {
        expect(stepButton).toHaveClass('bg-green-100'); // Completado
      } else {
        expect(stepButton).toHaveClass('bg-gray-100'); // No completado
      }
    });
  });

  it('debería gestionar correctamente la expansión de pasos al hacer clic', () => {
    render(<NetbookDetails netbook={mockNetbook} />);
    
    const stepButton = screen.getAllByRole('button')[1]; // Segundo botón (HW Auditado)
    
    // Inicialmente no debería haber contenido expandido
    expect(screen.queryByText(/Auditoría de Hardware/i)).not.toBeInTheDocument();
    
    // Simula el click para expandir
    fireEvent.click(stepButton);
    
    // Ahora debería mostrar el contenido del paso HW Auditado
    expect(screen.getByText(/Auditoría de Hardware/i)).toBeInTheDocument();
    expect(screen.getByText(mockNetbook.hwAuditor)).toBeInTheDocument();
  });

  it('debería mostrar información específica del paso SW Validado', () => {
    render(<NetbookDetails netbook={mockNetbook} />);
    
    const stepButton = screen.getAllByRole('button')[2]; // Tercer botón (SW Validado)
    fireEvent.click(stepButton);
    
    // Verifica que aparece la versión de SO
    expect(screen.getByText(mockNetbook.osVersion)).toBeInTheDocument();
  });

  it('debería actualizar los detalles cuando se emite un evento HardwareAudited', async () => {
    const updatedNetbook = {
      ...mockNetbook,
      state: 1, // HW_APROBADO
      hwAuditor: '0x9999999999999999999999999999999999999999',
      hwIntegrityPassed: false
    };
    
    // Mock para getNetbookReport
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      web3Service: {
        setupEventListener: jest.fn((eventName, callback) => {
          if (eventName === 'HardwareAudited') {
            // Simular evento después de un pequeño delay
            setTimeout(() => {
              callback({
                event: 'HardwareAudited',
                args: {
                  serialNumber: 'NB-001-ABC',
                  auditor: '0x9999999999999999999999999999999999999999',
                  passed: false,
                  reportHash: '0xnew123'
                }
              });
            }, 100);
          }
        }),
        removeAllEventListeners: jest.fn(),
        getNetbookReport: jest.fn().mockResolvedValue(updatedNetbook)
      }
    }));

    render(<NetbookDetails netbook={mockNetbook} />);
    
    await waitFor(() => {
      expect(screen.getByText(/HW_APROBADO/i)).toBeInTheDocument();
      expect(screen.getByText('0x999...9999')).toBeInTheDocument(); // Dirección truncada
    });
  });

  it('debería manejar errores al actualizar los detalles', async () => {
    // Mock para error en getNetbookReport
    jest.spyOn(require('@/lib/contexts/Web3Context'), 'useWeb3').mockImplementation(() => ({
      web3Service: {
        setupEventListener: jest.fn((eventName, callback) => {
          if (eventName === 'HardwareAudited') {
            setTimeout(() => {
              callback({
                event: 'HardwareAudited',
                args: { serialNumber: 'NB-001-ABC' }
              });
            }, 100);
          }
        }),
        removeAllEventListeners: jest.fn(),
        getNetbookReport: jest.fn().mockRejectedValue(new Error('Error de red'))
      }
    }));

    render(<NetbookDetails netbook={mockNetbook} />);
    
    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Error al actualizar el estado de la netbook');
    });
  });

  it('debería mostrar información de distribución cuando el estado es DISTRIBUIDA', () => {
    const distributedNetbook = {
      ...mockNetbook,
      state: 3, // DISTRIBUIDA
      destinationSchoolHash: '0xschool123',
      studentIdHash: '0xstudent456',
      distributionTimestamp: 1740000000
    };
    
    render(<NetbookDetails netbook={distributedNetbook} />);
    
    // Verificar que se muestra la información de distribución
    expect(screen.getByText(/Distribuida en/i)).toBeInTheDocument();
    expect(screen.getByText(/0xschool...123/i)).toBeInTheDocument();
    expect(screen.getByText(/0xstudent...456/i)).toBeInTheDocument();
  });
});