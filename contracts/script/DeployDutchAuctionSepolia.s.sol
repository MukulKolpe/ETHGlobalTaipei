// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/DutchAuction.sol";

contract DeployDutchAuctionSepolia is Script {
    function run() external {
        // Replace these with actual values before deploying
        uint32 ORIGIN_CHAIN = 11155111;
         address mailbox = 0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766; // Hyplerlane Messenger address on sepolia
        vm.startBroadcast();

        // Deploy Dutch Auction contract
        DutchAuction auction = new DutchAuction(address(0), ORIGIN_CHAIN, mailbox);

        console.log("Dutch Auction deployed at:", address(auction));

        vm.stopBroadcast();
    }
}