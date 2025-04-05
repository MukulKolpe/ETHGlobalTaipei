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
import { SUPPORTED_NETWORKS, TOKEN_DEFINITIONS } from "./constants";

// Helper function to get network by chain ID
const getNetworkById = (id) => {
  return SUPPORTED_NETWORKS.find((network) => network.id === id);
};

// Helper function to fetch token details from any chain
const fetchTokenDetails = async (address, rpcUrl) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      address,
      [
        "function symbol() view returns (string)",
        "function name() view returns (string)",
        "function decimals() view returns (uint8)",
      ],
      provider
    );

    const [symbol, name, decimals] = await Promise.all([
      contract.symbol().catch(() => "???"),
      contract.name().catch(() => "Unknown Token"),
      contract.decimals().catch(() => 18),
    ]);

    return { symbol, name, decimals };
  } catch (error) {
    console.error("Error fetching token details:", error);
    return { symbol: "???", name: "Unknown Token", decimals: 18 };
  }
};

// Network Selection Component
const NetworkSelector = ({ selectedNetwork, onSelectNetwork, stats }) => {
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
};

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

    const getTokenDisplay = (address) => {
      return (
        TOKEN_DEFINITIONS[address] || {
          icon: "/placeholder.svg",
          color: "#6B7280",
          name: "Unknown",
          network: "Unknown Network",
        }
      );
    };

    const sourceToken = getTokenDisplay(auction.tokenInfo.sourceToken);
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

  // Initialize Web3 providers and contracts for all networks
  useEffect(() => {
    const initializeProviders = async () => {
      try {
        const newProviders = {};
        const newContracts = {};

        // Initialize providers for all networks
        for (const network of SUPPORTED_NETWORKS) {
          const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
          newProviders[network.id] = provider;

          const dutchAuctionContract = new ethers.Contract(
            network.contracts.dutchAuction,
            DUTCH_AUCTION_ABI,
            provider
          );
          newContracts[network.id] = dutchAuctionContract;
        }

        setProviders(newProviders);
        setContracts(newContracts);

        // Initialize web3 provider for wallet connection
        if (window.ethereum) {
          const web3Provider = new ethers.providers.Web3Provider(
            window.ethereum
          );
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          setWalletConnected(accounts.length > 0);

          if (accounts.length > 0) {
            setSigner(web3Provider.getSigner());

            const chainId = await web3Provider
              .getNetwork()
              .then((net) => net.chainId);

            // Find if the connected chain matches any of our supported networks
            const connectedNetwork = SUPPORTED_NETWORKS.find(
              (network) => network.chainId === chainId
            );

            if (!connectedNetwork) {
              setNetworkError(`Please switch to one of the supported networks`);
            } else {
              setNetworkError(null);
            }
          }
        }
      } catch (err) {
        console.error("Failed to initialize providers:", err);
        setError("Failed to connect to blockchain");
      }
    };

    initializeProviders();
  }, []);

  // Fetch auction details from a specific network
  const fetchAuctionDetails = useCallback(
    async (auctionId, networkId) => {
      const contract = contracts[networkId];
      const provider = providers[networkId];

      if (!contract || !provider) return null;

      try {
        const [tokenInfo, timeInfo, bidInfo, parties] = await Promise.all([
          contract.auctionTokens(auctionId),
          contract.auctionTimes(auctionId),
          contract.auctionBids(auctionId),
          contract.auctionParties(auctionId),
        ]);

        if (
          !tokenInfo ||
          !timeInfo ||
          !bidInfo ||
          !parties ||
          parties.user === ethers.constants.AddressZero
        ) {
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
        };

        const bidInfoCopy = {
          winner: bidInfo.winner,
          winningBid: bidInfo.winningBid,
          settled: bidInfo.settled,
        };

        const partiesCopy = {
          user: parties.user,
          settler: parties.settler,
        };

        let currentPrice;
        const now = Math.floor(Date.now() / 1000);
        if (
          now >= timeInfoCopy.startTime.toNumber() &&
          now <= timeInfoCopy.endTime.toNumber()
        ) {
          try {
            currentPrice = await contract.getCurrentPrice(auctionId);
          } catch (error) {
            console.warn(
              `Could not get current price for auction ${auctionId}`
            );
          }
        }

        // Fetch token details
        const [sourceSymbol, destSymbol, sourceDecimals, destDecimals] =
          await Promise.all([
            fetchTokenDetails(
              tokenInfoCopy.sourceToken,
              providers[networkId].connection.url
            )
              .then((details) => details.symbol)
              .catch(() => "???"),
            fetchTokenDetails(
              tokenInfoCopy.destToken,
              providers[networkId].connection.url
            )
              .then((details) => details.symbol)
              .catch(() => "???"),
            fetchTokenDetails(
              tokenInfoCopy.sourceToken,
              providers[networkId].connection.url
            )
              .then((details) => details.decimals)
              .catch(() => 18),
            fetchTokenDetails(
              tokenInfoCopy.destToken,
              providers[networkId].connection.url
            )
              .then((details) => details.decimals)
              .catch(() => 18),
          ]);

        // Add token details to the copy
        tokenInfoCopy.sourceSymbol = sourceSymbol;
        tokenInfoCopy.destSymbol = destSymbol;
        tokenInfoCopy.sourceDecimals = sourceDecimals;
        tokenInfoCopy.destDecimals = destDecimals;

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

      const priceUpdates = await Promise.all(
        activeAuctions.map(async (auction) => {
          try {
            const contract = contracts[auction.network];
            if (!contract) return null;

            const currentPrice = await contract.getCurrentPrice(auction.id);
            return {
              id: auction.id,
              network: auction.network,
              currentPrice,
            };
          } catch (error) {
            console.warn(`Failed to update price for auction ${auction.id}`);
            return null;
          }
        })
      );

      setAuctions((prevAuctions) => {
        const updatedAuctions = [...prevAuctions];
        priceUpdates.forEach((update) => {
          if (update) {
            const index = updatedAuctions.findIndex(
              (a) => a.id === update.id && a.network === update.network
            );
            if (index !== -1) {
              updatedAuctions[index] = {
                ...updatedAuctions[index],
                currentPrice: update.currentPrice,
              };
            }
          }
        });
        return updatedAuctions;
      });

      setLastUpdate(Date.now());
    } catch (error) {
      console.error("Error updating auction prices:", error);
    }
  }, [contracts, auctions]);

  // Fetch auctions from all networks or a specific network
  const fetchAuctions = useCallback(async () => {
    if (!contracts || Object.keys(contracts).length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const networksToFetch =
        selectedNetwork === "all"
          ? SUPPORTED_NETWORKS.map((n) => n.id)
          : [selectedNetwork];

      const allAuctions = [];

      for (const networkId of networksToFetch) {
        const contract = contracts[networkId];
        if (!contract) continue;

        try {
          const nextAuctionId = await contract.nextAuctionId();

          const auctionPromises = [];
          for (let i = 0; i < nextAuctionId; i++) {
            auctionPromises.push(fetchAuctionDetails(i, networkId));
          }

          const networkAuctions = await Promise.all(auctionPromises);

          // Filter out null results
          const validAuctions = networkAuctions.filter(
            (auction) => auction !== null
          );
          allAuctions.push(...validAuctions);
        } catch (error) {
          console.error(`Error fetching auctions from ${networkId}:`, error);
        }
      }

      setAuctions(allAuctions);

      // Update prices for active auctions
      await updateAuctionPrices();
    } catch (error) {
      console.error("Error fetching auctions:", error);
      setError("Failed to load auctions");
    } finally {
      setLoading(false);
    }
  }, [contracts, selectedNetwork, fetchAuctionDetails, updateAuctionPrices]);

  // Handle bid placement
  const handlePlaceBid = useCallback(
    async (auctionId, networkId) => {
      if (!signer || !contracts[networkId]) {
        setError("Please connect your wallet first");
        return;
      }

      try {
        setPlacingBid(auctionId);
        setError(null);

        const contractWithSigner = contracts[networkId].connect(signer);
        const tx = await contractWithSigner.placeBid(auctionId, {
          gasLimit: 500000,
        });

        await tx.wait();
        setTxHash(tx.hash);

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
        }
      } catch (error) {
        console.error("Error placing bid:", error);
        setError(error.message || "Failed to place bid");
      } finally {
        setPlacingBid(null);
      }
    },
    [signer, contracts, fetchAuctionDetails]
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

  // Initial fetch and periodic updates
  useEffect(() => {
    if (contracts && Object.keys(contracts).length > 0) {
      fetchAuctions();

      // Set up auto-refresh if enabled
      let priceInterval, auctionInterval;

      if (autoRefresh) {
        priceInterval = setInterval(updateAuctionPrices, 15000);
        auctionInterval = setInterval(fetchAuctions, 60000);
      }

      return () => {
        if (priceInterval) clearInterval(priceInterval);
        if (auctionInterval) clearInterval(auctionInterval);
      };
    }
  }, [contracts, fetchAuctions, updateAuctionPrices, autoRefresh]);

  // Handle network selection
  const handleNetworkSelect = (networkId) => {
    setSelectedNetwork(networkId);
    setShowNetworkSelector(false);
    setCurrentPage(1);
    setLoading(true);

    // Fetch auctions for the selected network
    setTimeout(() => {
      fetchAuctions();
    }, 100);
  };

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
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
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
                        key={`${auction.id}-${auction.network}-${lastUpdate}`}
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
    </div>
  );
}
