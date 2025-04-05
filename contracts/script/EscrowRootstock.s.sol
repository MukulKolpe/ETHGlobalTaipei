// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/Escrow.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {OrderData, OrderEncoder} from "intents-framework/libs/OrderEncoder.sol";

contract OpenEscrowRootstock is Script {
    uint32 localDomain = 11155111; // Example local domain ID
    address permit2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3; // Permit2 address
    Escrow public escrow = Escrow(payable(vm.envAddress("ESCROW_ADDR")));
    uint32 constant ORIGIN_CHAIN = 11155111;
    uint32 constant DESTINATION_CHAIN = 31;
    address constant USDC_SEPOLIA = 0xA70638af71aD445D6E899790e327e73A0ba09e4f;
    address constant USDC_ROOTSTOCK = 0x2FF407DAE17A31A737633bc0dAa2aB36294d1b44;
    address SETTLER = vm.envAddress("DUTCH_AUCTION_ADDR_ROOTSTOCK");

    function run() external {
        // Load Alice's private key from env
        uint256 alicePk = vm.envUint("ALICE_PRIVATE_KEY");
        address alice = vm.addr(alicePk);

        // Start broadcasting as Alice
        vm.startBroadcast(alicePk);

        // Approve tokens
        ERC20 inputToken = ERC20(USDC_SEPOLIA);
        ERC20 outputToken = ERC20(USDC_ROOTSTOCK);
        inputToken.approve(address(escrow), type(uint256).max);

        // Prepare order data
        OrderData memory orderData = OrderData({
            sender: TypeCasts.addressToBytes32(alice),
            recipient: TypeCasts.addressToBytes32(alice),
            inputToken: TypeCasts.addressToBytes32(address(inputToken)),
            outputToken: TypeCasts.addressToBytes32(address(outputToken)),
            amountIn: 1e17,
            amountOut: 1e17,
            senderNonce: uint32(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            block.prevrandao,
                            msg.sender
                        )
                    )
                ) % 10_000
            ), // Random number between 0 and 9999
            originDomain: ORIGIN_CHAIN,
            destinationDomain: DESTINATION_CHAIN,
            destinationSettler: TypeCasts.addressToBytes32(SETTLER),
            fillDeadline: uint32(block.timestamp + 24 hours),
            data: new bytes(0)
        });

        bytes memory encodedOrder = OrderEncoder.encode(orderData);

        OnchainCrossChainOrder memory order = _prepareOnchainOrder(
            encodedOrder,
            orderData.fillDeadline,
            OrderEncoder.orderDataType()
        );

        escrow.open{value:1e13}(order);

        bytes32 id = OrderEncoder.id(orderData);
        console2.logString("orderId: ");
        console2.logBytes32(id);

        console2.log("encodedOrder: ");
        console2.logBytes(encodedOrder);

        vm.stopBroadcast();
    }

    function _prepareOnchainOrder(
        bytes memory orderData,
        uint32 fillDeadline,
        bytes32 orderDataType
    ) internal pure returns (OnchainCrossChainOrder memory) {
        return
            OnchainCrossChainOrder({
                fillDeadline: fillDeadline,
                orderDataType: orderDataType,
                orderData: orderData
            });
    }
}
