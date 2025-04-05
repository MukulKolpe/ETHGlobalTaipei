"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  XCircle,
  AlertTriangle,
  SnowflakeIcon as Confetti,
  Trophy,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import DUTCH_AUCTION_ABI from "@/utils/abis/DutchAuctionABI.json";
import ERC20_ABI from "@/utils/abis/ERC20.json";

// Define the props for the modal
interface WinAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: any;
  orderId: string;
  originData: string;
  signer: ethers.Signer | null;
  onSuccess: () => void;
}

// Define the steps in the process
enum Step {
  Congratulations = 0,
  FillOrder = 1,
  SettleOrder = 2,
  Complete = 3,
}

export default function WinAuctionModal({
  isOpen,
  onClose,
  auction,
  orderId,
  originData,
  signer,
  onSuccess,
}: WinAuctionModalProps) {
  const [step, setStep] = useState<Step>(Step.Congratulations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fillTxHash, setFillTxHash] = useState<string | null>(null);
  const [settleTxHash, setSettleTxHash] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    console.log("WinAuctionModal props:", {
      isOpen,
      auction,
      orderId,
      originData,
    });

    if (isOpen) {
      console.log("Modal is open, resetting state");
      setStep(Step.Congratulations);
      setLoading(false);
      setError(null);
      setFillTxHash(null);
      setSettleTxHash(null);

      // Trigger confetti animation
      setConfetti(true);
      const timer = setTimeout(() => setConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, auction, orderId, originData]);

  // Update the handleFillOrder function to validate the originData before using it
  const handleFillOrder = async () => {
    console.log("Attempting to fill order with:", {
      auction,
      orderId,
      originData: originData.substring(0, 50) + "...",
    });

    if (!signer) {
      setError("Wallet not connected. Please connect your wallet first.");
      return;
    }

    if (!auction) {
      setError("Auction data is missing. Please try again.");
      return;
    }

    // Validate that originData is a valid hex string with even length
    if (
      !originData ||
      !originData.startsWith("0x") ||
      originData.length % 2 !== 0
    ) {
      setError(
        "Invalid origin data format. The hex data must have an even number of characters."
      );
      console.error("Invalid origin data:", originData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the NEXT_PUBLIC_SETTLER_ADDRESS as the primary source of truth
      const contractAddress =
        process.env.NEXT_PUBLIC_SETTLER_ADDRESS ||
        "0x94AA7d7A4e249ca9A12A834CeC057e91F886B92a";

      console.log("Using contract address for fill:", contractAddress);

      const contract = new ethers.Contract(
        contractAddress,
        DUTCH_AUCTION_ABI,
        signer
      );

      const signerAddress = await signer.getAddress();
      console.log("Signer address:", signerAddress);

      const fillerData = ethers.utils.defaultAbiCoder.encode(
        ["bytes32"],
        [ethers.utils.hexZeroPad(signerAddress, 32)]
      );

      console.log("Calling fill with:", {
        orderId,
        originDataLength: originData.length,
        fillerDataLength: fillerData.length,
      });

      const ERC20Contract = new ethers.Contract(
        "0xd0A9c6e7FF012F22Ba52038F9727b50e16466176",
        ERC20_ABI,
        signer
      );

      await ERC20Contract.approve(
        process.env.NEXT_PUBLIC_SETTLER_ADDRESS,
        ethers.constants.MaxUint256
      );

      // Call the fill function
      const tx = await contract.fill(orderId, originData, fillerData, {
        gasLimit: 1000000,
      });

      console.log("Fill transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Fill transaction confirmed:", receipt);

      setFillTxHash(receipt.transactionHash);

      // Move to next step
      setStep(Step.SettleOrder);
    } catch (err: any) {
      console.error("Error filling order:", err);

      // Provide more helpful error messages based on common issues
      if (err.message.includes("insufficient funds")) {
        setError(
          "Insufficient funds to complete the transaction. Please check your wallet balance."
        );
      } else if (err.message.includes("user rejected")) {
        setError("Transaction was rejected. Please try again.");
      } else if (err.message.includes("execution reverted")) {
        setError(
          "Contract execution failed. This could be due to an invalid order ID or data format."
        );
      } else if (err.message.includes("hex data is odd-length")) {
        setError(
          "Invalid hex data format. Please contact support with this error: " +
            err.message
        );
      } else {
        setError(err.message || "Failed to fill order");
      }
    } finally {
      setLoading(false);
    }
  };

  // Update the handleSettleOrder function to use the correct contract address
  const handleSettleOrder = async () => {
    if (!signer || !auction) {
      setError("Wallet not connected or auction data missing.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the NEXT_PUBLIC_SETTLER_ADDRESS as the primary source of truth
      const contractAddress =
        process.env.NEXT_PUBLIC_SETTLER_ADDRESS ||
        "0x94AA7d7A4e249ca9A12A834CeC057e91F886B92a";

      console.log("Using contract address for settle:", contractAddress);

      const contract = new ethers.Contract(
        contractAddress,
        DUTCH_AUCTION_ABI,
        signer
      );

      // Prepare the order IDs array
      const orderIds = [orderId];
      console.log("Settling order ID:", orderId);

      // Call the settle function
      const tx = await contract.settle(orderIds, {
        value: ethers.utils.parseEther("0.003"), // 3e15 wei as in the script
        gasLimit: 1000000,
      });

      console.log("Settle transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Settle transaction confirmed:", receipt);

      setSettleTxHash(receipt.transactionHash);

      // Move to complete step
      setStep(Step.Complete);

      // Trigger success callback
      onSuccess();
    } catch (err: any) {
      console.error("Error settling order:", err);

      // Provide more helpful error messages based on common issues
      if (err.message.includes("insufficient funds")) {
        setError(
          "Insufficient funds to complete the transaction. Please check your wallet balance."
        );
      } else if (err.message.includes("user rejected")) {
        setError("Transaction was rejected. Please try again.");
      } else if (err.message.includes("execution reverted")) {
        setError(
          "Contract execution failed. This could be due to an invalid order ID or the order has already been settled."
        );
      } else {
        setError(err.message || "Failed to settle order");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle close with confirmation if in the middle of the process
  const handleClose = () => {
    if (step !== Step.Congratulations && step !== Step.Complete && !error) {
      if (
        window.confirm(
          "Are you sure you want to close? The process is not complete."
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        {/* Confetti effect */}
        {confetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 100 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                initial={{
                  top: "0%",
                  left: `${Math.random() * 100}%`,
                  backgroundColor: [
                    "#FFD700", // Gold
                    "#FF6B6B", // Red
                    "#4ECDC4", // Teal
                    "#FF9F1C", // Orange
                    "#A78BFA", // Purple
                  ][Math.floor(Math.random() * 5)],
                }}
                animate={{
                  top: "100%",
                  left: `${Math.random() * 100}%`,
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-2xl"
        >
          <Card className="bg-slate-900/95 border-blue-900/30 backdrop-blur-md shadow-[0_0_40px_rgba(59,130,246,0.3)] p-8 rounded-2xl overflow-hidden">
            {/* Glowing background effect */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>

            {/* Content based on current step */}
            <div className="relative z-10">
              {step === Step.Congratulations && (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 w-24 h-24 rounded-full flex items-center justify-center">
                        <Trophy className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Congratulations!
                  </h2>

                  <p className="text-xl text-gray-300 mb-6">
                    You've won the Dutch auction for order #{auction?.id}
                  </p>

                  <div className="bg-slate-800/70 rounded-xl p-4 border border-blue-900/20 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="text-gray-400">Auction ID:</div>
                      <div className="text-white font-medium">
                        {auction?.id}
                      </div>

                      <div className="text-gray-400">Token:</div>
                      <div className="text-white font-medium">
                        {auction?.tokenInfo?.sourceSymbol}
                      </div>

                      <div className="text-gray-400">Amount:</div>
                      <div className="text-white font-medium">
                        {ethers.utils.formatUnits(
                          auction?.tokenInfo?.sourceAmount || 0,
                          18
                        )}{" "}
                        {auction?.tokenInfo?.sourceSymbol}
                      </div>

                      <div className="text-gray-400">Your Bid:</div>
                      <div className="text-white font-medium">
                        {ethers.utils.formatUnits(
                          auction?.bidInfo?.winningBid || 0,
                          18
                        )}{" "}
                        {auction?.tokenInfo?.destSymbol}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-8">
                    To complete the cross-chain bridge, you need to fill and
                    settle the order.
                  </p>

                  <Button
                    className="w-full py-6 text-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-xl group relative overflow-hidden"
                    onClick={() => setStep(Step.FillOrder)}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Continue to Fill Order
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </div>
              )}

              {step === Step.FillOrder && (
                <div>
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center">
                        <Rocket className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mb-4 text-center text-white">
                    Step 1: Fill the Order
                  </h2>

                  <p className="text-gray-300 mb-6 text-center">
                    Fill the order to transfer the tokens from the source chain
                    to the destination chain.
                  </p>

                  <div className="bg-slate-800/70 rounded-xl p-4 border border-blue-900/20 mb-6">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Transaction Details
                    </h3>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Contract:</span>
                        <span className="text-gray-300 truncate max-w-[250px]">
                          {auction?.network?.contracts?.dutchAuction}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Order ID:</span>
                        <span className="text-gray-300 truncate max-w-[250px]">
                          {orderId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Function:</span>
                        <span className="text-gray-300">
                          fill(bytes32, bytes, bytes)
                        </span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-900/30 rounded-xl flex items-center gap-3 text-red-400">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {fillTxHash && (
                    <div className="mb-6 p-4 bg-green-900/20 border border-green-900/30 rounded-xl">
                      <div className="flex items-center gap-3 text-green-400 mb-2">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <span className="text-base font-medium">
                          Transaction Successful
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm break-all">
                        <span className="text-gray-400">Tx Hash: </span>
                        <a
                          href={`https://explorer.testnet.citrea.xyz/tx/${fillTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {fillTxHash}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 py-4 bg-slate-800/70 border-blue-900/30 text-gray-300 hover:bg-slate-700/70"
                      onClick={() => setStep(Step.Congratulations)}
                      disabled={loading}
                    >
                      Back
                    </Button>

                    <Button
                      className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-xl"
                      onClick={handleFillOrder}
                      disabled={loading || !!fillTxHash}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </span>
                      ) : fillTxHash ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Order Filled
                        </span>
                      ) : (
                        "Fill Order"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {step === Step.SettleOrder && (
                <div>
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center">
                        <Sparkles className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mb-4 text-center text-white">
                    Step 2: Settle the Order
                  </h2>

                  <p className="text-gray-300 mb-6 text-center">
                    Settle the order to complete the cross-chain bridge
                    transaction.
                  </p>

                  <div className="bg-slate-800/70 rounded-xl p-4 border border-blue-900/20 mb-6">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Transaction Details
                    </h3>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Contract:</span>
                        <span className="text-gray-300 truncate max-w-[250px]">
                          {auction?.network?.contracts?.dutchAuction}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Order ID:</span>
                        <span className="text-gray-300 truncate max-w-[250px]">
                          {orderId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Function:</span>
                        <span className="text-gray-300">settle(bytes32[])</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Value:</span>
                        <span className="text-gray-300">0.003 ETH</span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-900/30 rounded-xl flex items-center gap-3 text-red-400">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {settleTxHash && (
                    <div className="mb-6 p-4 bg-green-900/20 border border-green-900/30 rounded-xl">
                      <div className="flex items-center gap-3 text-green-400 mb-2">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <span className="text-base font-medium">
                          Transaction Successful
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm break-all">
                        <span className="text-gray-400">Tx Hash: </span>
                        <a
                          href={`https://explorer.testnet.citrea.xyz/tx/${settleTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {settleTxHash}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 py-4 bg-slate-800/70 border-blue-900/30 text-gray-300 hover:bg-slate-700/70"
                      onClick={() => setStep(Step.FillOrder)}
                      disabled={loading}
                    >
                      Back
                    </Button>

                    <Button
                      className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-xl"
                      onClick={handleSettleOrder}
                      disabled={loading || !!settleTxHash}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </span>
                      ) : settleTxHash ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Order Settled
                        </span>
                      ) : (
                        "Settle Order"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {step === Step.Complete && (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-green-500 to-blue-600 w-24 h-24 rounded-full flex items-center justify-center">
                        <Confetti className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                    Transaction Complete!
                  </h2>

                  <p className="text-xl text-gray-300 mb-6">
                    You've successfully completed the cross-chain bridge
                    transaction.
                  </p>

                  <div className="bg-slate-800/70 rounded-xl p-6 border border-blue-900/20 mb-8">
                    <div className="flex flex-col gap-4">
                      <div>
                        <Badge className="bg-green-600 text-white mb-2">
                          Fill Transaction
                        </Badge>
                        <div className="text-gray-300 text-sm break-all">
                          <a
                            href={`https://explorer.testnet.citrea.xyz/tx/${fillTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {fillTxHash}
                          </a>
                        </div>
                      </div>

                      <div>
                        <Badge className="bg-green-600 text-white mb-2">
                          Settle Transaction
                        </Badge>
                        <div className="text-gray-300 text-sm break-all">
                          <a
                            href={`https://explorer.testnet.citrea.xyz/tx/${settleTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {settleTxHash}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full py-6 text-xl bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-medium rounded-xl"
                    onClick={onClose}
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Close
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* Progress indicator */}
            {step !== Step.Complete && (
              <div className="mt-8 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-700 -translate-y-1/2"></div>
                <div className="relative flex justify-between">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center z-10",
                        step >= Step.Congratulations
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-gray-400"
                      )}
                    >
                      1
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2",
                        step >= Step.Congratulations
                          ? "text-blue-400"
                          : "text-gray-500"
                      )}
                    >
                      Start
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center z-10",
                        step >= Step.FillOrder
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-gray-400"
                      )}
                    >
                      2
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2",
                        step >= Step.FillOrder
                          ? "text-blue-400"
                          : "text-gray-500"
                      )}
                    >
                      Fill
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center z-10",
                        step >= Step.SettleOrder
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-gray-400"
                      )}
                    >
                      3
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2",
                        step >= Step.SettleOrder
                          ? "text-blue-400"
                          : "text-gray-500"
                      )}
                    >
                      Settle
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
