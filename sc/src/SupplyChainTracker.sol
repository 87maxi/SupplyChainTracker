/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC721SupplyChain} from "./interfaces/IERC721SupplyChain.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title SupplyChainTracker - Sistema de Rastreo de Netbooks mediante NFTs
/// @author Continue
/// @notice Sistema completo de trazabilidad para netbooks del Plan de Inclusión Digital
/// Cada netbook es representada como un NFT (nToken) con seguimiento del ciclo de vida
contract SupplyChainTracker is ERC721Enumerable, AccessControl, IERC721SupplyChain {
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
    
    ///
    /// Mapeos de roles y aprobaciones
    ///
    mapping(bytes32 => mapping(address => bool)) private _roleApprovals;
    mapping(bytes32 => mapping(address => RoleApproval)) private _roleStatus;
    RoleApproval[] private _pendingRoleRequests;
    
    ///
    /// Eventos de roles
    ///
    event RoleRequested(bytes32 indexed role, address indexed account);
    event RoleApproved(bytes32 indexed role, address indexed account, address indexed approvedBy);
    event RoleRejected(bytes32 indexed role, address indexed account, address indexed rejectedBy);

    event RoleRequestCanceled(bytes32 indexed role, address indexed account);

    ///
    /// Eventos de trazabilidad
    ///
    event TokenMinted(uint256 tokenId, string serialNumber, string manufacturer);
    event VerificationUpdated(uint256 indexed tokenId, TokenState previousState, TokenState newState, string certificateHash);
    event VerificationRoleRegistered(address verifier, uint8 verificationType);
    event DistributionRecorded(uint256 tokenId, bytes32 schoolHash, bytes32 studentIdHash, uint256 timestamp);
    event HardwareVerificationAdded(uint256 index, address verifier, string reportHash, bool passed);
    event TokenStateUpdated(uint256 tokenId, TokenState newState);

    ///
    /// Implementación de la interfaz IERC721SupplyChain
    ///
    function getTokenSerialNumber(uint256 tokenId) external view returns (string memory) {
        return tokenMetadata[tokenId].serialNumber;
    }
    
    function getTokenBatchId(uint256 tokenId) external view returns (string memory) {
        return tokenMetadata[tokenId].batchId;
    }
    
    function getTokenSpecs(uint256 tokenId) external view returns (string memory) {
        return tokenMetadata[tokenId].technicalSpecs;
    }
    
    function getTokenState(uint256 tokenId) external view returns (uint8) {
        return uint8(tokenState[tokenId]);
    }
    
    function getTokenStateLabel(uint256 tokenId) external view returns (string memory) {
        TokenState state = tokenState[tokenId];
        if (state == TokenState.INITIALIZED) return unicode"Registrada";
        if (state == TokenState.IN_CIRCULATION) return unicode"En Verificación";
        if (state == TokenState.VERIFIED) return unicode"Verificada";
        if (state == TokenState.DISTRIBUTED) return unicode"Distribuida";
        if (state == TokenState.DISCONTINUED) return unicode"Fuera de Servicio";
        if (state == TokenState.STOLEN) return unicode"Reportada como Robada";
        if (state == TokenState.BLOCKED) return unicode"Bloqueada";
        return "Desconocido";
    }
    
   function getHardwareAuditData(uint256 tokenId) 
        external view 
        returns (address auditor, bytes32 reportHash, bool passed)
    {
        for (uint256 i = 0; i < verificationHistory[tokenId].length; i++) {
            if (verificationHistory[tokenId][i].newState == TokenState.IN_CIRCULATION) {
                return (
                    verificationHistory[tokenId][i].verifier,
                    bytes32(bytes(tokenMetadata[tokenId].hardwareAuditReportHash)),
                    true
                );
            }
        }
        return (address(0), bytes32(0), false);
    }
    
    function getSoftwareValidationData(uint256 tokenId) 
        external view 
        returns (address technician, string memory osVersion, bool passed)
    {
        for (uint256 i = 0; i < verificationHistory[tokenId].length; i++) {
            if (verificationHistory[tokenId][i].newState == TokenState.VERIFIED) {
                return (
                    verificationHistory[tokenId][i].verifier,
                    tokenMetadata[tokenId].softwareValidationReportHash,
                    true
                );
            }
        }
        return (address(0), "", false);
    }
    
    function getDistributionData(uint256 tokenId) 
        external view 
        returns (bytes32 schoolHash, bytes32 studentHash, uint256 timestamp)
    {
        require(ownerOf(tokenId) != address(0), "Token no existe");
        
        for (uint256 i = 0; i < verificationHistory[tokenId].length; i++) {
            if (verificationHistory[tokenId][i].newState == TokenState.DISTRIBUTED) {
                return (
                    tokenMetadata[tokenId].schoolHash,
                    tokenMetadata[tokenId].studentIdHash,
                    verificationHistory[tokenId][i].timestamp
                );
            }
        }
        return (bytes32(0), bytes32(0), 0);
    }
    
    ///
    /// Modificador de control de acceso
    ///
    function _onlyVerifiedStatus(uint256 tokenId) internal view {
        require(tokenState[tokenId] == TokenState.VERIFIED, unicode"El token debe estar verificado");
    }

    function _onlyAuthorizedVerifier(bytes32 role) internal view {
        require(_hasApprovedRole(role, msg.sender), unicode"No autorizado para esta operación");
    }

    function _onlyApprovedRole(bytes32 role) internal view {
        require(_hasApprovedRole(role, msg.sender), unicode"Rol no aprobado para esta dirección");
    }

    modifier onlyVerifiedStatus(uint256 tokenId) {
        _onlyVerifiedStatus(tokenId);
        _;
    }

    modifier onlyAuthorizedVerifier(bytes32 role) {
        _onlyAuthorizedVerifier(role);
        _;
    }

    modifier onlyApprovedRole(bytes32 role) {
        _onlyApprovedRole(role);
        _;
    }

    ///
    /// Constructor
    ///
    uint256 private _tokenIdCounter;
    constructor() ERC721("SecureNetbookToken", "SNBK") {
        _tokenIdCounter = 1;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    ///
    /// Registra múltiples netbooks
    ///
    function registerNetbooks(
        string[] memory serialNumbers,
        string[] memory batchIds,
        string[] memory specs
    ) public onlyApprovedRole(FABRICANTE_ROLE) {
        require(serialNumbers.length == batchIds.length && batchIds.length == specs.length, unicode"Longitud de arrays no coincide");
        
        for (uint256 i = 0; i < serialNumbers.length; i++) {
            require(serialNumberToTokenId[serialNumbers[i]] == 0, unicode"Netbook ya registrada");
            
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            tokenMetadata[tokenId] = TokenMetadata({
                serialNumber: serialNumbers[i],
                manufacturer: "Manufacturer",
                technicalSpecs: specs[i],
                batchId: batchIds[i],
                hardwareAuditReportHash: "",
                softwareValidationReportHash: "",
                distributionCertificateHash: "",
                schoolHash: bytes32(0),
                studentIdHash: bytes32(0)
            });
            
            tokenState[tokenId] = TokenState.INITIALIZED;
            serialNumberToTokenId[serialNumbers[i]] = tokenId;
            
            _safeMint(msg.sender, tokenId);
            emit TokenMinted(tokenId, serialNumbers[i], "Manufacturer");
        }
    }
    
    ///
    /// Obtiene el estado de una netbook
    ///
    function getNetbookState(string memory serialNumber) public view returns (uint8) {
        uint256 tokenId = serialNumberToTokenId[serialNumber];
        require(tokenId != 0, unicode"Netbook no existe");
        return uint8(tokenState[tokenId]);
    }
    
    ///
    /// Obtiene el reporte de una netbook
    ///
    function getNetbookReport(string memory serialNumber) public view returns (IERC721SupplyChain.Netbook memory) {
        uint256 tokenId = serialNumberToTokenId[serialNumber];
        require(tokenId != 0, unicode"Netbook no existe");
        return this.getSupplyChainReport(tokenId);
    }

    ///
    /// Solicita la aprobación de un rol
    ///
    function requestRoleApproval(bytes32 role) public {
        require(!_roleApprovals[role][msg.sender], unicode"Rol ya aprobado para esta dirección");
        
        _roleStatus[role][msg.sender] = RoleApproval({
            state: RoleState.Pending,
            account: msg.sender,
            role: role,
            approvedBy: address(0),
            approvalTimestamp: block.timestamp
        });
        
        _pendingRoleRequests.push(_roleStatus[role][msg.sender]);
        emit RoleRequested(role, msg.sender);
    }
    
    ///
    /// Aprueba un rol para una dirección
    ///
    function approveRole(bytes32 role, address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_roleStatus[role][account].state == RoleState.Pending, unicode"Rol no está pendiente");
        
        _roleApprovals[role][account] = true;
        _roleStatus[role][account].state = RoleState.Approved;
        _roleStatus[role][account].approvedBy = msg.sender;
        _roleStatus[role][account].approvalTimestamp = block.timestamp;
        
        emit RoleApproved(role, account, msg.sender);
        _removePendingRequest(role, account);
    }
    
    ///
    /// Rechaza un rol para una dirección
    ///
    function rejectRole(bytes32 role, address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_roleStatus[role][account].state == RoleState.Pending, unicode"Rol no está pendiente");
        
        _roleStatus[role][account].state = RoleState.Rejected;
        _roleStatus[role][account].approvedBy = msg.sender;
        _roleStatus[role][account].approvalTimestamp = block.timestamp;
        
        emit RoleRejected(role, account, msg.sender);
        _removePendingRequest(role, account);
    }
    
    ///
    /// Revoca un rol aprobado
    ///
    function revokeRoleApproval(bytes32 role, address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_roleApprovals[role][account], unicode"Rol no está aprobado");
        
        _roleApprovals[role][account] = false;
        _roleStatus[role][account].state = RoleState.Canceled;
        _roleStatus[role][account].approvedBy = msg.sender;
        _roleStatus[role][account].approvalTimestamp = block.timestamp;
        
        emit RoleRevoked(role, account, msg.sender);
    }
    
    ///
    /// Cancela una solicitud de rol
    ///
    function cancelRoleRequest(bytes32 role) public {
        require(_roleStatus[role][msg.sender].state == RoleState.Pending, unicode"Rol no está pendiente");
        
        _roleStatus[role][msg.sender].state = RoleState.Canceled;
        _roleStatus[role][msg.sender].approvedBy = msg.sender;
        _roleStatus[role][msg.sender].approvalTimestamp = block.timestamp;
        
        emit RoleRequestCanceled(role, msg.sender);
        _removePendingRequest(role, msg.sender);
    }
    
    ///
    /// Obtiene el estado de un rol para una dirección
    ///
    function getRoleStatus(bytes32 role, address account) public view returns (RoleApproval memory) {
        return _roleStatus[role][account];
    }
    
    ///
    /// Obtiene todas las solicitudes de rol pendientes
    ///
    function getAllPendingRoleRequests() public view returns (RoleApproval[] memory) {
        return _pendingRoleRequests;
    }
    
    ///
    /// Elimina una solicitud pendiente de la lista
    ///
    function _removePendingRequest(bytes32 role, address account) private {
        for (uint256 i = 0; i < _pendingRoleRequests.length; i++) {
            if (_pendingRoleRequests[i].role == role && _pendingRoleRequests[i].account == account) {
                _pendingRoleRequests[i] = _pendingRoleRequests[_pendingRoleRequests.length - 1];
                _pendingRoleRequests.pop();
                break;
            }
        }
    }
    
    ///
    /// Verifica si una dirección tiene un rol aprobado
    ///
    function _hasApprovedRole(bytes32 role, address account) internal view returns (bool) {
        return _roleApprovals[role][account];
    }

        ///
    /// Agrega verificación de hardware
    ///
    function auditHardware(string memory serialNumber, bytes32 reportHash) public onlyAuthorizedVerifier(AUDITOR_HW_ROLE) {
        uint256 tokenId = serialNumberToTokenId[serialNumber];
        require(tokenId != 0, unicode"Netbook no existe");
        require(tokenState[tokenId] == TokenState.INITIALIZED || tokenState[tokenId] == TokenState.IN_CIRCULATION, unicode"Estado incorrecto para auditoría de hardware");

        TokenMetadata storage metadata = tokenMetadata[tokenId];
        metadata.hardwareAuditReportHash = string(abi.encodePacked(reportHash));

        TokenState previousState = tokenState[tokenId];
        tokenState[tokenId] = TokenState.IN_CIRCULATION;
        
        verificationHistory[tokenId].push(VerificationRecord({
            verifier: msg.sender,
            previousState: previousState,
            newState: TokenState.IN_CIRCULATION,
            timestamp: block.timestamp,
            certificateHash: string(abi.encodePacked(reportHash))
        }));
        
        emit VerificationUpdated(tokenId, previousState, TokenState.IN_CIRCULATION, string(abi.encodePacked(reportHash)));
    }

    ///
    /// Agrega verificación de software
    ///
    function validateSoftware(string memory serialNumber, string memory osVersion) public onlyAuthorizedVerifier(TECNICO_SW_ROLE) {
        uint256 tokenId = serialNumberToTokenId[serialNumber];
        require(tokenId != 0, unicode"Netbook no existe");
        require(tokenState[tokenId] == TokenState.IN_CIRCULATION, unicode"Estado incorrecto para validación de software");

        TokenMetadata storage metadata = tokenMetadata[tokenId];
        metadata.softwareValidationReportHash = osVersion;

        TokenState previousState = tokenState[tokenId];
        tokenState[tokenId] = TokenState.VERIFIED;
        
        verificationHistory[tokenId].push(VerificationRecord({
            verifier: msg.sender,
            previousState: previousState,
            newState: TokenState.VERIFIED,
            timestamp: block.timestamp,
            certificateHash: osVersion
        }));
        
        emit VerificationUpdated(tokenId, previousState, TokenState.VERIFIED, osVersion);
    }

    ///
    /// Distribuye una netbook a un estudiante
    ///
    function assignToStudent(string memory serialNumber, bytes32 schoolHash, bytes32 studentHash) public onlyAuthorizedVerifier(ESCUELA_ROLE) {
        uint256 tokenId = serialNumberToTokenId[serialNumber];
        require(tokenId != 0, unicode"Netbook no existe");
        require(tokenState[tokenId] == TokenState.VERIFIED, unicode"Estado incorrecto para distribución");

        TokenMetadata storage metadata = tokenMetadata[tokenId];
        metadata.schoolHash = schoolHash;
        metadata.studentIdHash = studentHash;
        metadata.distributionCertificateHash = string(abi.encodePacked(schoolHash, studentHash));

        TokenState previousState = tokenState[tokenId];
        tokenState[tokenId] = TokenState.DISTRIBUTED;
        
        verificationHistory[tokenId].push(VerificationRecord(
            msg.sender,
            previousState,
            TokenState.DISTRIBUTED,
            block.timestamp,
            string(abi.encodePacked(schoolHash, studentHash))
        ));
        
        emit DistributionRecorded(tokenId, schoolHash, studentHash, block.timestamp);
    }

    ///
    /// Reporte completo de la netbook
    ///
    function getSupplyChainReport(uint256 tokenId) external view returns (Netbook memory) {
        require(ownerOf(tokenId) != address(0), unicode"Token no existe");

        // Obtener datos de hardware
        address hwAuditor = address(0);
        bytes32 hwReportHash = bytes32(0);
        bool hwPassed = false;
        for (uint256 i = 0; i < verificationHistory[tokenId].length; i++) {
            if (verificationHistory[tokenId][i].newState == TokenState.IN_CIRCULATION) {
                hwAuditor = verificationHistory[tokenId][i].verifier;
                hwReportHash = bytes32(bytes(tokenMetadata[tokenId].hardwareAuditReportHash));
                hwPassed = true;
                break;
            }
        }

        // Obtener datos de software
        address swTechnician = address(0);
        string memory osVersion = "";
        bool swPassed = false;
        for (uint256 i = 0; i < verificationHistory[tokenId].length; i++) {
            if (verificationHistory[tokenId][i].newState == TokenState.VERIFIED) {
                swTechnician = verificationHistory[tokenId][i].verifier;
                osVersion = tokenMetadata[tokenId].softwareValidationReportHash;
                swPassed = true;
                break;
            }
        }

        // Obtener datos de distribución
        bytes32 schoolHash = tokenMetadata[tokenId].schoolHash;
        bytes32 studentHash = tokenMetadata[tokenId].studentIdHash;
        uint256 distTimestamp = 0;
        for (uint256 i = 0; i < verificationHistory[tokenId].length; i++) {
            if (verificationHistory[tokenId][i].newState == TokenState.DISTRIBUTED) {
                distTimestamp = verificationHistory[tokenId][i].timestamp;
                break;
            }
        }

        return IERC721SupplyChain.Netbook({
            serialNumber: tokenMetadata[tokenId].serialNumber,
            batchId: tokenMetadata[tokenId].batchId,
            specs: tokenMetadata[tokenId].technicalSpecs,
            state: uint8(tokenState[tokenId]),
            hwAuditor: hwAuditor,
            hwReportHash: hwReportHash,
            hwIntegrityPassed: hwPassed,
            swTechnician: swTechnician,
            osVersion: osVersion,
            swValidationPassed: swPassed,
            destinationSchoolHash: schoolHash,
            studentIdHash: studentHash,
            distributionTimestamp: distTimestamp
        });
    }
}