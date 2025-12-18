import { Request, Response, NextFunction } from 'express'
import * as logger from '../common/logger'
import * as env from '../config/env.config'

/**
 * CORS configuration validator middleware
 */
export const corsValidator = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('Origin')
  const method = req.method

  // Validate CORS configuration in development
  if (env.IS_DEVELOPMENT) {
    validateCorsSetup(req, res)
  }

  // Monitor CORS usage patterns
  if (origin && method !== 'OPTIONS') {
    monitorCorsUsage(req)
  }

  next()
}

/**
 * Validate CORS setup and configuration
 */
function validateCorsSetup(req: Request, res: Response) {
  const requiredCorsHeaders = [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers'
  ]
  
  // Check if CORS headers will be set
  res.on('finish', () => {
    const missingHeaders = requiredCorsHeaders.filter(header => !res.getHeader(header))
    
    if (missingHeaders.length > 0 && req.get('Origin')) {
      logger.warn(`Missing CORS headers for ${req.path}:`, missingHeaders)
    }
  })
}

/**
 * Monitor CORS usage patterns for security analysis
 */
function monitorCorsUsage(req: Request) {
  const origin = req.get('Origin')
  const userAgent = req.get('User-Agent')
  const referer = req.get('Referer')
  
  // Detect potentially suspicious CORS patterns
  const suspiciousPatterns = [
    // Localhost origins in production
    { pattern: /localhost|127\.0\.0\.1/, severity: 'MEDIUM', description: 'Localhost origin in production' },
    // File protocol origins
    { pattern: /^file:\/\//, severity: 'HIGH', description: 'File protocol origin' },
    // Suspicious TLDs
    { pattern: /\.(tk|ml|ga|cf)$/, severity: 'MEDIUM', description: 'Suspicious TLD origin' },
    // IP addresses as origins
    { pattern: /^https?:\/\/\d+\.\d+\.\d+\.\d+/, severity: 'MEDIUM', description: 'IP address origin' }
  ]
  
  if (origin) {
    for (const { pattern, severity, description } of suspiciousPatterns) {
      if (pattern.test(origin)) {
        logger.logSecurityEvent(
          `Suspicious CORS origin detected: ${description}`,
          {
            origin,
            userAgent,
            referer,
            path: req.path,
            method: req.method,
            clientIP: req.ip
          },
          severity as any,
          logger.createRequestContext(req)
        )
        break
      }
    }
  }
  
  // Monitor for CORS abuse patterns
  monitorCorsAbuse(req)
}

/**
 * Monitor for CORS abuse patterns
 */
function monitorCorsAbuse(req: Request) {
  const origin = req.get('Origin')
  const clientIP = req.ip
  
  if (!origin || !clientIP) return
  
  // Simple in-memory tracking (in production, use Redis or database)
  const corsTracker = global.corsTracker || (global.corsTracker = new Map())
  const key = `${clientIP}:${origin}`
  const now = Date.now()
  const windowMs = 60000 // 1 minute window
  
  const requests = corsTracker.get(key) || []
  
  // Remove old requests outside the window
  const recentRequests = requests.filter((timestamp: number) => now - timestamp < windowMs)
  recentRequests.push(now)
  
  corsTracker.set(key, recentRequests)
  
  // Check for abuse patterns
  if (recentRequests.length > 100) { // More than 100 requests per minute
    logger.logSecurityEvent(
      'Potential CORS abuse detected',
      {
        origin,
        clientIP,
        requestCount: recentRequests.length,
        timeWindow: `${windowMs / 1000}s`,
        path: req.path,
        userAgent: req.get('User-Agent')
      },
      'HIGH',
      logger.createRequestContext(req)
    )
    
    // Track as security incident
    const { SecurityIncidentTracker } = require('./security')
    SecurityIncidentTracker.trackIncident(
      clientIP,
      'CORS_ABUSE',
      'HIGH',
      {
        origin,
        requestCount: recentRequests.length,
        timeWindow: windowMs
      }
    )
  }
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupCorsTracker(corsTracker, windowMs)
  }
}

/**
 * Clean up old CORS tracking entries
 */
function cleanupCorsTracker(tracker: Map<string, number[]>, windowMs: number) {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  for (const [key, requests] of tracker.entries()) {
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs)
    
    if (recentRequests.length === 0) {
      keysToDelete.push(key)
    } else {
      tracker.set(key, recentRequests)
    }
  }
  
  keysToDelete.forEach(key => tracker.delete(key))
}

/**
 * CORS security report generator
 */
export const generateCorsSecurityReport = () => {
  const corsTracker = global.corsTracker || new Map()
  const now = Date.now()
  const windowMs = 3600000 // 1 hour window
  
  const report = {
    timestamp: new Date().toISOString(),
    totalOrigins: corsTracker.size,
    activeOrigins: 0,
    suspiciousActivity: 0,
    topOrigins: [] as Array<{ origin: string; requests: number }>
  }
  
  const originCounts = new Map<string, number>()
  
  for (const [key, requests] of corsTracker.entries()) {
    const [, origin] = key.split(':')
    const recentRequests = requests.filter((timestamp: number) => now - timestamp < windowMs)
    
    if (recentRequests.length > 0) {
      report.activeOrigins++
      originCounts.set(origin, (originCounts.get(origin) || 0) + recentRequests.length)
      
      if (recentRequests.length > 50) {
        report.suspiciousActivity++
      }
    }
  }
  
  // Get top origins by request count
  report.topOrigins = Array.from(originCounts.entries())
    .map(([origin, requests]) => ({ origin, requests }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10)
  
  return report
}

export default corsValidator
