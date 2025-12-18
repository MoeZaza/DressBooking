import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import * as logger from '../common/logger.js'
// import { SecurityError, ErrorCode } from '../common/errors.js'
// import BackendValidationService from '../services/ValidationService'
// import BackendXSSProtectionService from '../services/XSSProtectionService'
import SecurityMonitoringService from '../services/SecurityMonitoringService'

/**
 * Enhanced rate limiting with IP-based tracking
 */
export const enhancedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    // Different limits based on endpoint sensitivity
    if (req.path.includes('/auth/')) return 5 // Auth endpoints
    if (req.path.includes('/payment/')) return 10 // Payment endpoints
    if (req.path.includes('/upload/')) return 5 // Upload endpoints
    return 100 // General endpoints
  },
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const context = logger.createRequestContext(req)
    
    // Log rate limit violation
    logger.logSecurityEvent(
      'Rate limit exceeded',
      {
        clientIP: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      },
      'MEDIUM',
      context
    )

    // Record security incident
    SecurityMonitoringService.recordIncident({
      type: 'RATE_LIMIT_EXCEEDED' as any,
      severity: 'MEDIUM' as any,
      description: 'Rate limit exceeded',
      clientIP: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      threats: [],
      blocked: true
    })

    res.status(429).json({
      error: 'Too many requests from this IP',
      retryAfter: '15 minutes'
    })
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health'
  }
})

/**
 * Progressive delay for suspicious activity
 */
export const progressiveDelay = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // Allow 10 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  // onLimitReached: (req: Request, res: Response) => {
  //   const context = logger.createRequestContext(req)
  //
  //   logger.logSecurityEvent(
  //     'Progressive delay limit reached',
  //     {
  //       clientIP: req.ip,
  //       userAgent: req.get('User-Agent'),
  //       endpoint: req.path
  //     },
  //     'MEDIUM',
  //     context
  //   )
  // }
})

/**
 * Comprehensive request validation middleware
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const context = logger.createRequestContext(req)
  
  try {
    const requestContext = {
      clientIP: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date()
    }

    // Monitor request with security service
    const analysis = SecurityMonitoringService.monitorRequest(req)
    
    if (analysis.shouldBlock) {
      logger.logSecurityEvent(
        'Request blocked by security analysis',
        {
          riskScore: analysis.riskScore,
          threats: analysis.threats,
          recommendations: analysis.recommendations,
          clientIP: requestContext.clientIP,
          endpoint: req.path
        },
        'HIGH',
        context
      )

      res.status(403).json({
        error: 'Request blocked due to security threats',
        riskScore: analysis.riskScore,
        blocked: true
      })
      return
    }

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Add security analysis to request for downstream middleware
    req.securityAnalysis = analysis
    
    next()
  } catch (error) {
    logger.logSecurityEvent(
      'Error in request validation',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'HIGH',
      context
    )
    next(error)
  }
}

/**
 * Content type validation middleware
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.get('Content-Type')
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        const context = logger.createRequestContext(req)
        
        logger.logSecurityEvent(
          'Invalid content type',
          {
            contentType,
            allowedTypes,
            endpoint: req.path,
            method: req.method
          },
          'MEDIUM',
          context
        )

        res.status(415).json({
          error: 'Unsupported Media Type',
          allowedTypes
        })
        return
      }
    }
    
    next()
  }
}

/**
 * Request size validation middleware
 */
export const validateRequestSize = (maxSize: number = 10 * 1024 * 1024) => { // 10MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('Content-Length') || '0')
    
    if (contentLength > maxSize) {
      const context = logger.createRequestContext(req)
      
      logger.logSecurityEvent(
        'Request size exceeded',
        {
          contentLength,
          maxSize,
          endpoint: req.path,
          method: req.method
        },
        'MEDIUM',
        context
      )

      res.status(413).json({
        error: 'Request entity too large',
        maxSize: `${maxSize} bytes`
      })
      return
    }
    
    next()
  }
}

/**
 * User agent validation middleware
 */
export const validateUserAgent = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.get('User-Agent')
  const context = logger.createRequestContext(req)
  
  // Block requests without user agent (potential bots)
  if (!userAgent) {
    logger.logSecurityEvent(
      'Request without user agent',
      {
        clientIP: req.ip,
        endpoint: req.path,
        method: req.method
      },
      'MEDIUM',
      context
    )

    res.status(400).json({
      error: 'User-Agent header is required'
    })
    return
  }

  // Check for suspicious user agents
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /openvas/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i
  ]

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.logSecurityEvent(
      'Suspicious user agent detected',
      {
        userAgent,
        clientIP: req.ip,
        endpoint: req.path
      },
      'HIGH',
      context
    )

    SecurityMonitoringService.recordIncident({
      type: 'SUSPICIOUS_REQUEST' as any,
      severity: 'HIGH' as any,
      description: 'Suspicious user agent detected',
      clientIP: req.ip || 'unknown',
      userAgent,
      endpoint: req.path,
      method: req.method,
      threats: [],
      blocked: true
    })

    res.status(403).json({
      error: 'Suspicious user agent detected'
    })
    return
  }

  next()
}

/**
 * Origin validation middleware
 */
export const validateOrigin = (allowedOrigins: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.get('Origin')
    const referer = req.get('Referer')
    const context = logger.createRequestContext(req)

    // Skip validation for same-origin requests
    if (!origin && !referer) {
      return next()
    }

    const requestOrigin = origin || (referer ? new URL(referer).origin : '')

    if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
      logger.logSecurityEvent(
        'Invalid origin detected',
        {
          origin: requestOrigin,
          allowedOrigins,
          clientIP: req.ip,
          endpoint: req.path
        },
        'HIGH',
        context
      )

      res.status(403).json({
        error: 'Origin not allowed'
      })
      return
    }

    next()
  }
}

/**
 * SQL injection detection middleware
 */
export const detectSQLInjection = (req: Request, res: Response, next: NextFunction): void => {
  const context = logger.createRequestContext(req)
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bFROM\b)/gi,
    /\b(DROP|DELETE|UPDATE|INSERT)\b.*\b(TABLE|FROM|INTO)\b/gi,
    /\bOR\s+1\s*=\s*1/gi,
    /\bAND\s+1\s*=\s*1/gi,
    /\b(EXEC|EXECUTE)\b/gi
  ]

  const checkForSQL = (obj: any, path: string = ''): boolean => {
    if (typeof obj === 'string') {
      return sqlPatterns.some(pattern => pattern.test(obj))
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).some(([key, value]) => 
        checkForSQL(value, path ? `${path}.${key}` : key)
      )
    }
    return false
  }

  if (checkForSQL(req.body) || checkForSQL(req.query) || checkForSQL(req.params)) {
    logger.logSecurityEvent(
      'SQL injection attempt detected',
      {
        body: req.body,
        query: req.query,
        params: req.params,
        clientIP: req.ip,
        endpoint: req.path
      },
      'CRITICAL',
      context
    )

    SecurityMonitoringService.recordIncident({
      type: 'SQL_INJECTION_ATTEMPT' as any,
      severity: 'CRITICAL' as any,
      description: 'SQL injection attempt detected',
      clientIP: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      payload: { body: req.body, query: req.query, params: req.params },
      threats: [],
      blocked: true
    })

    res.status(403).json({
      error: 'Malicious request detected'
    })
    return
  }

  next()
}

/**
 * NoSQL injection detection middleware
 */
export const detectNoSQLInjection = (req: Request, res: Response, next: NextFunction): void => {
  const context = logger.createRequestContext(req)
  const nosqlPatterns = [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$regex/gi,
    /\$or/gi,
    /\$and/gi
  ]

  const checkForNoSQL = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return nosqlPatterns.some(pattern => pattern.test(obj))
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj).some(key => 
        nosqlPatterns.some(pattern => pattern.test(key)) || checkForNoSQL(obj[key])
      )
    }
    return false
  }

  if (checkForNoSQL(req.body) || checkForNoSQL(req.query) || checkForNoSQL(req.params)) {
    logger.logSecurityEvent(
      'NoSQL injection attempt detected',
      {
        body: req.body,
        query: req.query,
        params: req.params,
        clientIP: req.ip,
        endpoint: req.path
      },
      'CRITICAL',
      context
    )

    SecurityMonitoringService.recordIncident({
      type: 'SQL_INJECTION_ATTEMPT' as any, // Using same type for NoSQL
      severity: 'CRITICAL' as any,
      description: 'NoSQL injection attempt detected',
      clientIP: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      payload: { body: req.body, query: req.query, params: req.params },
      threats: [],
      blocked: true
    })

    res.status(403).json({
      error: 'Malicious request detected'
    })
    return
  }

  next()
}

/**
 * Security middleware stack for different endpoint types
 */
export const securityStack = {
  // Basic security for all endpoints
  basic: [
    enhancedRateLimit,
    validateUserAgent,
    validateRequest
  ],
  
  // Enhanced security for sensitive endpoints
  enhanced: [
    enhancedRateLimit,
    progressiveDelay,
    validateUserAgent,
    validateContentType(['application/json']),
    validateRequestSize(5 * 1024 * 1024), // 5MB
    detectSQLInjection,
    detectNoSQLInjection,
    validateRequest
  ],
  
  // Maximum security for critical endpoints
  critical: [
    enhancedRateLimit,
    progressiveDelay,
    validateUserAgent,
    validateContentType(['application/json']),
    validateRequestSize(1 * 1024 * 1024), // 1MB
    detectSQLInjection,
    detectNoSQLInjection,
    validateOrigin(['http://localhost:3000', 'https://bookdress.com']),
    validateRequest
  ]
}

export default securityStack
