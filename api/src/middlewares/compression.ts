import compression from 'compression'
import { Request, Response } from 'express'

/**
 * Compression middleware configuration for API responses
 * Provides additional compression for large JSON responses on specific routes
 */
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    // Don't compress if client explicitly requests no compression
    if (req.headers['x-no-compression']) {
      return false
    }
    // Use compression default filter for everything else
    return compression.filter(req, res)
  },
  level: 6, // Good balance between compression ratio and speed
  threshold: 1024, // Only compress responses larger than 1KB
})
