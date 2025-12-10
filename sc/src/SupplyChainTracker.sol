/// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC721, ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC721SupplyChain} from "./interfaces/IERC721SupplyChain.sol";

/// @title SupplyChainTracker - Sistema de Rastreo de Netbooks mediante NFTs
/// @author Continue
/// @notice Sistema completo de trazabilidad para netbooks del Plan de Inclusión Digital
/// Cada netbook es representada como un NFT (nToken) con seguimiento del ciclo de vida
contract SupplyChainTracker is ERC721Enumerable, Ownable2Step, IERC721SupplyChain {
    /// 
    /// Estados del Ciclo de Vida
    ///
    enum State {
        FABRICADA,      // Netbook registrada por fabricante
        HW_APROBADO,    // Auditoría de hardware completada
        SW_VALIDADO,    // Validación de software completada
        DISTRIBUIDA     // Asignada a un estudiante
    }
    
    ///
    /// Roles de Participantes
    ///
    bytes32 public constant FABRICANTE_ROLE = keccak256("FABRICANTE_ROLE");
    bytes32 public constant AUDITOR_HW_ROLE = keccak256("AUDITOR_HW_ROLE");
    bytes32 public constant TECNICO_SW_ROLE = keccak256("TECNICO_SW_ROLE");
    bytes32 public constant ESCUELA_ROLE = keccak256("ESCUELA_ROLE");
    
    ///
    /// Estado de Aprobación de Rol
    ///
    enum ApprovalState {
        PENDING,    // Solicitud pendiente
        APPROVED,   // Aprobado
        REJECTED,   // Rechazado
        CANCELLED   // Cancelado por solicitante
    }
    
    ///
    /// Estructura de Datos
    /// 
    struct RoleApproval {
        ApprovalState state;
        address account;
        bytes32 role;
        address approvedBy;
        uint256 approvalTimestamp;
    }
    
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
    
    ///
    /// Mapping de Datos
    ///
    // Mapeo de token ID a datos de netbook
    mapping(uint256 => Netbook) private _netbooks;
    
    // Mapeo de direcciones a sus roles aprobados
    mapping(address => mapping(bytes32 => RoleApproval)) private _roleApprovals;
    
    // Mapeo de número de serie a token ID
    mapping(string => uint256) private _serialToToken;
    
    // Contador de tokens para generar IDs únicos
    uint256 private _tokenIdCounter;
    
    // Storage para iteración sobre RoleApprovals
    // 
    // Para permitir la iteración en getAllPendingRoleRequests, necesitamos
    // un mecanismo para rastrear todas las entradas en _roleApprovals.
    // 
    // Estrategia: Usar un array para almacenar las combinaciones de (account, role)
    // que han sido solicitadas, y luego iterar sobre este array para obtener
    // las solicitudes pendientes.
    //
    struct RoleApprovalKey {
        address account;
        bytes32 role;
    }
    
    RoleApprovalKey[] private _roleApprovalKeys;
    mapping(address => mapping(bytes32 => uint256)) private _roleApprovalIndices;
    
    ///
    /// Eventos
    ///
    event RoleRequested(address indexed account, bytes32 indexed role);
    event RoleApproved(address indexed account, bytes32 indexed role, address indexed approvedBy);
    event RoleRejected(address indexed account, bytes32 indexed role, address indexed approvedBy);
    event RoleCancelled(address indexed account, bytes32 indexed role);
    event RoleRevoked(address indexed account, bytes32 indexed role, address indexed revokedBy);
    
    event NetbookMinted(
        uint256 indexed tokenId,
        string serialNumber,
        string batchId,
        string specs
    );
    
    event HardwareAudited(
        uint256 indexed tokenId,
        address indexed auditor,
        bytes32 reportHash,
        bool passed
    );
    
    event SoftwareValidated(
        uint256 indexed tokenId,
        address indexed technician,
        string osVersion,
        bool passed
    );
    
    event NetbookAssigned(
        uint256 indexed tokenId,
        bytes32 schoolHash,
        bytes32 studentIdHash,
        uint256 timestamp
    );
    
    ///
    /// Modificadores
    ///
    modifier onlyApprovedRole(bytes32 role) {
        require(_hasApprovedRole(role), "Rol no aprobado para esta dirección");
        _;
    }
    
    modifier onlyState(uint256 tokenId, State expectedState) {
        require(_netbooks[tokenId].state == uint8(expectedState), "Estado incorrecto para esta operación");
        _;
    }
    
    modifier exists(uint256 tokenId) {
        require(_exists(tokenId), "Netbook no existe");
        _;
    }
    
    ///
    /// Constructor
    ///
    constructor() ERC721("NetbookToken", "NBT") Ownable2Step(msg.sender) {
        _tokenIdCounter = 1;
    }
    
    /// 
    /// Funciones Internas - Gestión de Aprobaciones de Roles
    /// 
    
    /// @dev Registra una nueva clave de aprobación de rol en el almacenamiento indexado
    /// @param account La dirección de la cuenta
    /// @param role El rol solicitado
    function _registerRoleApprovalKey(address account, bytes32 role) internal {
        // Verificar si ya existe
        if (_roleApprovalIndices[account][role] != 0) {
            // Ya existe en el mapeo de índices, verificar si es una entrada válida
            uint256 index = _roleApprovalIndices[account][role] - 1; // Convertir a índice base 0
            if (index < _roleApprovalKeys.length && 
                _roleApprovalKeys[index].account == account && 
                _roleApprovalKeys[index].role == role) {
                // La entrada ya existe, no hacer nada
                return;
            }
        }
        
        // La entrada no existe, agregarla
        _roleApprovalIndices[account][role] = _roleApprovalKeys.length + 1; // Almacenar índice base 1
        _roleApprovalKeys.push(RoleApprovalKey(account, role));
    }
    
    /// @dev Elimina una clave de aprobación de rol del almacenamiento indexado
    /// @param account La dirección de la cuenta
    /// @param role El rol
    function _removeRoleApprovalKey(address account, bytes32 role) internal {
        uint256 index = _roleApprovalIndices[account][role];
        if (index == 0) {
            // No existe
            return;
        }
        
        // Convertir a índice base 0
        index--;
        
        // Mover el último elemento al lugar del que se está eliminando
        if (index < _roleApprovalKeys.length - 1) {
            RoleApprovalKey memory last = _roleApprovalKeys[_roleApprovalKeys.length - 1];
            _roleApprovalKeys[index] = last;
            _roleApprovalIndices[last.account][last.role] = index + 1; // Actualizar índice base 1
        }
        
        // Eliminar el último elemento y limpiar el índice
        _roleApprovalKeys.pop();
        _roleApproval