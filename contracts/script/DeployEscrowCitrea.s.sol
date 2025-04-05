// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/Escrow.sol";

contract DeployEscrowCitrea is Script {
    function run() external {
        // Replace these with actual values before deploying
        vm.startBroadcast();
        uint32 localDomain = 5115;  // Example local domain ID
        address permit2 = address(0);  // Permit2 address on sepolia
        address mailbox = 0xB08d78F439e55D02C398519eef61606A5926245F; // Mailbox address citrea

        // Deploy Escrow contract
        Escrow escrow = new Escrow(localDomain, permit2 , mailbox);

        console.log("Escrow deployed at:", address(escrow));

        vm.stopBroadcast();
    }
}
