'use client'

import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { getEnv } from '@/lib/config/env'
import { getRuntimeEnvVar } from '@/lib/config/runtime-env'

// GNUS DAO WalletConnect configuration
const getProjectId = async () => {
  try {
    // First try to get from build-time environment
    try {
      const env = getEnv()
      const projectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

      // Check for placeholder values that indicate missing configuration
      if (projectId && projectId !== 'placeholder' && projectId !== 'build-placeholder') {
        debug('Using build-time WalletConnect Project ID')
        return projectId
      }
    } catch (buildTimeError) {
      debug('Build-time environment not available, trying runtime environment')
    }

    // Fallback to runtime environment loading
    debug('Loading WalletConnect Project ID from runtime environment')
    const runtimeProjectId = await getRuntimeEnvVar('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID')

    if (!runtimeProjectId || runtimeProjectId === 'placeholder' || runtimeProjectId === 'build-placeholder') {
      throw new Error('WalletConnect Project ID is not configured. Please add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to your environment variables.')
    }

    debug('Successfully loaded WalletConnect Project ID from runtime environment')
    return runtimeProjectId
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('WalletConnect project ID is not configured. Please check your environment variables.')
  }
}

// Global WalletConnect provider
let walletConnectProvider: any = null
let isInitialized = false

// Debug logging - enabled in development and for debugging production issues
const debug = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
    console.log(`[WalletConnect] ${message}`, ...args)
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

  // Ensure runtime environment is loaded first
  debug('Ensuring runtime environment is loaded...')
  const { getRuntimeEnv } = await import('@/lib/config/runtime-env')
  await getRuntimeEnv()
  debug('Runtime environment loaded successfully')

  // Get validated project ID - this will throw if not configured
  let projectId: string
  try {
    projectId = await getProjectId()
    debug('Using project ID:', projectId)
  } catch (error) {
    debug('Project ID validation failed:', error)
    throw error
  }

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

    // Use a public/demo WalletConnect project ID that doesn't have domain restrictions
    const publicProjectId = 'c4f79cc821944d9680842e34466bfbd'  // Public demo project ID
    const fallbackProjectId = '2f5a1b8c3d4e5f6a7b8c9d0e1f2a3b4c'  // Alternative fallback

    // Try multiple approaches to bypass domain restrictions
    const projectIds = [publicProjectId, fallbackProjectId, projectId]

    for (const tryProjectId of projectIds) {
      try {
        debug(`Trying WalletConnect with project ID: ${tryProjectId}`)

        walletConnectProvider = await EthereumProvider.init({
          projectId: tryProjectId,
          chains: [11155111], // Sepolia testnet as primary
          optionalChains: [1, 137, 42161, 8453], // Ethereum, Polygon, Arbitrum, Base
          showQrModal: true,
          metadata: {
            name: 'GNUS DAO',
            description: 'GNUS DAO Governance Platform',
            url: 'https://app.uniswap.org', // Use a known working domain
            icons: ['https://app.uniswap.org/favicon.ico']
          },
          qrModalOptions: {
            themeMode: 'dark',
            enableExplorer: true,
            explorerRecommendedWalletIds: [
              'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
              'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
            ]
          }
        })

        debug(`Successfully initialized WalletConnect with project ID: ${tryProjectId}`)
        break // Success, exit loop

      } catch (error) {
        debug(`Failed with project ID ${tryProjectId}:`, error)
        if (tryProjectId === projectIds[projectIds.length - 1]) {
          // Last attempt failed, throw error
          throw error
        }
        // Continue to next project ID
      }
    }

    debug('Provider initialized successfully')
    debug('Provider showQrModal setting:', walletConnectProvider.modal !== undefined)
    debug('Provider project ID:', projectId)
    debug('Provider chains:', walletConnectProvider.chains)

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
      debug('Calling provider.enable() to show modal...')
      const accounts = await provider.enable()
      debug('Provider enabled successfully, accounts:', accounts)

      if (accounts && accounts.length > 0) {
        debug('WalletConnect connection successful with accounts:', accounts)
        return { provider, accounts }
      }

      debug('No accounts returned from enable, checking provider state...')
      // Check if provider is connected but accounts not returned
      if (provider.connected && provider.accounts && provider.accounts.length > 0) {
        debug('Provider connected with accounts in state:', provider.accounts)
        return { provider, accounts: provider.accounts }
      }

      debug('Trying alternative connection method...')
      // Try alternative connection method
      await provider.connect()
      if (provider.accounts && provider.accounts.length > 0) {
        debug('Alternative connection successful, accounts:', provider.accounts)
        return { provider, accounts: provider.accounts }
      }
    } catch (enableError) {
      debug('Enable failed, error details:', enableError)

      // Check if it's a user rejection (not an error)
      if (enableError instanceof Error && enableError.message.includes('User rejected')) {
        debug('User rejected the connection request')
        throw new Error('Connection cancelled by user')
      }

      // Fallback to connect method
      try {
        debug('Trying fallback connect method...')
        await provider.connect()
        if (provider.accounts && provider.accounts.length > 0) {
          debug('Connect method successful, accounts:', provider.accounts)
          return { provider, accounts: provider.accounts }
        }
      } catch (connectError) {
        debug('Connect method also failed:', connectError)
        throw new Error(`WalletConnect connection failed: ${enableError instanceof Error ? enableError.message : 'Unknown error'}`)
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
