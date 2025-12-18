
import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

export const cachingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Enhanced caching strategy with ETags and longer cache durations
  if (req.path.includes('/api/locations') || req.path.includes('/api/countries')) {
    // Cache location and country data for 4 hours (they rarely change)
    res.set('Cache-Control', 'public, max-age=14400')
    res.set('Vary', 'Accept-Language, Accept-Encoding')
  } else if (req.path.includes('/api/frontend-dresses')) {
    // Cache dress data for 15 minutes with ETags
    res.set('Cache-Control', 'public, max-age=900')
    res.set('Vary', 'Accept-Language, Accept-Encoding')
    
    // Add ETag support for better cache validation
    const originalSend = res.send
    res.send = function(body) {
      if (body && typeof body === 'string') {
        const etag = crypto.createHash('md5').update(body).digest('hex')
        res.set('ETag', `"${etag}"`)
        
        // Check if client has current version
        if (req.headers['if-none-match'] === `"${etag}"`) {
          res.status(304).end()
          return res
        }
      }
      return originalSend.call(this, body)
    }
  } else if (req.path.includes('/api/frontend-suppliers')) {
    // Cache supplier data for 30 minutes
    res.set('Cache-Control', 'public, max-age=1800')
    res.set('Vary', 'Accept-Language, Accept-Encoding')
  } else if (req.path.includes('/api/cdn/') || req.path.includes('/images/')) {
    // Cache static assets for 24 hours
    res.set('Cache-Control', 'public, max-age=86400')
  } else {
    // Default: no cache for dynamic data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
  }
  
  next()
}
