/**
 * Network configuration for GNUS DAO multi-chain support
 * Focuses on low-cost and zero-gas networks for accessible governance
 */

import { getRpcUrl, getBackupRpcUrl, getContractAddress, getSepoliaRpcUrl } from './env'

export interface NetworkConfig {
  id: number
  name: string
  displayName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: {
    default: { http: string[] }
    public: { http: string[] }
  }
  blockExplorers: {
    default: { name: string; url: string }
  }
  testnet?: boolean
  gasless?: boolean
  lowCost?: boolean
  iconUrl?: string
  features: string[]
}

/**
 * Supported networks configuration
 * Priority: Low-cost and gasless networks first
 */
export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  // SKALE Europa Hub - Zero gas fees
  2046399126: {
    id: 2046399126,
    name: 'skale-europa',
    displayName: 'SKALE Europa Hub',
    nativeCurrency: {
      name: 'sFUEL',
      symbol: 'sFUEL',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [getRpcUrl('skale')] },
      public: { http: [getRpcUrl('skale')] },
    },
    blockExplorers: {
      default: { name: 'SKALE Explorer', url: 'https://elated-tan-skat.explorer.mainnet.skalenodes.com' },
    },
    gasless: true,
    features: ['zero-gas', 'fast-finality', 'ethereum-compatible'],
    iconUrl: '/networks/skale.svg',
  },

  // Base - Low-cost L2
  8453: {
    id: 8453,
    name: 'base',
    displayName: 'Base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [getRpcUrl('base')] },
      public: { http: [getRpcUrl('base')] },
    },
    blockExplorers: {
      default: { name: 'BaseScan', url: 'https://basescan.org' },
    },
    lowCost: true,
    features: ['low-cost', 'fast-finality', 'coinbase-backed'],
    iconUrl: '/networks/base.svg',
  },

  // Polygon - Low-cost with high adoption
  137: {
    id: 137,
    name: 'polygon',
    displayName: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [getRpcUrl('polygon')] },
      public: { http: [getRpcUrl('polygon')] },
    },
    blockExplorers: {
      default: { name: 'PolygonScan', url: 'https://polygonscan.com' },
    },
    lowCost: true,
    features: ['low-cost', 'high-adoption', 'defi-ecosystem'],
    iconUrl: '/networks/polygon.svg',
  },

  // Arbitrum One - L2 with good ecosystem
  42161: {
    id: 42161,
    name: 'arbitrum',
    displayName: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://arb1.arbitrum.io/rpc'] },
      public: { http: ['https://arb1.arbitrum.io/rpc'] },
    },
    blockExplorers: {
      default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
    },
    lowCost: true,
    features: ['low-cost', 'optimistic-rollup', 'ethereum-security'],
    iconUrl: '/networks/arbitrum.svg',
  },

  // Ethereum Mainnet - For high-value governance
  1: {
    id: 1,
    name: 'ethereum',
    displayName: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [getRpcUrl('ethereum')] },
      public: { http: [getRpcUrl('ethereum')] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://etherscan.io' },
    },
    features: ['mainnet', 'highest-security', 'maximum-decentralization'],
    iconUrl: '/networks/ethereum.svg',
  },

  // Testnets for development
  11155111: {
    id: 11155111,
    name: 'sepolia',
    displayName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [getSepoliaRpcUrl()] },
      public: { http: [getSepoliaRpcUrl()] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    },
    testnet: true,
    features: ['testnet', 'development', 'free-eth'],
    iconUrl: '/networks/ethereum.svg',
  },

  // Base Sepolia Testnet
  84532: {
    id: 84532,
    name: 'base-sepolia',
    displayName: 'Base Sepolia',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://sepolia.base.org'] },
      public: { http: ['https://sepolia.base.org'] },
    },
    blockExplorers: {
      default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
    },
    testnet: true,
    features: ['testnet', 'low-cost', 'base-l2'],
    iconUrl: '/networks/base.svg',
  },
}

/**
 * Default network for new users (prioritize gasless/low-cost)
 */
export const DEFAULT_NETWORK_ID = 2046399126 // SKALE Europa Hub (gasless)

/**
 * Fallback network if default is not available
 */
export const FALLBACK_NETWORK_ID = 8453 // Base (low-cost)

/**
 * Networks sorted by preference (gasless first, then low-cost)
 */
export const NETWORK_PRIORITY = [
  2046399126, // SKALE Europa Hub (gasless)
  8453,       // Base (low-cost)
  137,        // Polygon (low-cost)
  42161,      // Arbitrum One (low-cost)
  1,          // Ethereum (mainnet)
  11155111,   // Sepolia (testnet)
  84532,      // Base Sepolia (testnet)
]

/**
 * Get network configuration by ID
 */
export function getNetworkConfig(networkId: number): NetworkConfig | undefined {
  return SUPPORTED_NETWORKS[networkId]
}

/**
 * Get all supported networks
 */
export function getAllNetworks(): NetworkConfig[] {
  return Object.values(SUPPORTED_NETWORKS)
}

/**
 * Get networks by feature
 */
export function getNetworksByFeature(feature: string): NetworkConfig[] {
  return getAllNetworks().filter(network => network.features.includes(feature))
}

/**
 * Get gasless networks
 */
export function getGaslessNetworks(): NetworkConfig[] {
  return getAllNetworks().filter(network => network.gasless)
}

/**
 * Get low-cost networks
 */
export function getLowCostNetworks(): NetworkConfig[] {
  return getAllNetworks().filter(network => network.lowCost)
}

/**
 * Get testnet networks
 */
export function getTestnetNetworks(): NetworkConfig[] {
  return getAllNetworks().filter(network => network.testnet)
}

/**
 * Get mainnet networks
 */
export function getMainnetNetworks(): NetworkConfig[] {
  return getAllNetworks().filter(network => !network.testnet)
}
