# Sistema de Gestión de Roles - Documentación Técnica

## Introducción

Este documento describe el sistema de gestión de roles implementado en el contrato `SupplyChainTracker.sol`. El sistema permite solicitudes de roles con aprobación administrativa, proporcionando un flujo de trabajo seguro para la gestión de permisos en la cadena de suministro de netbooks.

## Estructuras de Datos

### RoleState (Enumeración)

Define los estados posibles para una solicitud de rol:

- `Pending`: Solicitud pendiente de aprobación
- `Approved`: Solicitud aprobada y rol concedido
- `Rejected`: Solicitud rechazada
- `Canceled`: Solicitud cancelada por el solicitante

### RoleApproval (Estructura)

Almacena información detallada sobre una solicitud de rol:

```solidity
struct RoleApproval {
    bytes32 role;
    address account;
    uint8 state;
    uint256 requestTimestamp;
    uint256 approvalTimestamp;
    address approvedBy;
}
```

## Mappings de Almacenamiento

```solidity
// Mapeo de solicitudes de rol por rol y cuenta
mapping(bytes32 => mapping(address => RoleApproval)) public roleRequests;

// Lista de aprobaciones por rol para búsqueda histórica
mapping(bytes32 => RoleApproval[]) public roleApprovals;

// Direcciones activas por rol para consultas eficientes
mapping(bytes32 => address[]) public roleAddresses;
```

## Roles del Sistema

Los roles definidos en el sistema son:

- `FABRICANTE_ROLE`: Fabricante de netbooks
- `AUDITOR_HW_ROLE`: Auditor de hardware
- `TECNICO_SW_ROLE`: Técnico de validación de software
- `ESCUELA_ROLE`: Representante de escuela
- `DEFAULT_ADMIN_ROLE`: Administrador principal (gestionado por OpenZeppelin AccessControl)

## Funciones de Gestión de Roles

### requestRoleApproval

Permite a un usuario solicitar un rol en el sistema.

**Parámetros:**
- `role`: El rol que se desea solicitar

**Validaciones:**
- No se puede solicitar el rol de administrador principal
- El rol debe ser uno de los roles válidos del sistema
- El usuario no puede tener el rol actualmente
- No puede haber una solicitud pendiente para el mismo rol

**Flujo:**
1. Validar condiciones de solicitud
2. Crear registro de solicitud con estado Pendiente
3. Almacenar solicitud en los mappings
4. Emitir evento `RoleRequested`

```solidity
function requestRoleApproval(bytes32 role) public {
    require(role != DEFAULT_ADMIN_ROLE, unicode"No se puede solicitar el rol de administrador principal");
    
    require(
        role == FABRICANTE_ROLE || 
        role == AUDITOR_HW_ROLE || 
        role == TECNICO_SW_ROLE || 
        role == ESCUELA_ROLE,
        unicode"Rol no válido para solicitud"
    );
    
    require(!hasRole(role, msg.sender), unicode"Ya tienes este rol");
    
    require(
        roleRequests[role][msg.sender].requestTimestamp == 0 || 
        roleRequests[role][msg.sender].state != uint8(RoleState.Approved),
        unicode"Ya tienes una solicitud pendiente para este rol"
    );
    
    RoleApproval memory approval = RoleApproval({
        role: role,
        account: msg.sender,
        state: uint8(RoleState.Pending),
        requestTimestamp: block.timestamp,
        approvalTimestamp: 0,
        approvedBy: address(0)
    });
    
    roleRequests[role][msg.sender] = approval;
    roleApprovals[role].push(approval);
    
    emit RoleRequested(role, msg.sender, block.timestamp);
}
```

### approveRole

Permite al administrador aprobar una solicitud de rol.

**Parámetros:**
- `role`: El rol a aprobar
- `account`: La cuenta que solicitó el rol

**Validaciones:**
- El llamador debe tener el rol de administrador
- No se puede aprobar el rol de administrador principal mediante este método
- Debe existir una solicitud pendiente para el rol y cuenta especificados

**Flujo:**
1. Validar autorización y condiciones
2. Conceder el rol utilizando la función interna de AccessControl
3. Actualizar el estado de la solicitud a Aprobado
4. Registrar la información de aprobación
5. Emitir evento `RoleApproved`

```solidity
function approveRole(bytes32 role, address account) public {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), unicode"Requiere rol de administrador");
    
    require(role != DEFAULT_ADMIN_ROLE, unicode"Use funciones de acceso directo para administradores");
    
    require(
        roleRequests[role][account].requestTimestamp > 0 && 
        roleRequests[role][account].state == uint8(RoleState.Pending),
        unicode"No hay solicitud pendiente para este rol"
    );
    
    _grantRole(role, account);
    
    roleRequests[role][account].state = uint8(RoleState.Approved);
    roleRequests[role][account].approvalTimestamp = block.timestamp;
    roleRequests[role][account].approvedBy = msg.sender;
    
    emit RoleApproved(role, account, msg.sender, block.timestamp);
}
```

## Eventos

### RoleRequested

Emitido cuando un usuario solicita un rol.

```solidity
event RoleRequested(bytes32 indexed role, address indexed account, uint256 timestamp);
```

### RoleApproved

Emitido cuando un administrador aprueba una solicitud de rol.

```solidity
event RoleApproved(bytes32 indexed role, address indexed account, address indexed approvedBy, uint256 timestamp);
```

### RoleRejected

Emitido cuando un administrador rechaza una solicitud de rol.

```solidity
event RoleRejected(bytes32 indexed role, address indexed account, address indexed rejectedBy, uint256 timestamp);
```

### RoleRequestCanceled

Emitido cuando un usuario cancela su solicitud de rol.

```solidity
event RoleRequestCanceled(bytes32 indexed role, address indexed account, uint256 timestamp);
```

## Consideraciones de Seguridad

1. **Validación de Roles**: Solo se permiten solicitudes para roles específicos del sistema, evitando solicitudes de roles arbitrarios.

2. **Protección contra Reentrada**: El contrato hereda de `ReentrancyGuard`, protegiendo las funciones de gestión de roles contra ataques de reentrada.

3. **Control de Acceso**: Solo los administradores pueden aprobar o rechazar solicitudes de roles.

4. **Historial Inmutable**: Las solicitudes aprobadas se mantienen en el historial para auditoría, incluso después de la aprobación.

5. **Prevención de Duplicados**: El sistema verifica que no exista una solicitud pendiente antes de permitir una nueva solicitud para el mismo rol.

## Flujo de Trabajo Típico

1. Un usuario llama `requestRoleApproval(role)` para solicitar un rol
2. Un administrador revisa las solicitudes pendientes
3. El administrador llama `approveRole(role, account)` para aprobar una solicitud
4. El sistema concede el rol y actualiza el estado de la solicitud
5. El usuario ahora tiene los permisos asociados con el rol concedido

## Integración con Frontend

El frontend espera las siguientes funciones en el contrato:
- `requestRoleApproval(bytes32 role)`
- `approveRole(bytes32 role, address account)`
- `rejectRole(bytes32 role, address account)`
- `cancelRoleRequest(bytes32 role)`

Estas funciones están reflejadas en los archivos ABI y son utilizadas por el servicio `Web3Service` en el frontend para interactuar con el contrato.