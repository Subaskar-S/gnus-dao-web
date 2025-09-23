import { z } from 'zod'

/**
 * Check if we're in static export mode (build time)
 */
const isStaticExport = process.env.STATIC_EXPORT === 'true' || process.env.NODE_ENV === 'production'

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid
 * More lenient during static export builds
 */
const envSchema = z.object({
  // WalletConnect Configuration
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: isStaticExport
    ? z.string().optional().default('placeholder')
    : z.string().min(1, 'WalletConnect Project ID is required'),

  // Application Configuration
  NEXT_PUBLIC_APP_NAME: z.string().default('GNUS DAO'),
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').default('https://dao.gnus.ai'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),

  // RPC URLs - Primary endpoints (optional during static export)
  NEXT_PUBLIC_ETHEREUM_RPC_URL: isStaticExport
    ? z.string().optional().default('https://eth.llamarpc.com')
    : z.string().url('Invalid Ethereum RPC URL'),
  NEXT_PUBLIC_BASE_RPC_URL: isStaticExport
    ? z.string().optional().default('https://mainnet.base.org')
    : z.string().url('Invalid Base RPC URL'),
  NEXT_PUBLIC_POLYGON_RPC_URL: isStaticExport
    ? z.string().optional().default('https://polygon-rpc.com')
    : z.string().url('Invalid Polygon RPC URL'),
  NEXT_PUBLIC_SKALE_RPC_URL: isStaticExport
    ? z.string().optional().default('https://mainnet.skalenodes.com/v1/elated-tan-skat')
    : z.string().url('Invalid SKALE RPC URL'),
  
  // RPC URLs - Backup endpoints (optional)
  NEXT_PUBLIC_ETHEREUM_RPC_URL_BACKUP: z.string().url().optional(),
  NEXT_PUBLIC_BASE_RPC_URL_BACKUP: z.string().url().optional(),
  NEXT_PUBLIC_POLYGON_RPC_URL_BACKUP: z.string().url().optional(),
  
  // API Keys (optional)
  NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().optional(),
  NEXT_PUBLIC_INFURA_API_KEY: z.string().optional(),

  // Testnet RPC URLs (optional - fallback to public endpoints)
  NEXT_PUBLIC_SEPOLIA_RPC_URL: z.string().url().optional(),
  
  // Contract Addresses
  NEXT_PUBLIC_ETHEREUM_GNUS_DAO_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum contract address').optional(),
  NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Sepolia contract address').optional(),
  NEXT_PUBLIC_BASE_GNUS_DAO_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Base contract address').optional(),
  NEXT_PUBLIC_POLYGON_GNUS_DAO_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Polygon contract address').optional(),
  NEXT_PUBLIC_SKALE_GNUS_DAO_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid SKALE contract address').optional(),
  
  // Development
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_TELEMETRY_DISABLED: z.string().optional(),
})

/**
 * Validated environment variables
 */
let validatedEnv: z.infer<typeof envSchema>

/**
 * Initialize and validate environment variables
 */
function initializeEnv(): z.infer<typeof envSchema> {
  try {
    const env = {
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
      NEXT_PUBLIC_ETHEREUM_RPC_URL: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
      NEXT_PUBLIC_BASE_RPC_URL: process.env.NEXT_PUBLIC_BASE_RPC_URL,
      NEXT_PUBLIC_POLYGON_RPC_URL: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
      NEXT_PUBLIC_SKALE_RPC_URL: process.env.NEXT_PUBLIC_SKALE_RPC_URL,
      NEXT_PUBLIC_ETHEREUM_RPC_URL_BACKUP: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL_BACKUP,
      NEXT_PUBLIC_BASE_RPC_URL_BACKUP: process.env.NEXT_PUBLIC_BASE_RPC_URL_BACKUP,
      NEXT_PUBLIC_POLYGON_RPC_URL_BACKUP: process.env.NEXT_PUBLIC_POLYGON_RPC_URL_BACKUP,
      NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      NEXT_PUBLIC_INFURA_API_KEY: process.env.NEXT_PUBLIC_INFURA_API_KEY,
      NEXT_PUBLIC_SEPOLIA_RPC_URL: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
      NEXT_PUBLIC_ETHEREUM_GNUS_DAO_ADDRESS: process.env.NEXT_PUBLIC_ETHEREUM_GNUS_DAO_ADDRESS,
      NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: process.env.NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS,
      NEXT_PUBLIC_BASE_GNUS_DAO_ADDRESS: process.env.NEXT_PUBLIC_BASE_GNUS_DAO_ADDRESS,
      NEXT_PUBLIC_POLYGON_GNUS_DAO_ADDRESS: process.env.NEXT_PUBLIC_POLYGON_GNUS_DAO_ADDRESS,
      NEXT_PUBLIC_SKALE_GNUS_DAO_ADDRESS: process.env.NEXT_PUBLIC_SKALE_GNUS_DAO_ADDRESS,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
    }

    return envSchema.parse(env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`Environment validation failed:\n${errorMessages}`)
    }
    throw error
  }
}

/**
 * Get validated environment variables
 * Throws an error if validation fails
 */
export function getEnv(): z.infer<typeof envSchema> {
  if (!validatedEnv) {
    validatedEnv = initializeEnv()
  }
  return validatedEnv
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production'
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development'
}

/**
 * Check if environment is test
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test'
}

/**
 * Get RPC URL for a specific network with fallback support
 */
export function getRpcUrl(network: 'ethereum' | 'base' | 'polygon' | 'skale'): string {
  const env = getEnv()
  
  switch (network) {
    case 'ethereum':
      return env.NEXT_PUBLIC_ETHEREUM_RPC_URL
    case 'base':
      return env.NEXT_PUBLIC_BASE_RPC_URL
    case 'polygon':
      return env.NEXT_PUBLIC_POLYGON_RPC_URL
    case 'skale':
      return env.NEXT_PUBLIC_SKALE_RPC_URL
    default:
      throw new Error(`Unsupported network: ${network}`)
  }
}

/**
 * Get backup RPC URL for a specific network
 */
export function getBackupRpcUrl(network: 'ethereum' | 'base' | 'polygon'): string | undefined {
  const env = getEnv()

  switch (network) {
    case 'ethereum':
      return env.NEXT_PUBLIC_ETHEREUM_RPC_URL_BACKUP
    case 'base':
      return env.NEXT_PUBLIC_BASE_RPC_URL_BACKUP
    case 'polygon':
      return env.NEXT_PUBLIC_POLYGON_RPC_URL_BACKUP
    default:
      return undefined
  }
}

/**
 * Get Sepolia testnet RPC URL with fallback
 */
export function getSepoliaRpcUrl(): string {
  const env = getEnv()

  // Use environment variable if available, otherwise fallback to public endpoint
  if (env.NEXT_PUBLIC_SEPOLIA_RPC_URL) {
    return env.NEXT_PUBLIC_SEPOLIA_RPC_URL
  }

  // Fallback to public Sepolia endpoint (no API key required)
  return 'https://rpc.sepolia.org'
}

/**
 * Get contract address for a specific network
 */
export function getContractAddress(network: 'ethereum' | 'sepolia' | 'base' | 'polygon' | 'skale'): string | undefined {
  const env = getEnv()
  
  switch (network) {
    case 'ethereum':
      return env.NEXT_PUBLIC_ETHEREUM_GNUS_DAO_ADDRESS
    case 'sepolia':
      return env.NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS
    case 'base':
      return env.NEXT_PUBLIC_BASE_GNUS_DAO_ADDRESS
    case 'polygon':
      return env.NEXT_PUBLIC_POLYGON_GNUS_DAO_ADDRESS
    case 'skale':
      return env.NEXT_PUBLIC_SKALE_GNUS_DAO_ADDRESS
    default:
      return undefined
  }
}

/**
 * Validate environment on module load (client-side only)
 */
if (typeof window !== 'undefined') {
  try {
    getEnv()
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Environment variables validated successfully')
    }
  } catch (error) {
    // Only log in development, in production we should handle this gracefully
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Environment validation failed:', error)
    }
    // In production, we might want to show a user-friendly error page
    if (isProduction()) {
      // Could redirect to an error page or show a modal
      // Don't log to console in production
      throw new Error('Application configuration error')
    }
  }
}
