# Plan de Refactorización del Proyecto SupplyChainTracker

Este documento detalla el plan para refactorizar el sistema de trazabilidad de netbooks, mejorando la coherencia, mantenibilidad y experiencia de usuario.

## Objetivos del Refactor

1. Mejorar la consistencia entre el contrato inteligente y el frontend
2. Optimizar el flujo de solicitudes de roles
3. Mejorar la experiencia de usuario en la interacción con la blockchain
4. Reforzar la seguridad y validaciones
5. Documentar completamente el sistema

## Áreas de Refactorización

### 1. Sincronización de Roles entre Contrato y Frontend

**Problema Detectado**: Inconsistencia en la definición de roles entre el contrato y el frontend.

**Análisis**:
- Contrato define roles como `FABRICANTE_ROLE`, `AUDITOR_HW_ROLE`, `TECNICO_SW_ROLE`, `ESCUELA_ROLE`
- Frontend en `Web3Service.ts` define constantes que deben ser exactamente iguales

**Solución Propuesta**:
1. Crear un archivo de constantes compartido (o asegurar consistencia)
2. Validar que los hashes de roles coincidan exactamente

```typescript
// En web/src/lib/constants/roles.ts
export const ROLE_CONSTANTS = {
  FABRICANTE_ROLE: ethers.keccak256(ethers.toUtf8Bytes('FABRICANTE_ROLE')),
  AUDITOR_HW_ROLE: ethers.keccak256(ethers.toUtf8Bytes('AUDITOR_HW_ROLE')),
  TECNICO_SW_ROLE: ethers.keccak256(ethers.toUtf8Bytes('TECNICO_SW_ROLE')),
  ESCUELA_ROLE: ethers.keccak256(ethers.toUtf8Bytes('ESCUELA_ROLE')),
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000'
};
```

### 2. Mejora del Componente RoleRequest

**Problema Detectado**: El componente de solicitud de roles puede mejorarse en cuanto a UX y funcionalidad.

**Mejoras Propuestas**:

#### A. Añadir Historial de Transacciones

Incluir el hash de transacción en la UI para mayor transparencia:

```tsx
// En RoleRequest.tsx
interface RoleStatus extends UserRoleStatus {
  lastTransactionHash?: string; // Nuevo campo
  lastTransactionTimestamp?: number;
}
```

#### B. Implementar Periodo de Espera entre Solicitudes

Evitar spam de solicitudes añadiendo un cooldown:

```tsx
// En Web3Service.ts
async requestRoleApproval(role: string): Promise<string> {
  // Verificar cooldown
  const lastRequest = localStorage.getItem(`lastRoleRequest_${role}`);
  if (lastRequest) {
    const lastRequestTime = parseInt(lastRequest);
    const now = Date.now();
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutos
    
    if (now - lastRequestTime < cooldownPeriod) {
      throw new Error(`Debe esperar ${Math.ceil((cooldownPeriod - (now - lastRequestTime)) / 1000)} segundos antes de reintentar`);
    }
  }
  
  // ... resto del código
  
  // Guardar timestamp después de éxito
  localStorage.setItem(`lastRoleRequest_${role}`, Date.now().toString());
  
  return txHash;
}
```

### 3. Refactorización del Servicio Web3Service

**Problema Detectado**: El servicio tiene lógica duplicada y puede modularizarse.

**Plan de Refactorización**:

1. **Separar en módulos por funcionalidad**:
   - `roleService.ts`: Gestión de roles
   - `netbookService.ts`: Gestión de netbooks
   - `traceabilityService.ts`: Consultas de trazabilidad

2. **Implementar caché para consultas frecuentes**:

```typescript
// En un nuevo archivo cacheService.ts
export class CacheService {
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private defaultTTL = 30000; // 30 segundos
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key: string, data: any, ttl: number = this.defaultTTL) {
    this.cache.set(key, { data, timestamp: Date.now() });
    // Limpiar automáticamente
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }
}
```

### 4. Mejoras de Seguridad

**Recomendaciones**:

#### A. Validación de Red

Asegurar que el usuario esté en la red correcta antes de interactuar:

```tsx
// En useWallet.ts
const checkNetwork = async (provider: any) => {
  const network = await provider.getNetwork();
  const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');
  
  if (network.chainId !== expectedChainId) {
    throw new Error(`Red incorrecta. Por favor, cambie a la red local (Chain ID: ${expectedChainId})`);
  }
};
```

#### B. Mejor Manejo de Errores

Crear un sistema de mapeo de errores más robusto:

```typescript
// En utils/contractErrors.ts
export const CONTRACT_ERROR_MAP = {
  'user rejected transaction': 'El usuario rechazó la transacción',
  'Fondos insuficientes': 'Fondos insuficientes para pagar el gas',
  'network error': 'Error de red. Verifique su conexión e intente nuevamente',
  'execution reverted: Rol ya aprobado': 'Ya tienes este rol aprobado',
  'execution reverted: Ya tienes una solicitud activa': 'Ya tienes una solicitud pendiente para este rol'
};

export const handleError = (error: any): string => {
  const message = error.message || error.toString();
  
  // Buscar coincidencias en el mapeo
  for (const [key, value] of Object.entries(CONTRACT_ERROR_MAP)) {
    if (message.includes(key)) {
      return value;
    }
  }
  
  // Mensaje genérico
  return 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.';
};
```

### 5. Documentación y Testing

**Plan**:

1. Generar documentación completa del contrato con NatSpec
2. Implementar tests para nuevos componentes
3. Crear diagramas UML del sistema
4. Documentar flujos de usuario

```solidity
/// @dev Registra la auditoría de hardware para una netbook
/// @param serialNumber Número de serie de la netbook
/// @param reportHash Hash del reporte de auditoría
/// @notice El llamante debe tener el rol AUDITOR_HW_ROLE
/// @notice El estado de la netbook debe ser INITIALIZED
/// @return tokenId ID del token asociado a la netbook
function auditHardware(string memory serialNumber, bytes32 reportHash) 
    public onlyAuthorizedVerifier(AUDITOR_HW_ROLE) nonReentrant
```

## Cronograma de Implementación

| Semana | Tareas |
|--------|--------|
| 1 | Sincronización de roles y validación de red |
| 2 | Refactorización del servicio Web3 y caché |
| 3 | Mejoras de UX en RoleRequest y manejo de errores |
| 4 | Implementación de tests y documentación |
| 5 | Pruebas integrales y despliegue |

## Conclusión

Este plan de refactorización mejorará significativamente la calidad del código, experiencia de usuario y mantenibilidad del sistema. Las principales mejoras incluyen mayor coherencia entre capas, mejor manejo de errores, y una arquitectura más modular que facilitará futuras extensiones.

La refactorización se realizará de manera incremental para minimizar el riesgo, con pruebas comprehensivas en cada etapa.