import { ethers } from "ethers"

// Network definitions
export const SUPPORTED_NETWORKS = [
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
]

// Token definitions
export const TOKEN_DEFINITIONS = {
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
}

// Helper function to get token by address (for use in the page)
export const getTokenByAddress = (address) => {
  if (!address) return null

  // Normalize the address
  const normalizedAddress = address.toLowerCase()

  // Check each token definition
  for (const [tokenId, token] of Object.entries(TOKEN_DEFINITIONS)) {
    for (const [networkId, tokenAddress] of Object.entries(token.addresses)) {
      if (tokenAddress.toLowerCase() === normalizedAddress) {
        return {
          ...token,
          id: tokenId,
          networkId,
        }
      }
    }
  }

  // Return default if not found
  return {
    name: "Unknown",
    icon: "/placeholder.svg",
    color: "#6B7280",
  }
}

// Add mock data for testing when RPC fails
export const MOCK_AUCTIONS = [
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
]

