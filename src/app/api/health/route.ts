import { NextRequest, NextResponse } from 'next/server'

/**
 * Health check endpoint for GNUS DAO
 * Provides system status and basic diagnostics
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      cloudflare: process.env.CLOUDFLARE_PAGES === 'true',
      
      // System info
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
      
      // Service checks
      services: {
        ipfs: await checkIPFSService(),
        rpc: await checkRPCServices(),
      },
      
      // Performance metrics
      performance: {
        responseTime: Date.now() - startTime,
      },
    }

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        performance: {
          responseTime: Date.now() - startTime,
        },
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

async function checkIPFSService(): Promise<{ status: string; gateway?: string }> {
  try {
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
    ]
    
    // Test with a known IPFS hash (empty file)
    const testHash = 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'
    
    for (const gateway of gateways) {
      try {
        const response = await fetch(`${gateway}${testHash}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        })
        
        if (response.ok) {
          return { status: 'healthy', gateway }
        }
      } catch {
        continue
      }
    }
    
    return { status: 'degraded' }
  } catch {
    return { status: 'unhealthy' }
  }
}

async function checkRPCServices(): Promise<{ status: string; networks?: string[] }> {
  try {
    const networks = []
    const rpcs = [
      { name: 'ethereum', url: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL },
      { name: 'base', url: process.env.NEXT_PUBLIC_BASE_RPC_URL },
      { name: 'polygon', url: process.env.NEXT_PUBLIC_POLYGON_RPC_URL },
      { name: 'skale', url: process.env.NEXT_PUBLIC_SKALE_RPC_URL },
    ]
    
    for (const rpc of rpcs) {
      if (rpc.url) {
        try {
          const response = await fetch(rpc.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_blockNumber',
              params: [],
              id: 1,
            }),
            signal: AbortSignal.timeout(5000),
          })
          
          if (response.ok) {
            networks.push(rpc.name)
          }
        } catch {
          continue
        }
      }
    }
    
    return {
      status: networks.length > 0 ? 'healthy' : 'degraded',
      networks,
    }
  } catch {
    return { status: 'unhealthy' }
  }
}

export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
