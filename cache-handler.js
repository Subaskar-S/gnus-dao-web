/**
 * Enhanced cache handler for Next.js with Cloudflare compatibility
 * Provides optimized caching for static and dynamic content
 */

const { IncrementalCache } = require('@neshca/cache-handler')
const createLruHandler = require('@neshca/cache-handler/local-lru').default
const createRedisHandler = require('@neshca/cache-handler/redis-strings').default

// Environment detection
const isCloudflarePages = process.env.CLOUDFLARE_PAGES === 'true'
const isProduction = process.env.NODE_ENV === 'production'

// Cache configuration
const cacheConfig = {
  // TTL in seconds
  defaultTtl: isProduction ? 3600 : 300, // 1 hour in prod, 5 min in dev
  maxTtl: isProduction ? 86400 : 3600,   // 24 hours in prod, 1 hour in dev
  
  // Cache size limits
  maxItems: isProduction ? 1000 : 100,
  maxSize: isProduction ? '100mb' : '10mb',
}

// Create cache handlers based on environment
function createCacheHandler() {
  if (isCloudflarePages) {
    // For Cloudflare Pages, use simple in-memory cache
    return createLruHandler({
      maxItemsNumber: cacheConfig.maxItems,
      maxItemSizeBytes: 1024 * 1024, // 1MB per item
    })
  }

  // For other environments, try Redis if available, fallback to LRU
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL
  
  if (redisUrl && isProduction) {
    try {
      return createRedisHandler({
        redis: {
          url: redisUrl,
          connectTimeout: 5000,
          commandTimeout: 5000,
        },
        keyPrefix: 'gnus-dao:',
        timeoutMs: 5000,
      })
    } catch (error) {
      console.warn('Failed to initialize Redis cache, falling back to LRU:', error.message)
    }
  }

  // Fallback to LRU cache
  return createLruHandler({
    maxItemsNumber: cacheConfig.maxItems,
    maxItemSizeBytes: 1024 * 1024, // 1MB per item
  })
}

// Create the incremental cache
const handler = IncrementalCache.createHandler({
  handlers: [createCacheHandler()],
  
  // Cache key transformation
  transformKey: (key) => {
    // Add environment prefix to avoid conflicts
    const env = isProduction ? 'prod' : 'dev'
    return `${env}:${key}`
  },
  
  // TTL calculation based on cache type
  ttl: (context) => {
    const { kind, pathname } = context
    
    // Different TTLs for different content types
    switch (kind) {
      case 'ROUTE':
        // API routes - short cache
        return 300 // 5 minutes
        
      case 'PAGE':
        // Static pages - longer cache
        if (pathname?.includes('/proposals/')) {
          return 1800 // 30 minutes for proposal pages
        }
        return cacheConfig.defaultTtl
        
      case 'APP_PAGE':
        // App router pages
        return cacheConfig.defaultTtl
        
      case 'IMAGE':
        // Images - very long cache
        return cacheConfig.maxTtl
        
      default:
        return cacheConfig.defaultTtl
    }
  },
})

module.exports = handler
