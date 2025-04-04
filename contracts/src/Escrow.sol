// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;
import { BasicSwap7683 } from "intents-framework/BasicSwap7683.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is BasicSwap7683, Ownable {

    constructor(
        address _permit2
    ) Ownable(msg.sender) BasicSwap7683(_permit2) {
        // Initialize the BasicSwap7683 contract with the Permit2 address
    }


    /// @notice Dispatches a refund message to the specified domain.
    /// @dev Encodes the refund message using Hyperlane7683Message and dispatches it via the GasRouter.
    /// @param _originDomain The domain to which the refund message is sent.
    /// @param _orderIds The IDs of the orders to refund.
    function _dispatchRefund(
        uint32 _originDomain,
        bytes32[] memory _orderIds
    ) internal override {}


     /// @notice Dispatches a settlement message to the specified domain.
    /// @dev Encodes the settle message using Hyperlane7683Message and dispatches it via the GasRouter.
    /// @param _originDomain The domain to which the settlement message is sent.
    /// @param _orderIds The IDs of the orders to settle.
    /// @param _ordersFillerData The filler data for the orders.
    function _dispatchSettle(
        uint32 _originDomain,
        bytes32[] memory _orderIds,
        bytes[] memory _ordersFillerData
    ) internal override {
    }


     /// @notice Retrieves the local domain identifier.
    /// @dev This function overrides the `_localDomain` function from the parent contract.
    /// @return The local domain ID.
    function _localDomain() internal view override returns (uint32) {
        
    }
}