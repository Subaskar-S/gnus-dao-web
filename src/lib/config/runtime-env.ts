'use client'

/**
 * Runtime Environment Variable Loader
 * Loads environment variables at runtime for client-side components
 */

interface RuntimeEnv {
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string
  NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: string
  NEXT_PUBLIC_ETHEREUM_RPC_URL: string
  NEXT_PUBLIC_BASE_RPC_URL: string
  NEXT_PUBLIC_POLYGON_RPC_URL: string
  NEXT_PUBLIC_SKALE_RPC_URL: string
}

// Cache for runtime environment variables
let runtimeEnvCache: RuntimeEnv | null = null
let isLoading = false
let loadPromise: Promise<RuntimeEnv> | null = null

/**
 * Load environment variables at runtime
 * This works by checking multiple sources in order of priority
 */
async function loadRuntimeEnvironment(): Promise<RuntimeEnv> {
  if (runtimeEnvCache) {
    return runtimeEnvCache
  }

  if (isLoading && loadPromise) {
    return loadPromise
  }

  isLoading = true
  loadPromise = new Promise<RuntimeEnv>(async (resolve, reject) => {
    try {
      // Method 1: Try to get from build-time environment (works in development)
      const buildTimeEnv = {
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: process.env.NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS,
        NEXT_PUBLIC_ETHEREUM_RPC_URL: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
        NEXT_PUBLIC_BASE_RPC_URL: process.env.NEXT_PUBLIC_BASE_RPC_URL,
        NEXT_PUBLIC_POLYGON_RPC_URL: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
        NEXT_PUBLIC_SKALE_RPC_URL: process.env.NEXT_PUBLIC_SKALE_RPC_URL,
      }

      // Check if we have all required variables from build time
      if (buildTimeEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID && 
          buildTimeEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID !== 'build-placeholder' &&
          buildTimeEnv.NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS) {
        
        console.log('[RuntimeEnv] Using build-time environment variables')
        runtimeEnvCache = buildTimeEnv as RuntimeEnv
        isLoading = false
        resolve(runtimeEnvCache)
        return
      }

      // Method 2: Try to fetch from runtime config endpoint (for Cloudflare Pages)
      try {
        console.log('[RuntimeEnv] Attempting to fetch runtime configuration...')
        const response = await fetch('/api/config', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (response.ok) {
          const runtimeConfig = await response.json()
          console.log('[RuntimeEnv] Successfully loaded runtime configuration')
          runtimeEnvCache = runtimeConfig
          isLoading = false
          resolve(runtimeEnvCache!)
          return
        }
      } catch (fetchError) {
        console.log('[RuntimeEnv] Runtime config endpoint not available, using fallback')
      }

      // Method 3: Use hardcoded fallback values for production
      console.log('[RuntimeEnv] Using hardcoded fallback configuration')
      const fallbackEnv: RuntimeEnv = {
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: '805f6520f2f2934352c65fe6bd70d15d',
        NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: '0x57AE78C65F7Dd6d158DE9F4cA9CCeaA98C988199',
        NEXT_PUBLIC_ETHEREUM_RPC_URL: 'https://eth.llamarpc.com',
        NEXT_PUBLIC_BASE_RPC_URL: 'https://mainnet.base.org',
        NEXT_PUBLIC_POLYGON_RPC_URL: 'https://polygon.llamarpc.com',
        NEXT_PUBLIC_SKALE_RPC_URL: 'https://mainnet.skalenodes.com/v1/green-giddy-denebola',
      }

      runtimeEnvCache = fallbackEnv
      isLoading = false
      resolve(runtimeEnvCache)

    } catch (error) {
      console.error('[RuntimeEnv] Failed to load runtime environment:', error)
      isLoading = false
      reject(error)
    }
  })

  return loadPromise
}

/**
 * Get runtime environment variables
 * Returns cached values if available, otherwise loads them
 */
export async function getRuntimeEnv(): Promise<RuntimeEnv> {
  return loadRuntimeEnvironment()
}

/**
 * Get a specific runtime environment variable
 */
export async function getRuntimeEnvVar(key: keyof RuntimeEnv): Promise<string> {
  const env = await getRuntimeEnv()
  return env[key]
}

/**
 * Check if runtime environment is loaded
 */
export function isRuntimeEnvLoaded(): boolean {
  return runtimeEnvCache !== null
}

/**
 * Get cached runtime environment (synchronous)
 * Returns null if not loaded yet
 */
export function getCachedRuntimeEnv(): RuntimeEnv | null {
  return runtimeEnvCache
}

/**
 * Preload runtime environment
 * Call this early in the application lifecycle
 */
export function preloadRuntimeEnv(): Promise<RuntimeEnv> {
  return loadRuntimeEnvironment()
}

/**
 * Clear runtime environment cache
 * Useful for testing or forcing a reload
 */
export function clearRuntimeEnvCache(): void {
  runtimeEnvCache = null
  isLoading = false
  loadPromise = null
}
