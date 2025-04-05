// Network definitions
export const SUPPORTED_NETWORKS = [
  {
    id: "ethereum",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    icon: "/assets/ethereum-logo.svg",
    color: "#627EEA",
    explorerUrl: "https://sepolia.etherscan.io",
    contracts: {
      dutchAuction: "0x21654dFbF44125271e87f71633ec1af17d0D685a",
      escrow: "0xCF1D0Bd7F6C2A8C05324d5D12fBa3E1eD2aa9451",
    },
  },
  {
    id: "rootstock",
    name: "Rootstock Testnet",
    chainId: 31,
    rpcUrl: "https://public-node.testnet.rsk.co",
    icon: "/assets/rootstock-logo.svg",
    color: "#FF9900",
    explorerUrl: "https://explorer.testnet.rsk.co",
    contracts: {
      dutchAuction: "0x21654dFbF44125271e87f71633ec1af17d0D685a",
      escrow: "0xCF1D0Bd7F6C2A8C05324d5D12fBa3E1eD2aa9451",
    },
  },
  {
    id: "citrea",
    name: "Citrea Testnet",
    chainId: 42069,
    rpcUrl: "https://rpc.testnet.citrea.xyz",
    icon: "/assets/t1-logo.svg",
    color: "#3B82F6",
    explorerUrl: "https://explorer.testnet.citrea.xyz",
    contracts: {
      dutchAuction: "0x21654dFbF44125271e87f71633ec1af17d0D685a",
      escrow: "0xCF1D0Bd7F6C2A8C05324d5D12fBa3E1eD2aa9451",
    },
  },
];

// Token definitions
export const TOKEN_DEFINITIONS = {
  "0x30E9b6B0d161cBd5Ff8cf904Ff4FA43Ce66AC346": {
    icon: "/assets/usdt-logo.svg",
    color: "#26A17B",
    name: "USDT",
    network: "Ethereum Sepolia (L1)",
  },
  "0xb6E3F86a5CE9ac318F54C9C7Bcd6eff368DF0296": {
    icon: "/assets/t1-logo.svg",
    color: "#3B82F6",
    name: "USDT",
    network: "t1 Devnet",
  },
};
