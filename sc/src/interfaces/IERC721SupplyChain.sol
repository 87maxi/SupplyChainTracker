/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

interface IERC721SupplyChain is IERC721Enumerable {
    /**
     * @dev Devuelve el número de serie asociado al nToken.
     * @param tokenId ID del nToken.
     * @return serialNumber Número de serie de la netbook.
     */
    function getTokenSerialNumber(uint256 tokenId) external view returns (string memory serialNumber);
    
    /**
     * @dev Devuelve el ID del lote asociado al nToken.
     * @param tokenId ID del nToken.
     * @return batchId ID del lote de fabricación.
     */
    function getTokenBatchId(uint256 tokenId) external view returns (string memory batchId);
    
    /**
     * @dev Devuelve las especificaciones técnicas de la netbook.
     * @param tokenId ID del nToken.
     * @return specs Especificaciones técnicas del hardware.
     */
    function getTokenSpecs(uint256 tokenId) external view returns (string memory specs);
    
    /**
     * @dev Devuelve el estado actual del ciclo de vida de la netbook.
     * @param tokenId ID del nToken.
     * @return state Estado actual (e.g., Fabricada, HW Auditado, SW Validado, etc.).
     */
    function getTokenState(uint256 tokenId) external view returns (uint8 state);
    
    /**
     * @dev Devuelve el estado del ciclo de vida de la netbook en formato legible.
     * @param tokenId ID del nToken.
     * @return stateLabel Etiqueta legible del estado.
     */
    function getTokenStateLabel(uint256 tokenId) external view returns (string memory stateLabel);
    
    /**
     * @dev Devuelve los datos de auditoría de hardware.
     * @param tokenId ID del nToken.
     * @return auditor Dirección del auditor que realizó la verificación.
     * @return reportHash Hash del reporte de auditoría.
     * @return passed Indica si la auditoría fue aprobada.
     */
    function getHardwareAuditData(uint256 tokenId) 
        external view 
        returns (
            address auditor, 
            bytes32 reportHash, 
            bool passed
        );
    
    /**
     * @dev Devuelve los datos de validación de software.
     * @param tokenId ID del nToken.
     * @return technician Dirección del técnico que realizó la validación.
     * @return osVersion Versión del sistema operativo instalado.
     * @return passed Indica si la validación fue aprobada.
     */
    function getSoftwareValidationData(uint256 tokenId) 
        external view 
        returns (
            address technician, 
            string memory osVersion, 
            bool passed
        );
    
    /**
     * @dev Devuelve los datos de asignación a estudiante.
     * @param tokenId ID del nToken.
     * @return schoolHash Hash del nombre de la escuela.
     * @return studentHash Hash del ID del estudiante.
     * @return distributionTimestamp Fecha y hora de asignación.
     */
    function getDistributionData(uint256 tokenId) 
        external view 
        returns (
            bytes32 schoolHash, 
            bytes32 studentHash, 
            uint256 distributionTimestamp
        );
    
    /**
     * @dev Devuelve un reporte completo de la netbook.
     * @param tokenId ID del nToken.
     * @return netbook Todos los datos asociados a la netbook.
     */
    function getSupplyChainReport(uint256 tokenId) external view returns (Netbook memory netbook);
    
    /**
     * @dev Estructura con todos los datos de seguimiento de la netbook.
     */
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
}