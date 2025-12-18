import compression from 'compression'
import { Request, Response } from 'express'
import zlib from 'zlib'

/**
 * Compression middleware configuration for API responses
 */
export const compressionMiddleware = compression({
  // Only compress responses larger than 1KB
  threshold: 1024,

  // Compression level (1-9, 6 is default balance of speed/compression)
  level: 6,

  // Memory level (1-9, 8 is default)
  memLevel: 8,

  // Compression strategy
  strategy: zlib.constants.Z_DEFAULT_STRATEGY,
  
  // Custom filter function to determine what to compress
  filter: (req: Request, res: Response) => {
    // Don't compress if the client doesn't support it
    if (req.headers['x-no-compression']) {
      return false
    }
    
    // Don't compress images, videos, or already compressed files
    const contentType = res.getHeader('content-type') as string
    if (contentType) {
      const skipTypes = [
        'image/',
        'video/',
        'audio/',
        'application/zip',
        'application/gzip',
        'application/x-gzip',
        'application/x-compress',
        'application/x-compressed'
      ]
      
      if (skipTypes.some(type => contentType.includes(type))) {
        return false
      }
    }
    
    // Use compression default filter for everything else
    return compression.filter(req, res)
  }
})

/**
 * High compression middleware for large JSON responses
 */
export const highCompressionMiddleware = compression({
  threshold: 512, // Compress smaller responses
  level: 9, // Maximum compression
  memLevel: 9, // Maximum memory usage for better compression
  strategy: zlib.constants.Z_DEFAULT_STRATEGY,
  filter: (_req: Request, res: Response): boolean => {
    const contentType = res.getHeader('content-type')
    // Only apply high compression to JSON responses
    return typeof contentType === 'string' && contentType.includes('application/json')
  }
})

export default compressionMiddleware
