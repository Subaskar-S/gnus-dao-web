#!/usr/bin/env node

/**
 * Test deployment script for debugging Cloudflare Pages issues
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Testing GNUS DAO deployment...\n')

// Set environment variables
process.env.NODE_ENV = 'production'
process.env.STATIC_EXPORT = 'true'

console.log('📦 Building for production...')
try {
  execSync('yarn build', { stdio: 'inherit' })
  console.log('✅ Build completed successfully\n')
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}

// Check if out directory exists
const outDir = path.join(__dirname, 'out')
if (!fs.existsSync(outDir)) {
  console.error('❌ Output directory "out" not found')
  process.exit(1)
}

// Check if index.html exists
const indexPath = path.join(outDir, 'index.html')
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in output directory')
  process.exit(1)
}

console.log('✅ Output directory structure:')
const files = fs.readdirSync(outDir)
files.forEach(file => {
  const filePath = path.join(outDir, file)
  const stats = fs.statSync(filePath)
  console.log(`  ${stats.isDirectory() ? '📁' : '📄'} ${file}`)
})

console.log('\n🎉 Deployment test completed successfully!')
console.log('\n📋 Cloudflare Pages Configuration:')
console.log('   Build command: yarn build')
console.log('   Output directory: out')
console.log('   Environment variables:')
console.log('     NODE_ENV = production')
console.log('     STATIC_EXPORT = true')
