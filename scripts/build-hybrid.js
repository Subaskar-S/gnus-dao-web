#!/usr/bin/env node

/**
 * Hybrid Build Script for GNUS DAO
 * Builds the application with static export + API routes for runtime configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Hybrid Build for GNUS DAO');
console.log('📋 Build Strategy: Static Export + Runtime API Routes');
console.log('=' .repeat(80));

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const isCloudflarePages = process.env.CLOUDFLARE_PAGES === 'true';

console.log(`🌍 Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`☁️  Cloudflare Pages: ${isCloudflarePages ? 'Yes' : 'No'}`);

// Set environment variables for hybrid build
process.env.STATIC_EXPORT = 'true';
process.env.HYBRID_BUILD = 'true';

console.log('\n📦 Building Next.js application...');

try {
  // Run Next.js build
  execSync('next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      STATIC_EXPORT: 'true',
      HYBRID_BUILD: 'true',
    }
  });

  console.log('✅ Next.js build completed successfully');

  // Verify build output
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    throw new Error('Build output directory not found');
  }

  console.log('\n🔍 Verifying build output...');

  // Check for essential files
  const essentialFiles = [
    'index.html',
    '_next',
    '_headers',
    '_redirects'
  ];

  const missingFiles = [];
  essentialFiles.forEach(file => {
    const filePath = path.join(outDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    } else {
      console.log(`✅ ${file} - Found`);
    }
  });

  if (missingFiles.length > 0) {
    console.warn(`⚠️  Missing files: ${missingFiles.join(', ')}`);
  }

  // Check for API routes (these should be handled by Cloudflare Pages Functions)
  const apiDir = path.join(outDir, 'api');
  if (fs.existsSync(apiDir)) {
    console.log('✅ API routes directory found');
    const apiFiles = fs.readdirSync(apiDir, { recursive: true });
    console.log(`📁 API routes: ${apiFiles.length} files`);
  } else {
    console.log('ℹ️  No API routes directory (will be handled by Cloudflare Pages Functions)');
  }

  // Create runtime configuration file for fallback
  console.log('\n📝 Creating runtime configuration fallback...');
  const runtimeConfig = {
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '805f6520f2f2934352c65fe6bd70d15d',
    NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: process.env.NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS || '0x57AE78C65F7Dd6d158DE9F4cA9CCeaA98C988199',
    NEXT_PUBLIC_ETHEREUM_RPC_URL: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    NEXT_PUBLIC_BASE_RPC_URL: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    NEXT_PUBLIC_POLYGON_RPC_URL: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
    NEXT_PUBLIC_SKALE_RPC_URL: process.env.NEXT_PUBLIC_SKALE_RPC_URL || 'https://mainnet.skalenodes.com/v1/green-giddy-denebola',
  };

  const configPath = path.join(outDir, 'runtime-config.json');
  fs.writeFileSync(configPath, JSON.stringify(runtimeConfig, null, 2));
  console.log(`✅ Runtime configuration saved: ${configPath}`);

  // Create _functions directory for Cloudflare Pages Functions
  const functionsDir = path.join(outDir, '_functions');
  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
  }

  // Create API config function for Cloudflare Pages
  const configFunctionContent = `
export async function onRequest(context) {
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
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const config = {
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '805f6520f2f2934352c65fe6bd70d15d',
      NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: env.NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS || '0x57AE78C65F7Dd6d158DE9F4cA9CCeaA98C988199',
      NEXT_PUBLIC_ETHEREUM_RPC_URL: env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      NEXT_PUBLIC_BASE_RPC_URL: env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
      NEXT_PUBLIC_POLYGON_RPC_URL: env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
      NEXT_PUBLIC_SKALE_RPC_URL: env.NEXT_PUBLIC_SKALE_RPC_URL || 'https://mainnet.skalenodes.com/v1/green-giddy-denebola',
    };

    return new Response(JSON.stringify(config), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Config function error:', error);
    
    // Return fallback configuration
    const fallbackConfig = {
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: '805f6520f2f2934352c65fe6bd70d15d',
      NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS: '0x57AE78C65F7Dd6d158DE9F4cA9CCeaA98C988199',
      NEXT_PUBLIC_ETHEREUM_RPC_URL: 'https://eth.llamarpc.com',
      NEXT_PUBLIC_BASE_RPC_URL: 'https://mainnet.base.org',
      NEXT_PUBLIC_POLYGON_RPC_URL: 'https://polygon.llamarpc.com',
      NEXT_PUBLIC_SKALE_RPC_URL: 'https://mainnet.skalenodes.com/v1/green-giddy-denebola',
    };

    return new Response(JSON.stringify(fallbackConfig), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
}
`;

  const configFunctionPath = path.join(functionsDir, 'api', 'config.js');
  fs.mkdirSync(path.dirname(configFunctionPath), { recursive: true });
  fs.writeFileSync(configFunctionPath, configFunctionContent);
  console.log(`✅ Cloudflare Pages Function created: ${configFunctionPath}`);

  // Calculate build size
  const calculateDirSize = (dirPath) => {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        totalSize += calculateDirSize(filePath);
      } else {
        totalSize += fs.statSync(filePath).size;
      }
    }
    
    return totalSize;
  };

  const buildSize = calculateDirSize(outDir);
  const buildSizeMB = (buildSize / (1024 * 1024)).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log('🎉 HYBRID BUILD COMPLETED SUCCESSFULLY');
  console.log('='.repeat(80));
  console.log(`📦 Build size: ${buildSizeMB} MB`);
  console.log(`📁 Output directory: ${outDir}`);
  console.log(`🔧 Build strategy: Static Export + Runtime API Routes`);
  console.log(`☁️  Cloudflare Pages Functions: Enabled`);
  console.log(`🔑 WalletConnect Project ID: ${runtimeConfig.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}`);
  console.log(`🔗 Contract Address: ${runtimeConfig.NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS}`);
  console.log('\n✅ Ready for Cloudflare Pages deployment with hybrid functionality!');

} catch (error) {
  console.error('\n💥 Build failed:', error.message);
  process.exit(1);
}
