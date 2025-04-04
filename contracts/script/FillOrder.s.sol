// SPDX-License-Identifier: MIT
import "forge-std/Script.sol";
import "../src/DutchAuction.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { TypeCasts } from "@hyperlane-xyz/libs/TypeCasts.sol";
contract FillOrder is Script {
     function run() external {
        uint256 solverPk = vm.envUint("TEST_PRIVATE_KEY");
        address solver = vm.addr(solverPk);
        address USDC_CITREA = 0xd0A9c6e7FF012F22Ba52038F9727b50e16466176;
        vm.startBroadcast(solverPk);

        // Get order details
        DutchAuction dutchAuction = DutchAuction(vm.envAddress("DUTCH_AUCTION_ADDR"));

        // NOTE - orderId logged from the first step goes here remove 0x (Escrow.s.sol script(Line 70))
        bytes32 orderId = hex"";

        uint256 auctionId = dutchAuction.orderIdToAuctionId(orderId);

        //Bid on the auction
        dutchAuction.placeBid(auctionId);

        // NOTE - encodedOrder logged from the first step goes here remove 0x (Escrow.s.sol script(Line 73))
        bytes memory originData = hex"";

        // Approve output tokens
        ERC20(USDC_CITREA).approve(
            address(dutchAuction),
            10e17 // match amount from order
        );

        // Fill the order
        bytes memory fillerData = abi.encode(TypeCasts.addressToBytes32(solver));
        dutchAuction.fill(orderId, originData, fillerData);

        vm.stopBroadcast();
    }
}