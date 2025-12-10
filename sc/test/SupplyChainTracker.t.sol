// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {SupplyChainTracker} from "../src/SupplyChainTracker.sol";

contract SupplyChainTrackerTest is Test {
    SupplyChainTracker public tracker;

    // Test addresses
    address constant FABRICANTE_ADDR = address(0x1);
    address constant AUDITOR_ADDR = address(0x2);
    address constant TECNICO_ADDR = address(0x3);
    address constant ESCUELA_ADDR = address(0x4);
    address adminAddr;
    
    // Test data
    string constant TEST_SERIAL = "NB001";
    string constant TEST_BATCH = "L001";
    string constant TEST_SPECS = "Intel N100, 8GB RAM, 256GB SSD";
    bytes32 constant TEST_REPORT_HASH = keccak256("test_report_hash");

    function setUp() public {
        tracker = new SupplyChainTracker();
        adminAddr = address(this);
        _setupApprovedRoles();
    }
    
    function _setupApprovedRoles() internal {
        // Configurar y aprobar roles para las direcciones de prueba
        
        // Solicitar roles desde cada dirección usando startPrank/stopPrank
        vm.startPrank(FABRICANTE_ADDR);
        tracker.requestRoleApproval(tracker.FABRICANTE_ROLE());
        vm.stopPrank();
        
        vm.startPrank(AUDITOR_ADDR);
        tracker.requestRoleApproval(tracker.AUDITOR_HW_ROLE());
        vm.stopPrank();
        
        vm.startPrank(TECNICO_ADDR);
        tracker.requestRoleApproval(tracker.TECNICO_SW_ROLE());
        vm.stopPrank();
        
        vm.startPrank(ESCUELA_ADDR);
        tracker.requestRoleApproval(tracker.ESCUELA_ROLE());
        vm.stopPrank();
        
        // Aprobar todos los roles desde admin
        vm.startPrank(adminAddr);
        tracker.approveRole(tracker.FABRICANTE_ROLE(), FABRICANTE_ADDR);
        tracker.approveRole(tracker.AUDITOR_HW_ROLE(), AUDITOR_ADDR);
        tracker.approveRole(tracker.TECNICO_SW_ROLE(), TECNICO_ADDR);
        tracker.approveRole(tracker.ESCUELA_ROLE(), ESCUELA_ADDR);
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
        vm.prank(adminAddr);
        tracker.approveRole(tracker.FABRICANTE_ROLE(), newFabricante);
        
        // Verificar estado aprobado
        status = tracker.getRoleStatus(tracker.FABRICANTE_ROLE(), newFabricante);
        assertEq(uint256(status.state), 1); // Approved
        assertEq(status.approvedBy, adminAddr);
        assertTrue(status.approvalTimestamp > 0);
    }
    
    function test_RoleRejectionWorkflow() public {
        address newAuditor = address(0x6);
        
        // Solicitar rol
        vm.prank(newAuditor);
        tracker.requestRoleApproval(tracker.AUDITOR_HW_ROLE());
        
        // Rechazar rol
        vm.prank(adminAddr);
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

        vm.prank(FABRICANTE_ADDR);
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

        vm.prank(FABRICANTE_ADDR);
        tracker.registerNetbooks(serials, batches, specs);
        
        vm.expectRevert(unicode"Netbook ya registrada");
        vm.prank(FABRICANTE_ADDR);
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

        vm.prank(FABRICANTE_ADDR);
        tracker.registerNetbooks(serials, batches, specs);
        
        bytes32 reportHash = keccak256(unicode"report_hw_001");
        
        vm.prank(AUDITOR_ADDR);
        tracker.auditHardware(serials[0], reportHash);
        
        // Verificar transición de estado
        assertEq(uint256(tracker.getNetbookState(serials[0])), 1); // HW_APROBADO
        
        // Verificar datos almacenados
        SupplyChainTracker.Netbook memory nb = tracker.getNetbookReport(serials[0]);
        assertEq(nb.hwAuditor, AUDITOR_ADDR);
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

        vm.prank(FABRICANTE_ADDR);
        tracker.registerNetbooks(serials, batches, specs);
        
        vm.expectRevert();
        vm.prank(FABRICANTE_ADDR); // fabricante intenta auditar
        tracker.auditHardware(serials[0], bytes32(0));
    }

    function test_CannotAuditIfWrongState() public {
        string[] memory serials = new string[](1);
        string[] memory batches = new string[](1);
        string[] memory specs = new string[](1);
        
        serials[0] = "NB001";
        batches[0] = "L001";
        specs[0] = "Spec";

        vm.prank(FABRICANTE_ADDR);
        tracker.registerNetbooks(serials, batches, specs);
        
        // Avanzar legalmente hasta SW_VALIDADO
        vm.prank(AUDITOR_ADDR);
        tracker.auditHardware(serials[0], bytes32(0));
        
        vm.prank(TECNICO_ADDR);
        tracker.validateSoftware(serials[0], "OS");
        
        // Ahora intentar auditar de nuevo - debería fallar porque el estado es SW_VALIDADO, no FABRICADA
        vm.expectRevert(unicode"Estado incorrecto para auditoría de hardware");
        vm.prank(AUDITOR_ADDR);
        tracker.auditHardware(serials[0], bytes32(0));
    }

    // --- Test: Validación de Software ---
    function test_ValidateSoftware() public {
        string[] memory serials = new string[](1);
        string[] memory batches = new string[](1);
        string[] memory specs = new string[](1);
        
        serials[0] = "NB001";
        batches[0] = "L001";
        specs[0] = "Spec";

        vm.prank(FABRICANTE_ADDR);
        tracker.registerNetbooks(serials, batches, specs);
        
        vm.prank(AUDITOR_ADDR);
        tracker.auditHardware(serials[0], bytes32(0));
        
        vm.prank(TECNICO_ADDR);
        tracker.validateSoftware(serials[0], "Linux Edu 5.0");
        
        // Verificar transición de estado
        assertEq(uint256(tracker.getNetbookState(serials[0])), 2); // SW_VALIDADO
        
        // Verificar datos
        SupplyChainTracker.Netbook memory nb = tracker.getNetbookReport(serials[0]);
        assertEq(nb.swTechnician, TECNICO_ADDR);
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

        vm.prank(FABRICANTE_ADDR);
        tracker.registerNetbooks(serials, batches, specs);
        
        vm.prank(AUDITOR_ADDR);
        tracker.auditHardware(serials[0], bytes32(0));
        
        vm.prank(TECNICO_ADDR);
        tracker.validateSoftware(serials[0], "OS");
        
        bytes32 schoolHash = keccak256(unicode"Escuela Nacional 1");
        bytes32 studentHash = keccak256(unicode"Juan Pérez");
        
        vm.prank(ESCUELA_ADDR);
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
        vm.startPrank(newFabricante);
        tracker.requestRoleApproval(tracker.FABRICANTE_ROLE());
        vm.stopPrank();
        
        vm.startPrank(newAuditor);
        tracker.requestRoleApproval(tracker.AUDITOR_HW_ROLE());
        vm.stopPrank();
        
        vm.startPrank(newTecnico);
        tracker.requestRoleApproval(tracker.TECNICO_SW_ROLE());
        vm.stopPrank();
        
        // Obtener todas las solicitudes pendientes
        SupplyChainTracker.RoleApproval[] memory pendingRequests = tracker.getAllPendingRoleRequests();
        
        // Deberíamos tener 3 solicitudes pendientes (las nuevas que acabamos de crear)
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
            if (pendingRequests[i].account == newFabricante) {
                assertEq(pendingRequests[i].role, tracker.FABRICANTE_ROLE());
                foundFabricante = true;
            }
            if (pendingRequests[i].account == newAuditor) {
                assertEq(pendingRequests[i].role, tracker.AUDITOR_HW_ROLE());
                foundAuditor = true;
            }
            if (pendingRequests[i].account == newTecnico) {
                assertEq(pendingRequests[i].role, tracker.TECNICO_SW_ROLE());
                foundTecnico = true;
            }
        }
        
        assertTrue(foundFabricante && foundAuditor && foundTecnico);
        
        // Aprobar una solicitud
        vm.startPrank(adminAddr);
        tracker.approveRole(tracker.FABRICANTE_ROLE(), newFabricante);
        vm.stopPrank();
        
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

    // --- Tests adicionales para mejorar cobertura ---
    
    function test_CancelRoleRequest() public {
        address newEscuela = address(0x13);
        
        // Solicitar rol
        vm.startPrank(newEscuela);
        tracker.requestRoleApproval(tracker.ESCUELA_ROLE());
        vm.stopPrank();
        
        // Verificar que está pendiente primero
        SupplyChainTracker.RoleApproval memory initialStatus = tracker.getRoleStatus(tracker.ESCUELA_ROLE(), newEscuela);
        assertEq(uint256(initialStatus.state), 0); // Pending
        
        // Cancelar solicitud
        vm.startPrank(newEscuela);
        tracker.cancelRoleRequest(tracker.ESCUELA_ROLE());
        vm.stopPrank();
        
        // Verificar estado cancelado
        SupplyChainTracker.RoleApproval memory status = tracker.getRoleStatus(tracker.ESCUELA_ROLE(), newEscuela);
        assertEq(uint256(status.state), 3); // Canceled
    }
    
    function test_RevokeRoleApproval() public {
        // Revocar rol aprobado
        vm.prank(adminAddr);
        tracker.revokeRoleApproval(tracker.FABRICANTE_ROLE(), FABRICANTE_ADDR);
        
        // Verificar estado cancelado
        SupplyChainTracker.RoleApproval memory status = tracker.getRoleStatus(tracker.FABRICANTE_ROLE(), FABRICANTE_ADDR);
        assertEq(uint256(status.state), 3); // Canceled
        
        // Verificar que no puede registrar netbooks después de revocar rol
        string[] memory serials = new string[](1);
        string[] memory batches = new string[](1);
        string[] memory specs = new string[](1);
        
        serials[0] = "NB_REVOKED";
        batches[0] = "L001";
        specs[0] = "Spec";

        vm.expectRevert(unicode"Rol no aprobado para esta dirección");
        vm.prank(FABRICANTE_ADDR);
        tracker.registerNetbooks(serials, batches, specs);
    }
    
    function test_CannotAuditNonExistentNetbook() public {
        vm.expectRevert(unicode"Netbook no existe");
        vm.startPrank(AUDITOR_ADDR);
        tracker.auditHardware("NON_EXISTENT", bytes32(0));
        vm.stopPrank();
    }
    
    function test_CannotValidateNonExistentNetbook() public {
        vm.expectRevert(unicode"Netbook no existe");
        vm.startPrank(TECNICO_ADDR);
        tracker.validateSoftware("NON_EXISTENT", "OS");
        vm.stopPrank();
    }
    
    function test_CannotAssignNonExistentNetbook() public {
        vm.expectRevert(unicode"Netbook no existe");
        vm.startPrank(ESCUELA_ADDR);
        tracker.assignToStudent("NON_EXISTENT", bytes32(0), bytes32(0));
        vm.stopPrank();
    }
    
    function test_RegisterMultipleNetbooksInBatch() public {
        string[] memory serials = new string[](3);
        string[] memory batches = new string[](3);
        string[] memory specs = new string[](3);
        
        serials[0] = "NB_BATCH_001";
        serials[1] = "NB_BATCH_002";
        serials[2] = "NB_BATCH_003";
        
        batches[0] = "BATCH_L001";
        batches[1] = "BATCH_L001";
        batches[2] = "BATCH_L001";
        
        specs[0] = "Spec 1";
        specs[1] = "Spec 2";
        specs[2] = "Spec 3";

        vm.prank(FABRICANTE_ADDR);
        tracker.registerNetbooks(serials, batches, specs);
        
        // Verificar que todos fueron registrados
        assertEq(uint256(tracker.getNetbookState("NB_BATCH_001")), 0);
        assertEq(uint256(tracker.getNetbookState("NB_BATCH_002")), 0);
        assertEq(uint256(tracker.getNetbookState("NB_BATCH_003")), 0);
    }
}
