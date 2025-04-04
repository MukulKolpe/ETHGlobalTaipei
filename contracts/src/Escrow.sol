// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;
import { BasicSwap7683 } from "intents-framework/BasicSwap7683.sol";
import {OnchainCrossChainOrder, ResolvedCrossChainOrder} from "intents-framework/ERC7683/IERC7683.sol";
import { TypeCasts } from "@hyperlane-xyz/libs/TypeCasts.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { TypeCasts } from "@hyperlane-xyz/libs/TypeCasts.sol";
import { Hyperlane7683Message } from "intents-framework/libs/Hyperlane7683Message.sol";
import {IMailbox} from "@hyperlane-xyz/interfaces/IMailbox.sol";

contract Escrow is BasicSwap7683, Ownable {
    using SafeERC20 for IERC20;
    // ============ Constants ============
    uint32 public immutable localDomain;
    uint256 internal constant gasLimit = 1_000_000;
    address public counterpart;
    IMailbox public mailbox;

    // ============ Storage variables ============
    mapping(uint256 => address) public chainToAuction;
    address public settlementContract;

    // ============ Errors ============
    error FunctionNotImplemented(string functionName);
    error EthNotAllowed();

    // ============ Constructor ============
    constructor(
        uint32 localDomain_,
        address _permit2,
        address _counterpart,
        address _mailbox
    ) Ownable(msg.sender) BasicSwap7683(_permit2) {
        localDomain = localDomain_;
        counterpart = _counterpart;
        mailbox = IMailbox(_mailbox);
    }

    // ============ External Functions ============

    /// @notice Opens an ERC 7683 order and deposits the token to the auction contract.
    /// @param _order The order to open.
    function open(
        OnchainCrossChainOrder calldata _order
    ) external payable override {
        (
            ResolvedCrossChainOrder memory resolvedOrder,
            bytes32 orderId,
            uint256 nonce
        ) = _resolveOrder(_order);
        openOrders[orderId] = abi.encode(
            _order.orderDataType,
            _order.orderData
        );
        orderStatus[orderId] = OPENED;
        _useNonce(msg.sender, nonce);

        uint256 totalValue;
        for (uint256 i = 0; i < resolvedOrder.minReceived.length; i++) {
            address token = TypeCasts.bytes32ToAddress(
                resolvedOrder.minReceived[i].token
            );
            if (token == address(0)) {
                totalValue += resolvedOrder.minReceived[i].amount;
            } else {
                IERC20(token).safeTransferFrom(msg.sender, address(this), resolvedOrder.minReceived[i].amount);
                bytes4 selector = getSelector("createAuction(address,uint256,address,uint256,address,bytes32)");
                address destToken = TypeCasts.bytes32ToAddress(resolvedOrder.minReceived[i].token);
               
                uint256 fee = mailbox.quoteDispatch(
                    uint32(resolvedOrder.fillInstructions[i].destinationChainId),
                    TypeCasts.addressToBytes32(counterpart),
                    abi.encodePacked(selector,token,resolvedOrder.minReceived[i].amount,destToken,resolvedOrder.maxSpent[i].amount, msg.sender, orderId),
                    bytes("")
                );

                mailbox.dispatch{value: fee}(
                    uint32(resolvedOrder.fillInstructions[i].destinationChainId),
                    TypeCasts.addressToBytes32(counterpart),
                    abi.encodePacked(selector,token,resolvedOrder.minReceived[i].amount,destToken,resolvedOrder.maxSpent[i].amount, msg.sender, orderId),
                    bytes("")
                );
            }
        }

        // if (msg.value != totalValue) revert InvalidNativeAmount();

        emit Open(orderId, resolvedOrder);
    }

    /// @notice Sets the settlement contract address.
    /// @param _settlementContract The address of the settlement contract.
    function setSettlementContract(
        address _settlementContract
    ) external onlyOwner {
        settlementContract = _settlementContract;
    }

    /// @notice Sets the counterpart address.
    /// @param _counterpart The address of the counterpart contract.
    function setCounterpart(
        address _counterpart
    ) external onlyOwner {
        counterpart = _counterpart;
    }

    // ============ Internal Functions ============

    /// @notice Dispatches a refund message to the specified domain.
    /// @dev Encodes the refund message using Hyperlane7683Message and dispatches it via the GasRouter.
    /// @param _originDomain The domain to which the refund message is sent.
    /// @param _orderIds The IDs of the orders to refund.
    function _dispatchRefund(
        uint32 _originDomain,
        bytes32[] memory _orderIds
    ) internal override {}

    /// @notice Handles an incoming message
    /// @param _origin The origin domain
    /// @param _sender The sender address
    /// @param _message The message
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) external payable {
        _handle(_origin, _sender, _message);
    }

    /// @notice Handles incoming messages
    /// @dev Decodes the message and processes settlement or refund operations accordingly
    /// @dev _originDomain The domain from which the message originates (unused in this implementation)
    /// @dev _sender The address of the sender on the origin domain (unused in this implementation)
    /// @param _message The encoded message received via t1
    function _handle(uint32, bytes32, bytes calldata _message) internal {
        (
            bool _settle,
            bytes32[] memory _orderIds,
            bytes[] memory _ordersFillerData
        ) = Hyperlane7683Message.decode(_message);

        for (uint256 i = 0; i < _orderIds.length; i++) {
            if (_settle) {
                _handleSettleOrder(
                    _orderIds[i],
                    abi.decode(_ordersFillerData[i], (bytes32))
                );
            } else {
                _handleRefundOrder(_orderIds[i]);
            }
        }
    }

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
        return localDomain;
    }

    /// @notice Retrieves the selector for a given function signature.
    /// @param functionSignature The function signature.
    /// @return The selector.
    function getSelector(
        string memory functionSignature
    ) internal pure returns (bytes4) {
        return bytes4(keccak256(bytes(functionSignature)));
    }

    receive() external payable {
        // Handle incoming Ether
    }
    fallback() external payable {
        // Handle fallback calls
    }
}