# Documentación Completa del Contrato SupplyChainTracker

## Contrato Principal

### SupplyChainTracker.sol

El contrato principal es un sistema de rastreo de netbooks mediante NFTs que implementa múltiples estándares y funcionalidades:

```solidity
contract SupplyChainTracker is ERC721Enumerable, AccessControl, ReentrancyGuard, IERC721SupplyChain {
```

**Herencia**:
- `ERC721Enumerable`: Estándar de tokens no fungibles con enumeración
- `AccessControl`: Sistema de control de acceso basado en roles
- `ReentrancyGuard`: Protección contra reentrada
- `IERC721SupplyChain`: Interfaz personalizada para trazabilidad

**Constructor**:
```solidity
constructor() ERC721("SecureNetbookToken", "SNBK") {
    _tokenIdCounter = 1;
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
}
```

El contrato se inicializa con el emisor como administrador y un contador de tokens que comienza en 1.

## Roles del Sistema

El sistema implementa un modelo de autorización jerárquico con roles específicos:

### Definición de Roles

```solidity
bytes32 public constant FABRICANTE_ROLE = keccak256("FABRICANTE_ROLE");
bytes32 public constant AUDITOR_HW_ROLE = keccak256("AUDITOR_HW_ROLE");
bytes32 public constant TECNICO_SW_ROLE = keccak256("TECNICO_SW_ROLE");
bytes32 public constant ESCUELA_ROLE = keccak256("ESCUELA_ROLE");
```

Cada rol corresponde a una entidad en la cadena de suministro:
- **Fabricante**: Registra productos y lotes
- **Auditor de Hardware**: Verifica integridad física
- **Técnico de Software**: Gestiona software y actualizaciones
- **Escuela**: Asigna dispositivos a estudiantes

### Estados de Solicitud de Roles

```solidity
enum RoleState {
    Pending,
    Approved,
    Rejected,
    Canceled
}

struct RoleApproval {
    RoleState state;
    address account;
    bytes32 role;
    address approvedBy;
    uint256 approvalTimestamp;
}
```

El flujo completo de solicitud de roles incluye estados para gestión completa del ciclo de vida de autorización.

## Gestión de Netbooks (Tokens NFT)

### Metadatos del Token

```solidity
struct TokenMetadata {
    string serialNumber;
    string manufacturer;
    string technicalSpecs;
    string batchId;
    string hardwareAuditReportHash;
    string softwareValidationReportHash;
    string distributionCertificateHash;
    bytes32 schoolHash;
    bytes32 studentIdHash;
}
```

Cada token NFT almacena información completa sobre la netbook que representa, incluyendo datos de fabricación, auditoría y distribución.

### Estados del Ciclo de Vida

```solidity
enum TokenState {
    INITIALIZED,    // Token creado pero sin auditoría
    IN_CIRCULATION, // Netbook en proceso de verificación
    VERIFIED,       // Verificación completa
    DISTRIBUTED,    // Entregada a beneficiario
    DISCONTINUED,   // Fuera de uso
    STOLEN,         // Reportada como robada
    BLOCKED         // Bloqueada para transferencias
}
```

El sistema implementa una máquina de estados que controla el progreso de cada netbook a través de la cadena de suministro.

## Funciones Clave del Contrato

### Registro de Netbooks

```solidity
function registerNetbooks(
    string[] memory serialNumbers,
    string[] memory batchIds,
    string[] memory specs
) public onlyApprovedRole(FABRICANTE_ROLE)
```

Registra múltiples netbooks a la vez, creando tokens NFT asociados. Requiere el rol de fabricante y valida que no existan duplicados.

### Auditoría de Hardware

```solidity
function auditHardware(string memory serialNumber, bytes32 reportHash) 
    public onlyAuthorizedVerifier(AUDITOR_HW_ROLE) nonReentrant
```

Registra la verificación del hardware, moviendo el estado a `IN_CIRCULATION`. Almacena el hash del reporte de auditoría.

### Validación de Software

```solidity
function validateSoftware(string memory serialNumber, string memory osVersion) 
    public onlyAuthorizedVerifier(TECNICO_SW_ROLE) nonReentrant
```

Registra la validación del software, moviendo el estado a `VERIFIED`. Almacena la versión del sistema operativo.

### Asignación a Estudiante

```solidity
function assignToStudent(string memory serialNumber, bytes32 schoolHash, bytes32 studentHash) 
    public onlyAuthorizedVerifier(ESCUELA_ROLE) nonReentrant
```

Asigna una netbook verificada a un estudiante, moviendo el estado a `DISTRIBUTED`. Usa hashes para proteger la privacidad.

## Reportes y Consultas

### Reporte Completo

```solidity
function getSupplyChainReport(uint256 tokenId) external view returns (Netbook memory)
```

Obtiene un reporte completo de la trazabilidad de una netbook, combinando todos los datos del ciclo de vida.

### Consultas por Número de Serie

```solidity
function getNetbookReport(string memory serialNumber) public view returns (IERC721SupplyChain.Netbook memory)
function getNetbookState(string memory serialNumber) public view returns (uint8)
```

Permite consultar información utilizando el número de serie en lugar del ID del token.

## Eventos del Contrato

### Eventos de Roles

```solidity
event RoleRequested(bytes32 indexed role, address indexed account);
event RoleApproved(bytes32 indexed role, address indexed account, address indexed approvedBy);
event RoleRejected(bytes32 indexed role, address indexed account, address indexed rejectedBy);
event RoleRequestCanceled(bytes32 indexed role, address indexed account);
```

Registra todas las acciones relacionadas con solicitudes y aprobaciones de roles.

### Eventos de Trazabilidad

```solidity
event TokenMinted(uint256 tokenId, string serialNumber, string manufacturer);
event VerificationUpdated(uint256 indexed tokenId, TokenState previousState, TokenState newState, string certificateHash);
event DistributionRecorded(uint256 tokenId, bytes32 schoolHash, bytes32 studentIdHash, uint256 timestamp);
```

Registra eventos clave en el ciclo de vida de las netbooks.

## Interfaz IERC721SupplyChain

El contrato implementa la interfaz personalizada `IERC721SupplyChain` que define métodos de consulta para la trazabilidad:

### Estructura Netbook

```solidity
struct Netbook {
    string serialNumber;
    string batchId;
    string specs;
    uint8 state;
    
    // Auditoría de Hardware
    address hwAuditor;
    bytes32 hwReportHash;
    bool hwIntegrityPassed;
    
    // Validación de Software
    address swTechnician;
    string osVersion;
    bool swValidationPassed;
    
    // Distribución
    bytes32 destinationSchoolHash;
    bytes32 studentIdHash;
    uint256 distributionTimestamp;
}
```

Esta estructura combina todos los datos de trazabilidad en un objeto único para consultas eficientes.

### Métodos de Consulta

| Método | Parámetros | Devuelve | Descripción |
|--------|-----------|---------|------------|
| `getTokenSerialNumber` | tokenId | string | Número de serie de la netbook |
| `getTokenBatchId` | tokenId | string | ID del lote de fabricación |
| `getTokenSpecs` | tokenId | string | Especificaciones técnicas |
| `getTokenState` | tokenId | uint8 | Estado actual del ciclo de vida |
| `getTokenStateLabel` | tokenId | string | Etiqueta legible del estado |
| `getHardwareAuditData` | tokenId | address, bytes32, bool | Datos de auditoría de hardware |
| `getSoftwareValidationData` | tokenId | address, string, bool | Datos de validación de software |
| `getDistributionData` | tokenId | bytes32, bytes32, uint256 | Datos de distribución |
| `getSupplyChainReport` | tokenId | Netbook | Reporte completo de trazabilidad |

## Coherencia entre Contrato y