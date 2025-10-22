/**
 * Cloudflare Worker: Secure Configuration
 * Provides runtime configuration without exposing sensitive keys
 */

interface Env {
  // Public configuration (safe to expose)
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string;
  NEXT_PUBLIC_ETHEREUM_RPC_URL: string;
  NEXT_PUBLIC_BASE_RPC_URL: string;
  NEXT_PUBLIC_POLYGON_RPC_URL: string;
  NEXT_PUBLIC_SKALE_RPC_URL: string;
  NEXT_PUBLIC_ARBITRUM_RPC_URL: string;
  NEXT_PUBLIC_SEPOLIA_RPC_URL: string;
  
  // Contract addresses
  NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: string;
  NEXT_PUBLIC_ETHEREUM_GNUS_DAO_ADDRESS: string;
  NEXT_PUBLIC_BASE_GNUS_DAO_ADDRESS: string;
  NEXT_PUBLIC_POLYGON_GNUS_DAO_ADDRESS: string;
  NEXT_PUBLIC_SKALE_GNUS_DAO_ADDRESS: string;
  
  // Application config
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_APP_VERSION: string;
  
  // IPFS gateways (public)
  NEXT_PUBLIC_IPFS_GATEWAY: string;
  NEXT_PUBLIC_IPFS_GATEWAY_BACKUP: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Return only public configuration
    // NEVER expose: PINATA_JWT, PINATA_API_KEY, PINATA_SECRET_KEY, JWT_SECRET
    const config = {
      walletConnect: {
        projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '805f6520f2f2934352c65fe6bd70d15d',
      },
      
      rpcUrls: {
        ethereum: env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
        base: env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
        polygon: env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
        skale: env.NEXT_PUBLIC_SKALE_RPC_URL || 'https://mainnet.skalenodes.com/v1/green-giddy-denebola',
        arbitrum: env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
        sepolia: env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/a9555646b9fb4da6ab4cc08c782f85ee',
      },
      
      contracts: {
        sepolia: env.NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS || '0x57AE78C65F7Dd6d158DE9F4cA9CCeaA98C988199',
        ethereum: env.NEXT_PUBLIC_ETHEREUM_GNUS_DAO_ADDRESS || '0x0000000000000000000000000000000000000000',
        base: env.NEXT_PUBLIC_BASE_GNUS_DAO_ADDRESS || '0x0000000000000000000000000000000000000000',
        polygon: env.NEXT_PUBLIC_POLYGON_GNUS_DAO_ADDRESS || '0x0000000000000000000000000000000000000000',
        skale: env.NEXT_PUBLIC_SKALE_GNUS_DAO_ADDRESS || '0x0000000000000000000000000000000000000000',
      },
      
      app: {
        name: env.NEXT_PUBLIC_APP_NAME || 'GNUS DAO',
        url: env.NEXT_PUBLIC_APP_URL || 'https://dao.gnus.ai',
        version: env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      },
      
      ipfs: {
        gateway: env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
        gatewayBackup: env.NEXT_PUBLIC_IPFS_GATEWAY_BACKUP || 'https://gateway.pinata.cloud/ipfs/',
      },
    };

    return new Response(
      JSON.stringify(config),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('Configuration fetch failed:', error);
    
    // Return minimal fallback configuration
    const fallbackConfig = {
      walletConnect: {
        projectId: '805f6520f2f2934352c65fe6bd70d15d',
      },
      rpcUrls: {
        ethereum: 'https://eth.llamarpc.com',
        base: 'https://mainnet.base.org',
        polygon: 'https://polygon.llamarpc.com',
        skale: 'https://mainnet.skalenodes.com/v1/green-giddy-denebola',
        arbitrum: 'https://arb1.arbitrum.io/rpc',
        sepolia: 'https://sepolia.infura.io/v3/a9555646b9fb4da6ab4cc08c782f85ee',
      },
      contracts: {
        sepolia: '0x57AE78C65F7Dd6d158DE9F4cA9CCeaA98C988199',
        ethereum: '0x0000000000000000000000000000000000000000',
        base: '0x0000000000000000000000000000000000000000',
        polygon: '0x0000000000000000000000000000000000000000',
        skale: '0x0000000000000000000000000000000000000000',
      },
      app: {
        name: 'GNUS DAO',
        url: 'https://dao.gnus.ai',
        version: '1.0.0',
      },
      ipfs: {
        gateway: 'https://ipfs.io/ipfs/',
        gatewayBackup: 'https://gateway.pinata.cloud/ipfs/',
      },
    };

    return new Response(
      JSON.stringify(fallbackConfig),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  }
};

