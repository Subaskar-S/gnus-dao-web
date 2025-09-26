#!/usr/bin/env node

/**
 * Comprehensive deployment validation script for GNUS DAO
 * Validates build output, environment variables, and deployment readiness
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${message}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green)
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

function logError(message) {
  log(`❌ ${message}`, colors.red)
}

// Validation functions
function validateEnvironmentVariables() {
  logStep('1/6', 'Validating environment variables...')
  
  const requiredVars = [
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
    'NEXT_PUBLIC_SEPOLIA_RPC_URL',
    'NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS'
  ]
  
  const optionalVars = [
    'NEXT_PUBLIC_PINATA_API_KEY',
    'NEXT_PUBLIC_PINATA_SECRET_KEY',
    'NEXT_PUBLIC_ETHEREUM_RPC_URL',
    'NEXT_PUBLIC_BASE_RPC_URL',
    'NEXT_PUBLIC_POLYGON_RPC_URL',
    'NEXT_PUBLIC_SKALE_RPC_URL'
  ]
  
  let allValid = true
  
  // Check required variables
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} ✓`)
    } else {
      logError(`${varName} ✗ (Required)`)
      allValid = false
    }
  }
  
  // Check optional variables
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} ✓`)
    } else {
      logWarning(`${varName} ✗ (Optional)`)
    }
  }
  
  return allValid
}

function validateBuildOutput() {
  logStep('2/6', 'Validating build output...')
  
  const outDir = path.join(process.cwd(), 'out')
  
  if (!fs.existsSync(outDir)) {
    logError('Build output directory not found')
    return false
  }
  
  const criticalFiles = [
    'index.html',
    '_redirects',
    '_headers',
    '_next'
  ]
  
  let allValid = true
  
  for (const file of criticalFiles) {
    const filePath = path.join(outDir, file)
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} ✓`)
    } else {
      logError(`${file} ✗`)
      allValid = false
    }
  }
  
  return allValid
}

function validateWebpackBundle() {
  logStep('3/6', 'Validating webpack bundle...')
  
  const nextDir = path.join(process.cwd(), 'out', '_next')
  
  if (!fs.existsSync(nextDir)) {
    logError('Next.js build directory not found')
    return false
  }
  
  const staticDir = path.join(nextDir, 'static')
  if (!fs.existsSync(staticDir)) {
    logError('Static assets directory not found')
    return false
  }
  
  logSuccess('Webpack bundle structure valid')
  return true
}

function validateIPFSIntegration() {
  logStep('4/6', 'Validating IPFS integration...')
  
  const ipfsFiles = [
    'src/lib/ipfs/service.ts',
    'src/lib/ipfs/client.ts',
    'src/lib/ipfs/config.ts',
    'src/components/ipfs/FileUpload.tsx'
  ]
  
  let allValid = true
  
  for (const file of ipfsFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} ✓`)
    } else {
      logError(`${file} ✗`)
      allValid = false
    }
  }
  
  return allValid
}

function validateWeb3Integration() {
  logStep('5/6', 'Validating Web3 integration...')
  
  const web3Files = [
    'src/lib/web3/appkit.ts',
    'src/lib/web3/connectors.ts',
    'src/components/wallet/ConnectWalletButton.tsx'
  ]
  
  let allValid = true
  
  for (const file of web3Files) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} ✓`)
    } else {
      logError(`${file} ✗`)
      allValid = false
    }
  }
  
  return allValid
}

function validateSecurityHeaders() {
  logStep('6/6', 'Validating security headers...')
  
  const headersPath = path.join(process.cwd(), 'out', '_headers')
  
  if (!fs.existsSync(headersPath)) {
    logError('_headers file not found')
    return false
  }
  
  const headersContent = fs.readFileSync(headersPath, 'utf8')
  
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Content-Security-Policy',
    'Cache-Control'
  ]
  
  let allValid = true
  
  for (const header of requiredHeaders) {
    if (headersContent.includes(header)) {
      logSuccess(`${header} ✓`)
    } else {
      logError(`${header} ✗`)
      allValid = false
    }
  }
  
  return allValid
}

function generateDeploymentReport() {
  const outDir = path.join(process.cwd(), 'out')
  
  if (!fs.existsSync(outDir)) {
    return
  }
  
  // Calculate build size
  let totalSize = 0
  function calculateSize(dir) {
    const items = fs.readdirSync(dir)
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        calculateSize(fullPath)
      } else {
        totalSize += stat.size
      }
    }
  }
  
  calculateSize(outDir)
  const sizeMB = (totalSize / 1024 / 1024).toFixed(2)
  
  log(`\n📊 Deployment Report:`)
  log(`📦 Build size: ${sizeMB} MB`)
  log(`📁 Output directory: ${outDir}`)
  log(`🌐 Ready for Cloudflare Pages deployment`)
}

function main() {
  log(`${colors.bright}${colors.cyan}🔍 GNUS DAO Deployment Validation${colors.reset}`)
  log(`${colors.cyan}Validating deployment readiness...${colors.reset}\n`)
  
  const validations = [
    validateEnvironmentVariables(),
    validateBuildOutput(),
    validateWebpackBundle(),
    validateIPFSIntegration(),
    validateWeb3Integration(),
    validateSecurityHeaders()
  ]
  
  const allValid = validations.every(v => v)
  
  if (allValid) {
    log(`\n${colors.bright}${colors.green}🎉 All validations passed!${colors.reset}`)
    log(`${colors.green}Deployment is ready for Cloudflare Pages.${colors.reset}`)
    generateDeploymentReport()
  } else {
    log(`\n${colors.bright}${colors.red}❌ Some validations failed!${colors.reset}`)
    log(`${colors.red}Please fix the issues before deploying.${colors.reset}`)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = {
  validateEnvironmentVariables,
  validateBuildOutput,
  validateWebpackBundle,
  validateIPFSIntegration,
  validateWeb3Integration,
  validateSecurityHeaders
}
