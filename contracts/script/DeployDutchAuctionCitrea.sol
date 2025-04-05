// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/DutchAuction.sol";

contract DeployDutchAuctionCitrea is Script {
    function run() external {
        // Replace these with actual values before deploying
        uint32 ORIGIN_CHAIN = 5115;
        address mailbox = 0xB08d78F439e55D02C398519eef61606A5926245F; // Mailbox address citrea
        vm.startBroadcast();

        // Deploy Dutch Auction contract
        DutchAuction auction = new DutchAuction(address(0), ORIGIN_CHAIN, mailbox);

        console.log("Dutch Auction deployed at:", address(auction));

        vm.stopBroadcast();
    }
}