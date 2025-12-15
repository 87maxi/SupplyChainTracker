/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC721SupplyChain} from "./interfaces/IERC721SupplyChain.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title SupplyChainTracker - Sistema de Rastreo de Netbooks mediante NFTs
/// @author Continue
/// @notice Sistema completo de trazabilidad para netbooks del Plan de Inclusión Digital
/// Cada netbook es representada como un NFT (nToken) con seguimiento del ciclo de vida
contract SupplyChainTracker is ERC721Enumerable, AccessControl, ReentrancyGuard, IERC721SupplyChain {
    // Counter for generating sequential token IDs
    uint256 private _tokenIdCounter;
    
    // Constructor que inicializa el nombre y símbolo del token NFT
    constructor() ERC721("SecureNetbookToken", "SNBK") {
        // Grant default admin role to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _tokenIdCounter = 1;
    }

    ///
    /// Implementación de IERC721SupplyChain
    ///
    // Convertir número de serie a ID de token
    function getNetbookId(string memory serialNumber) public view returns (uint256) {
        uint256 tokenId = serialNumberToTokenId[serialNumber];
        require(tokenId > 0, unicode"Netbook no existe");
        return tokenId;
    }
    
    // Obtener estado del netbook por número de serie
    function getNetbookState(string memory serialNumber) public view returns (uint8) {
        uint256 tokenId = getNetbookId(serialNumber);
        return uint8(tokenState[tokenId]);
    }
    
    function getNetbookReport(string memory serialNumber) public view returns (Netbook memory) {
        uint256 tokenId = getNetbookId(serialNumber);
        return this.getSupplyChainReport(tokenId);
    }

    ///
    /// Token Minting
    ///
    function registerNetbooks(
        string[] memory serialNumbers,
        string[] memory batchIds,
        string[] memory technicalSpecs
    ) public onlyRole(FABRICANTE_ROLE) {
        require(serialNumbers.length > 0, unicode"Debe proporcionar al menos una netbook");
        require(
            serialNumbers.length == batchIds.length && 
            serialNumbers.length == technicalSpecs.length,
            unicode"Los arreglos deben tener la misma longitud"
        );

        for (uint256 i = 0; i < serialNumbers.length; i++) {
            registerSingleNetbook(serialNumbers[i], batchIds[i], technicalSpecs[i]);
        }
    }

    function registerSingleNetbook(
        string memory serialNumber,
        string memory batchId,
        string memory technicalSpecs
    ) private {
        // Verificar que el número de serie no exista
        require(serialNumberToTokenId[serialNumber] == 0, unicode"Netbook ya registrada");

        // Obtener el nuevo ID de token
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Crear metadata
        tokenMetadata[tokenId] = TokenMetadata({
            serialNumber: serialNumber,
            manufacturer: "",
            technicalSpecs: technicalSpecs,
            batchId: batchId,
            hardwareAuditReportHash: "",
            softwareValidationReportHash: "",
            distributionCertificateHash: "",
            schoolHash: bytes32(0),
            studentIdHash: bytes32(0)
        });

        // Registrar el número de serie al ID de token
        serialNumberToTokenId[serialNumber] = tokenId;
        
        // Inicializar estado
        tokenState[tokenId] = TokenState.INITIALIZED;

        // Acuñar el NFT al fabricante
        _safeMint(msg.sender, tokenId);

        // Registrar evento
        emit TokenMinted(tokenId, serialNumber, "");
    }

    ///
    /// Sobrescribe supportsInterface para combinar AccessControl y ERC721Enumerable
    ///
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, AccessControl, IERC165) returns (bool) {
        return ERC721Enumerable.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }


    ///
    /// Centro de Registro de NFTs de Netbook
    ///
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

    ///
    /// Estados de Trazabilidad
    ///
    enum TokenState {
        INITIALIZED,    // Token creado pero sin auditoría
        IN_CIRCULATION, // Netbook en proceso de verificación
        VERIFIED,       // Verificación completa
        DISTRIBUTED,    // Entregada a beneficiario
        DISCONTINUED,   // Fuera de uso
        STOLEN,         // Reportada como robada
        BLOCKED         // Bloqueada para transferencias
    }

    ///
    /// Historial de eventos de verificación
    ///
    struct VerificationRecord {
                 address verifier;
         TokenState previousState;
         TokenState newState;
         uint256 timestamp;
        string certificateHash;
    }

    ///
    /// Mapeos de estado y datos
    ///
    mapping(uint256 => TokenMetadata) public tokenMetadata;
    mapping(uint256 => TokenState) public tokenState;
    mapping(uint256 => VerificationRecord[]) public verificationHistory;
    mapping(string => uint256) public serialNumberToTokenId;

    ///
    /// Roles del sistema
    ///
    bytes32 public constant FABRICANTE_ROLE = keccak256("FABRICANTE_ROLE");
    bytes32 public constant AUDITOR_HW_ROLE = keccak256("AUDITOR_HW_ROLE");
    bytes32 public constant TECNICO_SW_ROLE = keccak256("TECNICO_SW_ROLE");
    bytes32 public constant ESCUELA_ROLE = keccak256("ESCUELA_ROLE");
    
    ///
    /// Estructuras y mapeos para gestión de roles
    ///
    ///
    /// Estado de aprobación de rol
    ///
    enum RoleState {
        Pending,
        Approved,
        Rejected,
        Canceled
    }
    
    ///
    /// Estructura para seguimiento de aprobación de roles
    ///
    struct RoleApproval {
        bytes32 role;
        address account;
        uint8 state;
        uint256 requestTimestamp;
        uint256 approvalTimestamp;
        address approvedBy;
    }
    
    mapping(bytes32 => mapping(address => RoleApproval)) public roleRequests;
    mapping(bytes32 => RoleApproval[]) public roleApprovals;
    mapping(bytes32 => address[]) public roleAddresses;
    
    ///
    /// Eventos para gestión de roles
    ///
    event RoleRequested(bytes32 indexed role, address indexed account, uint256 timestamp);
    event RoleApproved(bytes32 indexed role, address indexed account, address indexed approvedBy, uint256 timestamp);
    event RoleRejected(bytes32 indexed role, address indexed account, address indexed rejectedBy, uint256 timestamp);
    event RoleRequestCanceled(bytes32 indexed role, address indexed account, uint256 timestamp);

    ///
    /// Evento para revocación de roles
    ///
    // event RoleRevoked(bytes32 indexed role, address indexed account, address indexed revokedBy)
    // Usando evento de OpenZeppelin AccessControl

        ///
    /// Eventos de trazabilidad
    ///
    event TokenMinted(uint256 tokenId, string serialNumber, string manufacturer);
    event VerificationUpdated(uint256 indexed tokenId, TokenState previousState, TokenState newState, string certificateHash);

    event DistributionRecorded(uint256 tokenId, bytes32 schoolHash, bytes32 studentIdHash, uint256 timestamp);
    event HardwareVerificationAdded(uint256 index, address verifier, string reportHash, bool passed);
    event TokenStateUpdated(uint256 tokenId, TokenState newState);

    function requestRoleApproval(bytes32 role) public {
        // No se puede solicitar el rol de administrador principal
        require(role != DEFAULT_ADMIN_ROLE, unicode"No se puede solicitar el rol de administrador principal");
        
        // Verificar que el rol sea uno válido del sistema
        require(
            role == FABRICANTE_ROLE || 
            role == AUDITOR_HW_ROLE || 
            role == TECNICO_SW_ROLE ||
            role == ESCUELA_ROLE,
            unicode"Rol no válido para solicitud"
        );
        
        // No se puede solicitar un rol si ya se tiene
        require(!hasRole(role, msg.sender), unicode"Ya tienes este rol");
        
        // No se puede solicitar un rol si ya hay una solicitud pendiente
        require(
            roleRequests[role][msg.sender].requestTimestamp == 0 || 
            roleRequests[role][msg.sender].state != uint8(RoleState.Approved),
            unicode"Ya tienes una solicitud pendiente para este rol"
        );
        
        // Registrar la solicitud
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
    
    function approveRole(bytes32 role, address account) public {
        // Solo el administrador puede aprobar roles
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), unicode"Requiere rol de administrador");
        
        // No se puede aprobar el rol de administrador principal a través de este flujo
        require(role != DEFAULT_ADMIN_ROLE, unicode"Use funciones de acceso directo para administradores");
        
        // La solicitud debe existir y estar pendiente
        require(
            roleRequests[role][account].requestTimestamp > 0 && 
            roleRequests[role][account].state == uint8(RoleState.Pending),
            unicode"No hay solicitud pendiente para este rol"
        );
        
        // Conceder el rol
        _grantRole(role, account);
        
        // Actualizar estado de la solicitud
        roleRequests[role][account].state = uint8(RoleState.Approved);
        roleRequests[role][account].approvalTimestamp = block.timestamp;
        roleRequests[role][account].approvedBy = msg.sender;
        
        // Buscar y actualizar en la lista general
        for (uint i = 0; i < roleApprovals[role].length; i++) {
            if (roleApprovals[role][i].account == account && roleApprovals[role][i].role == role) {
                roleApprovals[role][i].state = uint8(RoleState.Approved);
                roleApprovals[role][i].approvalTimestamp = block.timestamp;
                roleApprovals[role][i].approvedBy = msg.sender;
                break;
            }
        }
        
        emit RoleApproved(role, account, msg.sender, block.timestamp);
    }
    
    function rejectRole(bytes32 role, address account) public {
        // Solo el administrador puede rechazar solicitudes
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), unicode"Requiere rol de administrador");
        
        // La solicitud debe existir y estar pendiente
        require(
            roleRequests[role][account].requestTimestamp > 0 && 
            roleRequests[role][account].state == uint8(RoleState.Pending),
            unicode"No hay solicitud pendiente para este rol"
        );
        
        // Actualizar estado de la solicitud
        roleRequests[role][account].state = uint8(RoleState.Rejected);
        roleRequests[role][account].approvalTimestamp = block.timestamp;
        roleRequests[role][account].approvedBy = msg.sender;
        
        // Buscar y actualizar en la lista general
        for (uint i = 0; i < roleApprovals[role].length; i++) {
            if (roleApprovals[role][i].account == account && roleApprovals[role][i].role == role) {
                roleApprovals[role][i].state = uint8(RoleState.Rejected);
                roleApprovals[role][i].approvalTimestamp = block.timestamp;
                roleApprovals[role][i].approvedBy = msg.sender;
                break;
            }
        }
        
        emit RoleRejected(role, account, msg.sender, block.timestamp);
    }
    
    function cancelRoleRequest(bytes32 role) public {
        // La solicitud debe existir para esta cuenta
        require(roleRequests[role][msg.sender].requestTimestamp > 0, unicode"No hay solicitud para este rol");
        
        // Solo solicitudes pendientes pueden cancelarse
        require(roleRequests[role][msg.sender].state == uint8(RoleState.Pending), unicode"Solo solicitudes pendientes pueden cancelarse");
        
        // Actualizar estado de la solicitud
        roleRequests[role][msg.sender].state = uint8(RoleState.Canceled);
        
        // Buscar y actualizar en la lista general
        for (uint i = 0; i < roleApprovals[role].length; i++) {
            if (roleApprovals[role][i].account == msg.sender && roleApprovals[role][i].role == role) {
                roleApprovals[role][i].state = uint8(RoleState.Canceled);
                break;
            }
        }
        
        emit RoleRequestCanceled(role, msg.sender, block.timestamp);
    }
    
    // Getter function to get role requests for a specific role (for admin interfaces)
    function getRoleRequests(bytes32 role) public view returns (RoleApproval[] memory) {
        return roleApprovals[role];
    }
    
    // Getter function for a specific user's role request
    function getUserRoleRequest(bytes32 role, address user) public view returns (RoleApproval memory) {
        return roleRequests[role][user];
    }
    
    // Getter function to get role status for a specific user (with backward compatibility)
    function getRoleStatus(bytes32 role, address account) public view returns (RoleApproval memory) {
        return roleRequests[role][account];
    }

    ///
    /// Implementación de IERC721SupplyChain
    ///
    function getTokenSerialNumber(uint256 tokenId) external view override returns (string memory) {
        require(_exists(tokenId), unicode"Token no existe");
        require(msg.sender == ownerOf(tokenId) || getApproved(tokenId) == msg.sender || isApprovedForAll(ownerOf(tokenId), msg.sender), unicode"No autorizado");
        return tokenMetadata[tokenId].serialNumber;
    }

    function getTokenBatchId(uint256 tokenId) external view override returns (string memory) {
        require(_exists(tokenId), unicode"Token no existe");
        require(msg.sender == ownerOf(tokenId) || getApproved(tokenId) == msg.sender || isApprovedForAll(ownerOf(tokenId), msg.sender), unicode"No autorizado");
        return tokenMetadata[tokenId].batchId;
    }

    function getTokenSpecs(uint256 tokenId) external view override returns (string memory) {
        require(_exists(tokenId), unicode"Token no existe");
        require(msg.sender == ownerOf(tokenId) || getApproved(tokenId) == msg.sender || isApprovedForAll(ownerOf(tokenId), msg.sender), unicode"No autorizado");
        return tokenMetadata[tokenId].technicalSpecs;
    }

    function getTokenState(uint256 tokenId) external view override returns (uint8) {
        require(_exists(tokenId), unicode"Token no existe");
        require(msg.sender == ownerOf(tokenId
