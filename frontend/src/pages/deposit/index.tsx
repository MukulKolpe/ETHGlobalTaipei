"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import {
  ChevronDown,
  RefreshCw,
  Info,
  Sparkles,
  Loader2,
  Globe,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import EscrowABI from "@/utils/abis/EscrowABI.json";
import ERC20ABI from "@/utils/abis/ERC20.json";
import { OrderEncoder } from "@/utils/OrderEncoder";

// Network definitions
const networks = [
  {
    id: "ethereum",
    name: "Ethereum",
    chainId: 11155111, // Sepolia
    icon: "/assets/ethereum.svg",
    color: "#627EEA",
    testnet: "Sepolia",
  },
  {
    id: "rootstock",
    name: "Rootstock",
    chainId: 31,
    icon: "/assets/rootstock.svg",
    color: "#00A14A",
    testnet: "Testnet",
  },
  {
    id: "citrea",
    name: "Citrea",
    chainId: 5115,
    icon: "/assets/citrea.svg",
    color: "#3B82F6",
    testnet: "Testnet",
  },
];

// Token definitions
const tokens = {
  usdc: {
    name: "USDC",
    icon: "/assets/usdc.svg",
    color: "#2775CA",
    addresses: {
      ethereum: "0xA70638af71aD445D6E899790e327e73A0ba09e4f", // Sepolia
      rootstock: "0x4F21994B5f8F724839bA574F97E47f8F3f967Cae",
      citrea: "0xC4A0fafFd686C4852020ED50152F6A171b2554ad", // Citrea
    },
  },
  usdt: {
    name: "USDT",
    icon: "/assets/usdt.svg",
    color: "#26A17B",
    addresses: {
      ethereum: "0x30E9b6B0d161cBd5Ff8cf904Ff4FA43Ce66AC346",
      rootstock: "0x8aD1b8C4082D7aF6E9C3D9D9Fc95A431Fb3d8A11",
      citrea: "0xb6E3F86a5CE9ac318F54C9C7Bcd6eff368DF0296",
    },
  },
  dai: {
    name: "DAI",
    icon: "/assets/dai.svg",
    color: "#F5AC37",
    addresses: {
      ethereum: "0x68194a729C2450ad26072b3D33ADaCbcef39D574",
      rootstock: "0xCF1D0Bd7F6C2A8C05324d5D12fBa3E1eD2aa9451",
      citrea: "0xd393b1E02dA9831Ff419e22eA105aAe4c47E1253",
    },
  },
};

// Constants
const SETTLER =
  process.env.NEXT_PUBLIC_SETTLER_ADDRESS ||
  "0xbF59f5a5931B9013A6d3724d0D3A2a0abafe3Afc";
const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "";

// Replace the BridgeAnimation component with this enhanced version
function BridgeAnimation({ sourceNetwork, destNetwork }) {
  return (
    <div className="relative w-full h-full">
      {/* Enhanced Glow Effect */}
      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl"></div>

      {/* Bridge Path */}
      <svg
        className="absolute inset-0"
        width="100%"
        height="100%"
        viewBox="0 0 300 80"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="pathGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="pathShadow" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glowing Path Background */}
        <path
          d="M 10,60 C 50,10 250,10 290,60"
          fill="none"
          stroke="url(#pathGlow)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Bridge Arc */}
        <path
          d="M 10,60 C 50,10 250,10 290,60"
          fill="none"
          stroke="url(#bridgeGradient)"
          strokeWidth="2.5"
          strokeDasharray="5,3"
          filter="url(#pathShadow)"
        />

        {/* Animated Particles */}
        <circle
          className="animate-pulse"
          r="5"
          fill="#60A5FA"
          filter="url(#glow)"
        >
          <animateMotion
            path="M 10,60 C 50,10 250,10 290,60"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>

        <circle r="3.5" fill="#93C5FD" opacity="0.8" filter="url(#glow)">
          <animateMotion
            path="M 10,60 C 50,10 250,10 290,60"
            dur="4s"
            repeatCount="indefinite"
            begin="1s"
          />
        </circle>

        <circle r="2.5" fill="#DBEAFE" opacity="0.6" filter="url(#glow)">
          <animateMotion
            path="M 10,60 C 50,10 250,10 290,60"
            dur="5s"
            repeatCount="indefinite"
            begin="0.5s"
          />
        </circle>
      </svg>

      {/* Network Labels with Enhanced Styling */}
      <div className="absolute bottom-2 left-2 text-sm font-medium flex items-center gap-2 bg-slate-800/70 px-3 py-1 rounded-full border border-blue-900/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
        {sourceNetwork ? (
          <>
            <div
              className="relative w-5 h-5 rounded-full overflow-hidden shadow-[0_0_5px_rgba(59,130,246,0.3)]"
              style={{ backgroundColor: sourceNetwork.color }}
            >
              <Image
                src={sourceNetwork.icon || "/placeholder.svg"}
                alt={sourceNetwork.name}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-white">{sourceNetwork.name}</span>
          </>
        ) : (
          <span className="text-gray-400">Source Chain</span>
        )}
      </div>

      <div className="absolute bottom-2 right-2 text-sm font-medium flex items-center gap-2 bg-slate-800/70 px-3 py-1 rounded-full border border-blue-900/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
        {destNetwork ? (
          <>
            <span className="text-white">{destNetwork.name}</span>
            <div
              className="relative w-5 h-5 rounded-full overflow-hidden shadow-[0_0_5px_rgba(59,130,246,0.3)]"
              style={{ backgroundColor: destNetwork.color }}
            >
              <Image
                src={destNetwork.icon || "/placeholder.svg"}
                alt={destNetwork.name}
                fill
                className="object-cover"
              />
            </div>
          </>
        ) : (
          <span className="text-gray-400">Destination Chain</span>
        )}
      </div>

      {/* Dutch Auction Label with Enhanced Styling */}
      <div className="absolute left-1/2 -translate-x-1/2 top-4 text-sm text-blue-300 font-medium bg-blue-900/40 px-4 py-1.5 rounded-full border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.4)] backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          Dutch Auction
        </span>
      </div>
    </div>
  );
}

export default function DepositPage() {
  // State for source selection
  const [sourceNetwork, setSourceNetwork] = useState<
    (typeof networks)[0] | null
  >(null);
  const [sourceToken, setSourceToken] = useState<string | null>(null);

  // State for destination selection
  const [destNetwork, setDestNetwork] = useState<(typeof networks)[0] | null>(
    null
  );
  const [destToken, setDestToken] = useState<string | null>(null);

  // State for input amounts
  const [depositAmount, setDepositAmount] = useState("");
  const [minExpectedAmount, setMinExpectedAmount] = useState("");

  // State for validation
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Animation state
  const [isSwapping, setIsSwapping] = useState(false);

  // Transaction state
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [balance, setBalance] = useState("0.00");

  // Get available tokens for a network
  const getAvailableTokensForNetwork = (networkId: string | null) => {
    if (!networkId) return [];

    return Object.entries(tokens)
      .filter(([_, token]) => token.addresses[networkId])
      .map(([id, token]) => ({
        id,
        ...token,
        address: token.addresses[networkId],
      }));
  };

  // Get token details
  const getTokenDetails = (
    tokenId: string | null,
    networkId: string | null
  ) => {
    if (!tokenId || !networkId || !tokens[tokenId]) return null;

    return {
      id: tokenId,
      ...tokens[tokenId],
      address: tokens[tokenId].addresses[networkId],
    };
  };

  // Get source token details
  const sourceTokenDetails = getTokenDetails(sourceToken, sourceNetwork?.id);

  // Get destination token details
  const destTokenDetails = getTokenDetails(destToken, destNetwork?.id);

  // Check balance when source token changes
  useEffect(() => {
    const checkBalance = async () => {
      if (
        !sourceTokenDetails ||
        !sourceNetwork ||
        !window.ethereum ||
        !window.ethereum._state?.accounts?.length
      )
        return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) return;

        const tokenContract = new ethers.Contract(
          sourceTokenDetails.address,
          ["function balanceOf(address) view returns (uint256)"],
          provider
        );

        const rawBalance = await tokenContract.balanceOf(accounts[0]);
        const formattedBalance = ethers.utils.formatUnits(rawBalance, 18); // Assuming 18 decimals
        setBalance(Number.parseFloat(formattedBalance).toFixed(2));
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("0.00");
      }
    };

    checkBalance();
  }, [sourceTokenDetails, sourceNetwork]);

  // Validate input amounts
  useEffect(() => {
    if (depositAmount && minExpectedAmount) {
      const depositValue = Number.parseFloat(depositAmount);
      const minExpectedValue = Number.parseFloat(minExpectedAmount);

      if (minExpectedValue >= depositValue) {
        setIsValid(false);
        setErrorMessage(
          "Minimum expected amount must be less than deposit amount"
        );
      } else {
        setIsValid(true);
        setErrorMessage("");
      }
    } else {
      setIsValid(true);
      setErrorMessage("");
    }
  }, [depositAmount, minExpectedAmount]);

  // Set default minExpectedAmount when depositAmount changes
  useEffect(() => {
    if (depositAmount) {
      // Set min expected as 90% of deposit amount as a default
      const minAmount = (Number.parseFloat(depositAmount) * 0.9).toFixed(2);
      setMinExpectedAmount(minAmount);
    }
  }, [depositAmount]);

  // Handle network and token selection
  const handleSourceNetworkSelect = (network) => {
    setSourceNetwork(network);
    // Reset token if not available in the new network
    if (sourceToken && !tokens[sourceToken]?.addresses[network.id]) {
      setSourceToken(null);
    }

    // If same network is selected for destination, swap them
    if (destNetwork && network.id === destNetwork.id) {
      setDestNetwork(sourceNetwork);
    }
  };

  const handleDestNetworkSelect = (network) => {
    setDestNetwork(network);
    // Reset token if not available in the new network
    if (destToken && !tokens[destToken]?.addresses[network.id]) {
      setDestToken(null);
    }

    // If same network is selected for source, swap them
    if (sourceNetwork && network.id === sourceNetwork.id) {
      setSourceNetwork(destNetwork);
    }
  };

  // Add helper functions for bidirectional selection
  // Get networks where a token is available
  const getNetworksForToken = (tokenId: string | null) => {
    if (!tokenId) return [];

    const tokenAddresses = tokens[tokenId]?.addresses;
    if (!tokenAddresses) return [];

    return networks.filter((network) => tokenAddresses[network.id]);
  };

  // Update the handleSourceTokenSelect function to support bidirectional selection
  const handleSourceTokenSelect = (tokenId) => {
    setSourceToken(tokenId);

    // If no network is selected, and this token is only available on one network, select it
    if (!sourceNetwork) {
      const availableNetworks = getNetworksForToken(tokenId);
      if (availableNetworks.length === 1) {
        setSourceNetwork(availableNetworks[0]);
      }
    }

    // If destination token is not set, set it to the same token if available
    if (
      !destToken &&
      destNetwork &&
      tokens[tokenId]?.addresses[destNetwork.id]
    ) {
      setDestToken(tokenId);
    }
  };

  // Update the handleDestTokenSelect function to support bidirectional selection
  const handleDestTokenSelect = (tokenId) => {
    setDestToken(tokenId);

    // If no network is selected, and this token is only available on one network, select it
    if (!destNetwork) {
      const availableNetworks = getNetworksForToken(tokenId);
      if (availableNetworks.length === 1) {
        setDestNetwork(availableNetworks[0]);
      }
    }

    // If source token is not set, set it to the same token if available
    if (
      !sourceToken &&
      sourceNetwork &&
      tokens[tokenId]?.addresses[sourceNetwork.id]
    ) {
      setSourceToken(tokenId);
    }
  };

  // Handle swap direction
  const handleSwapDirection = () => {
    if (!sourceNetwork || !destNetwork) return;

    setIsSwapping(true);
    setTimeout(() => {
      const tempNetwork = sourceNetwork;
      const tempToken = sourceToken;

      setSourceNetwork(destNetwork);
      setSourceToken(destToken);

      setDestNetwork(tempNetwork);
      setDestToken(tempToken);

      setIsSwapping(false);
    }, 500);
  };

  // Handle max button click
  const handleMaxClick = async () => {
    if (!sourceTokenDetails || !sourceNetwork || !window.ethereum) return;

    try {
      // Get the latest balance
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) return;

      const tokenContract = new ethers.Contract(
        sourceTokenDetails.address,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );

      const rawBalance = await tokenContract.balanceOf(accounts[0]);
      const formattedBalance = ethers.utils.formatUnits(rawBalance, 18); // Assuming 18 decimals
      const currentBalance = Number.parseFloat(formattedBalance).toFixed(2);

      // Set the deposit amount to the current balance
      setDepositAmount(currentBalance);

      // Set min expected as 90% of deposit amount as a default suggestion
      const minAmount = (Number.parseFloat(currentBalance) * 0.9).toFixed(2);
      setMinExpectedAmount(minAmount);

      // Update the displayed balance
      setBalance(currentBalance);
    } catch (error) {
      console.error("Error getting max balance:", error);
    }
  };

  // Handle deposit submission
  const handleDeposit = async () => {
    if (
      !sourceNetwork ||
      !destNetwork ||
      !sourceTokenDetails ||
      !destTokenDetails
    ) {
      setIsValid(false);
      setErrorMessage("Please select both source and destination");
      return;
    }

    if (!depositAmount) {
      setIsValid(false);
      setErrorMessage("Please enter a deposit amount");
      return;
    }

    if (!isValid) return;

    try {
      setIsLoading(true);
      setTxHash("");

      // Check if wallet is connected
      if (!window.ethereum) {
        setErrorMessage("Please install MetaMask to use this application");
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      if (
        !window.ethereum._state?.accounts ||
        window.ethereum._state.accounts.length === 0
      ) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const accounts = await provider.listAccounts();
      const userAddress = accounts[0];

      // Convert amounts to wei
      const amountInWei = ethers.utils.parseEther(depositAmount);
      const minAmountWei = ethers.utils.parseEther(minExpectedAmount);

      // Approve token first
      const tokenContract = new ethers.Contract(
        sourceTokenDetails.address,
        ERC20ABI,
        signer
      );

      try {
        const approvalTx = await tokenContract.approve(
          ESCROW_ADDRESS,
          ethers.constants.MaxUint256
        );

        await approvalTx.wait();
      } catch (approvalError) {
        console.error("Token approval failed:", approvalError);
        setErrorMessage("Failed to approve tokens for transfer");
        setIsLoading(false);
        return;
      }

      // Generate random nonce
      const randomBytes = ethers.utils.randomBytes(4);
      const randomNonce = ethers.utils.hexDataSlice(
        ethers.utils.keccak256(randomBytes),
        0,
        4
      );
      const senderNonce = ethers.BigNumber.from(randomNonce).toNumber() % 10000;

      // Fill deadline - 24 hours from now
      const fillDeadline = Math.floor(Date.now() / 1000) + 86400;

      // Create and encode the order data
      const orderData = {
        sender: ethers.utils.hexZeroPad(userAddress, 32),
        recipient: ethers.utils.hexZeroPad(userAddress, 32), // Same as sender
        inputToken: ethers.utils.hexZeroPad(sourceTokenDetails.address, 32),
        outputToken: ethers.utils.hexZeroPad(destTokenDetails.address, 32),
        amountIn: amountInWei,
        amountOut: minAmountWei,
        senderNonce: senderNonce,
        originDomain: sourceNetwork.chainId,
        destinationDomain: destNetwork.chainId,
        destinationSettler: ethers.utils.hexZeroPad(SETTLER, 32),
        fillDeadline: fillDeadline,
        data: "0x",
      };

      // Encode the order data
      let encodedOrder;
      try {
        encodedOrder = OrderEncoder.encode(orderData);
      } catch (encodeError) {
        console.error("Order encoding error:", encodeError);
        encodedOrder = ethers.utils.defaultAbiCoder.encode(
          [
            "tuple(bytes32 sender, bytes32 recipient, bytes32 inputToken, bytes32 outputToken, " +
              "uint256 amountIn, uint256 amountOut, uint32 senderNonce, uint32 originDomain, " +
              "uint32 destinationDomain, bytes32 destinationSettler, uint32 fillDeadline, bytes data)",
          ],
          [orderData]
        );
      }

      const ORDER_DATA_TYPE_HASH =
        "0x08d75650babf4de09c9273d48ef647876057ed91d4323f8a2e3ebc2cd8a63b5e";

      // Create OnchainCrossChainOrder
      const order = {
        fillDeadline: orderData.fillDeadline,
        orderDataType: ORDER_DATA_TYPE_HASH,
        orderData: encodedOrder,
      };

      // Create contract instance and call open function
      const escrowContract = new ethers.Contract(
        ESCROW_ADDRESS,
        EscrowABI,
        signer
      );

      const tx = await escrowContract.open(order, {
        value: ethers.utils.parseEther("0.001"),
        gasLimit: 1000000,
      });

      const receipt = await tx.wait();
      setTxHash(receipt.transactionHash);

      // Clear form after successful deposit
      setDepositAmount("");
      setMinExpectedAmount("");

      // Log the order ID
      try {
        const orderId = OrderEncoder.id(orderData);
        console.log("Order ID:", orderId);
      } catch (error) {
        console.log("Could not calculate order ID:", error);
      }
    } catch (error) {
      console.error("Deposit error:", error);

      // Parse the error message for more helpful feedback
      let errorMsg = "Failed to deposit tokens";
      if (error.message) {
        if (error.message.includes("insufficient funds")) {
          errorMsg = "Insufficient funds for gas";
        } else if (error.message.includes("user rejected")) {
          errorMsg = "Transaction was rejected";
        } else if (error.message.includes("execution reverted")) {
          errorMsg = "Contract execution failed - Check contract compatibility";
        }
      }

      setErrorMessage(errorMsg);
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center pt-32 pb-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            Bridge Tokens
          </h1>
          <p className="text-xl text-gray-300">
            Transfer tokens between networks using our Dutch auction mechanism
          </p>
        </div>

        <Card className="bg-slate-900/70 border-blue-900/30 backdrop-blur-md shadow-[0_0_40px_rgba(59,130,246,0.2)] p-8 rounded-2xl">
          {/* Replace the Deposit Token section UI with this updated version */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-gray-200 text-xl font-medium">
                    Deposit Token
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-blue-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-blue-900/30 text-white text-base p-3 max-w-xs">
                        <p>
                          You can select either the token first or the network
                          first. Selecting a token will show you which networks
                          it's available on.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="text-base text-gray-400">
                Balance: <span className="text-gray-200">{balance}</span>
              </div>
            </div>

            <div className="bg-slate-800/70 rounded-xl p-5 border border-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md">
              {/* Amount Input and Token Selection Side by Side */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <div className="flex-1 bg-slate-700/50 rounded-xl px-4 py-3 border border-blue-900/20">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => {
                      // Allow only numbers and decimals
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setDepositAmount(value);
                      }
                    }}
                    className="bg-transparent border-none text-m md:text-xl sm:text-sm font-medium text-white placeholder:text-gray-500 placeholder:text-xl md:placeholder:text-xl sm:placeholder:text-lg focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  />
                </div>

                {/* Token Selection */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="rounded-xl bg-slate-700/50 hover:bg-slate-600/70 px-4 py-3 h-auto border border-blue-900/20 min-w-[160px] relative"
                    >
                      {sourceTokenDetails ? (
                        <div className="flex items-center gap-2 w-full">
                          <div
                            className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                            style={{
                              backgroundColor: sourceTokenDetails.color,
                            }}
                          >
                            <Image
                              src={
                                sourceTokenDetails.icon || "/placeholder.svg"
                              }
                              alt={sourceTokenDetails.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="font-medium text-white text-base truncate">
                              {sourceTokenDetails.name}
                            </div>
                          </div>
                          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <Coins className="h-5 w-5 text-blue-400 mr-2" />
                          <span className="text-blue-300 text-base flex-1 text-left font-medium">
                            Select Token
                          </span>
                          <ChevronDown className="h-5 w-5 text-blue-400" />
                        </div>
                      )}
                      {!sourceToken && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="bg-slate-800 border-blue-900/30 text-white w-[200px] shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                    style={
                      {
                        "--accent": "hsl(215 25% 27% / 0.8)",
                      } as React.CSSProperties
                    }
                  >
                    {/* Show all tokens if no network selected, or tokens available on the selected network */}
                    {(sourceNetwork
                      ? getAvailableTokensForNetwork(sourceNetwork.id)
                      : Object.entries(tokens).map(([id, token]) => ({
                          id,
                          ...token,
                        }))
                    ).map((token) => (
                      <DropdownMenuItem
                        key={token.id}
                        onClick={() => handleSourceTokenSelect(token.id)}
                        className="flex items-center gap-3 py-3 px-4 cursor-pointer text-base data-[highlighted]:bg-slate-700/80 data-[highlighted]:text-white"
                      >
                        <div
                          className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                          style={{ backgroundColor: token.color }}
                        >
                          <Image
                            src={token.icon || "/placeholder.svg"}
                            alt={token.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-base truncate">
                            {token.name}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-500 transition-colors duration-200 p-0 h-auto text-base hover:bg-transparent"
                  onClick={handleMaxClick}
                >
                  MAX
                </Button>
              </div>

              {/* Network Selection Below */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`rounded-xl bg-slate-700/50 hover:bg-slate-600/70 px-6 py-3 h-auto w-full flex justify-between items-center border ${
                      sourceToken
                        ? "border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        : "border-blue-900/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                    }`}
                  >
                    {sourceNetwork ? (
                      <div className="flex items-center gap-3">
                        <div
                          className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                          style={{ backgroundColor: sourceNetwork.color }}
                        >
                          <Image
                            src={sourceNetwork.icon || "/placeholder.svg"}
                            alt={sourceNetwork.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <span className="text-white text-lg font-medium">
                            {sourceNetwork.name}{" "}
                            {sourceNetwork.testnet && (
                              <span className="text-sm text-gray-400">
                                ({sourceNetwork.testnet})
                              </span>
                            )}
                          </span>
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-400 ml-auto" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Globe
                          className={`h-6 w-6 ${
                            sourceToken ? "text-blue-400" : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-lg font-medium ${
                            sourceToken ? "text-blue-300" : "text-gray-300"
                          }`}
                        >
                          {sourceToken
                            ? `Select Network for ${tokens[sourceToken].name}`
                            : "Select Network"}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 ml-auto ${
                            sourceToken ? "text-blue-400" : "text-gray-400"
                          }`}
                        />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-slate-800 border-blue-900/30 text-white w-[280px] shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                  style={
                    {
                      "--accent": "hsl(215 25% 27% / 0.8)",
                    } as React.CSSProperties
                  }
                >
                  {/* Show all networks if no token selected, or networks where the token is available */}
                  {(sourceToken
                    ? getNetworksForToken(sourceToken)
                    : networks
                  ).map((network) => (
                    <DropdownMenuItem
                      key={network.id}
                      onClick={() => handleSourceNetworkSelect(network)}
                      className="flex items-center gap-3 py-3 px-4 cursor-pointer text-base data-[highlighted]:bg-slate-700/80 data-[highlighted]:text-white"
                    >
                      <div
                        className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                        style={{ backgroundColor: network.color }}
                      >
                        <Image
                          src={network.icon || "/placeholder.svg"}
                          alt={network.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-base truncate">
                          {network.name}
                          {network.testnet && (
                            <span className="text-sm text-gray-400 ml-1">
                              ({network.testnet})
                            </span>
                          )}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Swap Direction Button */}
              <div className="relative flex justify-center my-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full border-t border-blue-900/30"></div>
                </div>

                <div className="relative z-10">
                  <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative rounded-full h-14 w-14 bg-slate-800 border-blue-500/50 hover:bg-blue-900/40 z-10 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    onClick={handleSwapDirection}
                    disabled={!sourceNetwork || !destNetwork}
                  >
                    <RefreshCw
                      className={cn(
                        "h-6 w-6 text-blue-400",
                        isSwapping && "animate-spin"
                      )}
                    />
                  </Button>
                </div>
              </div>

              {/* Bridge Animation */}
              <div className="relative h-32 my-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <BridgeAnimation
                    sourceNetwork={sourceNetwork}
                    destNetwork={destNetwork}
                  />
                </div>
              </div>

              {/* Replace the Get Tokens section UI with this updated version */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-200 text-xl font-medium">
                        Get Token
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-blue-400 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 border-blue-900/30 text-white text-base p-3 max-w-xs">
                            <p>
                              Select the token you want to receive first, then
                              choose which network to receive it on.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto"
                        >
                          <Info className="h-5 w-5 text-gray-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-blue-900/30 text-white text-base p-3">
                        <p>Select the network and token you want to receive</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="bg-slate-800/70 rounded-xl p-5 border border-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md">
                  {/* Network and Token Selection Side by Side */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Network Selection */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`rounded-xl bg-slate-700/50 hover:bg-slate-600/70 px-4 py-3 h-auto w-full border ${
                            destToken
                              ? "border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                              : "border-blue-900/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                          }`}
                        >
                          {destNetwork ? (
                            <div className="flex items-center gap-2 w-full">
                              <div
                                className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                style={{ backgroundColor: destNetwork.color }}
                              >
                                <Image
                                  src={destNetwork.icon || "/placeholder.svg"}
                                  alt={destNetwork.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="text-left min-w-0 flex-1">
                                <div className="font-medium text-white text-base truncate">
                                  {destNetwork.name}
                                  {destNetwork.testnet && (
                                    <span className="text-xs text-gray-400 ml-1">
                                      ({destNetwork.testnet})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <Globe
                                className={`h-5 w-5 ${
                                  destToken ? "text-blue-400" : "text-gray-400"
                                } mr-2`}
                              />
                              <span
                                className={`text-base flex-1 text-left ${
                                  destToken
                                    ? "text-blue-300 font-medium"
                                    : "text-gray-300"
                                }`}
                              >
                                {destToken
                                  ? `Select Network for ${tokens[destToken].name}`
                                  : "Select Network"}
                              </span>
                              <ChevronDown
                                className={`h-5 w-5 ${
                                  destToken ? "text-blue-400" : "text-gray-400"
                                }`}
                              />
                            </div>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="bg-slate-800 border-blue-900/30 text-white w-[200px] shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                        style={
                          {
                            "--accent": "hsl(215 25% 27% / 0.8)",
                          } as React.CSSProperties
                        }
                      >
                        {/* Show all networks if no token selected, or networks where the token is available */}
                        {(destToken
                          ? getNetworksForToken(destToken)
                          : networks
                        ).map((network) => (
                          <DropdownMenuItem
                            key={network.id}
                            onClick={() => handleDestNetworkSelect(network)}
                            className="flex items-center gap-3 py-3 px-4 cursor-pointer text-base data-[highlighted]:bg-slate-700/80 data-[highlighted]:text-white"
                          >
                            <div
                              className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                              style={{ backgroundColor: network.color }}
                            >
                              <Image
                                src={network.icon || "/placeholder.svg"}
                                alt={network.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-base truncate">
                                {network.name}
                                {network.testnet && (
                                  <span className="text-sm text-gray-400 ml-1">
                                    ({network.testnet})
                                  </span>
                                )}
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Token Selection */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="rounded-xl bg-slate-700/50 hover:bg-slate-600/70 px-4 py-3 h-auto w-full border border-blue-900/20 shadow-[0_0_10px_rgba(59,130,246,0.1)] relative"
                        >
                          {destTokenDetails ? (
                            <div className="flex items-center gap-2 w-full">
                              <div
                                className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                style={{
                                  backgroundColor: destTokenDetails.color,
                                }}
                              >
                                <Image
                                  src={
                                    destTokenDetails.icon || "/placeholder.svg"
                                  }
                                  alt={destTokenDetails.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="text-left min-w-0 flex-1">
                                <div className="font-medium text-white text-base truncate">
                                  {destTokenDetails.name}
                                </div>
                              </div>
                              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <Coins className="h-5 w-5 text-blue-400 mr-2" />
                              <span className="text-blue-300 text-base flex-1 text-left font-medium">
                                Select Token
                              </span>
                              <ChevronDown className="h-5 w-5 text-blue-400" />
                            </div>
                          )}
                          {!destToken && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="bg-slate-800 border-blue-900/30 text-white w-[200px] shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                        style={
                          {
                            "--accent": "hsl(215 25% 27% / 0.8)",
                          } as React.CSSProperties
                        }
                      >
                        {/* Show all tokens if no network selected, or tokens available on the selected network */}
                        {(destNetwork
                          ? getAvailableTokensForNetwork(destNetwork.id)
                          : Object.entries(tokens).map(([id, token]) => ({
                              id,
                              ...token,
                            }))
                        ).map((token) => (
                          <DropdownMenuItem
                            key={token.id}
                            onClick={() => handleDestTokenSelect(token.id)}
                            className="flex items-center gap-3 py-3 px-4 cursor-pointer text-base data-[highlighted]:bg-slate-700/80 data-[highlighted]:text-white"
                          >
                            <div
                              className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                              style={{ backgroundColor: token.color }}
                            >
                              <Image
                                src={token.icon || "/placeholder.svg"}
                                alt={token.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-base truncate">
                                {token.name}
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <Button
                className="w-full py-7 text-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl group relative overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                disabled={
                  isLoading ||
                  !isValid ||
                  !depositAmount ||
                  !sourceNetwork ||
                  !destNetwork ||
                  !sourceToken ||
                  !destToken
                }
                onClick={handleDeposit}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Deposit Tokens
                    </>
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 group-hover:opacity-0 transition-opacity duration-300"></span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center text-base text-gray-300">
          <p>
            Tokens will be bridged via our Dutch auction mechanism.
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 ml-1 underline underline-offset-2"
            >
              Learn more
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
