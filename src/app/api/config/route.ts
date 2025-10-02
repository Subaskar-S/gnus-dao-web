import { NextRequest, NextResponse } from 'next/server'

/**
 * Runtime Configuration API Endpoint
 * Provides environment variables at runtime for client-side components
 * This endpoint will be available in Cloudflare Pages Functions
 */

export async function GET(request: NextRequest) {
  try {
    // Get environment variables from the runtime environment
    const config = {
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: 
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '805f6520f2f2934352c65fe6bd70d15d',
      NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: 
        process.env.NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS || '0x57AE78C65F7Dd6d158DE9F4cA9CCeaA98C988199',
      NEXT_PUBLIC_ETHEREUM_RPC_URL: 
        process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      NEXT_PUBLIC_BASE_RPC_URL: 
        process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
      NEXT_PUBLIC_POLYGON_RPC_URL: 
        process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
      NEXT_PUBLIC_SKALE_RPC_URL: 
        process.env.NEXT_PUBLIC_SKALE_RPC_URL || 'https://mainnet.skalenodes.com/v1/green-giddy-denebola',
    }

    // Add CORS headers for cross-origin requests
    const response = NextResponse.json(config)
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    // Cache for 5 minutes to reduce API calls
    response.headers.set('Cache-Control', 'public, max-age=300')

    return response
  } catch (error) {
    console.error('Failed to load runtime configuration:', error)
    
    // Return fallback configuration
    const fallbackConfig = {
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: '805f6520f2f2934352c65fe6bd70d15d',
      NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: '0x57AE78C65F7Dd6d158DE9F4cA9CCeaA98C988199',
      NEXT_PUBLIC_ETHEREUM_RPC_URL: 'https://eth.llamarpc.com',
      NEXT_PUBLIC_BASE_RPC_URL: 'https://mainnet.base.org',
      NEXT_PUBLIC_POLYGON_RPC_URL: 'https://polygon.llamarpc.com',
      NEXT_PUBLIC_SKALE_RPC_URL: 'https://mainnet.skalenodes.com/v1/green-giddy-denebola',
    }

    const response = NextResponse.json(fallbackConfig)
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Cache-Control', 'public, max-age=60')
    
    return response
  }
}
