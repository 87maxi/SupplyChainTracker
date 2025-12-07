// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SupplyChainTracker
 * @dev Sistema de trazabilidad para netbooks con control de acceso basado en roles y máquina de estados.
 */
contract SupplyChainTracker is AccessControl {
    // Definición de roles
    bytes32 public constant FABRICANTE_ROLE = keccak256("FABRICANTE_ROLE");
    bytes32 public constant AUDITOR_HW_ROLE = keccak256("AUDITOR_HW_ROLE");
    bytes32 public constant TECNICO_SW_ROLE = keccak256("TECNICO_SW_ROLE");
    bytes32 public constant ESCUELA_ROLE = keccak256("ESCUELA_ROLE");

    // Estados de aprobación para roles
    enum ApprovalState {
        Pending,
        Approved,
        Rejected,
        Canceled
    }

    // Definición de estados de netbook
    enum NetbookState {
        FABRICADA,
        HW_APROBADO,
        SW_VALIDADO,
        DISTRIBUIDA
    }

    // Estructura para gestión de estados de rol por dirección
    struct RoleApproval {
        bytes32 role;
        address account;
        ApprovalState state;
        uint256 approvalTimestamp;
        address approvedBy;
    }

    // Estructura de datos para la netbook
    struct Netbook {
        string serialNumber;
        string batchId;
        string initialModelSpecs;

        address hwAuditor;
        bool hwIntegrityPassed;
        bytes32 hwReportHash;

        address swTechnician;
        string osVersion;
        bool swValidationPassed;

        bytes32 destinationSchoolHash;
        bytes32 studentIdHash;
        uint256 distributionTimestamp;

        NetbookState state;
    }
    
    // Mapping de serialNumber a Netbook
    mapping(string => Netbook) private netbooks;
    
    // Mapping para estados de aprobación de roles: role => account => RoleApproval
    mapping(bytes32 => mapping(address => RoleApproval)) public roleApprovals;
    
    // Eventos
    event NetbookRegistered(string serialNumber, string batchId, string initialModelSpecs);
    event HardwareAudited(string serialNumber, address auditor, bool passed, bytes32 reportHash);
    event SoftwareValidated(string serialNumber, address technician, string osVersion, bool passed);
    event AssignedToStudent(string serialNumber, bytes32 schoolHash, bytes32 studentHash);
    event RoleStatusUpdated(bytes32 indexed role, address indexed account, ApprovalState state, address updatedBy);
    
    // Modificador para verificar el estado previo de netbook
    modifier netbookStateIs(string memory serial, NetbookState expectedState) {
        _checkNetbookState(serial, expectedState);
        _;
    }

    function _checkNetbookState(string memory serial, NetbookState expectedState) internal view {
        require(netbooks[serial].state == expectedState, unicode"Estado incorrecto para esta operación");
    }

    modifier onlyApprovedRole(bytes32 role) {
        _checkApprovedRole(role);
        _;
    }

    function _checkApprovedRole(bytes32 role) internal view {
        require(roleApprovals[role][msg.sender].state == ApprovalState.Approved, 
                unicode"Rol no aprobado para esta dirección");
    }
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    // Funciones administrativas para gestión de roles
    function requestRoleApproval(bytes32 role) external {
        require(role != DEFAULT_ADMIN_ROLE, "Cannot request admin role");
        require(roleApprovals[role][msg.sender].state == ApprovalState.Pending || 
                roleApprovals[role][msg.sender].state == ApprovalState.Canceled,
                "Role request already exists or is approved");
        
        roleApprovals[role][msg.sender] = RoleApproval({
            role: role,
            account: msg.sender,
            state: ApprovalState.Pending,
            approvalTimestamp: 0,
            approvedBy: address(0)
        });
        
        emit RoleStatusUpdated(role, msg.sender, ApprovalState.Pending, msg.sender);
    }
    
    function approveRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(roleApprovals[role][account].state == ApprovalState.Pending, 
                "Role not in pending state");
        
        roleApprovals[role][account].state = ApprovalState.Approved;
        roleApprovals[role][account].approvalTimestamp = block.timestamp;
        roleApprovals[role][account].approvedBy = msg.sender;
        
        _grantRole(role, account);
        emit RoleStatusUpdated(role, account, ApprovalState.Approved, msg.sender);
    }
    
    function rejectRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(roleApprovals[role][account].state == ApprovalState.Pending, 
                "Role not in pending state");
        
        roleApprovals[role][account].state = ApprovalState.Rejected;
        roleApprovals[role][account].approvalTimestamp = block.timestamp;
        roleApprovals[role][account].approvedBy = msg.sender;
        
        emit RoleStatusUpdated(role, account, ApprovalState.Rejected, msg.sender);
    }
    
    function cancelRoleRequest(bytes32 role) external {
        require(roleApprovals[role][msg.sender].state == ApprovalState.Pending, 
                "No pending request to cancel");
        
        roleApprovals[role][msg.sender].state = ApprovalState.Canceled;
        roleApprovals[role][msg.sender].approvalTimestamp = block.timestamp;
        
        emit RoleStatusUpdated(role, msg.sender, ApprovalState.Canceled, msg.sender);
    }
    
    function revokeRoleApproval(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(roleApprovals[role][account].state == ApprovalState.Approved, 
                "Role not approved");
        
        roleApprovals[role][account].state = ApprovalState.Canceled;
        roleApprovals[role][account].approvalTimestamp = block.timestamp;
        roleApprovals[role][account].approvedBy = msg.sender;
        
        _revokeRole(role, account);
        emit RoleStatusUpdated(role, account, ApprovalState.Canceled, msg.sender);
    }
    
    function getRoleStatus(bytes32 role, address account) external view returns (RoleApproval memory) {
        return roleApprovals[role][account];
    }
    
    // Funciones de escritura
    function registerNetbooks(
        string[] calldata serialNumbers,
        string[] calldata batchIds,
        string[] calldata modelSpecs
    ) external onlyApprovedRole(FABRICANTE_ROLE) {
        require(serialNumbers.length == batchIds.length && batchIds.length == modelSpecs.length, "Arrays de longitud incompatible");
        
        for (uint256 i = 0; i < serialNumbers.length; i++) {
            string memory serial = serialNumbers[i];
            require(bytes(netbooks[serial].serialNumber).length == 0, "Netbook ya registrada");
            
            netbooks[serial] = Netbook({
                serialNumber: serial,
                batchId: batchIds[i],
                initialModelSpecs: modelSpecs[i],
                hwAuditor: address(0),
                hwIntegrityPassed: false,
                hwReportHash: bytes32(0),
                swTechnician: address(0),
                osVersion: "",
                swValidationPassed: false,
                destinationSchoolHash: bytes32(0),
                studentIdHash: bytes32(0),
                distributionTimestamp: 0,
                state: NetbookState.FABRICADA
            });
            
            emit NetbookRegistered(serial, batchIds[i], modelSpecs[i]);
        }
    }
    
    function auditHardware(
        string calldata serialNumber,
        bool integrityPassed,
        bytes32 reportHash
    ) external onlyApprovedRole(AUDITOR_HW_ROLE) netbookStateIs(serialNumber, NetbookState.FABRICADA) {
        Netbook storage netbook = netbooks[serialNumber];
        netbook.hwAuditor = msg.sender;
        netbook.hwIntegrityPassed = integrityPassed;
        netbook.hwReportHash = reportHash;
        netbook.state = NetbookState.HW_APROBADO;
        
        emit HardwareAudited(serialNumber, msg.sender, integrityPassed, reportHash);
    }
    
    function validateSoftware(
        string calldata serialNumber,
        string calldata osVersion,
        bool validationPassed
    ) external onlyApprovedRole(TECNICO_SW_ROLE) netbookStateIs(serialNumber, NetbookState.HW_APROBADO) {
        Netbook storage netbook = netbooks[serialNumber];
        netbook.swTechnician = msg.sender;
        netbook.osVersion = osVersion;
        netbook.swValidationPassed = validationPassed;
        netbook.state = NetbookState.SW_VALIDADO;
        
        emit SoftwareValidated(serialNumber, msg.sender, osVersion, validationPassed);
    }
    
    function assignToStudent(
        string calldata serialNumber,
        bytes32 schoolHash,
        bytes32 studentHash
    ) external onlyApprovedRole(ESCUELA_ROLE) netbookStateIs(serialNumber, NetbookState.SW_VALIDADO) {
        Netbook storage netbook = netbooks[serialNumber];
        netbook.destinationSchoolHash = schoolHash;
        netbook.studentIdHash = studentHash;
        netbook.distributionTimestamp = block.timestamp;
        netbook.state = NetbookState.DISTRIBUIDA;
        
        emit AssignedToStudent(serialNumber, schoolHash, studentHash);
    }
    
    // Funciones de lectura
    function getNetbookReport(string calldata serialNumber) external view returns (Netbook memory) {
        return netbooks[serialNumber];
    }
    
    function getNetbookState(string calldata serialNumber) external view returns (NetbookState) {
        return netbooks[serialNumber].state;
    }
}