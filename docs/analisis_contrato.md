# Análisis del Contrato Smart: SupplyChainTracker.sol

Este documento presenta un análisis detallado del contrato inteligente `SupplyChainTracker.sol`, que implementa un sistema de trazabilidad para netbooks con gestión de roles y estados.

## 1. Información General

- **Nombre**: `SupplyChainTracker`
- **Ubicación**: `sc/src/SupplyChainTracker.sol`
- **Lenguaje**: Solidity ^0.8.13
- **Framework**: Foundry
- **Bibliotecas**: OpenZeppelin AccessControl
- **Función Principal**: Gestiona la trazabilidad de netbooks a través de una máquina de estados, con control de acceso basado en roles.

## 2. Framework y Configuración

El proyecto `sc` utiliza **Foundry** como framework de desarrollo para contratos inteligentes:

- **`foundry.toml`**: Configura los directorios `src`, `out` y `lib`, y especifica las dependencias en `lib`.
- **Dependencias**: Se usa OpenZeppelin AccessControl (`@openzeppelin/contracts/access/AccessControl.sol`) para el control de autorizaciones.
- **Pruebas**: Utiliza el sistema de pruebas de Foundry (script `test/SupplyChainTracker.t.sol`, ejecutable con `forge test`).
- **Despliegue**: Scripts en `script/` y `scripts/` para desplegar y interactuar con el contrato.

## 3. Análisis del Contrato

### 3.1. Imports y Dependencias

```solidity
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
```

Se importa `AccessControl` de OpenZeppelin, que proporciona un sistema robusto basado en roles para gestionar permisos. El contrato hereda todas sus funcionalidades.

### 3.2. Roles Definidos

Se definen 4 roles específicos para el ciclo de vida de la netbook:

| Rol | Hash (bytes32) | Descripción |
|---|---|---|
| `FABRICANTE_ROLE` | keccak256("FABRICANTE_ROLE") | Entidad que fabrica y registra las netbooks |
| `AUDITOR_HW_ROLE` | keccak256("AUDITOR_HW_ROLE") | Entidad que verifica la integridad del hardware |
| `TECNICO_SW_ROLE` | keccak256("TECNICO_SW_ROLE") | Entidad que instala y valida el software |
| `ESCUELA_ROLE` | keccak256("ESCUELA_ROLE") | Escuela que recibe y asigna la netbook al estudiante |

Además, hereda `DEFAULT_ADMIN_ROLE` de OpenZeppelin para gestionar los otros roles.

### 3.3. Estados y Estructuras de Datos

#### Enumeraciones

```solidity
enum ApprovalState { Pending, Approved, Rejected, Canceled }

enum NetbookState { FABRICADA, HW_APROBADO, SW_VALIDADO, DISTRIBUIDA }
```

Dos máquinas de estados:
- **`ApprovalState`**: Gestiona el estado de las solicitudes de rol.
- **`NetbookState`**: Representa el ciclo de vida de la netbook.

#### Estructuras

- **`RoleApproval`**: Maneja el estado de aprobación de un rol para una dirección.
  ```solidity
  struct RoleApproval {
      bytes32 role;
      address account;
      ApprovalState state;
      uint256 approvalTimestamp;
      address approvedBy;
  }
  ```

- **`Netbook`**: Almacena toda la información de una netbook.
  ```solidity
  struct Netbook {
      string serialNumber;
      string batchId;
      string initialModelSpecs;
      // Hardware
      address hwAuditor;
      bool hwIntegrityPassed;
      bytes32 hwReportHash;
      // Software
      address swTechnician;
      string osVersion;
      bool swValidationPassed;
      // Distribución
      bytes32 destinationSchoolHash;
      bytes32 studentIdHash;
      uint256 distributionTimestamp;
      // Estado
      NetbookState state;
  }
  ```

- **`PendingRequest`**: Estructura auxiliar para manejar eficientemente las solicitudes pendientes en un array.

### 3.4. Mappings y Almacenamiento

- `mapping(string => Netbook) private netbooks;`
  Mapea un número de serie (string) a su estructura `Netbook`.

- `mapping(bytes32 => mapping(address => RoleApproval)) public roleApprovals;`
  Mapea `role => account => RoleApproval` para consultar el estado de aprobación de un rol.

- `mapping(bytes32 => mapping(address => uint256)) public pendingRequestIndex;`
  Índice para el array `pendingRequests`, permitiendo búsqueda O(1) del índice en el array.

- `PendingRequest[] public pendingRequests;`
  Array para iterar eficientemente sobre solicitudes pendientes.

### 3.5. Eventos

El contrato emite eventos para rastrear cambios:

- `event NetbookRegistered(...)`: Cuando se registra una nueva netbook.
- `event HardwareAudited(...)`: Al auditar hardware.
- `event SoftwareValidated(...)`: Al validar software.
- `event AssignedToStudent(...)`: Al asignar la netbook a un estudiante.
- `event RoleStatusUpdated(...)`: Al cambiar el estado de una solicitud de rol.

### 3.6. Modificadores

- `netbookStateIs(...)`: Verifica que la netbook esté en el `NetbookState` correcto antes de permitir una operación.
- `onlyApprovedRole(...)`: Asegura que el `msg.sender` tenga el rol especificado y su estado sea "Aprobado".

### 3.7. Funciones del Contrato

#### i. Gestión de Roles

Estas funciones permiten solicitar, aprobar y revocar roles:

| Función | Modificador | Descripción |
|---|---|---|
| `requestRoleApproval(bytes32 role)` | `external` | Permite al usuario solicitar la aprobación de un rol. |
| `approveRole(bytes32 role, address account)` | `onlyRole(DEFAULT_ADMIN_ROLE)` | Aprueba una solicitud de rol, añade el rol con `grantRole` y lo elimina de pendientes. |
| `rejectRole(bytes32 role, address account)` | `onlyRole(DEFAULT_ADMIN_ROLE)` | Rechaza una solicitud de rol. |
| `cancelRoleRequest(bytes32 role)` | `external` | Permite al solicitante cancelar su propia solicitud. |
| `revokeRoleApproval(bytes32 role, address account)` | `onlyRole(DEFAULT_ADMIN_ROLE)` | Revoca un rol ya aprobado (equivalente a `renounceRole` pero para cualquier cuenta). |
| `getRoleStatus(...)` | `external view` | Obtiene el estado de aprobación de un rol para una cuenta. |
| `getAllPendingRoleRequests()` | `external view` | Devuelve todas las solicitudes pendientes para iterar en el frontend. |

#### ii. Ciclo de Vida de la Netbook

Funciones para avanzar las netbooks a través de sus estados:

| Función | Modificador | Descripción |
|---|---|---|
| `registerNetbooks(...)` | `onlyApprovedRole(FABRICANTE_ROLE)` | Registra múltiples netbooks en estado `FABRICADA`. Valida que los arrays tengan la misma longitud y que el número de serie no esté usado. |
| `auditHardware(...)` | `onlyApprovedRole(AUDITOR_HW_ROLE) netbookStateIs(..., FABRICADA)` | Registra el resultado de la verificación de hardware. Cambia el estado a `HW_APROBADO`. |
| `validateSoftware(...)` | `onlyApprovedRole(TECNICO_SW_ROLE) netbookStateIs(..., HW_APROBADO)` | Registra la validación del software. Cambia el estado a `SW_VALIDADO`. |
| `assignToStudent(...)` | `onlyApprovedRole(ESCUELA_ROLE) netbookStateIs(..., SW_VALIDADO)` | Asigna la netbook a un estudiante. Cambia el estado a `DISTRIBUIDA`. |
| `getNetbookReport(...)` | `external view` | Obtiene el reporte completo de una netbook por su número de serie. |

## 4. Coherencia con ABI

El archivo ABI `SupplyChainTrackerABI.json` en `web/src/contracts/` contiene la definición completa de todas