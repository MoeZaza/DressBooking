import { Request, Response, NextFunction } from 'express'
import NodeCache from 'node-cache'

// Create cache instance with 5 minute TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 })

// Export cache instance for direct use
export { cache }

interface CacheOptions {
  ttl?: number
  keyGenerator?: (req: Request) => string
  condition?: (req: Request) => boolean
}

/**
 * Cache middleware for API responses
 * @param options Cache configuration options
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req: Request) => `${req.method}:${req.originalUrl}`,
    condition = () => true
  } = options

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests or if condition is false
    if (req.method !== 'GET' || !condition(req)) {
      return next()
    }

    const cacheKey = keyGenerator(req)
    const cachedResponse = cache.get(cacheKey)

    if (cachedResponse) {
      console.log(`Cache hit for key: ${cacheKey}`)
      return res.json(cachedResponse)
    }

    // Store original json method
    const originalJson = res.json.bind(res)

    // Override json method to cache response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl)
        console.log(`Cached response for key: ${cacheKey}`)
      }
      return originalJson(data)
    }

    next()
  }
}

/**
 * Cache middleware specifically for dashboard data
 */
export const dashboardCache = cacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: (req: Request) => `dashboard:${(req as any).user?.id || 'anonymous'}:${req.originalUrl}`,
  condition: (req: Request) => req.originalUrl.includes('/dashboard') || req.originalUrl.includes('/stats')
})

/**
 * Cache middleware for supplier data
 */
export const supplierCache = cacheMiddleware({
  ttl: 600, // 10 minutes
  keyGenerator: (req: Request) => `suppliers:${req.originalUrl}:${JSON.stringify(req.query)}`,
  condition: (req: Request) => req.originalUrl.includes('/suppliers')
})

/**
 * Cache middleware for location data
 */
export const locationCache = cacheMiddleware({
  ttl: 900, // 15 minutes
  keyGenerator: (req: Request) => `locations:${req.originalUrl}:${JSON.stringify(req.query)}`,
  condition: (req: Request) => req.originalUrl.includes('/locations')
})

/**
 * Cache middleware for dress data
 */
export const dressCache = cacheMiddleware({
  ttl: 180, // 3 minutes (shorter due to frequent updates)
  keyGenerator: (req: Request) => `dresses:${req.originalUrl}:${JSON.stringify(req.query)}`,
  condition: (req: Request) => req.originalUrl.includes('/dresses')
})

/**
 * Clear cache for specific patterns
 */
export const clearCache = (pattern?: string) => {
  if (pattern) {
    const keys = cache.keys()
    const matchingKeys = keys.filter((key: string) => key.includes(pattern))
    cache.del(matchingKeys)
    console.log(`Cleared ${matchingKeys.length} cache entries matching pattern: ${pattern}`)
  } else {
    cache.flushAll()
    console.log('Cleared all cache entries')
  }
}

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    keyspace: cache.keys()
  }
}

export default cache
