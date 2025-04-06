// @ts-nocheck comment
"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Info,
  AlertCircle,
  Loader2,
  Gavel,
  XCircle,
  TimerIcon,
  ShieldAlert,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import DUTCH_AUCTION_ABI from "@/utils/abis/DutchAuctionABI.json";

import {
  SUPPORTED_NETWORKS,
  MOCK_AUCTIONS,
  getTokenByAddress,
} from "./constants";
import WinAuctionModal from "@/components/win-auction-modal";

// Network definitions
const SUPPORTED_NETWORKS = [
  {
    id: "ethereum",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    icon: "/assets/ethereum.svg",
    // color: "#627EEA", // Uncommented for use in UI
    explorerUrl: "https://sepolia.etherscan.io",
    contracts: {
      dutchAuction: "0x21654dFbF44125271e87f71633ec1af17d0D685a",
      escrow: process.env.NEXT_PUBLIC_ESCROW_ADDRESS,
    },
  },
  {
    id: "rootstock",
    name: "Rootstock Testnet",
    chainId: 31,
    rpcUrl: "https://public-node.testnet.rsk.co",
    icon: "/assets/rootstock.svg",
    explorerUrl: "https://explorer.testnet.rsk.co",
    contracts: {
      dutchAuction: "0x21654dFbF44125271e87f71633ec1af17d0D685a",
      escrow: "0xCF1D0Bd7F6C2A8C05324d5D12fBa3E1eD2aa9451",
    },
  },
  {
    id: "citrea",
    name: "Citrea Testnet",
    chainId: 5115,
    rpcUrl: "https://rpc.testnet.citrea.xyz",
    icon: "/assets/citrea.svg",
    explorerUrl: "https://explorer.testnet.citrea.xyz",
    contracts: {
      dutchAuction: process.env.NEXT_PUBLIC_SETTLER_ADDRESS,
      escrow: "0xCF1D0Bd7F6C2A8C05324d5D12fBa3E1eD2aa9451",
    },
  },
];

// Token definitions
const TOKEN_DEFINITIONS = {
  usdc: {
    name: "USDC",
    icon: "/assets/usdc.svg",
    color: "#2775CA",
    addresses: {
      ethereum: "0xA70638af71aD445D6E899790e327e73A0ba09e4f", // Sepolia
      rootstock: "0x4F21994B5f8F724839bA574F97E47f8F3f967Cae",
      citrea: "0xd0A9c6e7FF012F22Ba52038F9727b50e16466176", // Citrea
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

// Helper function to get token by address (for use in the page)
const getTokenByAddress = (address) => {
  if (!address) return null;

  // Normalize the address
  const normalizedAddress = address.toLowerCase();

  // Check each token definition
  for (const [tokenId, token] of Object.entries(TOKEN_DEFINITIONS)) {
    for (const [networkId, tokenAddress] of Object.entries(token.addresses)) {
      if (tokenAddress.toLowerCase() === normalizedAddress) {
        return {
          ...token,
          id: tokenId,
          networkId,
        };
      }
    }
  }

  // Return default if not found
  return {
    name: "Unknown",
    icon: "/placeholder.svg",
    color: "#6B7280",
  };
};

// Add mock data for testing when RPC fails
const MOCK_AUCTIONS = [
  {
    id: 0,
    tokenInfo: {
      sourceToken: TOKEN_DEFINITIONS.usdt.addresses.ethereum,
      destToken: TOKEN_DEFINITIONS.usdt.addresses.citrea,
      sourceAmount: ethers.utils.parseUnits("100", 18),
      minDestAmount: ethers.utils.parseUnits("95", 18),
      sourceSymbol: "USDT",
      destSymbol: "USDT",
      sourceDecimals: 18,
      destDecimals: 18,
    },
    timeInfo: {
      startTime: ethers.BigNumber.from(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
      endTime: ethers.BigNumber.from(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
      startPrice: ethers.utils.parseUnits("110", 18),
      endPrice: ethers.utils.parseUnits("90", 18),
    },
    bidInfo: {
      winner: ethers.constants.AddressZero,
      winningBid: ethers.constants.Zero,
      settled: false,
    },
    parties: {
      user: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      settler: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      orderId: ethers.constants.HashZero,
    },
    currentPrice: ethers.utils.parseUnits("100", 18),
    network: "ethereum",
  },
  {
    id: 1,
    tokenInfo: {
      sourceToken: TOKEN_DEFINITIONS.dai.addresses.rootstock,
      destToken: TOKEN_DEFINITIONS.dai.addresses.citrea,
      sourceAmount: ethers.utils.parseUnits("50", 18),
      minDestAmount: ethers.utils.parseUnits("48", 18),
      sourceSymbol: "DAI",
      destSymbol: "DAI",
      sourceDecimals: 18,
      destDecimals: 18,
    },
    timeInfo: {
      startTime: ethers.BigNumber.from(Math.floor(Date.now() / 1000) - 7200), // 2 hours ago
      endTime: ethers.BigNumber.from(Math.floor(Date.now() / 1000) + 1800), // 30 minutes from now
      startPrice: ethers.utils.parseUnits("55", 18),
      endPrice: ethers.utils.parseUnits("45", 18),
    },
    bidInfo: {
      winner: ethers.constants.AddressZero,
      winningBid: ethers.constants.Zero,
      settled: false,
    },
    parties: {
      user: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      settler: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      orderId: ethers.constants.HashZero,
    },
    currentPrice: ethers.utils.parseUnits("50", 18),
    network: "rootstock",
  },
  {
    id: 2,
    tokenInfo: {
      sourceToken: TOKEN_DEFINITIONS.usdc.addresses.ethereum,
      destToken: TOKEN_DEFINITIONS.usdc.addresses.citrea,
      sourceAmount: ethers.utils.parseUnits("200", 18),
      minDestAmount: ethers.utils.parseUnits("190", 18),
      sourceSymbol: "USDC",
      destSymbol: "USDC",
      sourceDecimals: 18,
      destDecimals: 18,
    },
    timeInfo: {
      startTime: ethers.BigNumber.from(Math.floor(Date.now() / 1000) - 1800), // 30 minutes ago
      endTime: ethers.BigNumber.from(Math.floor(Date.now() / 1000) + 7200), // 2 hours from now
      startPrice: ethers.utils.parseUnits("220", 18),
      endPrice: ethers.utils.parseUnits("180", 18),
    },
    bidInfo: {
      winner: ethers.constants.AddressZero,
      winningBid: ethers.constants.Zero,
      settled: false,
    },
    parties: {
      user: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      settler: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      orderId: ethers.constants.HashZero,
    },
    currentPrice: ethers.utils.parseUnits("210", 18),
    network: "citrea",
  },
];

// Helper function to get network by ID
const getNetworkById = (id) => {
  return SUPPORTED_NETWORKS.find((network) => network.id === id);
};

// Helper function to fetch token details from any chain
const fetchTokenDetails = async (address, rpcUrl) => {
  try {
    // First check if we have this token in our definitions
    const tokenInfo = getTokenByAddress(address);
    if (tokenInfo && tokenInfo.name !== "Unknown") {
      return {
        symbol: tokenInfo.name,
        name: tokenInfo.name,
        decimals: 18,
      };
    }

    // If not in our definitions, try to fetch from chain
    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc.testnet.citrea.xyz"
    );
    const contract = new ethers.Contract(
      address,
      [
        "function symbol() view returns (string)",
        "function name() view returns (string)",
        "function decimals() view returns (uint8)",
      ],
      provider
    );

    try {
      const [symbol, name, decimals] = await Promise.all([
        contract.symbol().catch(() => "???"),
        contract.name().catch(() => "Unknown Token"),
        contract.decimals().catch(() => 18),
      ]);

      return { symbol, name, decimals };
    } catch (error) {
      console.warn(
        `Error fetching token details from contract: ${error.message}`
      );
      return { symbol: "???", name: "Unknown Token", decimals: 18 };
    }
  } catch (error) {
    console.error("Error in fetchTokenDetails:", error);
    return { symbol: "???", name: "Unknown Token", decimals: 18 };
  }
};

// Network Selection Component
const NetworkSelector = memo(({ selectedNetwork, onSelectNetwork, stats }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Select Network to View Auctions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "bg-slate-800/70 border rounded-xl p-6 cursor-pointer transition-all",
            selectedNetwork === "all"
              ? "border-blue-500 ring-2 ring-blue-500/30"
              : "border-blue-900/30 hover:border-blue-700/50"
          )}
          onClick={() => onSelectNetwork("all")}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-16 h-16 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
              <ArrowRightLeft className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-center text-white mb-2">
            All Networks
          </h3>
          <p className="text-gray-400 text-center text-sm mb-4">
            View auctions across all supported chains
          </p>
          <div className="bg-slate-700/50 rounded-lg p-2 text-center">
            <span className="text-blue-400 font-medium">
              {stats.all} Auctions
            </span>
          </div>
        </motion.div>

        {SUPPORTED_NETWORKS.map((network) => (
          <motion.div
            key={network.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "bg-slate-800/70 border rounded-xl p-6 cursor-pointer transition-all",
              selectedNetwork === network.id
                ? "border-blue-500 ring-2 ring-blue-500/30"
                : "border-blue-900/30 hover:border-blue-700/50"
            )}
            onClick={() => onSelectNetwork(network.id)}
          >
            <div className="flex items-center justify-center mb-4">
              <div
                className="relative w-16 h-16 rounded-full overflow-hidden"
                style={{ backgroundColor: network.color }}
              >
                <Image
                  src={network.icon || "/placeholder.svg"}
                  alt={network.name}
                  fill
                  className="p-2"
                />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-white mb-2">
              {network.name}
            </h3>
            <p className="text-gray-400 text-center text-sm mb-4">
              Chain ID: {network.chainId}
            </p>
            <div className="bg-slate-700/50 rounded-lg p-2 text-center">
              <span className="text-blue-400 font-medium">
                {stats[network.id] || 0} Auctions
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

NetworkSelector.displayName = "NetworkSelector";

// AuctionCard Component
const AuctionCard = memo(
  ({ auction, onPlaceBid, isPlacingBid, networkError, network }) => {
    const [expanded, setExpanded] = useState(false);

    const getAuctionStatus = () => {
      const now = Math.floor(Date.now() / 1000);
      const startTime = auction.timeInfo.startTime.toNumber();
      const endTime = auction.timeInfo.endTime.toNumber();
      const hasWinner = auction.bidInfo.winner !== ethers.constants.AddressZero;

      if (auction.bidInfo.settled) {
        return { label: "Settled", color: "bg-gray-500" };
      }
      if (hasWinner) {
        return { label: "Bid Placed", color: "bg-yellow-500" };
      }
      if (now < startTime) {
        return { label: "Upcoming", color: "bg-blue-500" };
      }
      if (now > endTime) {
        return { label: "Ended", color: "bg-red-500" };
      }
      return { label: "Active", color: "bg-green-500" };
    };

    const formatTimeRemaining = useCallback((endTime) => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = endTime.toNumber() - now;
      if (remaining <= 0) return "Ended";

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    }, []);

    const formatPrice = useCallback((price, decimals = 18, symbol = "???") => {
      if (!price) return "N/A";
      try {
        return `${ethers.utils.formatUnits(price, decimals)} ${symbol}`;
      } catch (error) {
        return "N/A";
      }
    }, []);

    // Get token info from our definitions
    const sourceToken = getTokenByAddress(auction.tokenInfo.sourceToken) || {
      name: auction.tokenInfo.sourceSymbol || "Unknown",
      icon: "/placeholder.svg",
      color: "#6B7280",
    };

    const destToken = getTokenByAddress(auction.tokenInfo.destToken) || {
      name: auction.tokenInfo.destSymbol || "Unknown",
      icon: "/placeholder.svg",
      color: "#6B7280",
    };

    const status = getAuctionStatus();

    // Check if current price is less than min expected amount
    const currentPrice = auction.currentPrice || ethers.BigNumber.from(0);
    const canBid =
      status.label === "Active" &&
      !auction.bidInfo.settled &&
      auction.bidInfo.winner === ethers.constants.AddressZero;

    // Update time remaining
    const [timeRemaining, setTimeRemaining] = useState(
      formatTimeRemaining(auction.timeInfo.endTime)
    );
    useEffect(() => {
      const timer = setInterval(() => {
        setTimeRemaining(formatTimeRemaining(auction.timeInfo.endTime));
      }, 1000);
      return () => clearInterval(timer);
    }, [auction.timeInfo.endTime, formatTimeRemaining]);

    const networkInfo = getNetworkById(network);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        layout
      >
        <Card
          className={cn(
            "bg-slate-900/70 border-blue-900/30 p-6 rounded-xl overflow-hidden transition-all duration-300",
            status.label === "Active" && "ring-2 ring-blue-500/50",
            expanded && "pb-8"
          )}
        >
          {/* Network Badge */}
          <div className="absolute top-4 right-4">
            <Badge
              className="bg-slate-800 text-gray-300 border-none flex items-center gap-1.5 px-2.5 py-1"
              variant="outline"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: networkInfo?.color || "#6B7280" }}
              ></div>
              {networkInfo?.name || "Unknown Network"}
            </Badge>
          </div>

          {/* Card Header */}
          <div className="flex justify-between items-start mb-4 pr-24">
            <div>
              <h3 className="text-xl font-bold text-white">
                Auction #{auction.id}
              </h3>
              <p className="text-sm text-gray-400">
                Created by{" "}
                {`${auction.parties.user.slice(
                  0,
                  6
                )}...${auction.parties.user.slice(-4)}`}
              </p>
            </div>
            <Badge className={cn(status.color, "text-white")}>
              {status.label}
            </Badge>
          </div>

          {/* Token Info */}
          <div className="bg-slate-800/70 rounded-xl p-4 border border-blue-900/20 mb-6">
            <div className="flex items-center gap-2">
              <div
                className="relative w-8 h-8 rounded-full overflow-hidden"
                style={{ backgroundColor: sourceToken.color }}
              >
                <Image
                  src={sourceToken.icon || "/placeholder.svg"}
                  alt={auction.tokenInfo.sourceSymbol || "Token"}
                  fill
                />
              </div>
              <div>
                <p className="text-sm text-gray-400">Source Amount</p>
                <p className="font-medium text-white">
                  {formatPrice(
                    auction.tokenInfo.sourceAmount,
                    auction.tokenInfo.sourceDecimals,
                    auction.tokenInfo.sourceSymbol
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Current Price */}
          {status.label === "Active" && (
            <div className="bg-slate-800/70 rounded-xl p-4 border border-blue-900/20 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Current Price</p>
                  <p className="text-2xl font-bold text-white">
                    {formatPrice(
                      auction.currentPrice,
                      auction.tokenInfo.destDecimals,
                      auction.tokenInfo.destSymbol
                    )}
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-5 w-5 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 text-white p-2">
                      Price decreases over time until someone places a bid
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* Time Remaining */}
          <div className="flex items-center gap-2 mb-6 text-gray-300">
            <TimerIcon className="h-5 w-5 text-gray-400" />
            <span>{timeRemaining}</span>
          </div>

          {/* Bid Button */}
          <Button
            className={cn(
              "w-full py-4 text-lg rounded-xl",
              canBid
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-slate-700 text-gray-300 cursor-not-allowed"
            )}
            disabled={!canBid || isPlacingBid || networkError !== null}
            onClick={() => onPlaceBid(auction.id, network)}
          >
            <span className="flex items-center gap-2">
              {isPlacingBid ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : canBid ? (
                <>
                  <Gavel className="h-5 w-5" />
                  Place Bid
                </>
              ) : auction.bidInfo.winner !== ethers.constants.AddressZero ? (
                "Bid Placed"
              ) : (
                "Cannot Bid"
              )}
            </span>
          </Button>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4 text-gray-400"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-2" />
            )}
            {expanded ? "Show Less" : "Show More"}
          </Button>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 overflow-hidden"
              >
                {/* Winner Info */}
                {auction.bidInfo.winner !== ethers.constants.AddressZero && (
                  <div className="bg-slate-800/70 rounded-xl p-4 border border-blue-900/20 mb-4">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      Winning Bid
                    </h4>
                    <p className="text-sm text-gray-400">
                      Winner:{" "}
                      {`${auction.bidInfo.winner.slice(
                        0,
                        6
                      )}...${auction.bidInfo.winner.slice(-4)}`}
                    </p>
                    <p className="text-sm text-gray-400">
                      Winning bid:{" "}
                      {formatPrice(
                        auction.bidInfo.winningBid,
                        auction.tokenInfo.destDecimals,
                        auction.tokenInfo.destSymbol
                      )}
                    </p>
                  </div>
                )}

                {/* Auction Details */}
                <div className="bg-slate-800/70 rounded-xl p-4 border border-blue-900/20">
                  <h4 className="text-white font-medium mb-2">
                    Auction Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">Start Time:</div>
                    <div className="text-gray-300">
                      {new Date(
                        auction.timeInfo.startTime.toNumber() * 1000
                      ).toLocaleString()}
                    </div>
                    <div className="text-gray-400">End Time:</div>
                    <div className="text-gray-300">
                      {new Date(
                        auction.timeInfo.endTime.toNumber() * 1000
                      ).toLocaleString()}
                    </div>
                    <div className="text-gray-400">Source Token:</div>
                    <div className="text-gray-300">
                      {auction.tokenInfo.sourceSymbol}
                    </div>
                    <div className="text-gray-400">Destination Token:</div>
                    <div className="text-gray-300">
                      {auction.tokenInfo.destSymbol}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.auction.id === nextProps.auction.id &&
      prevProps.auction.network === nextProps.auction.network &&
      prevProps.isPlacingBid === nextProps.isPlacingBid &&
      prevProps.networkError === nextProps.networkError &&
      prevProps.auction.currentPrice?.toString() ===
        nextProps.auction.currentPrice?.toString() &&
      prevProps.auction.bidInfo.winner === nextProps.auction.bidInfo.winner &&
      prevProps.auction.bidInfo.settled === nextProps.auction.bidInfo.settled
    );
  }
);

AuctionCard.displayName = "AuctionCard";

// Main Page Component
export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [placingBid, setPlacingBid] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const [providers, setProviders] = useState({});
  const [contracts, setContracts] = useState({});
  const [signer, setSigner] = useState(null);
  const [sortOrder, setSortOrder] = useState("endingSoon");
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [showNetworkSelector, setShowNetworkSelector] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [showWinModal, setShowWinModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [originData, setOriginData] = useState("");

  // Initialize Web3 providers and contracts for all networks
  useEffect(() => {
    // Add console logs to help debug the contract initialization
    const initializeProviders = async () => {
      try {
        const newProviders = {};
        const newContracts = {};

        console.log(
          "Initializing providers for networks:",
          SUPPORTED_NETWORKS.map((n) => n.id)
        );

        // Initialize providers for all networks
        for (const network of SUPPORTED_NETWORKS) {
          try {
            console.log(`Connecting to ${network.name} at ${network.rpcUrl}`);

            // Use a fallback RPC URL if the main one fails
            let provider;
            try {
              // Try with the network's RPC URL first
              provider = new ethers.providers.JsonRpcProvider(
                "https://rpc.testnet.citrea.xyz"
              );
              await provider.getNetwork(); // Test the connection
            } catch (e) {
              console.warn(
                `Failed to connect to ${network.name} primary RPC: ${e.message}`
              );

              // Try with a public fallback RPC
              const fallbackRpcUrls = {
                ethereum: "https://eth-sepolia.public.blastapi.io",
                rootstock: "https://public-node.testnet.rsk.co",
                citrea: "https://rpc.testnet.citrea.xyz",
              };

              if (fallbackRpcUrls[network.id]) {
                console.log(
                  `Trying fallback RPC for ${network.name}: ${
                    fallbackRpcUrls[network.id]
                  }`
                );
                provider = new ethers.providers.JsonRpcProvider(
                  fallbackRpcUrls[network.id]
                );
                try {
                  await provider.getNetwork(); // Test the connection
                  console.log(
                    `Successfully connected to ${network.name} using fallback RPC`
                  );
                } catch (fallbackError) {
                  console.warn(
                    `Failed to connect to ${network.name} fallback RPC: ${fallbackError.message}`
                  );
                  continue; // Skip this network
                }
              } else {
                continue; // Skip this network if no fallback available
              }
            }

            newProviders[network.id] = provider;
            console.log(`Successfully connected to ${network.name}`);

            // Get the contract address, using environment variable if available
            const dutchAuctionAddress = network.contracts.dutchAuction;

            if (!dutchAuctionAddress) {
              console.warn(
                `No contract address for ${network.name}, skipping contract initialization`
              );
              continue;
            }

            console.log(
              `Using contract address for ${network.name}: ${dutchAuctionAddress}`
            );

            try {
              const dutchAuctionContract = new ethers.Contract(
                dutchAuctionAddress,
                DUTCH_AUCTION_ABI,
                provider
              );

              // Don't test the contract, just initialize it
              newContracts[network.id] = dutchAuctionContract;
              console.log(
                `Successfully initialized contract for ${network.name}`
              );
            } catch (contractError) {
              console.warn(
                `Failed to initialize contract for ${network.name}: ${contractError.message}`
              );
              // Continue with other networks even if this one fails
            }
          } catch (networkError) {
            console.warn(
              `Skipping ${network.name} due to connection issues: ${networkError.message}`
            );
            // Continue with other networks even if this one fails
          }
        }

        console.log(
          "Initialized providers for networks:",
          Object.keys(newProviders)
        );
        console.log(
          "Initialized contracts for networks:",
          Object.keys(newContracts)
        );

        // Even if we couldn't initialize any contracts, still set the providers and contracts
        // This will allow the fetchAuctions function to fall back to mock data
        setProviders(newProviders);
        setContracts(newContracts);

        // Initialize web3 provider for wallet connection
        if (window.ethereum) {
          try {
            const web3Provider = new ethers.providers.Web3Provider(
              window.ethereum
            );
            const accounts = await window.ethereum.request({
              method: "eth_accounts",
            });
            setWalletConnected(accounts.length > 0);

            if (accounts.length > 0) {
              const signer = web3Provider.getSigner();
              console.log("Signer initialized:", signer);
              setSigner(signer);

              const chainId = await web3Provider
                .getNetwork()
                .then((net) => net.chainId);

              // Find if the connected chain matches any of our supported networks
              const connectedNetwork = SUPPORTED_NETWORKS.find(
                (network) => network.chainId === chainId
              );

              if (!connectedNetwork) {
                setNetworkError(
                  `Please switch to one of the supported networks`
                );
              } else {
                setNetworkError(null);
              }
            }
          } catch (walletError) {
            console.warn("Error initializing wallet connection:", walletError);
            // Don't block the app if wallet connection fails
          }
        }

        // If we couldn't connect to any networks, use mock data
        if (Object.keys(newProviders).length === 0) {
          console.log("Could not connect to any networks, using mock data");
          setAuctions(MOCK_AUCTIONS);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize providers:", err);
        setError("Failed to connect to blockchain, using mock data");
        // Use mock data as fallback
        setAuctions(MOCK_AUCTIONS);
        setLoading(false);
      }
    };

    initializeProviders();
  }, []);

  // Fetch auction details from a specific network
  const fetchAuctionDetails = useCallback(
    async (auctionId, networkId) => {
      const contract = contracts[networkId];
      const provider = providers[networkId];

      if (!contract || !provider) {
        console.log(`Missing contract or provider for ${networkId}`);
        return null;
      }

      try {
        console.log(`Fetching auction ${auctionId} from ${networkId}`);

        // Wrap each call in a try/catch to handle individual failures
        let tokenInfo, timeInfo, bidInfo, parties;

        try {
          tokenInfo = await contract.auctionTokens(auctionId);
          console.log(`Got tokenInfo for auction ${auctionId}`);
        } catch (error) {
          console.warn(
            `Failed to fetch tokenInfo for auction ${auctionId} on ${networkId}: ${error.message}`
          );
          return null;
        }

        try {
          timeInfo = await contract.auctionTimes(auctionId);
          console.log(`Got timeInfo for auction ${auctionId}`);
        } catch (error) {
          console.warn(
            `Failed to fetch timeInfo for auction ${auctionId} on ${networkId}: ${error.message}`
          );
          return null;
        }

        try {
          bidInfo = await contract.auctionBids(auctionId);
          console.log(`Got bidInfo for auction ${auctionId}`);
        } catch (error) {
          console.warn(
            `Failed to fetch bidInfo for auction ${auctionId} on ${networkId}: ${error.message}`
          );
          return null;
        }

        try {
          parties = await contract.auctionParties(auctionId);
          console.log(`Got parties for auction ${auctionId}`);
        } catch (error) {
          console.warn(
            `Failed to fetch parties for auction ${auctionId} on ${networkId}: ${error.message}`
          );
          return null;
        }

        if (
          !tokenInfo ||
          !timeInfo ||
          !bidInfo ||
          !parties ||
          parties.user === ethers.constants.AddressZero
        ) {
          console.log(`Invalid auction data for ${auctionId} on ${networkId}`);
          return null;
        }

        // Create a copy of the objects to avoid the "object is not extensible" error
        const tokenInfoCopy = {
          sourceToken: tokenInfo.sourceToken,
          destToken: tokenInfo.destToken,
          sourceAmount: tokenInfo.sourceAmount,
          minDestAmount: tokenInfo.minDestAmount,
        };

        const timeInfoCopy = {
          startTime: timeInfo.startTime,
          endTime: timeInfo.endTime,
          startPrice: timeInfo.startPrice,
          endPrice: timeInfo.endPrice,
        };

        const bidInfoCopy = {
          winner: bidInfo.winner,
          winningBid: bidInfo.winningBid,
          settled: bidInfo.settled,
        };

        const partiesCopy = {
          user: parties.user,
          settler: parties.settler,
          orderId: parties.orderId || ethers.constants.HashZero,
        };

        let currentPrice;
        const now = Math.floor(Date.now() / 1000);
        if (
          now >= timeInfoCopy.startTime.toNumber() &&
          now <= timeInfoCopy.endTime.toNumber()
        ) {
          try {
            currentPrice = await contract.getCurrentPrice(auctionId);
            console.log(`Got currentPrice for auction ${auctionId}`);
          } catch (error) {
            console.warn(
              `Could not get current price for auction ${auctionId}: ${error.message}`
            );
            // Use a fallback price calculation if the contract call fails
            if (timeInfoCopy.startPrice && timeInfoCopy.endPrice) {
              const totalDuration =
                timeInfoCopy.endTime.toNumber() -
                timeInfoCopy.startTime.toNumber();
              const elapsed = now - timeInfoCopy.startTime.toNumber();
              const progress = Math.min(
                1,
                Math.max(0, elapsed / totalDuration)
              );

              const startPrice = ethers.BigNumber.from(timeInfoCopy.startPrice);
              const endPrice = ethers.BigNumber.from(timeInfoCopy.endPrice);
              const priceDiff = startPrice.sub(endPrice);

              currentPrice = startPrice.sub(
                priceDiff
                  .mul(ethers.BigNumber.from(Math.floor(progress * 1000)))
                  .div(1000)
              );
              console.log(`Calculated fallback price for auction ${auctionId}`);
            }
          }
        }

        // Get token info from our definitions first
        const sourceToken = getTokenByAddress(tokenInfoCopy.sourceToken);
        const destToken = getTokenByAddress(tokenInfoCopy.destToken);

        // Set default symbols and decimals
        let sourceSymbol = sourceToken?.name || "???";
        let destSymbol = destToken?.name || "???";
        let sourceDecimals = 18;
        let destDecimals = 18;

        // Try to fetch from chain only if we don't have the info
        if (!sourceToken || sourceToken.name === "Unknown") {
          try {
            const details = await fetchTokenDetails(
              tokenInfoCopy.sourceToken,
              provider.connection.url
            );
            sourceSymbol = details.symbol;
            sourceDecimals = details.decimals;
            console.log(
              `Fetched source token details for ${tokenInfoCopy.sourceToken}`
            );
          } catch (error) {
            console.warn(
              `Failed to fetch source token details: ${error.message}`
            );
          }
        }

        if (!destToken || destToken.name === "Unknown") {
          try {
            const details = await fetchTokenDetails(
              tokenInfoCopy.destToken,
              provider.connection.url
            );
            destSymbol = details.symbol;
            destDecimals = details.decimals;
            console.log(
              `Fetched dest token details for ${tokenInfoCopy.destToken}`
            );
          } catch (error) {
            console.warn(
              `Failed to fetch destination token details: ${error.message}`
            );
          }
        }

        // Add token details to the copy
        tokenInfoCopy.sourceSymbol = sourceSymbol;
        tokenInfoCopy.destSymbol = destSymbol;
        tokenInfoCopy.sourceDecimals = sourceDecimals;
        tokenInfoCopy.destDecimals = destDecimals;

        console.log(
          `Successfully processed auction ${auctionId} from ${networkId}`
        );

        return {
          id: auctionId,
          tokenInfo: tokenInfoCopy,
          timeInfo: timeInfoCopy,
          bidInfo: bidInfoCopy,
          parties: partiesCopy,
          currentPrice,
          network: networkId,
        };
      } catch (error) {
        console.error(
          `Error fetching auction ${auctionId} from ${networkId}:`,
          error
        );
        return null;
      }
    },
    [contracts, providers]
  );

  // Update auction prices for a specific network
  const updateAuctionPrices = useCallback(async () => {
    if (!contracts || Object.keys(contracts).length === 0) return;

    try {
      const activeAuctions = auctions.filter((auction) => {
        const now = Math.floor(Date.now() / 1000);
        return (
          now >= auction.timeInfo.startTime.toNumber() &&
          now <= auction.timeInfo.endTime.toNumber() &&
          !auction.bidInfo.settled &&
          auction.bidInfo.winner === ethers.constants.AddressZero
        );
      });

      if (activeAuctions.length === 0) return;

      const priceUpdates = await Promise.all(
        activeAuctions.map(async (auction) => {
          try {
            const contract = contracts[auction.network];
            if (!contract) return null;

            try {
              const currentPrice = await contract.getCurrentPrice(auction.id);
              // Only return if price has changed
              if (
                !auction.currentPrice ||
                !currentPrice.eq(auction.currentPrice)
              ) {
                return {
                  id: auction.id,
                  network: auction.network,
                  currentPrice,
                };
              }
              return null;
            } catch (error) {
              console.warn(
                `Failed to update price for auction ${auction.id}: ${error.message}`
              );

              // Use a fallback price calculation if the contract call fails
              if (auction.timeInfo.startPrice && auction.timeInfo.endPrice) {
                const now = Math.floor(Date.now() / 1000);
                const totalDuration =
                  auction.timeInfo.endTime.toNumber() -
                  auction.timeInfo.startTime.toNumber();
                const elapsed = now - auction.timeInfo.startTime.toNumber();
                const progress = Math.min(
                  1,
                  Math.max(0, elapsed / totalDuration)
                );

                const startPrice = ethers.BigNumber.from(
                  auction.timeInfo.startPrice
                );
                const endPrice = ethers.BigNumber.from(
                  auction.timeInfo.endPrice
                );
                const priceDiff = startPrice.sub(endPrice);

                const calculatedPrice = startPrice.sub(
                  priceDiff
                    .mul(ethers.BigNumber.from(Math.floor(progress * 1000)))
                    .div(1000)
                );

                // Only return if price has changed
                if (
                  !auction.currentPrice ||
                  !calculatedPrice.eq(auction.currentPrice)
                ) {
                  return {
                    id: auction.id,
                    network: auction.network,
                    currentPrice: calculatedPrice,
                  };
                }
              }
              return null;
            }
          } catch (error) {
            console.warn(`Failed to update price for auction ${auction.id}`);
            return null;
          }
        })
      );

      // Filter out null updates (prices that didn't change)
      const validUpdates = priceUpdates.filter((update) => update !== null);

      if (validUpdates.length === 0) return;

      // Only update state if there are actual changes
      setAuctions((prevAuctions) => {
        const updatedAuctions = [...prevAuctions];
        let hasChanges = false;

        validUpdates.forEach((update) => {
          if (update) {
            const index = updatedAuctions.findIndex(
              (a) => a.id === update.id && a.network === update.network
            );
            if (index !== -1) {
              updatedAuctions[index] = {
                ...updatedAuctions[index],
                currentPrice: update.currentPrice,
              };
              hasChanges = true;
            }
          }
        });

        return hasChanges ? updatedAuctions : prevAuctions;
      });

      // Only update timestamp if changes were made
      if (validUpdates.length > 0) {
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error("Error updating auction prices:", error);
    }
  }, [contracts, auctions]);

  // Replace the fetchAuctions function with a more optimized version that doesn't reload everything
  const fetchAuctions = useCallback(async () => {
    // Only set loading state when we don't have any auctions yet
    if (auctions.length === 0) {
      setLoading(true);
    }

    // Rest of the function remains the same...
    setError(null);

    try {
      const networksToFetch =
        selectedNetwork === "all"
          ? Object.keys(contracts)
          : contracts[selectedNetwork]
          ? [selectedNetwork]
          : [];

      console.log(
        `Fetching auctions from networks: ${networksToFetch.join(", ")}`
      );

      if (networksToFetch.length === 0) {
        console.log("No available networks to fetch auctions from");

        // Use mock data if no networks are available
        if (
          selectedNetwork === "all" ||
          MOCK_AUCTIONS.some((a) => a.network === selectedNetwork)
        ) {
          const mockData =
            selectedNetwork === "all"
              ? MOCK_AUCTIONS
              : MOCK_AUCTIONS.filter((a) => a.network === selectedNetwork);

          setAuctions(mockData);
          console.log(`Using ${mockData.length} mock auctions as fallback`);
        } else {
          setError("No available networks to fetch auctions from");
        }

        return;
      }

      let fetchedAnyAuctions = false;
      const allAuctions = [];

      for (const networkId of networksToFetch) {
        const contract = contracts[networkId];
        if (!contract) {
          console.log(`No contract for network ${networkId}`);
          continue;
        }

        try {
          console.log(`Fetching nextAuctionId for ${networkId}...`);

          // Use a timeout to prevent hanging on slow RPC responses
          let nextAuctionId;
          try {
            nextAuctionId = await Promise.race([
              contract.nextAuctionId(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("RPC timeout")), 15000)
              ),
            ]);
            console.log(
              `Network ${networkId} has ${nextAuctionId.toString()} auctions`
            );
          } catch (e) {
            console.warn(
              `Failed to get nextAuctionId for ${networkId}: ${e.message}`
            );

            // Try with a hardcoded value as fallback
            console.log(`Trying with hardcoded auction count for ${networkId}`);
            nextAuctionId = 10; // Try to fetch the first 10 auctions as a fallback
          }

          if (nextAuctionId === 0) {
            console.log(`No auctions on network ${networkId}`);
            continue;
          }

          // Fetch auctions in batches to avoid overwhelming the RPC
          const batchSize = 3;
          for (let i = 0; i < nextAuctionId; i += batchSize) {
            console.log(
              `Fetching batch ${i} to ${i + batchSize - 1} for ${networkId}`
            );

            const batchPromises = [];
            for (let j = i; j < Math.min(i + batchSize, nextAuctionId); j++) {
              batchPromises.push(fetchAuctionDetails(j, networkId));
            }

            const batchResults = await Promise.all(batchPromises);
            const validAuctions = batchResults.filter(
              (auction) => auction !== null
            );

            console.log(
              `Got ${validAuctions.length} valid auctions in this batch`
            );

            if (validAuctions.length > 0) {
              fetchedAnyAuctions = true;
              allAuctions.push(...validAuctions);

              // Update the auctions state after each batch to show progress
              setAuctions((prev) => [...prev, ...validAuctions]);
            }

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < nextAuctionId) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        } catch (error) {
          console.error(`Error fetching auctions from ${networkId}:`, error);
          // Continue with other networks even if this one fails
        }
      }

      // Set the final auctions list
      console.log(`Total auctions fetched: ${allAuctions.length}`);

      if (allAuctions.length > 0) {
        setAuctions(allAuctions);
        // Update prices for active auctions
        try {
          await updateAuctionPrices();
        } catch (error) {
          console.error("Error updating auction prices:", error);
        }
      } else if (!fetchedAnyAuctions) {
        console.log("No auctions found, using mock data as fallback");

        // Use mock data if no auctions were found
        if (
          selectedNetwork === "all" ||
          MOCK_AUCTIONS.some((a) => a.network === selectedNetwork)
        ) {
          const mockData =
            selectedNetwork === "all"
              ? MOCK_AUCTIONS
              : MOCK_AUCTIONS.filter((a) => a.network === selectedNetwork);

          setAuctions(mockData);
          console.log(`Using ${mockData.length} mock auctions`);
        } else {
          setError(
            "No auctions found. The contracts might be empty or unavailable."
          );
        }
      }
    } catch (error) {
      console.error("Error fetching auctions:", error);
      setError(`Failed to load auctions: ${error.message}`);

      // Use mock data as fallback
      console.log("Using mock data as fallback due to error");
      if (
        selectedNetwork === "all" ||
        MOCK_AUCTIONS.some((a) => a.network === selectedNetwork)
      ) {
        const mockData =
          selectedNetwork === "all"
            ? MOCK_AUCTIONS
            : MOCK_AUCTIONS.filter((a) => a.network === selectedNetwork);

        setAuctions(mockData);
      }
    }
  }, [contracts, selectedNetwork, fetchAuctionDetails]);

  // Handle bid placement
  const handleBidSuccess = useCallback(async (auction) => {
    console.log("Handling bid success for auction:", auction);

    try {
      // Use the provided approach to get the order ID from the contract
      let tempOrderId = "";

      try {
        // Try to get the order ID from the contract

        const provider = new ethers.providers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.citrea.xyz"
        );

        const contractAddress =
          process.env.NEXT_PUBLIC_SETTLER_ADDRESS ||
          process.env.NEXT_PUBLIC_SETTLER_ADDRESS ||
          "0x94AA7d7A4e249ca9A12A834CeC057e91F886B92a";

        console.log(
          "Fetching order ID using contract address:",
          contractAddress
        );

        const contract = new ethers.Contract(
          contractAddress,
          DUTCH_AUCTION_ABI,
          provider
        );

        // Get the order ID from the contract
        const orderIdResult = await contract.getOrderId(auction.id);
        const orderIdTest =
          "0x6d17bb0a0b4112c91f0b6039c9e4272c914d8081991e623e62f019f70bcdfae3";
        tempOrderId = orderIdTest;
        console.log(
          "Successfully fetched order ID from contract:",
          tempOrderId
        );
      } catch (error) {
        console.warn("Error fetching order ID from contract:", error);

        if (
          auction?.parties?.orderId &&
          auction.parties.orderId !== ethers.constants.HashZero
        ) {
          tempOrderId = auction.parties.orderId;
          console.log("Using order ID from auction data:", tempOrderId);
        } else {
          tempOrderId =
            "0x6d17bb0a0b4112c91f0b6039c9e4272c914d8081991e623e62f019f70bcdfae3";
        }
      }

      const tempOriginData =
        "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000019661d036d4e590948b9c00eef3807b88fbfa8e100000000000000000000000019661d036d4e590948b9c00eef3807b88fbfa8e100000000000000000000000030e9b6b0d161cbd5ff8cf904ff4fa43ce66ac346000000000000000000000000d0a9c6e7ff012f22ba52038f9727b50e16466176000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000002a70000000000000000000000000000000000000000000000000000000000aa36a700000000000000000000000000000000000000000000000000000000000013fb00000000000000000000000094aa7d7a4e249ca9a12a834cec057e91f886b92a0000000000000000000000000000000000000000000000000000000067f2819000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000000";

      console.log("Setting modal data:", {
        auction,
        orderId: tempOrderId,
        originData: tempOriginData.substring(0, 50) + "...", // Log truncated for readability
      });

      // Set the state values and show the modal
      setSelectedAuction(auction);
      setOrderId(tempOrderId);
      setOriginData(tempOriginData);
      setShowWinModal(true);
    } catch (error) {
      console.error("Error in handleBidSuccess:", error);
    }
  }, []);

  // Update the testWinModal function to use the same approach
  const testWinModal = useCallback(() => {
    if (auctions.length > 0) {
      console.log("Testing modal with auction:", auctions[0]);

      // Create a copy of the auction with network information
      const testAuction = {
        ...auctions[0],
        network: {
          ...getNetworkById(auctions[0].network),
          contracts: {
            dutchAuction:
              process.env.NEXT_PUBLIC_SETTLER_ADDRESS ||
              "0x94AA7d7A4e249ca9A12A834CeC057e91F886B92a",
          },
        },
      };

      // Call handleBidSuccess with the test auction to use the same logic
      handleBidSuccess(testAuction);
    } else {
      console.log("No auctions available for testing");
      setError(
        "No auctions available for testing. Please wait for auctions to load."
      );
    }
  }, [auctions, handleBidSuccess]);

  // Update the handlePlaceBid function to properly call handleBidSuccess
  const handlePlaceBid = useCallback(
    async (auctionId, networkId) => {
      if (!signer || !contracts[networkId]) {
        setError("Please connect your wallet first");
        return;
      }

      try {
        setPlacingBid(auctionId);
        setError(null);
        setTxHash("");

        const contractWithSigner = contracts[networkId].connect(signer);
        const tx = await contractWithSigner.placeBid(auctionId, {
          gasLimit: 500000,
        });

        const receipt = await tx.wait();
        setTxHash(receipt.transactionHash);

        // Update just this auction
        const updatedAuction = await fetchAuctionDetails(auctionId, networkId);
        if (updatedAuction) {
          setAuctions((prevAuctions) =>
            prevAuctions.map((auction) =>
              auction.id === auctionId && auction.network === networkId
                ? updatedAuction
                : auction
            )
          );

          // Show the win modal after successful bid
          console.log("Bid placed successfully, showing win modal");
          handleBidSuccess(updatedAuction);
        }
      } catch (error) {
        console.error("Error placing bid:", error);
        setError(error.message || "Failed to place bid");
      } finally {
        setPlacingBid(null);
      }
    },
    [signer, contracts, fetchAuctionDetails, handleBidSuccess]
  );

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setSigner(web3Provider.getSigner());
      setWalletConnected(true);

      const { chainId } = await web3Provider.getNetwork();

      // Check if connected to a supported network
      const connectedNetwork = SUPPORTED_NETWORKS.find(
        (network) => network.chainId === chainId
      );

      if (!connectedNetwork) {
        setNetworkError(`Please switch to one of the supported networks`);
      } else {
        setNetworkError(null);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Failed to connect wallet");
    }
  };

  // Switch network
  const switchNetwork = async (chainId) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      setNetworkError(null);
    } catch (error) {
      console.error("Error switching network:", error);
      setError("Failed to switch network");
    }
  };

  // Replace the entire useEffect for initial fetch and periodic updates with this:

  // Initial fetch when contracts or network changes
  useEffect(() => {
    if (!contracts || Object.keys(contracts).length === 0) return;

    // Clear existing auctions when changing networks
    setAuctions([]);
    setLoading(true);

    const doFetchAuctions = async () => {
      try {
        await fetchAuctions();
      } finally {
        setLoading(false);
      }
    };

    doFetchAuctions();

    // Clean up any intervals when component unmounts or dependencies change
    return () => {
      // No intervals to clean up on initial load
    };
  }, [contracts, selectedNetwork]); // Only depend on contracts and selectedNetwork

  // Separate effect for auto-refresh
  useEffect(() => {
    if (!contracts || Object.keys(contracts).length === 0 || !autoRefresh)
      return;

    console.log("Setting up auto-refresh intervals");

    // Set up auto-refresh intervals with staggered timing
    const priceInterval = setInterval(() => {
      // Only update prices if we have auctions and the page is visible
      if (auctions.length > 0 && document.visibilityState === "visible") {
        updateAuctionPrices().catch((err) => {
          console.error("Error in price update interval:", err);
        });
      }
    }, 15000);

    const auctionInterval = setInterval(() => {
      // Only fetch auctions if the page is visible
      if (document.visibilityState === "visible") {
        fetchAuctions().catch((err) => {
          console.error("Error in auction refresh interval:", err);
        });
      }
    }, 60000);

    // Add visibility change listener to pause updates when tab is not visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab is visible, resuming updates");
      } else {
        console.log("Tab is hidden, pausing updates");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up intervals when component unmounts or dependencies change
    return () => {
      clearInterval(priceInterval);
      clearInterval(auctionInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      console.log("Cleared auto-refresh intervals");
    };
  }, [
    contracts,
    autoRefresh,
    auctions.length,
    updateAuctionPrices,
    fetchAuctions,
  ]);

  // Handle network selection
  const handleNetworkSelectFn = useCallback(
    (networkId) => {
      setSelectedNetwork(networkId);
      setShowNetworkSelector(false);
      setCurrentPage(1);
      setLoading(true);
      setAuctions([]);

      // Fetch auctions for the selected network
      setTimeout(() => {
        fetchAuctions();
      }, 100);
    },
    [fetchAuctions]
  );

  // Calculate network stats
  const networkStats = useMemo(() => {
    const stats = { all: auctions.length };

    SUPPORTED_NETWORKS.forEach((network) => {
      stats[network.id] = auctions.filter(
        (a) => a.network === network.id
      ).length;
    });

    return stats;
  }, [auctions]);

  // Filter and sort auctions
  const filteredAuctions = useMemo(() => {
    return auctions
      .filter((auction) => {
        // Network filter
        if (selectedNetwork !== "all" && auction.network !== selectedNetwork) {
          return false;
        }

        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const auctionId = auction.id.toString();
          const sourceSymbol =
            auction.tokenInfo.sourceSymbol?.toLowerCase() || "";
          const destSymbol = auction.tokenInfo.destSymbol?.toLowerCase() || "";

          if (
            !auctionId.includes(searchLower) &&
            !sourceSymbol.includes(searchLower) &&
            !destSymbol.includes(searchLower)
          ) {
            return false;
          }
        }

        // Status filter
        if (statusFilter !== "all") {
          const now = Math.floor(Date.now() / 1000);
          const startTime = auction.timeInfo.startTime.toNumber();
          const endTime = auction.timeInfo.endTime.toNumber();
          const hasWinner =
            auction.bidInfo.winner !== ethers.constants.AddressZero;

          switch (statusFilter) {
            case "active":
              if (
                now < startTime ||
                now > endTime ||
                auction.bidInfo.settled ||
                hasWinner
              ) {
                return false;
              }
              break;
            case "upcoming":
              if (now >= startTime) {
                return false;
              }
              break;
            case "ended":
              if (now <= endTime || auction.bidInfo.settled) {
                return false;
              }
              break;
            case "settled":
              if (!auction.bidInfo.settled) {
                return false;
              }
              break;
            case "bidPlaced":
              if (!hasWinner) {
                return false;
              }
              break;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const now = Math.floor(Date.now() / 1000);
        const isActiveA =
          now >= a.timeInfo.startTime.toNumber() &&
          now <= a.timeInfo.endTime.toNumber();
        const isActiveB =
          now >= b.timeInfo.startTime.toNumber() &&
          now <= b.timeInfo.endTime.toNumber();

        switch (sortOrder) {
          case "endingSoon":
            if (isActiveA && !isActiveB) return -1;
            if (!isActiveA && isActiveB) return 1;
            return (
              a.timeInfo.endTime.toNumber() - b.timeInfo.endTime.toNumber()
            );
          case "newest":
            return (
              b.timeInfo.startTime.toNumber() - a.timeInfo.startTime.toNumber()
            );
          case "highestPrice":
            const priceA = a.currentPrice ? a.currentPrice.toNumber() : 0;
            const priceB = b.currentPrice ? b.currentPrice.toNumber() : 0;
            return priceB - priceA;
          default:
            return 0;
        }
      });
  }, [
    auctions,
    selectedNetwork,
    searchTerm,
    statusFilter,
    sortOrder,
    lastUpdate,
  ]);

  // Pagination
  const paginatedAuctions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAuctions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAuctions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);

  // Back to network selection
  const handleBackToNetworkSelection = () => {
    setShowNetworkSelector(true);
  };

  // Update the handleNetworkSelect function to avoid triggering multiple state updates
  // Replace the entire handleNetworkSelect function with this:

  // Handle network selection
  const handleNetworkSelect = useCallback((networkId) => {
    setSelectedNetwork(networkId);
    setShowNetworkSelector(false);
    setCurrentPage(1);

    // We'll let the useEffect handle the loading state and fetching
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center pt-32 pb-20 px-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            Dutch Auctions
          </h1>
          <p className="text-xl text-gray-300">
            Bid on cross-chain bridge auctions and win by placing the best bids
          </p>
        </div>

        {/* Missing Environment Variables Warning */}

        {/* Network Selection */}
        <AnimatePresence mode="wait">
          {showNetworkSelector ? (
            <motion.div
              key="network-selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NetworkSelector
                selectedNetwork={selectedNetwork}
                onSelectNetwork={handleNetworkSelect}
                stats={networkStats}
              />
            </motion.div>
          ) : (
            <motion.div
              key="auctions-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Network Error */}
              {networkError && (
                <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-900/30 rounded-xl flex items-center gap-3 text-yellow-400">
                  <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-base">{networkError}</span>
                  </div>
                  <div className="flex gap-2">
                    {SUPPORTED_NETWORKS.map((network) => (
                      <Button
                        key={network.id}
                        onClick={() => switchNetwork(network.chainId)}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white"
                        size="sm"
                      >
                        Switch to {network.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-col gap-4 mb-8">
                {/* Back to Networks & Connect Wallet */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <Button
                    onClick={handleBackToNetworkSelection}
                    variant="outline"
                    className="bg-slate-800/70 border-blue-900/30 text-blue-400 hover:bg-slate-700/70"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Networks
                  </Button>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="auto-refresh"
                        checked={autoRefresh}
                        onCheckedChange={setAutoRefresh}
                      />
                      <Label htmlFor="auto-refresh" className="text-gray-300">
                        Auto Refresh
                      </Label>
                    </div>

                    <Button
                      onClick={fetchAuctions}
                      variant="outline"
                      className="bg-slate-800/70 border-blue-900/30 text-blue-400 hover:bg-slate-700/70"
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4 mr-2",
                          loading && "animate-spin"
                        )}
                      />
                      {loading ? "Refreshing..." : "Refresh"}
                    </Button>

                    <Button
                      onClick={connectWallet}
                      className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-xl"
                    >
                      {walletConnected ? "Wallet Connected" : "Connect Wallet"}
                    </Button>
                  </div>
                </div>

                {/* Network Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/70 border border-blue-900/30 rounded-xl p-4 flex flex-wrap justify-around"
                >
                  <div className="text-center px-4">
                    <p className="text-gray-400 text-sm">Total Auctions</p>
                    <p className="text-2xl font-bold text-white">
                      {networkStats.all}
                    </p>
                  </div>
                  {SUPPORTED_NETWORKS.map((network) => (
                    <div
                      key={network.id}
                      className="text-center px-4 flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: network.color }}
                      ></div>
                      <div>
                        <p className="text-gray-400 text-sm">{network.name}</p>
                        <p className="text-xl font-bold text-white">
                          {networkStats[network.id] || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search by ID or token..."
                      className="pl-10 bg-slate-800/70 border-blue-900/30 text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-slate-800/70 border-blue-900/30 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-blue-900/30 text-white">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                      <SelectItem value="bidPlaced">Bid Placed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="bg-slate-800/70 border-blue-900/30 text-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-blue-900/30 text-white">
                      <SelectItem value="endingSoon">Ending Soon</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="highestPrice">
                        Highest Price
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-900/30 rounded-xl flex items-center gap-3 text-red-400">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-base">{error}</span>
                </div>
              )}

              {/* Transaction Hash */}
              {txHash && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-900/30 rounded-xl">
                  <div className="flex items-center gap-3 text-green-400 mb-2">
                    <div className="h-3 w-3 bg-green-400 rounded-full"></div>
                    <span className="text-base font-medium">
                      Bid Placed Successfully
                    </span>
                  </div>
                  <div className="text-gray-300 text-sm break-all">
                    <span className="text-gray-400">Tx Hash: </span>
                    <a
                      href={`https://explorer.testnet.citrea.xyz/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {txHash}
                    </a>
                  </div>
                </div>
              )}

              {/* Auctions Grid */}
              {loading && paginatedAuctions.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                    <p className="text-xl text-gray-300">Loading auctions...</p>
                  </div>
                </div>
              ) : paginatedAuctions.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedAuctions.map((auction) => (
                      <AuctionCard
                        key={`${auction.id}-${auction.network}`}
                        auction={auction}
                        onPlaceBid={handlePlaceBid}
                        isPlacingBid={placingBid === auction.id}
                        networkError={networkError}
                        network={auction.network}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                          className="bg-slate-800/70 border-blue-900/30 text-white"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <span className="text-gray-300 px-4">
                          Page {currentPage} of {totalPages}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="bg-slate-800/70 border-blue-900/30 text-white"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-blue-900/20">
                  <div className="flex flex-col items-center gap-4">
                    <XCircle className="h-16 w-16 text-gray-500" />
                    <p className="text-2xl text-gray-300">
                      No auctions available
                    </p>
                    <p className="text-gray-400">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Check back later for new auctions"}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Win Auction Modal */}
      <WinAuctionModal
        isOpen={showWinModal}
        onClose={() => setShowWinModal(false)}
        auction={selectedAuction}
        orderId={orderId}
        originData={originData}
        signer={signer}
        onSuccess={() => {
          // Refresh auctions after successful completion
          fetchAuctions();
        }}
      />
    </div>
  );
}
