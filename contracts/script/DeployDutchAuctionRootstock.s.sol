// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/DutchAuction.sol";

contract DeployDutchAuctionRootstock is Script {
    function run() external {
        // Replace these with actual values before deploying
        uint32 ORIGIN_CHAIN = 31;
        address mailbox = 0x0d38F2A54F97Ea1aF03C92A9247e99bfBEb3e943; // Mailbox address rootstock
        vm.startBroadcast();

        // Deploy Dutch Auction contract
        DutchAuction auction = new DutchAuction(address(0), ORIGIN_CHAIN, mailbox);

        console.log("Dutch Auction deployed at:", address(auction));

        vm.stopBroadcast();
    }
}