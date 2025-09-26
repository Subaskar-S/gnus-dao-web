#!/usr/bin/env node

/**
 * Verify Build Output
 * Script to verify that the build output is correct for Cloudflare Pages
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Verifying build output for Cloudflare Pages...\n')

const checks = []

// Check if out directory exists
if (fs.existsSync('out')) {
  checks.push({ name: 'Output directory exists', status: 'pass' })
} else {
  checks.push({ name: 'Output directory exists', status: 'fail', message: 'out/ directory not found' })
}

// Check for index.html
if (fs.existsSync('out/index.html')) {
  checks.push({ name: 'Main index.html exists', status: 'pass' })
  
  // Check if index.html contains expected content
  const indexContent = fs.readFileSync('out/index.html', 'utf8')
  if (indexContent.includes('GNUS DAO')) {
    checks.push({ name: 'Index.html contains expected content', status: 'pass' })
  } else {
    checks.push({ name: 'Index.html contains expected content', status: 'warn', message: 'Expected content not found' })
  }
} else {
  checks.push({ name: 'Main index.html exists', status: 'fail', message: 'out/index.html not found' })
}

// Check for static assets
if (fs.existsSync('out/_next/static')) {
  checks.push({ name: 'Static assets directory exists', status: 'pass' })
  
  // Check for CSS files
  const cssFiles = findFiles('out/_next/static', '.css')
  if (cssFiles.length > 0) {
    checks.push({ name: 'CSS files generated', status: 'pass', message: `Found ${cssFiles.length} CSS files` })
  } else {
    checks.push({ name: 'CSS files generated', status: 'warn', message: 'No CSS files found' })
  }
  
  // Check for JS files
  const jsFiles = findFiles('out/_next/static', '.js')
  if (jsFiles.length > 0) {
    checks.push({ name: 'JavaScript files generated', status: 'pass', message: `Found ${jsFiles.length} JS files` })
  } else {
    checks.push({ name: 'JavaScript files generated', status: 'fail', message: 'No JS files found' })
  }
} else {
  checks.push({ name: 'Static assets directory exists', status: 'fail', message: 'out/_next/static not found' })
}

// Check for important pages
const importantPages = [
  'proposals/index.html',
  'dao/index.html',
  '404.html'
]

for (const page of importantPages) {
  if (fs.existsSync(`out/${page}`)) {
    checks.push({ name: `Page ${page} exists`, status: 'pass' })
  } else {
    checks.push({ name: `Page ${page} exists`, status: 'warn', message: `${page} not found` })
  }
}

// Check for _headers file (Cloudflare Pages headers)
if (fs.existsSync('out/_headers')) {
  checks.push({ name: 'Cloudflare headers file exists', status: 'pass' })
} else {
  checks.push({ name: 'Cloudflare headers file exists', status: 'warn', message: '_headers file not found' })
}

// Check for _redirects file (Cloudflare Pages redirects)
if (fs.existsSync('out/_redirects')) {
  checks.push({ name: 'Cloudflare redirects file exists', status: 'pass' })
} else {
  checks.push({ name: 'Cloudflare redirects file exists', status: 'warn', message: '_redirects file not found' })
}

// Check for IPFS-related content
const appJsFiles = findFiles('out/_next/static/chunks', '_app-*.js')
if (appJsFiles.length > 0) {
  const appJsContent = fs.readFileSync(appJsFiles[0], 'utf8')
  if (appJsContent.includes('ipfs') || appJsContent.includes('pinata')) {
    checks.push({ name: 'IPFS functionality included', status: 'pass' })
  } else {
    checks.push({ name: 'IPFS functionality included', status: 'warn', message: 'IPFS code not detected in bundle' })
  }
} else {
  checks.push({ name: 'IPFS functionality included', status: 'warn', message: 'Could not verify IPFS inclusion' })
}

// Check bundle sizes
const totalSize = calculateTotalSize('out')
checks.push({ 
  name: 'Bundle size check', 
  status: totalSize < 50 * 1024 * 1024 ? 'pass' : 'warn', // 50MB limit
  message: `Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`
})

// Check for potential issues
const potentialIssues = []

// Check for large files
const largeFiles = findLargeFiles('out', 5 * 1024 * 1024) // 5MB
if (largeFiles.length > 0) {
  potentialIssues.push(`Large files detected: ${largeFiles.join(', ')}`)
}

// Check for Node.js specific code in client bundles
const clientJsFiles = findFiles('out/_next/static/chunks', '.js')
for (const file of clientJsFiles.slice(0, 5)) { // Check first 5 files
  const content = fs.readFileSync(file, 'utf8')
  if (content.includes('require(') && !content.includes('__webpack_require__')) {
    potentialIssues.push(`Potential Node.js code in client bundle: ${path.basename(file)}`)
  }
}

// Display results
console.log('📋 Build Verification Results:')
console.log('='.repeat(50))

let passCount = 0
let warnCount = 0
let failCount = 0

for (const check of checks) {
  const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌'
  const message = check.message ? ` (${check.message})` : ''
  console.log(`${icon} ${check.name}${message}`)
  
  if (check.status === 'pass') passCount++
  else if (check.status === 'warn') warnCount++
  else failCount++
}

if (potentialIssues.length > 0) {
  console.log('\n⚠️  Potential Issues:')
  for (const issue of potentialIssues) {
    console.log(`   • ${issue}`)
  }
}

console.log('\n' + '='.repeat(50))
console.log(`✅ Passed: ${passCount}`)
console.log(`⚠️  Warnings: ${warnCount}`)
console.log(`❌ Failed: ${failCount}`)

if (failCount === 0) {
  console.log('\n🎉 Build verification completed successfully!')
  process.exit(0)
} else {
  console.log('\n💥 Build verification failed. Please fix the issues.')
  process.exit(1)
}

// Helper functions
function findFiles(dir, pattern) {
  const files = []
  
  function search(currentDir) {
    if (!fs.existsSync(currentDir)) return
    
    const items = fs.readdirSync(currentDir)
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        search(fullPath)
      } else if (pattern.startsWith('*') ? item.endsWith(pattern.slice(1)) : 
                 pattern.includes('*') ? new RegExp(pattern.replace(/\*/g, '.*')).test(item) :
                 item.endsWith(pattern)) {
        files.push(fullPath)
      }
    }
  }
  
  search(dir)
  return files
}

function calculateTotalSize(dir) {
  let totalSize = 0
  
  function calculate(currentDir) {
    if (!fs.existsSync(currentDir)) return
    
    const items = fs.readdirSync(currentDir)
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        calculate(fullPath)
      } else {
        totalSize += stat.size
      }
    }
  }
  
  calculate(dir)
  return totalSize
}

function findLargeFiles(dir, sizeLimit) {
  const largeFiles = []
  
  function search(currentDir) {
    if (!fs.existsSync(currentDir)) return
    
    const items = fs.readdirSync(currentDir)
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        search(fullPath)
      } else if (stat.size > sizeLimit) {
        largeFiles.push(`${fullPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`)
      }
    }
  }
  
  search(dir)
  return largeFiles
}
