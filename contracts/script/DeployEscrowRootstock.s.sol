// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/Escrow.sol";

contract DeployEscrowRootstock is Script {
    function run() external {
        // Replace these with actual values before deploying
        vm.startBroadcast();
        uint32 localDomain = 31;  // Example local domain ID
        address permit2 = address(0);  // Permit2 address on sepolia
        address mailbox = 0x0d38F2A54F97Ea1aF03C92A9247e99bfBEb3e943; // Mailbox address rootstock

        // Deploy Escrow contract
        Escrow escrow = new Escrow(localDomain, permit2 , mailbox);

        console.log("Escrow deployed at:", address(escrow));

        vm.stopBroadcast();
    }
}
