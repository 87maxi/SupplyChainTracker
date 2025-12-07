// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {SupplyChainTracker} from "../src/SupplyChainTracker.sol";

contract DeployBasic is Script {
    function run() external returns (SupplyChainTracker) {
        // Private key de la primera cuenta de anvil (0xac97...)
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        vm.startBroadcast(deployerPrivateKey);
        SupplyChainTracker tracker = new SupplyChainTracker();
        vm.stopBroadcast();
        
        console.log("Contrato desplegado en:", address(tracker));
        return tracker;
    }
}
