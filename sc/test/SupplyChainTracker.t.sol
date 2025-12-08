// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {SupplyChainTracker} from "../src/SupplyChainTracker.sol";

contract SupplyChainTrackerTest is Test {
    SupplyChainTracker public tracker;

    address fabricante = address(0x1);
    address auditor = address(0x2);
    address tecnico = address(0x3);
    address escuela = address(0x4);
    address admin = address(this);

    function setUp() public {
        tracker = new SupplyChainTracker();
        
        // Configurar roles aprobados
        vm.startPrank(fabricante);
        tracker.requestRoleApproval(tracker.FABRICANTE_ROLE());
        vm.stopPrank();
        
        vm.startPrank(auditor);
        tracker.requestRoleApproval(tracker.AUDITOR_HW_ROLE());
        vm.stopPrank();
        
        vm.startPrank(tecnico);
        tracker.requestRoleApproval(tracker.TECNICO_SW_ROLE());
        vm.stopPrank();
        
        vm.startPrank(escuela);
        tracker.requestRoleApproval(tracker.ESCUELA_ROLE());
        vm.stopPrank();
        
        // Aprobar todos los roles como admin
        vm.startPrank(admin);
        tracker.approveRole(tracker.FABRICANTE_ROLE(), fabricante);
        tracker.approveRole(tracker.AUDITOR_HW_ROLE(), auditor);
        tracker.approveRole(tracker.TECNICO_SW_ROLE(), tecnico);
        tracker.approveRole(tracker.ESCUELA_ROLE(), escuela);
        vm.stopPrank();
    }

    // --- Test: Gestión de Roles ---
    function test_RoleApprovalWorkflow() public {
        address newFabricante = address(0x5);
        
        // Solicitar rol
        vm.prank(newFabricante);
        tracker.requestRoleApproval(tracker.FABRICANTE_ROLE());
        
        // Verificar estado pendiente
        SupplyChainTracker.RoleApproval memory status = tracker.getRoleStatus(tracker.FABRICANTE_ROLE(), newFabricante);
        assertEq(uint256(status.state), 0); // Pending
        
        // Aprobar rol
        vm.prank(admin);
        tracker.approveRole(tracker.FABRICANTE_ROLE(), newFabricante);
        
        // Verificar estado aprobado
        status = tracker.getRoleStatus(tracker.FABRICANTE_ROLE(), newFabricante);
        assertEq(uint256(status.state), 1); // Approved
        assertEq(status.approvedBy, admin);
        assertTrue(status.approvalTimestamp > 0);
    }
    
    function test_RoleRejectionWorkflow() public {
        address newAuditor = address(0x6);
        
        // Solicitar rol
        vm.prank(newAuditor);
        tracker.requestRoleApproval(tracker.AUDITOR_HW_ROLE());
        
        // Rechazar rol
        vm.prank(admin);
        tracker.rejectRole(tracker.AUDITOR_HW_ROLE(), newAuditor);
        
        // Verificar estado rechazado
        SupplyChainTracker.RoleApproval memory status = tracker.getRoleStatus(tracker.AUDITOR_HW_ROLE(), newAuditor);
        assertEq(uint256(status.state), 2); // Rejected
    }
    
    function test_CannotUseRoleWithoutApproval() public {
        address unauthorized = address(0x7);
        
        string[] memory serials = new string[](1);
        string[] memory batches = new string[](1);
        string[] memory specs = new string[](1);
        
        serials[0] = "NB001";
        batches[0] = "L001";
        specs[0] = "Spec";

        // Intentar registrar sin aprobación - debería fallar
        vm.expectRevert(unicode"Rol no aprobado para esta dirección");
        vm.prank(unauthorized);
        tracker.registerNetbooks(serials, batches, specs);
    }

    // --- Test: Registro de Netbooks ---
    function test_RegisterNetbooks() public {
        string[] memory serials = new string[](2);
        string[] memory batches = new string[](2);
        string[] memory specs = new string[](2);
        
        serials[0] = "NB001";
        batches[0] = "L001";
        specs[0] = "Intel N100, 8GB RAM, 256GB SSD";
        
        serials[1] = "NB002";
        batches[1] = "L001";
        specs[1] = "Intel N100, 8GB RAM, 256GB SSD";

        vm.prank(fabricante);
        tracker.registerNetbooks(serials, batches, specs);
        
        // Verificar estado 1
        assertEq(uint256(tracker.getNetbookState(serials[0])), 0); // FABRICADA
        assertEq(tracker.getNetbookReport(serials[0]).batchId, batches[0]);
        
        // Verificar estado 2
        assertEq(uint256(tracker.getNetbookState(serials[1])), 0); // FABRICADA
        assertEq(tracker.getNetbookReport(serials[1]).batchId, batches[1]);
    }

    function test_CannotRegisterDuplicate() public {
        string[] memory serials = new string[](1);
        string[] memory batches = new string[](1);
        string[] memory specs = new string[](1);
        
        serials[0] = "NB001";
        batches[0] = "L001";
        specs[0] = "Spec";

        vm.prank(fabricante);
        tracker.registerNetbooks(serials, batches, specs);
        
        vm.expectRevert(unicode"Netbook ya registrada");
        vm.prank(fabricante);
        tracker.registerNetbooks(serials, batches, specs);
    }

    // --- Test: Auditoría de Hardware ---
    function test_AuditHardware() public {
        string[] memory serials = new string[](1);
        string[] memory batches = new string[](1);
        string[] memory specs = new string[](1);
        
        serials[0] = "NB001";
        batches[0] = "L001";
        specs[0] = "Spec";

        vm.prank(fabricante);
        tracker.registerNetbooks(serials, batches, specs);
        
        bytes32 reportHash = keccak256(unicode"report_hw_001");
        
        vm.prank(auditor);
        tracker.auditHardware(serials[0], true, reportHash);
        
        // Verificar transición de estado
        assertEq(uint256(tracker.getNetbookState(serials[0])), 1); // HW_APROBADO
        
        // Verificar datos almacenados
        SupplyChainTracker.Netbook memory nb = tracker.getNetbookReport(serials[0]);
        assertEq(nb.hwAuditor, auditor);
        assertEq(nb.hwIntegrityPassed, true);
        assertEq(nb.hwReportHash, reportHash);
    }

    function test_CannotAuditIfNotAuditorRole() public {
        string[] memory serials = new string[](1);
        string[] memory batches = new string[](1);
        string[] memory specs = new string[](1);
        
        serials[0] = "NB001";
        batches[0] = "L001";
        specs[0] = "Spec";

        vm.prank(fabricante);
        tracker.registerNetbooks(serials, batches, specs);
        
        vm.expectRevert();
        vm.prank(fabricante); // fabricante intenta auditar
        tracker.auditHardware(serials[0], true, bytes32(0));
    }

    function test_CannotAuditIfWrongState() public {
        string[] memory serials = new string[](1);
        string[] memory batches = new string[](1);
        string[] memory specs = new string[](1);
        
        serials[0] = "NB001";
        batches[0] = "L001";
        specs[0] = "Spec";

        vm.prank(fabricante);
        tracker.registerNetbooks(serials, batches, specs);
        
        // Avanzar legalmente hasta SW_VALIDADO
        vm.prank(auditor);
        tracker.auditHardware(serials[0], true, bytes32(0));
        
        vm.prank(tecnico);
        tracker.validateSoftware(serials[0], "OS", true);
        
        // Ahora intentar auditar de nuevo - debería fallar porque el estado es SW_VALIDADO, no FABRICADA
        vm.expectRevert(unicode"Estado incorrecto para esta operación");
        vm.prank(auditor);
        tracker.auditHardware(serials[0], true, bytes32(0));
    }

    // --- Test: Validación de Software ---
    function test_ValidateSoftware() public {
        string[] memory serials = new string[](1);
        string[] memory batches = new string[](1);
        string[] memory specs = new string[](1);
        
        serials[0] = "NB001";
        batches[0] = "L001";
        specs[0] = "Spec";

        vm.prank(fabricante);
        tracker.registerNetbooks(serials, batches, specs);
        
        vm.prank(auditor);
        tracker.auditHardware(serials[0], true, bytes32(0));
        
        vm.prank(tecnico);
        tracker.validateSoftware(serials[0], "Linux Edu 5.0", true);
        
        // Verificar transición de estado
        assertEq(uint256(tracker.getNetbookState(serials[0])), 2); // SW_VALIDADO
        
        // Verificar datos
        SupplyChainTracker.Netbook memory nb = tracker.getNetbookReport(serials[0]);
        assertEq(nb.swTechnician, tecnico);
        assertEq(nb.osVersion, "Linux Edu 5.0");
        assertEq(nb.swValidationPassed, true);
    }

    // --- Test: Asignación a Estudiante ---
    function test_AssignToStudent() public {
        string[] memory serials = new string[](1);
        string[] memory batches = new string[](1);
        string[] memory specs = new string[](1);
        
        serials[0] = "NB001";
        batches[0] = "L001";
        specs[0] = "Spec";

        vm.prank(fabricante);
        tracker.registerNetbooks(serials, batches, specs);
        
        vm.prank(auditor);
        tracker.auditHardware(serials[0], true, bytes32(0));
        
        vm.prank(tecnico);
        tracker.validateSoftware(serials[0], "OS", true);
        
        bytes32 schoolHash = keccak256(unicode"Escuela Nacional 1");
        bytes32 studentHash = keccak256(unicode"Juan Pérez");
        
        vm.prank(escuela);
        tracker.assignToStudent(serials[0], schoolHash, studentHash);
        
        // Verificar transición de estado
        assertEq(uint256(tracker.getNetbookState(serials[0])), 3); // DISTRIBUIDA
        
        // Verificar datos
        SupplyChainTracker.Netbook memory nb = tracker.getNetbookReport(serials[0]);
        assertEq(nb.destinationSchoolHash, schoolHash);
        assertEq(nb.studentIdHash, studentHash);
        assertTrue(nb.distributionTimestamp > 0);
    }

    // --- Test: GetAllPendingRoleRequests ---
    function test_GetAllPendingRoleRequests() public {
        address newFabricante = address(0x10);
        address newAuditor = address(0x11);
        address newTecnico = address(0x12);
        
        // Solicitar roles - todos deberían estar pendientes
        vm.prank(newFabricante);
        tracker.requestRoleApproval(tracker.FABRICANTE_ROLE());
        
        vm.prank(newAuditor);
        tracker.requestRoleApproval(tracker.AUDITOR_HW_ROLE());
        
        vm.prank(newTecnico);
        tracker.requestRoleApproval(tracker.TECNICO_SW_ROLE());
        
        // Obtener todas las solicitudes pendientes
        SupplyChainTracker.RoleApproval[] memory pendingRequests = tracker.getAllPendingRoleRequests();
        
        // Deberíamos tener 3 solicitudes pendientes
        assertEq(pendingRequests.length, 3);
        
        // Verificar que todas las solicitudes están en estado Pendiente (0)
        for (uint i = 0; i < pendingRequests.length; i++) {
            assertEq(uint256(pendingRequests[i].state), 0); // Pending
            assertTrue(pendingRequests[i].approvalTimestamp > 0);
        }
        
        // Verificar que las direcciones y roles son correctos
        bool foundFabricante = false;
        bool foundAuditor = false;
        bool foundTecnico = false;
        
        for (uint i = 0; i < pendingRequests.length; i++) {
            console2.log("Checking request", i);
            console2.log("  Account:", uint256(uint160(pendingRequests[i].account)));
            console2.log("  Expected fabricante:", uint256(uint160(newFabricante)));
            console2.log("  Expected auditor:", uint256(uint160(newAuditor)));
            console2.log("  Expected tecnico:", uint256(uint160(newTecnico)));
            
            if (pendingRequests[i].account == newFabricante) {
                console2.log("Found fabricante request");
                assertEq(pendingRequests[i].role, tracker.FABRICANTE_ROLE());
                foundFabricante = true;
            }
            if (pendingRequests[i].account == newAuditor) {
                console2.log("Found auditor request");
                assertEq(pendingRequests[i].role, tracker.AUDITOR_HW_ROLE());
                foundAuditor = true;
            }
            if (pendingRequests[i].account == newTecnico) {
                console2.log("Found tecnico request");
                assertEq(pendingRequests[i].role, tracker.TECNICO_SW_ROLE());
                foundTecnico = true;
            }
        }
        
        console2.log("foundFabricante:", foundFabricante);
        console2.log("foundAuditor:", foundAuditor);
        console2.log("foundTecnico:", foundTecnico);
        assertTrue(foundFabricante && foundAuditor && foundTecnico);
        
        // Aprobar una solicitud
        vm.prank(admin);
        tracker.approveRole(tracker.FABRICANTE_ROLE(), newFabricante);
        
        // Obtener nuevamente las solicitudes pendientes
        SupplyChainTracker.RoleApproval[] memory updatedPendingRequests = tracker.getAllPendingRoleRequests();
        
        // Ahora deberíamos tener 2 solicitudes pendientes
        assertEq(updatedPendingRequests.length, 2);
        
        // Verificar que la solicitud aprobada ya no está en la lista
        bool stillFoundFabricante = false;
        for (uint i = 0; i < updatedPendingRequests.length; i++) {
            if (updatedPendingRequests[i].account == newFabricante) {
                stillFoundFabricante = true;
                break;
            }
        }
        assertFalse(stillFoundFabricante);
    }
}
