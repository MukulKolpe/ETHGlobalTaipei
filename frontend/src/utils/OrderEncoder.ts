// @ts-nocheck comment
import { ethers } from "ethers"

export class OrderEncoder {
  // Order data type hash
  private static ORDER_DATA_TYPE =
    "OrderData(" +
    "bytes32 sender," +
    "bytes32 recipient," +
    "bytes32 inputToken," +
    "bytes32 outputToken," +
    "uint256 amountIn," +
    "uint256 amountOut," +
    "uint256 senderNonce," +
    "uint32 originDomain," +
    "uint32 destinationDomain," +
    "bytes32 destinationSettler," +
    "uint32 fillDeadline," +
    "bytes data)"

  // Cached order data type hash
  private static ORDER_DATA_TYPE_HASH = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(OrderEncoder.ORDER_DATA_TYPE))

  /**
   * Encodes order data for the escrow contract
   * @param orderData The order data to encode
   * @returns The encoded order data
   */
  public static encode(orderData: any): string {
    return ethers.utils.defaultAbiCoder.encode(
      [
        "tuple(bytes32 sender, bytes32 recipient, bytes32 inputToken, bytes32 outputToken, " +
          "uint256 amountIn, uint256 amountOut, uint32 senderNonce, uint32 originDomain, " +
          "uint32 destinationDomain, bytes32 destinationSettler, uint32 fillDeadline, bytes data)",
      ],
      [orderData],
    )
  }

  /**
   * Calculates the order ID from order data
   * @param orderData The order data
   * @returns The order ID
   */
  public static id(orderData: any): string {
    const encodedData = ethers.utils.defaultAbiCoder.encode(
      [
        "bytes32",
        "bytes32",
        "bytes32",
        "bytes32",
        "uint256",
        "uint256",
        "uint32",
        "uint32",
        "uint32",
        "bytes32",
        "uint32",
        "bytes",
      ],
      [
        orderData.sender,
        orderData.recipient,
        orderData.inputToken,
        orderData.outputToken,
        orderData.amountIn,
        orderData.amountOut,
        orderData.senderNonce,
        orderData.originDomain,
        orderData.destinationDomain,
        orderData.destinationSettler,
        orderData.fillDeadline,
        orderData.data,
      ],
    )

    return ethers.utils.keccak256(
      ethers.utils.solidityPack(["bytes32", "bytes"], [OrderEncoder.ORDER_DATA_TYPE_HASH, encodedData]),
    )
  }
}

