// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {SupplyChainTracker} from "../src/SupplyChainTracker.sol";

contract DeployScript is Script {
    function run() external returns (SupplyChainTracker) {
        // Obtener la private key del administrador desde las variables de entorno
        uint256 adminPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        address adminAddress = vm.addr(adminPrivateKey);
        
        // Iniciar broadcasting con la cuenta administrador
        vm.startBroadcast(adminPrivateKey);
        
        // Desplegar el contrato
        SupplyChainTracker tracker = new SupplyChainTracker();
        
        vm.stopBroadcast();
        
// Log la dirección del contrato desplegado
console.log("Contrato desplegado en:", address(tracker));
        
        // Log información del deploy
        console.log("Contrato SupplyChainTracker desplegado en:", address(tracker));
        console.log("Administrador:", adminAddress);
        
        return tracker;
    }
}
