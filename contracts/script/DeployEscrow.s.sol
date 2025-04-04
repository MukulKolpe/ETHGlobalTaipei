// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/Escrow.sol";

contract DeployEscrow is Script {
    function run() external {
        // Replace these with actual values before deploying
        vm.startBroadcast();
        uint32 localDomain = 11155111;  // Example local domain ID
        address permit2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;  // Permit2 address on sepolia
        address mailbox = 0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766; // Hyplerlane Messenger address on sepolia
        address counterpart = address(0); // Dutch auction address initially to 0
        // Deploy Escrow contract
        Escrow escrow = new Escrow(localDomain, permit2 , counterpart, mailbox);

        console.log("Escrow deployed at:", address(escrow));

        vm.stopBroadcast();
    }
}
