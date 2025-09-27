#!/usr/bin/env node

/**
 * Cloudflare Pages build script using @cloudflare/next-on-pages adapter
 * Handles dynamic routing and Edge Runtime compatibility
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Load environment variables manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

// Load environment variables
loadEnvFile()

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

function logError(message) {
  log(`❌ ${message}`, colors.red)
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

function validateEnvironment() {
  logStep('1/7', 'Validating environment variables...')
  
  const requiredVars = [
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
    'NEXT_PUBLIC_SEPOLIA_RPC_URL',
    'NEXT_PUBLIC_SEPOLIA_GNUS_DAO_ADDRESS'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    logError(`Missing required environment variables: ${missingVars.join(', ')}`)
    process.exit(1)
  }
  
  logSuccess('Environment variables validated')
}

function runTypeCheck() {
  logStep('2/7', 'Running TypeScript type check...')

  try {
    execSync('yarn tsc --noEmit --skipLibCheck', { stdio: 'inherit' })
    logSuccess('TypeScript type check passed')
  } catch (error) {
    logError('TypeScript type check failed')
    process.exit(1)
  }
}

function runLinting() {
  logStep('3/7', 'Running ESLint...')

  try {
    execSync('yarn lint', { stdio: 'inherit' })
    logSuccess('Linting passed')
  } catch (error) {
    logWarning('Linting issues found, but continuing build...')
  }
}

function runTests() {
  logStep('4/7', 'Running tests...')
  
  try {
    execSync('yarn test --passWithNoTests --watchAll=false', { stdio: 'inherit' })
    logSuccess('Tests passed')
  } catch (error) {
    logWarning('Tests failed, but continuing build...')
  }
}

function buildNextApp() {
  logStep('5/7', 'Building Next.js application...')

  // Set environment variables for Cloudflare Pages
  process.env.CLOUDFLARE_PAGES = 'true'
  process.env.NODE_ENV = 'production'

  try {
    execSync('yarn build', { stdio: 'inherit' })
    logSuccess('Next.js build completed successfully')
  } catch (error) {
    logError('Next.js build failed')
    process.exit(1)
  }
}

function buildCloudflareAdapter() {
  logStep('6/7', 'Building Cloudflare Pages adapter...')

  try {
    execSync('npx @cloudflare/next-on-pages', { stdio: 'inherit' })
    logSuccess('Cloudflare adapter build completed successfully')
  } catch (error) {
    logError('Cloudflare adapter build failed')
    process.exit(1)
  }
}

function validateBuild() {
  logStep('7/7', 'Validating build output...')
  
  const distDir = path.join(process.cwd(), '.vercel', 'output', 'static')
  const functionsDir = path.join(process.cwd(), '.vercel', 'output', 'functions')
  
  // Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    logError('Static build output directory not found')
    process.exit(1)
  }
  
  // Check if functions directory exists (for dynamic routes)
  if (fs.existsSync(functionsDir)) {
    logSuccess('Functions directory found - dynamic routes supported')
  } else {
    logWarning('Functions directory not found - only static routes available')
  }
  
  // Check if _worker.js exists (Cloudflare Worker)
  const workerPath = path.join(process.cwd(), '.vercel', 'output', 'static', '_worker.js')
  if (fs.existsSync(workerPath)) {
    logSuccess('Cloudflare Worker found')
  } else {
    logWarning('Cloudflare Worker not found')
  }
  
  // Check build size
  let buildSize
  try {
    if (process.platform === 'win32') {
      const sizeBytes = execSync(`powershell "(Get-ChildItem -Path '${distDir}' -Recurse | Measure-Object -Property Length -Sum).Sum"`, { encoding: 'utf8' }).trim()
      const sizeMB = Math.round(parseInt(sizeBytes) / 1024 / 1024 * 100) / 100
      buildSize = `${sizeMB}M`
    } else {
      buildSize = execSync(`du -sh ${distDir}`, { encoding: 'utf8' }).trim().split('\t')[0]
    }
  } catch (error) {
    buildSize = 'Unknown'
  }
  log(`\n📊 Build size: ${buildSize}`)
  
  // List critical files
  const criticalFiles = ['_worker.js', 'index.html', '_next']
  log('\n📁 Critical files check:')
  criticalFiles.forEach(file => {
    const filePath = path.join(distDir, file)
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} ✓`)
    } else {
      logWarning(`${file} ✗`)
    }
  })
  
  logSuccess('Build validation completed')
}

function createDeploymentInfo() {
  const deploymentInfo = {
    buildTime: new Date().toISOString(),
    adapter: '@cloudflare/next-on-pages',
    runtime: 'edge',
    features: {
      dynamicRouting: true,
      edgeRuntime: true,
      staticGeneration: true,
      ipfsIntegration: true,
      web3Support: true
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      cloudflarePages: process.env.CLOUDFLARE_PAGES
    }
  }
  
  const infoPath = path.join(process.cwd(), '.vercel', 'output', 'static', 'deployment-info.json')
  fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2))
  logSuccess('Deployment info created')
}

function main() {
  log(`${colors.bright}${colors.cyan}🚀 GNUS DAO Cloudflare Pages Build (Adapter)${colors.reset}`)
  log(`${colors.cyan}Building with @cloudflare/next-on-pages for dynamic routing...${colors.reset}\n`)
  
  try {
    validateEnvironment()
    runTypeCheck()
    runLinting()
    runTests()
    buildNextApp()
    buildCloudflareAdapter()
    validateBuild()
    createDeploymentInfo()
    
    log(`\n${colors.bright}${colors.green}🎉 Cloudflare adapter build completed successfully!${colors.reset}`)
    log(`${colors.green}Ready for Cloudflare Pages deployment with dynamic routing support.${colors.reset}`)
    log(`${colors.cyan}Deploy the '.vercel/output/static' directory to Cloudflare Pages.${colors.reset}\n`)
    
  } catch (error) {
    logError(`Build failed: ${error.message}`)
    process.exit(1)
  }
}

// Run the build script
if (require.main === module) {
  main()
}

module.exports = {
  validateEnvironment,
  runTypeCheck,
  runLinting,
  runTests,
  buildNextApp,
  buildCloudflareAdapter,
  validateBuild,
  createDeploymentInfo
}
