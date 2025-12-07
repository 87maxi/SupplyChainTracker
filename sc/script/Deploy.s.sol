// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {SupplyChainTracker} from "../src/SupplyChainTracker.sol";

contract DeployScript is Script {
    // Dirección de la primera cuenta de anvil (cuenta administrador por defecto)
    address internal constant ADMIN = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    
    // Direcciones predefinidas de anvil para asignar roles
    address internal constant FABRICANTE = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address internal constant AUDITOR_HW = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address internal constant TECNICO_SW = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
    address internal constant ESCUELA = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;
    
    // Hashes de los roles (deben coincidir con el contrato)
    bytes32 internal constant FABRICANTE_ROLE = keccak256("FABRICANTE_ROLE");
    bytes32 internal constant AUDITOR_HW_ROLE = keccak256("AUDITOR_HW_ROLE");
    bytes32 internal constant TECNICO_SW_ROLE = keccak256("TECNICO_SW_ROLE");
    bytes32 internal constant ESCUELA_ROLE = keccak256("ESCUELA_ROLE");
    
    function run() external returns (SupplyChainTracker) {
        // Obtener la private key del administrador desde las variables de entorno
        uint256 adminPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        
        // Iniciar broadcasting con la cuenta administrador
        vm.startBroadcast(adminPrivateKey);
        
        // Desplegar el contrato
        SupplyChainTracker tracker = new SupplyChainTracker();
        
        // Configurar todos los roles
        _setupRole(tracker, FABRICANTE_ROLE, FABRICANTE);
        _setupRole(tracker, AUDITOR_HW_ROLE, AUDITOR_HW);
        _setupRole(tracker, TECNICO_SW_ROLE, TECNICO_SW);
        _setupRole(tracker, ESCUELA_ROLE, ESCUELA);
        
        vm.stopBroadcast();
        
        // Guardar la dirección del contrato desplegado
        vm.writeFile(".deployed", vm.toString(address(tracker)));
        
        // Log información del deploy
        console.log("Contrato SupplyChainTracker desplegado en:", address(tracker));
        console.log("Roles configurados:");
        console.log("   - FABRICANTE:", FABRICANTE);
        console.log("   - AUDITOR_HW:", AUDITOR_HW);
        console.log("   - TECNICO_SW:", TECNICO_SW);
        console.log("   - ESCUELA:", ESCUELA);
        
        return tracker;
    }
    
    function _setupRole(SupplyChainTracker tracker, bytes32 role, address account) internal {
        // Solicitar aprobación del rol (desde la cuenta destino)
        vm.startBroadcast(vm.envUint(getPrivateKeyForAddress(account)));
        tracker.requestRoleApproval(role);
        vm.stopBroadcast();
        
        // Aprobar el rol (desde el administrador)
        tracker.approveRole(role, account);
    }
    
    function getPrivateKeyForAddress(address addr) internal pure returns (string memory) {
        // Mapeo de direcciones a nombres de variables de entorno para private keys
        if (addr == FABRICANTE) return "FABRICANTE_PRIVATE_KEY";
        if (addr == AUDITOR_HW) return "AUDITOR_PRIVATE_KEY";
        if (addr == TECNICO_SW) return "TECNICO_PRIVATE_KEY";
        if (addr == ESCUELA) return "ESCUELA_PRIVATE_KEY";
        if (addr == ADMIN) return "ADMIN_PRIVATE_KEY";
        revert("Direccion no reconocida");
    }
}
