'use client'

import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { getEnv } from '@/lib/config/env'

// GNUS DAO WalletConnect configuration
const getProjectId = () => {
  try {
    const env = getEnv()
    return env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  } catch (error) {
    throw new Error('WalletConnect project ID is not configured. Please check your environment variables.')
  }
}

// Global WalletConnect provider
let walletConnectProvider: any = null
let isInitialized = false

// Debug logging - only in development
const debug = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[WalletConnect Debug] ${message}`, ...args)
  }
}

/**
 * Initialize WalletConnect v2 with modern configuration
 */
export async function initializeWalletConnect() {
  if (typeof window === 'undefined') {
    debug('Window is undefined, skipping initialization')
    return null
  }

  // Get validated project ID
  const projectId = getProjectId()
  debug('Using project ID:', projectId)

  // Return existing instance if already initialized and connected
  if (walletConnectProvider && isInitialized && walletConnectProvider.connected) {
    debug('Using existing connected provider')
    return walletConnectProvider
  }

  try {
    debug('Initializing WalletConnect with validated configuration')

    // Clean up any existing provider
    if (walletConnectProvider) {
      try {
        debug('Cleaning up existing provider')
        await walletConnectProvider.disconnect()
      } catch (e) {
        debug('Error cleaning up existing provider:', e)
      }
    }

    debug('Creating new EthereumProvider instance...')

    // Create WalletConnect provider with built-in modal
    walletConnectProvider = await EthereumProvider.init({
      projectId,
      chains: [8453], // Base network as default
      optionalChains: [1351057110, 137, 42161, 1], // SKALE, Polygon, Arbitrum, Ethereum
      showQrModal: true, // Use built-in modal
      qrModalOptions: {
        themeMode: 'dark',
        themeVariables: {
          '--wcm-accent-color': '#3b82f6',
          '--wcm-background-color': '#1a1a1a',
          '--wcm-container-border-radius': '8px'
        },
        enableExplorer: true,
        explorerRecommendedWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
        ]
      },
      metadata: {
        name: 'GNUS DAO Governance',
        description: 'Decentralized governance platform for GNUS DAO community',
        url: 'https://gnus-dao.org',
        icons: ['/logo.png']
      }
    })

    debug('Provider initialized successfully:', walletConnectProvider)
    isInitialized = true
    return walletConnectProvider
  } catch (error) {
    debug('Failed to initialize WalletConnect:', error)
    isInitialized = false
    walletConnectProvider = null
    throw error
  }
}

/**
 * Get the WalletConnect provider
 */
export function getWalletConnectProvider() {
  return walletConnectProvider
}

/**
 * Open the WalletConnect modal
 */
export async function openWalletConnect() {
  try {
    debug('Opening modal...')

    const provider = await initializeWalletConnect()
    if (!provider) {
      throw new Error('Failed to initialize WalletConnect provider')
    }

    debug('Provider initialized, checking connection state...')
    debug('Provider connected:', provider.connected)
    debug('Provider accounts:', provider.accounts)
    debug('Provider chainId:', provider.chainId)

    // If already connected, return the provider
    if (provider.connected && provider.accounts?.length > 0) {
      debug('Already connected, returning existing connection')
      return provider
    }

    debug('Enabling provider (this should show the QR modal)...')
    debug('Provider showQrModal setting should be true')

    // Enable the provider (this will show the QR modal)
    try {
      const accounts = await provider.enable()
      debug('Provider enabled successfully, accounts:', accounts)

      if (accounts && accounts.length > 0) {
        debug('WalletConnect connection successful with accounts:', accounts)
        return { provider, accounts }
      }

      debug('No accounts returned from enable, trying alternative connection method...')
      // Try alternative connection method
      await provider.connect()
      if (provider.accounts && provider.accounts.length > 0) {
        debug('Alternative connection successful, accounts:', provider.accounts)
        return { provider, accounts: provider.accounts }
      }
    } catch (enableError) {
      debug('Enable failed, trying connect method:', enableError)
      // Fallback to connect method
      try {
        await provider.connect()
        if (provider.accounts && provider.accounts.length > 0) {
          debug('Connect method successful, accounts:', provider.accounts)
          return { provider, accounts: provider.accounts }
        }
      } catch (connectError) {
        debug('Connect method also failed:', connectError)
        throw enableError
      }
    }

    throw new Error('No accounts returned from WalletConnect')
  } catch (error) {
    debug('Failed to open WalletConnect:', error)

    // Reset provider state on error
    walletConnectProvider = null
    isInitialized = false

    throw error
  }
}

/**
 * Close the WalletConnect modal
 */
export function closeWalletConnect() {
  // The modal closes automatically when connection is established or cancelled
}

/**
 * Get the current connection state
 */
export function getWalletConnectState() {
  if (!walletConnectProvider) return null

  return {
    isConnected: walletConnectProvider.connected || false,
    address: walletConnectProvider.accounts?.[0] || null,
    chainId: walletConnectProvider.chainId || null
  }
}

/**
 * Get the current account address
 */
export function getWalletConnectAddress(): string | null {
  if (!walletConnectProvider) return null
  return walletConnectProvider.accounts?.[0] || null
}

/**
 * Get the current chain ID
 */
export function getWalletConnectChainId(): number | null {
  if (!walletConnectProvider) return null
  return walletConnectProvider.chainId || null
}

/**
 * Switch to a specific network
 */
export async function switchWalletConnectNetwork(chainId: number) {
  if (!walletConnectProvider) {
    throw new Error('WalletConnect not initialized')
  }

  try {
    await walletConnectProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    })
  } catch (error) {
    console.error('Failed to switch network:', error)
    throw error
  }
}

/**
 * Disconnect from WalletConnect
 */
export async function disconnectWalletConnect() {
  if (!walletConnectProvider) return

  try {
    await walletConnectProvider.disconnect()
    walletConnectProvider = null
    isInitialized = false
  } catch (error) {
    console.error('Failed to disconnect:', error)
    throw error
  }
}

/**
 * Subscribe to WalletConnect events
 */
export function subscribeToWalletConnect(callback: (event: string, data: any) => void) {
  if (!walletConnectProvider) return () => {}

  const events = ['connect', 'disconnect', 'chainChanged', 'accountsChanged']

  events.forEach(event => {
    walletConnectProvider.on(event, (data: any) => callback(event, data))
  })

  return () => {
    events.forEach(event => {
      walletConnectProvider.removeAllListeners(event)
    })
  }
}
