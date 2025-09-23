#!/usr/bin/env node

/**
 * Health check script for GNUS DAO deployment
 * Validates that the deployed application is working correctly
 */

const https = require('https')
const http = require('http')

// Configuration
const config = {
  url: process.env.HEALTH_CHECK_URL || 'https://dao.gnus.ai',
  timeout: 10000,
  retries: 3,
  retryDelay: 2000,
}

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

function logSuccess(message) {
  log(`✅ ${message}`, colors.green)
}

function logError(message) {
  log(`❌ ${message}`, colors.red)
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue)
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === 'https:' ? https : http
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: config.timeout,
      headers: {
        'User-Agent': 'GNUS-DAO-Health-Check/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    }
    
    const req = client.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        })
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    req.end()
  })
}

async function checkEndpoint(url, expectedStatus = 200) {
  logInfo(`Checking ${url}...`)
  
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      const response = await makeRequest(url)
      
      if (response.statusCode === expectedStatus) {
        logSuccess(`${url} responded with status ${response.statusCode}`)
        return {
          success: true,
          statusCode: response.statusCode,
          headers: response.headers,
          body: response.body,
        }
      } else {
        logWarning(`${url} responded with status ${response.statusCode} (expected ${expectedStatus})`)
        if (attempt === config.retries) {
          return {
            success: false,
            statusCode: response.statusCode,
            error: `Unexpected status code: ${response.statusCode}`,
          }
        }
      }
    } catch (error) {
      logError(`Attempt ${attempt}/${config.retries} failed: ${error.message}`)
      if (attempt === config.retries) {
        return {
          success: false,
          error: error.message,
        }
      }
    }
    
    if (attempt < config.retries) {
      logInfo(`Retrying in ${config.retryDelay}ms...`)
      await new Promise(resolve => setTimeout(resolve, config.retryDelay))
    }
  }
}

function validateHTML(html) {
  const checks = [
    {
      name: 'Title contains GNUS DAO',
      test: html.includes('GNUS DAO'),
    },
    {
      name: 'React app root element exists',
      test: html.includes('id="__next"') || html.includes('id="root"'),
    },
    {
      name: 'No obvious error messages',
      test: !html.toLowerCase().includes('error') || !html.toLowerCase().includes('404'),
    },
    {
      name: 'Contains JavaScript bundles',
      test: html.includes('_next/static') || html.includes('.js'),
    },
    {
      name: 'Contains CSS styles',
      test: html.includes('.css') || html.includes('<style'),
    },
  ]
  
  const results = checks.map(check => ({
    ...check,
    passed: check.test,
  }))
  
  return results
}

function validateHeaders(headers) {
  const securityHeaders = [
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
    'content-security-policy',
  ]
  
  const results = securityHeaders.map(header => ({
    name: `Security header: ${header}`,
    passed: !!headers[header],
    value: headers[header],
  }))
  
  return results
}

async function runHealthCheck() {
  log(`${colors.bright}${colors.cyan}🏥 GNUS DAO Health Check${colors.reset}`)
  log(`${colors.cyan}Checking deployment health...${colors.reset}\n`)
  
  const endpoints = [
    { url: config.url, name: 'Homepage' },
    { url: `${config.url}/proposals`, name: 'Proposals page' },
    { url: `${config.url}/treasury`, name: 'Treasury page' },
    { url: `${config.url}/analytics`, name: 'Analytics page' },
  ]
  
  let allPassed = true
  const results = []
  
  for (const endpoint of endpoints) {
    log(`\n${colors.bright}Checking ${endpoint.name}...${colors.reset}`)
    
    const result = await checkEndpoint(endpoint.url)
    results.push({ ...endpoint, ...result })
    
    if (result.success) {
      // Validate HTML content for homepage
      if (endpoint.name === 'Homepage' && result.body) {
        log('\n📄 Validating HTML content...')
        const htmlChecks = validateHTML(result.body)
        
        htmlChecks.forEach(check => {
          if (check.passed) {
            logSuccess(check.name)
          } else {
            logError(check.name)
            allPassed = false
          }
        })
        
        // Validate security headers
        log('\n🔒 Validating security headers...')
        const headerChecks = validateHeaders(result.headers)
        
        headerChecks.forEach(check => {
          if (check.passed) {
            logSuccess(`${check.name}: ${check.value}`)
          } else {
            logWarning(`${check.name}: Missing`)
          }
        })
      }
    } else {
      allPassed = false
    }
  }
  
  // Summary
  log(`\n${colors.bright}📊 Health Check Summary${colors.reset}`)
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    log(`${status} ${result.name}: ${result.success ? 'PASS' : 'FAIL'}`)
    if (!result.success && result.error) {
      log(`   Error: ${result.error}`, colors.red)
    }
  })
  
  if (allPassed) {
    log(`\n${colors.bright}${colors.green}🎉 All health checks passed!${colors.reset}`)
    log(`${colors.green}Deployment is healthy and ready.${colors.reset}`)
    process.exit(0)
  } else {
    log(`\n${colors.bright}${colors.red}💥 Some health checks failed!${colors.reset}`)
    log(`${colors.red}Please review the deployment.${colors.reset}`)
    process.exit(1)
  }
}

// Run health check if called directly
if (require.main === module) {
  runHealthCheck().catch(error => {
    logError(`Health check failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  runHealthCheck,
  checkEndpoint,
  validateHTML,
  validateHeaders,
}
