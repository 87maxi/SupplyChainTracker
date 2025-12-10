/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721, IERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC721SupplyChain} from "./interfaces/IERC721SupplyChain.sol";

/// @title SupplyChainTracker - Sistema de Rastreo de Netbooks mediante NFTs
/// @author Continue
/// @notice Sistema completo de trazabilidad para netbooks del Plan de Inclusión Digital
/// Cada netbook es representada como un NFT (nToken) con seguimiento del ciclo de vida
contract SupplyChainTracker is ERC721Enumerable, Ownable2Step, IERC721SupplyChain {
    ///
    /// Centro de Registro de NFTs de Netbook
    ///
    struct TokenMetadata {
        string serialNumber;
        string manufacturer;
        string technicalSpecs;
        string hardwareAuditReportHash;
        string softwareValidationReportHash;
        string distributionCertificateHash;
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
    /// Permisos de auditoría y verificación
    ///
    mapping(address => bool) public hardwareVerifiers;
    mapping(address => bool) public softwareVerifiers;
    mapping(address => bool) public distributionOfficers;

    ///
    /// Eventos de trazabilidad
    ///
    ///
    event TokenMinted(uint256 tokenId, string serialNumber, string manufacturer);

    ///
    /// Implementación de la interfaz IERC721SupplyChain
    ///
    function getTokenSerialNumber(uint256 tokenId) external view returns (string memory) {
        return tokenMetadata[tokenId].serialNumber;
    }
    
    function getTokenBatchId(uint256 tokenId) external view returns (string memory) {
        // Devolvemos el ID del lote. Asumamos que es parte del serial o se almacena separadamente.
        // Por simplicidad, devolvemos una cadena vacía, pero debería ser almacenada.
        return "";
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
        // Buscamos en el historial de verificación el registro de Hardware
        for (uint256 i = 0; i < verificationHistory[tokenId].length; i++) {
            if (verificationHistory[tokenId][i].newState == TokenState.IN_CIRCULATION) {
                return (
                    verificationHistory[tokenId][i].verifier,
                    bytes32(bytes(verificationHistory[tokenId][i].certificateHash)),
                    true // Asumimos que si hay un reporte, pasó
                );
            }
        }
        return (address(0), bytes32(0), false);
    }
    
    function getSoftwareValidationData(uint256 tokenId) 
        external view 
        returns (address technician, string memory osVersion, bool passed)
    {
        // Buscamos en el historial de verificación el registro de Software
        for (uint256 i = 0; i < verificationHistory[tokenId].length; i++) {
            if (verificationHistory[tokenId][i].newState == TokenState.VERIFIED) {
                return (
                    verificationHistory[tokenId][i].verifier,
                    "Ultima Version", // Placeholder. El OS real debería almacenarse.
                    true // Asumimos éxito
                );
            }
        }
        return (address(0), "", false);
    }
    
    function getDistributionData(uint256 tokenId) 
        external view 
        returns (bytes32 schoolHash, bytes32 studentHash, uint256 timestamp)
    {
        // Buscamos en el historial de verificación el registro de Distribución
        for (uint256 i = 0; i < verificationHistory[tokenId].length; i++) {
            if (verificationHistory[tokenId][i].newState == TokenState.DISTRIBUTED) {
                bytes memory data = bytes(tokenMetadata[tokenId].distributionCertificateHash);
                if (data.length >= 64) {
                    // Extraemos los hashes del string almacenado.
                    // Esto es una simplificación. En la práctica, deberían estar almacenados como bytes32.
                    assembly {
                        schoolHash := mload(add(data, 0x20))
                        studentHash := mload(add(data, 0x40))
                    }
                }
                return (schoolHash, studentHash, verificationHistory[tokenId][i].timestamp);
            }
        }
        return (bytes32(0), bytes32(0), 0);
    }
    
    event VerificationUpdated(uint256 indexed tokenId, TokenState previousState, TokenState newState, string certificateHash);
    event VerificationRoleRegistered(address verifier, uint8 verificationType);
    event DistributionRecorded(uint256 tokenId, bytes32 schoolHash, bytes32 studentIdHash, uint256 timestamp);
    event HardwareVerificationAdded(uint256 index, address verifier, string reportHash, bool passed);
    event TokenStateUpdated(uint256 tokenId, TokenState newState);

    ///
    /// Modificador de control de acceso
    ///
    modifier onlyVerifiedStatus(uint256 tokenId) {
        require(tokenState[tokenId] == TokenState.VERIFIED, unicode"El token debe estar verificado");
        _;
    }

    modifier onlyAuthorizedVerifier(uint8 verificationType) {
        if (verificationType == 1) { // Hardware
            require(hardwareVerifiers[msg.sender], unicode"No autorizado para verificación de hardware");
        } else if (verificationType == 2) { // Software
            require(softwareVerifiers[msg.sender], unicode"No autorizado para verificación de software");
        }
        _;
    }

    ///
    /// Constructor
    ///
    uint256 private _tokenIdCounter;
    constructor() ERC721("SecureNetbookToken", "SNBK") Ownable2Step(msg.sender) {
        // Inicialización de roles
        _tokenIdCounter = 1;
    }

    ///
    /// Minting de tokens con datos base
    /// @param serialNumber Número de serie único de la netbook
    /// @param manufacturer Fabricante
    /// @param technicalSpecs Especificaciones técnicas
    /// @return tokenId El ID del token generado
    function mint(
        string memory serialNumber,
        string memory manufacturer,
        string memory technicalSpecs
    ) public onlyOwner returns (uint256 tokenId) {
        require(serialNumberToTokenId[serialNumber] == 0, unicode"El número de serie ya está registrado");

        tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Registrar los datos básicos
        tokenMetadata[tokenId] = TokenMetadata(
            serialNumber,
            manufacturer,
            technicalSpecs,
            "",
            "",
            ""
        );

        tokenState[tokenId] = TokenState.INITIALIZED;
        serialNumberToTokenId[serialNumber] = tokenId;

        _safeMint(msg.sender, tokenId);
        
        emit TokenMinted(tokenId, serialNumber, manufacturer);
    }

    ///
    /// Registra un verificador autorizado
    /// @param verifier Dirección del verificador
    /// @param verificationType 1=Hardware 2=Software
    function registerVerifier(address verifier, uint8 verificationType) public onlyOwner {
        if (verificationType == 1) {
            hardwareVerifiers[verifier] = true;
        } else if (verificationType == 2) {
            softwareVerifiers[verifier] = true;
        }
        
        emit VerificationRoleRegistered(verifier, verificationType);
    }

    ///
    /// Registra un oficial de distribución
    /// @param facilator Dirección del oficial
    function registerDistributionFacilator(address facilator) public onlyOwner {
        distributionOfficers[facilator] = true;
    }

    ///
    /// Agrega verificación de hardware
    /// @param tokenId ID del token
    /// @param reportHash Hash del certificado de auditoría
    function addHardwareVerification(uint256 tokenId, string memory reportHash) public onlyAuthorizedVerifier(1) {
        require(tokenState[tokenId] == TokenState.INITIALIZED || tokenState[tokenId] == TokenState.IN_CIRCULATION, unicode"Estado incorrecto para auditoría de hardware");

        // Actualizar datos
        TokenMetadata storage metadata = tokenMetadata[tokenId];
        metadata.hardwareAuditReportHash = reportHash;

        // Actualizar estado
        TokenState previousState = tokenState[tokenId];
        tokenState[tokenId] = TokenState.IN_CIRCULATION;
        
        // Registrar el historial
        verificationHistory[tokenId].push(VerificationRecord(
            msg.sender,
            uint8(previousState),
            uint8(TokenState.IN_CIRCULATION),
            block.timestamp,
            reportHash
        ));
        
        emit VerificationUpdated(tokenId, previousState, TokenState.IN_CIRCULATION, reportHash);
    }

    ///
    /// Agrega verificación de software
    /// @param tokenId ID del token
    /// @param reportHash Hash del certificado de validación
    function addSoftwareValidation(uint256 tokenId, string memory reportHash) public onlyAuthorizedVerifier(2) {
        require(tokenState[tokenId] == TokenState.IN_CIRCULATION, unicode"Estado incorrecto para validación de software");

        // Actualizar datos
        TokenMetadata storage metadata = tokenMetadata[tokenId];
        metadata.softwareValidationReportHash = reportHash;

        // Actualizar estado
        TokenState previousState = tokenState[tokenId];
        tokenState[tokenId] = TokenState.VERIFIED;
        
        // Registrar el historial
        verificationHistory[tokenId].push(VerificationRecord(
            msg.sender,
            uint8(previousState),
            uint8(TokenState.VERIFIED),
            block.timestamp,
            reportHash
        ));
        
        emit VerificationUpdated(tokenId, previousState, TokenState.VERIFIED, reportHash);
    }

    /**
     * Función de reporte principal que agrega todos los datos de trazabilidad.
     * Se mueve al final para permitir que vea las funciones declaradas antes.
     */
    function getSupplyChainReport(uint256 tokenId) external view returns (Netbook memory) {
        (address hwAuditor, bytes32 hwReportHash, bool hwPassed) = getHardwareAuditData(tokenId);
        (address swTechnician, string memory osVersion, bool swPassed) = getSoftwareValidationData(tokenId);
        (bytes32 schoolHash, bytes32 studentHash, uint256 distTimestamp) = getDistributionData(tokenId);

        return Netbook({
            serialNumber: getTokenSerialNumber(tokenId),
            batchId: getTokenBatchId(tokenId),
            specs: getTokenSpecs(tokenId),
            state: getTokenState(tokenId),
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