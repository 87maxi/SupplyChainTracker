# Análisis del Frontend Web

## Descripción General

El frontend es una aplicación web construida con Next.js 16.3.1, React 19.2.2 y TypeScript, diseñada para interactuar con el contrato inteligente `SupplyChainTracker`. La aplicación utiliza Tailwind CSS para estilización y proporciona una interfaz para la gestión de roles, búsqueda de netbooks y seguimiento de trazabilidad.

## Framework y Tecnologías Utilizadas

El frontend utiliza un stack tecnológico moderno:

- **Next.js 16.3.1**: Framework React para renderizado tanto en servidor como en cliente
- **React 19.2.2**: Biblioteca de interfaz de usuario
- **TypeScript 5.9.3**: Lenguaje de programación con tipado estático
- **Tailwind CSS 4.1.18**: Framework de estilización utility-first
- **Ethers.js 6.16.0**: Para interactuar con la blockchain Ethereum
- **Radix UI**: Componentes primitivos para accesibilidad
- **Sonner**: Sistema de notificaciones
- **Zod**: Validación de esquemas (implícito en uso de formularios)

La configuración se encuentra en:
- `next.config.ts`: Configuración de Next.js
- `tsconfig.json`: Configuración de TypeScript
- `postcss.config.mjs`: Configuración de PostCSS para Tailwind
- `eslint.config.mjs`: Configuración de ESLint

## Estructura de Directorios

```bash
src/
├── app/                # Rutas de la aplicación (App Router)
├── components/         # Componentes reutilizables
├── contracts/          # ABI y metadatos de contratos
├── lib/                # Lógica de aplicación, hooks, contextos
├── services/          # Servicios de negocio
└── types/             # Tipos TypeScript
```

## Contexto Web3 y Gestión de Estado

### Web3Context.tsx

El contexto principal `Web3Provider` gestiona el estado global de la conexión web3:

- Utiliza `useWallet` para manejar la conexión de wallet
- Mantiene estados para cada tipo de rol (fabricante, auditor, técnico, escuela, administrador)
- Proporciona una instancia de `Web3Service` configurada con el signer actual
- Implementa mecanismos de debounce para evitar refreshes excesivos
- Usa `sonner` para notificaciones de error

```tsx
const Web3Provider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected, connectWallet, disconnectWallet, isLoading, signer } = useWallet();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isManufacturer, setIsManufacturer] = useState<boolean>(false);
  // ... otros estados de rol
  
  const web3Service = useMemo(() => {
    if (!signer) return null;
    return new Web3Service(signer);
  }, [signer]);

  const checkRoles = useCallback(async () => {
    if (isConnected && address && web3Service) {
      try {
        // Verificar todos los roles en paralelo
        const [
          defaultAdminResult,
          manufacturerResult,
          auditorResult,
          technicianResult,
          schoolResult
        ] = await Promise.all([
          web3Service.hasRole(roleConstants.DEFAULT_ADMIN_ROLE, address),
          web3Service.hasRole(roleConstants.FABRICANTE_ROLE, address),
          web3Service.hasRole(roleConstants.AUDITOR_HW_ROLE, address),
          web3Service.hasRole(roleConstants.TECNICO_SW_ROLE, address),
          web3Service.hasRole(roleConstants.ESCUELA_ROLE, address)
        ]);
        
        // Actualizar estados
        setIsDefaultAdmin(defaultAdminResult);
        setIsManufacturer(manufacturerResult);
        // ... actualizar otros estados
      } catch (error) {
        // Manejo de errores
      }
    }
  }, [isConnected, address, web3Service]);

  // Efectos para chequear roles
};
```

## Servicio Web3Service

La clase `Web3Service` encapsula todas las interacciones con el contrato blockchain:

- **Constructor**: Configura el contrato con la dirección del contrato y el signer
- **Variables estáticas de roles**: Define los hashes de roles consistentes con el contrato
- **Métodos principales**:

```tsx
class Web3Service {
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  constructor(signer?: ethers.Signer | null) {
    this.signer = signer || null;
    if (this.signer) {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      this.contract = new ethers.Contract(
        contractAddress,
        SupplyChainTrackerABI.abi,
        this.signer
      );
    }
  }

  async hasRole(role: string, address: string): Promise<boolean> {
    if (!this.contract) return false;
    try {
      const result = await this.contract.hasRole(role, address);
      return result;
    } catch (error) {
      // Manejo de errores
      return false;
    }
  }

  async requestRoleApproval(role: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Servicio de contrato no inicializado');
    }

    try {
      // Pre-validación
      const address = await this.signer!.getAddress();
      const currentStatus = await this.getRoleStatus(role, address);
      
      if (currentStatus.state === 1) {
        throw new Error('Ya tienes este rol aprobado');
      }
      
      if (currentStatus.state === 0 && currentStatus.account !== '0x0000000000000000000000000000000000000000') {
        throw new Error('Ya tienes una solicitud pendiente');
      }

      // Estimar gas
      const gasEstimate = await this.contract.requestRoleApproval.estimateGas(role);
      
      // Enviar transacción con buffer de gas (120%)
      const tx = await this.contract.requestRoleApproval(role, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100)
      });
      
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      // Parsear errores específicos
      if (error.message?.includes('Rol ya aprobado')) {
        throw new Error('Ya tienes este rol aprobado');
      }
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('user rejected transaction');
      }
      // ... otros manejadores de error
      throw error;
    }
  }
}
```

## Componente RoleRequest.tsx

Este componente permite a los usuarios solicitar roles en el sistema:

### Características Principales

- **UI Moderna**: Utiliza Card de Radix UI con iconos de Lucide React
- **Feedback Visual**: Estado visual para cada rol (activo, pendiente, rechazado)
- **Manejo de Carga**: Indicadores de carga durante transacciones
- **Notificaciones**: Uso de `sonner` para feedback de usuario
- **Event Listeners**: Escucha eventos de contrato para actualizar estado en tiempo real

### Flujo de Solicitud de Rol

1. **Verificación Previa**: Antes de enviar transacción, verifica estado actual
2. **Estimación de Gas**: Calcula gas necesario + 20% buffer
3. **Notificaciones Progresivas**:
   - "Esperando confirmación de wallet..." (carga inicial)
   - "Transacción enviada, esperando confirmación..." (después de firma)
   - "¡Solicitud enviada con éxito!" (después de confirmación)
4. **Actualización de Estado**: Actualiza optimísticamente la UI y luego refresca de blockchain
5. **Manejo de Errores**: Detecta y presenta errores específicos (rechazo, fondos insuficientes, etc.)

### Implementación Clave

```tsx
const handleRequest = async (role: string) => {
  // Pre-validaciones
  const currentStatus = roleStatuses.find(s => s.role === role);
  if (currentStatus?.state === 1) {
    toast.error('Rol ya aprobado');
    return;
  }

  // Mostrar toast