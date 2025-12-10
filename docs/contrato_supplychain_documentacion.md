# Documentación del Contrato SupplyChainTracker

## Visión General
El contrato `SupplyChainTracker` es un sistema de trazabilidad para netbooks del Plan de Inclusión Digital, donde cada netbook es representada como un NFT (nToken) con seguimiento del ciclo de vida completo.

## Estructuras de Datos

### `Netbook`
Estructura que contiene toda la información de trazabilidad de una netbook:

```solidity
struct Netbook {
    string serialNumber;                    // Número de serie
    string batchId;                         // ID del lote de fabricación
    string specs;                          // Especificaciones técnicas
    uint8 state;                           // Estado actual (enum TokenState)
    
    // Auditoría de Hardware
    address hwAuditor;                     // Auditor de hardware
    bytes32 hwReportHash;                  // Hash del reporte de auditoría
    bool hwIntegrityPassed;                // ¿Pasó la auditoría?
    
    // Validación de Software
    address swTechnician;                  // Técnico de software
    string osVersion;                      // Versión del sistema operativo
    bool swValidationPassed;               // ¿Pasó la validación?
    
    // Distribución
    bytes32 destinationSchoolHash;         // Hash de la escuela destino
    bytes32 studentIdHash;                 // Hash del ID del estudiante
    uint256 distributionTimestamp;         // Fecha de distribución
}
```

### `TokenMetadata`
Datos básicos y de trazabilidad del token:

```solidity
struct TokenMetadata {
    string serialNumber;                   // Número de serie
    string manufacturer;                   // Fabricante
    string technicalSpecs;                 // Especificaciones técnicas
    string batchId;                        // ID del lote
    string hardwareAuditReportHash;        // Hash del reporte de hardware
    string softwareValidationReportHash;   // Hash del reporte de software
    string distributionCertificateHash;    // Hash del certificado de distribución
    bytes32 schoolHash;                    // Hash de la escuela (almacenado como bytes32)
    bytes32 studentIdHash;                 // Hash del estudiante (almacenado como bytes32)
}
```

### `VerificationRecord`
Historial de verificaciones:

```solidity
struct VerificationRecord {
    address verifier;                     // Quién realizó la verificación
    TokenState previousState;             // Estado anterior
    TokenState newState;                  // Estado nuevo
    uint256 timestamp;                    // Fecha y hora
    string certificateHash;               // Hash del certificado
}
```

## Enumeraciones

### `TokenState`
Estados del ciclo de vida de la netbook:

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

## Mapeos

```solidity
mapping(uint256 => TokenMetadata) public tokenMetadata;      // Datos del token
mapping(uint256 => TokenState) public tokenState;            // Estado actual
mapping(uint256 => VerificationRecord[]) public verificationHistory;  // Historial
mapping(string => uint256) public serialNumberToTokenId;     // Búsqueda por serial
mapping(address => bool) public hardwareVerifiers;          // Auditores HW
mapping(address => bool) public softwareVerifiers;          // Técnicos SW
mapping(address => bool) public distributionOfficers;       // Oficiales de distribución
```

## Eventos

```solidity
event TokenMinted(uint256 tokenId, string serialNumber, string manufacturer);
event VerificationUpdated(uint256 indexed tokenId, TokenState previousState, TokenState newState, string certificateHash);
event VerificationRoleRegistered(address verifier, uint8 verificationType);
event DistributionRecorded(uint256 tokenId, bytes32 schoolHash, bytes32 studentIdHash, uint256 timestamp);
event TokenStateUpdated(uint256 tokenId, TokenState newState);
```

## Funciones Principales

### `mint`
Crea un nuevo token para una netbook:

```solidity
function mint(
    string memory serialNumber,
    string memory manufacturer,
    string memory technicalSpecs,
    string memory batchId
) public onlyOwner returns (uint256 tokenId)
```

**Parámetros:**
- `serialNumber`: Número de serie único
- `manufacturer`: Fabricante de la netbook
- `technicalSpecs`: Especificaciones técnicas
- `batchId`: ID del lote de fabricación

**Flujo:**
1. Verifica que el serial no exista
2. Crea el token con estado `INITIALIZED`
3. Asocia los metadatos
4. Emite evento `TokenMinted`

### `addHardwareVerification`
Registra la auditoría de hardware:

```solidity
function addHardwareVerification(uint256 tokenId, string memory reportHash) public onlyAuthorizedVerifier(1)
```

**Requiere:**
- Estado `INITIALIZED` o `IN_CIRCULATION`
- Ser verificador autorizado (tipo 1)

**Flujo:**
1. Actualiza el hash del reporte
2. Cambia estado a `IN_CIRCULATION`
3. Registra en historial
4. Emite evento

### `addSoftwareValidation`
Registra la validación de software:

```solidity
function addSoftwareValidation(uint256 tokenId, string memory reportHash) public onlyAuthorizedVerifier(2)
```

**Requiere:**
- Estado `IN_CIRCULATION`
- Ser verificador autorizado (tipo 2)

**Flujo:**
1. Actualiza el hash del reporte
2. Cambia estado a `VERIFIED`
3. Registra en historial
4. Emite evento

### `distribute`
Distribuye la netbook a un estudiante:

```solidity
function distribute(
    uint256 tokenId,
    bytes32 schoolHash,
    bytes32 studentHash
) public onlyDistributionOfficer onlyVerifiedStatus(tokenId)
```

**Requiere:**
- Estado `VERIFIED`
- Ser oficial de distribución

**Flujo:**
1. Almacena los hashes de escuela y estudiante
2. Cambia estado a `DISTRIBUTED`
3. Registra en historial
4. Emite evento `DistributionRecorded`

### `getSupplyChainReport`
Obtiene el reporte completo de trazabilidad:

```solidity
function getSupplyChainReport(uint256 tokenId) external view returns (Netbook memory)
```

**Devuelve:**
- Todos los datos de trazabilidad en una sola estructura
- Combina información de hardware, software y distribución

## Interfaz IERC721SupplyChain

El contrato implementa completamente la interfaz `IERC721SupplyChain` con todas sus funciones:

```solidity
// Consultas básicas
function getTokenSerialNumber(uint256 tokenId) external view returns (string memory)
function getTokenBatchId(uint256 tokenId) external view returns (string memory)
function getTokenSpecs(uint256 tokenId) external view returns (string memory)
function getTokenState(uint256 tokenId) external view returns (uint8)
function getTokenStateLabel(uint256 tokenId) external view returns (string memory)

// Datos de verificación
function getHardwareAuditData(uint256 tokenId) external view returns (address, bytes32, bool)
function getSoftwareValidationData(uint256 tokenId) external view returns (address, string memory, bool)
function getDistributionData(uint256 tokenId) external view returns (bytes32, bytes32, uint256)

// Reporte completo
function getSupplyChainReport(uint256 tokenId) external view returns (Netbook memory)
```

## Flujos de Trabajo

### Flujo Completo de Trazabilidad
1. **Minting**: Fabricante crea el token
2. **Auditoría HW**: Verificador de hardware audita
3. **Validación SW**: Técnico valida el software
4. **Distribución**: Oficial distribuye a estudiante
5. **Consulta**: Cualquiera puede verificar el historial completo

## Seguridad

### Modificadores
- `onlyOwner`: Acceso restringido al propietario
- `onlyAuthorizedVerifier`: Verificadores autorizados
- `onlyDistributionOfficer`: Oficiales de distribución
- `onlyVerifiedStatus`: Solo para tokens verificados

### Validaciones
- Duplicados de número de serie
- Transiciones de estado válidas
- Existencia de token
- Autorización de roles
- Integridad de datos