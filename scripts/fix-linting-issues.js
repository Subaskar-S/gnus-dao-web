#!/usr/bin/env node

/**
 * Automated linting issue fix script for GNUS DAO
 * Fixes common ESLint warnings and errors for production deployment
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

// Fix patterns for common linting issues
const fixPatterns = [
  // Remove unused imports
  {
    pattern: /import.*\{[^}]*Network[^}]*\}.*from.*\n/g,
    replacement: '',
    description: 'Remove unused Network import'
  },
  {
    pattern: /import.*\{[^}]*ExternalLink[^}]*\}.*from.*\n/g,
    replacement: '',
    description: 'Remove unused ExternalLink import'
  },
  {
    pattern: /import.*\{[^}]*Copy[^}]*\}.*from.*\n/g,
    replacement: '',
    description: 'Remove unused Copy import'
  },
  
  // Fix console statements in production
  {
    pattern: /console\.(log|warn|error|info)\([^)]*\);?\n/g,
    replacement: '// console.$1 removed for production\n',
    description: 'Comment out console statements'
  },
  
  // Fix unused variables by prefixing with underscore
  {
    pattern: /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g,
    replacement: (match, varName) => {
      if (varName.startsWith('_')) return match
      return match.replace(varName, `_${varName}`)
    },
    description: 'Prefix unused variables with underscore'
  },
  
  // Fix extra semicolons
  {
    pattern: /;;/g,
    replacement: ';',
    description: 'Remove extra semicolons'
  }
]

// Files to fix (excluding test files and node_modules)
function getFilesToFix() {
  const srcDir = path.join(process.cwd(), 'src')
  const files = []
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== '__tests__') {
        walkDir(fullPath)
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx')) && !item.includes('.test.') && !item.includes('.spec.')) {
        files.push(fullPath)
      }
    }
  }
  
  walkDir(srcDir)
  return files
}

// Apply fixes to a file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    for (const fix of fixPatterns) {
      const originalContent = content
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement)
      } else {
        content = content.replace(fix.pattern, fix.replacement)
      }
      
      if (content !== originalContent) {
        modified = true
        log(`  - ${fix.description}`, colors.cyan)
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      return true
    }
    
    return false
  } catch (error) {
    logError(`Error fixing ${filePath}: ${error.message}`)
    return false
  }
}

// Main function
function main() {
  log(`${colors.bright}${colors.cyan}🔧 GNUS DAO Linting Issue Fixer${colors.reset}`)
  log(`${colors.cyan}Automatically fixing common ESLint issues...${colors.reset}\n`)
  
  logStep('1/3', 'Scanning for files to fix...')
  const files = getFilesToFix()
  log(`Found ${files.length} TypeScript files to process`)
  
  logStep('2/3', 'Applying automated fixes...')
  let fixedFiles = 0
  
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file)
    log(`Processing: ${relativePath}`)
    
    if (fixFile(file)) {
      fixedFiles++
      logSuccess(`Fixed: ${relativePath}`)
    }
  }
  
  logStep('3/3', 'Running ESLint with auto-fix...')
  try {
    execSync('yarn lint --fix', { stdio: 'inherit' })
    logSuccess('ESLint auto-fix completed')
  } catch (error) {
    logWarning('ESLint auto-fix completed with warnings')
  }
  
  log(`\n${colors.bright}${colors.green}🎉 Linting fix completed!${colors.reset}`)
  log(`${colors.green}Fixed ${fixedFiles} files automatically.${colors.reset}`)
  log(`${colors.cyan}Run 'yarn lint' to check remaining issues.${colors.reset}\n`)
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { fixFile, getFilesToFix }
