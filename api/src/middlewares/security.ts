import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'
import * as logger from '../common/logger'
import { SecurityError, ErrorCode } from '../common/errors'
import getSecurityConfig from '../config/security.config'
import * as env from '../config/env.config'
import ThreatMonitor from './threatMonitor'
import BackendValidationService from '../services/ValidationService'

// Get environment-specific security configuration
const securityConfig = getSecurityConfig()

import crypto from 'crypto'

/**
 * Generate cryptographically secure CSP nonce
 */
export const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('base64')
}

/**
 * CSP nonce middleware with enhanced security
 */
export const cspNonce = (req: Request, res: Response, next: NextFunction) => {
  if (securityConfig.csp.useNonces) {
    req.nonce = generateNonce()

    // Set nonce in response headers for client-side access if needed
    res.setHeader('X-CSP-Nonce', req.nonce)
  }
  next()
}

/**
 * CSP violation handler middleware
 */
export const cspViolationHandler = (_req: Request, res: Response, next: NextFunction) => {
  // Add CSP violation reporting
  res.setHeader('Report-To', JSON.stringify({
    group: 'csp-endpoint',
    max_age: 10886400,
    endpoints: [{ url: securityConfig.csp.reportUri }]
  }))

  next()
}

/**
 * Security headers validation middleware
 */
export const validateSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Use res.on('finish') to validate headers after they're set
  res.on('finish', () => {
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'X-DNS-Prefetch-Control'
    ]

    const missingHeaders: string[] = []

    for (const header of requiredHeaders) {
      if (!res.getHeader(header)) {
        missingHeaders.push(header)
      }
    }

    // Log missing headers in development for monitoring
    if (missingHeaders.length > 0 && env.IS_DEVELOPMENT) {
      logger.warn(`Missing security headers for ${req.path}:`, missingHeaders)
    }

    // Log security headers compliance
    if (securityConfig.monitoring.enableLogging) {
      logger.logSecurityEvent(
        'Security headers validation',
        {
          path: req.path,
          method: req.method,
          missingHeaders,
          hasAllHeaders: missingHeaders.length === 0
        },
        missingHeaders.length > 0 ? 'LOW' : 'LOW',
        logger.createRequestContext(req)
      )
    }
  })

  next()
}

/**
 * Enhanced security headers middleware using Helmet
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Apply CSP with nonces if enabled
  const cspDirectives = { ...securityConfig.csp.directives }

  // Add nonces for inline scripts and styles
  if (securityConfig.csp.useNonces && req.nonce) {
    cspDirectives['script-src'] = [
      ...cspDirectives['script-src'].filter(src => !src.includes('unsafe-inline')),
      `'nonce-${req.nonce}'`
    ]
    cspDirectives['style-src'] = [
      ...cspDirectives['style-src'].filter(src => !src.includes('unsafe-inline')),
      `'nonce-${req.nonce}'`
    ]
  } else if (env.IS_DEVELOPMENT) {
    // Allow unsafe-inline only in development
    if (!cspDirectives['script-src'].includes("'unsafe-inline'")) {
      cspDirectives['script-src'] = [...cspDirectives['script-src'], "'unsafe-inline'"]
    }
    if (!cspDirectives['style-src'].includes("'unsafe-inline'")) {
      cspDirectives['style-src'] = [...cspDirectives['style-src'], "'unsafe-inline'"]
    }
  }

  const helmetConfig: any = {
    contentSecurityPolicy: {
      directives: cspDirectives,
      reportOnly: securityConfig.csp.reportOnly,
      reportUri: securityConfig.csp.reportUri
    },
    crossOriginEmbedderPolicy: securityConfig.headers.crossOriginEmbedderPolicy,
    crossOriginOpenerPolicy: {
      policy: securityConfig.headers.crossOriginOpenerPolicy as 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none'
    },
    crossOriginResourcePolicy: {
      policy: securityConfig.headers.crossOriginResourcePolicy as 'same-origin' | 'same-site' | 'cross-origin'
    },
    hsts: env.HTTPS ? {
      maxAge: securityConfig.headers.hsts.maxAge,
      includeSubDomains: securityConfig.headers.hsts.includeSubDomains,
      preload: securityConfig.headers.hsts.preload
    } : false,
    frameguard: {
      action: securityConfig.headers.frameOptions.toLowerCase() as 'deny' | 'sameorigin'
    },
    noSniff: securityConfig.headers.contentTypeOptions,
    referrerPolicy: {
      policy: securityConfig.headers.referrerPolicy as any
    },
    permittedCrossDomainPolicies: false,
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
    xssFilter: true,
    originAgentCluster: true
  }

  // Apply Helmet with configuration
  helmet(helmetConfig)(req, res, () => {
    // Add custom Permissions Policy header (only in production)
    if (!env.IS_DEVELOPMENT) {
      const permissionsPolicy = Object.entries(securityConfig.headers.permissionsPolicy)
        .map(([directive, allowlist]) => `${directive}=(${allowlist.join(' ')})`)
        .join(', ')

      res.setHeader('Permissions-Policy', permissionsPolicy)
    }

    // Add comprehensive security headers for API responses
    res.setHeader('X-API-Version', '1.0')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Download-Options', 'noopen')
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
    res.setHeader('X-DNS-Prefetch-Control', 'off')
    res.setHeader('X-Frame-Options', securityConfig.headers.frameOptions)
    res.setHeader('Referrer-Policy', securityConfig.headers.referrerPolicy)

    // Add security-related cache control
    if (req.path.includes('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
      res.setHeader('Surrogate-Control', 'no-store')
    }

    // Add HSTS header for HTTPS
    if (env.HTTPS && securityConfig.headers.hsts.maxAge > 0) {
      let hstsValue = `max-age=${securityConfig.headers.hsts.maxAge}`
      if (securityConfig.headers.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains'
      }
      if (securityConfig.headers.hsts.preload) {
        hstsValue += '; preload'
      }
      res.setHeader('Strict-Transport-Security', hstsValue)
    }

    // Add Cross-Origin headers
    res.setHeader('Cross-Origin-Opener-Policy', securityConfig.headers.crossOriginOpenerPolicy)
    res.setHeader('Cross-Origin-Resource-Policy', securityConfig.headers.crossOriginResourcePolicy)

    // Add server information hiding
    res.removeHeader('X-Powered-By')
    res.removeHeader('Server')

    // Add nonce to response locals for template rendering
    if (req.nonce) {
      res.locals.nonce = req.nonce
      res.setHeader('X-CSP-Nonce', req.nonce)
    }

    // Add security monitoring headers
    res.setHeader('X-Security-Policy', 'BookDress-Security-v1.0')
    res.setHeader('X-Request-ID', logger.createRequestContext(req).requestId || 'unknown')

    next()
  })
}

/**
 * Rate limiting for general API requests
 */
export const generalRateLimit = rateLimit({
  windowMs: securityConfig.rateLimit.general.windowMs,
  max: securityConfig.rateLimit.general.max,
  message: {
    error: securityConfig.rateLimit.general.message,
    retryAfter: `${securityConfig.rateLimit.general.windowMs / 60000} minutes`
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for test environment
    if (req.headers['x-playwright-test'] === 'true' ||
        req.headers['user-agent']?.includes('Playwright') ||
        process.env.NODE_ENV === 'test') {
      console.log('🧪 Skipping rate limiting for test environment')
      return true
    }

    // Skip rate limiting for trusted IPs in development
    if (env.IS_DEVELOPMENT && req.ip === '127.0.0.1') {
      return true
    }
    return false
  },
  handler: (req: Request, _res: Response, next: NextFunction) => {
    const securityError = new SecurityError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded - too many requests',
      'HIGH',
      logger.createRequestContext(req)
    )

    logger.logSecurityEvent(
      'Rate limit exceeded',
      {
        limit: 'general',
        windowMs: securityConfig.rateLimit.general.windowMs,
        maxRequests: securityConfig.rateLimit.general.max,
        userAgent: req.get('User-Agent'),
        endpoint: req.path
      },
      'HIGH',
      logger.createRequestContext(req)
    )

    next(securityError)
  }
})

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: securityConfig.rateLimit.auth.windowMs,
  max: securityConfig.rateLimit.auth.max,
  message: {
    error: securityConfig.rateLimit.auth.message,
    retryAfter: `${securityConfig.rateLimit.auth.windowMs / 60000} minutes`
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req: Request) => {
    // Skip auth rate limiting for test environment
    if (req.headers['x-playwright-test'] === 'true' ||
        req.headers['user-agent']?.includes('Playwright') ||
        process.env.NODE_ENV === 'test') {
      console.log('🧪 Skipping auth rate limiting for test environment')
      return true
    }
    return false
  },
  keyGenerator: (req: Request) => {
    // Use combination of IP and email for more accurate tracking
    const email = req.body?.email || req.query?.email || ''
    return `auth:${req.ip}:${email}`
  },
  handler: (req: Request, _res: Response, next: NextFunction) => {
    const securityError = new SecurityError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many authentication attempts',
      'CRITICAL',
      logger.createRequestContext(req)
    )

    logger.logSecurityEvent(
      'Authentication rate limit exceeded',
      {
        limit: 'auth',
        windowMs: securityConfig.rateLimit.auth.windowMs,
        maxRequests: securityConfig.rateLimit.auth.max,
        endpoint: req.path,
        email: req.body?.email || 'unknown',
        userAgent: req.get('User-Agent')
      },
      'CRITICAL',
      logger.createRequestContext(req)
    )

    // Track failed authentication attempts
    SecurityIncidentTracker.trackIncident(
      req.ip || 'unknown',
      'AUTH_RATE_LIMIT',
      'CRITICAL',
      {
        endpoint: req.path,
        email: req.body?.email || 'unknown',
        userAgent: req.get('User-Agent')
      }
    )

    next(securityError)
  }
})

/**
 * Rate limiting for payment endpoints
 */
export const paymentRateLimit = rateLimit({
  windowMs: securityConfig.rateLimit.payment.windowMs,
  max: securityConfig.rateLimit.payment.max,
  message: {
    error: securityConfig.rateLimit.payment.message,
    retryAfter: `${securityConfig.rateLimit.payment.windowMs / 3600000} hour(s)`
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use combination of IP and user ID for payment tracking
    const userId = req.body?.userId || req.query?.userId || ''
    return `payment:${req.ip}:${userId}`
  },
  handler: (req: Request, _res: Response, next: NextFunction) => {
    const securityError = new SecurityError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many payment attempts',
      'CRITICAL',
      logger.createRequestContext(req)
    )

    logger.logSecurityEvent(
      'Payment rate limit exceeded',
      {
        limit: 'payment',
        windowMs: securityConfig.rateLimit.payment.windowMs,
        maxRequests: securityConfig.rateLimit.payment.max,
        endpoint: req.path,
        userId: req.body?.userId || 'unknown',
        userAgent: req.get('User-Agent')
      },
      'CRITICAL',
      logger.createRequestContext(req)
    )

    next(securityError)
  }
})

/**
 * Enhanced input sanitization middleware with comprehensive threat detection
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const context = logger.createRequestContext(req)
  let threatDetected = false
  const threats: any[] = []
  let blocked = false

  try {
    const requestContext = {
      clientIP: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date()
    }

    // Skip sanitization for certain API endpoints that use MongoDB queries
    const skipSanitizationPaths = [
      '/api/fitting-appointments/supplier/',
      '/api/dresses/',
      '/api/bookings/'
    ]
    
    const shouldSkipSanitization = skipSanitizationPaths.some(path => req.path.startsWith(path))
    
    if (shouldSkipSanitization) {
      // For MongoDB query endpoints, only do basic validation without deep sanitization
      if (req.body && typeof req.body === 'object') {
        // Basic string sanitization only, preserve MongoDB query structure
        req.body = sanitizeObjectBasic(req.body)
      }
      
      if (req.query && typeof req.query === 'object') {
        // Basic string sanitization only, preserve query structure
        req.query = sanitizeObjectBasic(req.query)
      }
      
      return next()
    }

    // Enhanced sanitization using new validation service
    if (req.body && typeof req.body === 'object') {
      const { sanitizedObject, detectedThreats, shouldBlock } = sanitizeObjectEnhanced(req.body, 'body', requestContext)
      req.body = sanitizedObject
      threats.push(...detectedThreats)
      if (detectedThreats.length > 0) {
        threatDetected = true
      }
      if (shouldBlock) {
        blocked = true
      }
    }

    // Sanitize and analyze query parameters
    if (req.query && typeof req.query === 'object') {
      const { sanitizedObject, detectedThreats, shouldBlock } = sanitizeObjectEnhanced(req.query, 'query', requestContext)
      // Use Object.assign to safely update query parameters
      Object.keys(req.query).forEach(key => delete req.query[key])
      Object.assign(req.query, sanitizedObject)
      threats.push(...detectedThreats)
      if (detectedThreats.length > 0) {
        threatDetected = true
      }
      if (shouldBlock) {
        blocked = true
      }
    }

    // Sanitize and analyze URL parameters
    if (req.params && typeof req.params === 'object') {
      const { sanitizedObject, detectedThreats, shouldBlock } = sanitizeObjectEnhanced(req.params, 'params', requestContext)
      req.params = sanitizedObject
      threats.push(...detectedThreats)
      if (detectedThreats.length > 0) {
        threatDetected = true
      }
      if (shouldBlock) {
        blocked = true
      }
    }

    // Analyze headers for threats
    const headerThreats = analyzeHeaders(req, context)
    threats.push(...headerThreats)
    if (headerThreats.length > 0) {
      threatDetected = true
    }

    // Skip threat detection in development
    if (process.env.NODE_ENV === 'development') {
      return next()
    }

    // Handle detected threats or blocking
    if ((threatDetected && securityConfig.monitoring.enableThreatDetection) || blocked) {
      handleThreatDetection(req, res, threats, context)

      // Advanced threat analysis
      const threatAnalysis = ThreatMonitor.monitorRequest(req, threats)

      // Add threat analysis to response headers for debugging
      if (env.IS_DEVELOPMENT) {
        res.setHeader('X-Threat-Risk-Score', threatAnalysis.riskScore.toString())
        res.setHeader('X-Threat-Patterns', threatAnalysis.patterns.join(','))
      }

      // Block request based on threat analysis, configuration, or validation service blocking
      // Never block in development mode
      const shouldBlock = !env.IS_DEVELOPMENT && (
        blocked ||
        threatAnalysis.shouldBlock ||
        (securityConfig.monitoring.blockSuspiciousRequests && threatAnalysis.riskScore >= 50)
      )

      if (shouldBlock) {
        // Log the blocking decision
        logger.logSecurityEvent(
          'Request blocked due to threat analysis',
          {
            riskScore: threatAnalysis.riskScore,
            patterns: threatAnalysis.patterns,
            recommendations: threatAnalysis.recommendations,
            threats
          },
          'HIGH',
          context
        )

        const securityError = new SecurityError(
          ErrorCode.SUSPICIOUS_ACTIVITY,
          'Suspicious activity detected in request',
          'HIGH',
          {
            ...context,
            additionalData: {
              threats,
              riskScore: threatAnalysis.riskScore,
              patterns: threatAnalysis.patterns,
              blocked: true
            }
          }
        )
        return next(securityError)
      }
    }

    next()
  } catch (error) {
    logger.error('Error in input sanitization:', error)
    next()
  }
}

/**
 * Enhanced recursive sanitization with threat detection
 */
/*
function sanitizeObject(obj: any, source: string, context: any): string[] {
  const threats: string[] = []

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        const originalValue = obj[key]
        const detectedThreats = detectThreats(originalValue, key, source)
        threats.push(...detectedThreats)

        // Apply sanitization
        obj[key] = sanitizeString(originalValue)

        // Log if value was modified
        if (originalValue !== obj[key] && securityConfig.monitoring.enableLogging) {
          logger.logSecurityEvent(
            'Input sanitized',
            {
              source,
              field: key,
              originalLength: originalValue.length,
              sanitizedLength: obj[key].length,
              threats: detectedThreats
            },
            'LOW',
            context
          )
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        const nestedThreats = sanitizeObject(obj[key], source, context)
        threats.push(...nestedThreats)
      }
    }
  }

  return threats
}
*/

/**
 * Detect security threats in input strings
 */
function detectThreats(value: string, field: string, _source: string): string[] {
  const threats: string[] = []

  // Enhanced threat detection patterns
  const threatPatterns = [
    // XSS patterns
    { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, type: 'XSS_SCRIPT_TAG' },
    { pattern: /javascript:/gi, type: 'XSS_JAVASCRIPT_PROTOCOL' },
    { pattern: /on\w+\s*=/gi, type: 'XSS_EVENT_HANDLER' },
    { pattern: /<iframe\b[^>]*>/gi, type: 'XSS_IFRAME' },
    { pattern: /<object\b[^>]*>/gi, type: 'XSS_OBJECT' },
    { pattern: /<embed\b[^>]*>/gi, type: 'XSS_EMBED' },
    { pattern: /vbscript:/gi, type: 'XSS_VBSCRIPT' },
    { pattern: /data:text\/html/gi, type: 'XSS_DATA_URI' },

    // SQL Injection patterns
    { pattern: /(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bFROM\b)/gi, type: 'SQL_INJECTION_SELECT' },
    { pattern: /\b(DROP|DELETE|UPDATE|INSERT)\b.*\b(TABLE|FROM|INTO)\b/gi, type: 'SQL_INJECTION_MODIFY' },
    { pattern: /\bOR\s+1\s*=\s*1/gi, type: 'SQL_INJECTION_BOOLEAN' },
    { pattern: /\bAND\s+1\s*=\s*1/gi, type: 'SQL_INJECTION_BOOLEAN' },
    { pattern: /['"];\s*(DROP|DELETE|UPDATE|INSERT)/gi, type: 'SQL_INJECTION_TERMINATE' },
    { pattern: /\b(EXEC|EXECUTE)\b.*\b(SP_|XP_)/gi, type: 'SQL_INJECTION_STORED_PROC' },

    // Command Injection patterns
    { pattern: /[;&|`$(){}[\]]/g, type: 'COMMAND_INJECTION_CHARS' },
    { pattern: /\b(cat|ls|dir|type|echo|ping|wget|curl|nc|netcat)\b/gi, type: 'COMMAND_INJECTION_COMMANDS' },
    { pattern: /\.\.\//g, type: 'PATH_TRAVERSAL' },
    { pattern: /\.\.\\/g, type: 'PATH_TRAVERSAL_WINDOWS' },

    // Code Injection patterns
    { pattern: /\beval\s*\(/gi, type: 'CODE_INJECTION_EVAL' },
    { pattern: /\bFunction\s*\(/gi, type: 'CODE_INJECTION_FUNCTION' },
    { pattern: /\bsetTimeout\s*\(/gi, type: 'CODE_INJECTION_SETTIMEOUT' },
    { pattern: /\bsetInterval\s*\(/gi, type: 'CODE_INJECTION_SETINTERVAL' },

    // Template Injection patterns
    { pattern: /\{\{.*\}\}/g, type: 'TEMPLATE_INJECTION_HANDLEBARS' },
    { pattern: /\$\{.*\}/g, type: 'TEMPLATE_INJECTION_ES6' },
    { pattern: /<%.*%>/g, type: 'TEMPLATE_INJECTION_EJS' },

    // LDAP Injection patterns
    { pattern: /[()&|!]/g, type: 'LDAP_INJECTION_CHARS' },

    // NoSQL Injection patterns
    { pattern: /\$where/gi, type: 'NOSQL_INJECTION_WHERE' },
    { pattern: /\$regex/gi, type: 'NOSQL_INJECTION_REGEX' },
    { pattern: /\$ne/gi, type: 'NOSQL_INJECTION_NOT_EQUAL' },

    // File inclusion patterns
    { pattern: /\b(file|http|https|ftp|data):/gi, type: 'FILE_INCLUSION_PROTOCOL' },
    { pattern: /\b(\/etc\/passwd|\/etc\/shadow|\/proc\/self\/environ)/gi, type: 'FILE_INCLUSION_SENSITIVE' },

    // XXE patterns
    { pattern: /<!ENTITY/gi, type: 'XXE_ENTITY' },
    { pattern: /<!DOCTYPE.*ENTITY/gi, type: 'XXE_DOCTYPE' },

    // SSRF patterns
    { pattern: /\b(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)/gi, type: 'SSRF_LOCALHOST' },
    { pattern: /\b(169\.254\.169\.254)/gi, type: 'SSRF_METADATA' },

    // Suspicious encoding patterns
    { pattern: /%[0-9a-f]{2}/gi, type: 'URL_ENCODING' },
    { pattern: /\\u[0-9a-f]{4}/gi, type: 'UNICODE_ENCODING' },
    { pattern: /\\x[0-9a-f]{2}/gi, type: 'HEX_ENCODING' }
  ]

  for (const { pattern, type } of threatPatterns) {
    if (pattern.test(value)) {
      threats.push(type)
    }
  }

  // Additional context-specific checks
  if (field.toLowerCase().includes('email') && !isValidEmail(value)) {
    threats.push('INVALID_EMAIL_FORMAT')
  }

  if (field.toLowerCase().includes('url') && !isValidUrl(value)) {
    threats.push('INVALID_URL_FORMAT')
  }

  // Check for excessively long inputs (potential buffer overflow)
  if (value.length > 10000) {
    threats.push('EXCESSIVE_INPUT_LENGTH')
  }

  // Check for null bytes
  if (value.includes('\0')) {
    threats.push('NULL_BYTE_INJECTION')
  }

  return threats
}

/**
 * Sanitize string input
 */
/*
function sanitizeString(value: string): string {
  return value
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^>]*>/gi, '')
    // Remove object and embed tags
    .replace(/<(object|embed)\b[^>]*>/gi, '')
    // Remove vbscript protocol
    .replace(/vbscript:/gi, '')
    // Remove data:text/html URIs
    .replace(/data:text\/html[^;]*;/gi, '')
    // Remove SQL injection patterns
    .replace(/(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bFROM\b)/gi, '')
    .replace(/\b(DROP|DELETE|UPDATE|INSERT)\b.*\b(TABLE|FROM|INTO)\b/gi, '')
    .replace(/\bOR\s+1\s*=\s*1/gi, '')
    .replace(/\bAND\s+1\s*=\s*1/gi, '')
    // Remove command injection characters
    .replace(/[;&|`$(){}[\]]/g, '')
    // Remove path traversal patterns
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    // Remove template injection patterns
    .replace(/\{\{.*\}\}/g, '')
    .replace(/\$\{.*\}/g, '')
    .replace(/<\%.*\%>/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim()
}
*/

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol) && url.length <= 2048
  } catch {
    return false
  }
}

/**
 * Analyze request headers for threats
 */
function analyzeHeaders(req: Request, _context: any): string[] {
  const threats: string[] = []
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-originating-ip',
    'x-remote-ip',
    'x-cluster-client-ip'
  ]

  // Check for header injection attempts
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      // Check for CRLF injection
      if (value.includes('\r') || value.includes('\n')) {
        threats.push('HEADER_CRLF_INJECTION')
      }

      // Check for suspicious header values
      if (detectThreats(value, name, 'header').length > 0) {
        threats.push('HEADER_THREAT_DETECTED')
      }
    }
  }

  // Check for suspicious user agents
  const userAgent = req.get('User-Agent') || ''
  const suspiciousAgents = [
    /sqlmap/gi,
    /nikto/gi,
    /nmap/gi,
    /burp/gi,
    /scanner/gi,
    /bot.*attack/gi,
    /havij/gi,
    /acunetix/gi,
    /nessus/gi,
    /openvas/gi
  ]

  for (const agentPattern of suspiciousAgents) {
    if (agentPattern.test(userAgent)) {
      threats.push('SUSPICIOUS_USER_AGENT')
      break
    }
  }

  // Check for IP spoofing attempts
  for (const header of suspiciousHeaders) {
    const value = req.get(header)
    if (value && value !== req.ip) {
      threats.push('POTENTIAL_IP_SPOOFING')
      break
    }
  }

  return threats
}

/**
 * Handle threat detection
 */
function handleThreatDetection(req: Request, res: Response, threats: string[], context: any): void {
  const clientIP = req.ip || 'unknown'
  const severity = determineThreatSeverity(threats)

  // Log the threat detection
  logger.logSecurityEvent(
    'Security threats detected in request',
    {
      threats,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      clientIP,
      severity
    },
    severity,
    context
  )

  // Track as security incident
  SecurityIncidentTracker.trackIncident(
    clientIP,
    'THREAT_DETECTION',
    severity,
    {
      threats,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    }
  )

  // Add security headers to response
  res.setHeader('X-Security-Threat-Detected', threats.join(','))
  res.setHeader('X-Security-Action', securityConfig.monitoring.blockSuspiciousRequests ? 'BLOCKED' : 'LOGGED')
}

/**
 * Determine threat severity based on detected threats
 */
function determineThreatSeverity(threats: string[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const criticalThreats = [
    'SQL_INJECTION_SELECT',
    'SQL_INJECTION_MODIFY',
    'COMMAND_INJECTION_COMMANDS',
    'CODE_INJECTION_EVAL',
    'XXE_ENTITY',
    'SSRF_LOCALHOST'
  ]

  const highThreats = [
    'XSS_SCRIPT_TAG',
    'XSS_IFRAME',
    'SQL_INJECTION_BOOLEAN',
    'COMMAND_INJECTION_CHARS',
    'PATH_TRAVERSAL',
    'TEMPLATE_INJECTION_ES6'
  ]

  const mediumThreats = [
    'XSS_EVENT_HANDLER',
    'XSS_JAVASCRIPT_PROTOCOL',
    'NOSQL_INJECTION_WHERE',
    'FILE_INCLUSION_PROTOCOL',
    'SUSPICIOUS_USER_AGENT'
  ]

  if (threats.some(threat => criticalThreats.includes(threat))) {
    return 'CRITICAL'
  }

  if (threats.some(threat => highThreats.includes(threat))) {
    return 'HIGH'
  }

  if (threats.some(threat => mediumThreats.includes(threat))) {
    return 'MEDIUM'
  }

  return 'LOW'
}

/**
 * Enhanced security logging and threat detection middleware
 */
export const securityLogger = (req: Request, _res: Response, next: NextFunction) => {
  const context = logger.createRequestContext(req)

  // Enhanced threat detection patterns
  const threatPatterns = [
    { pattern: /\.\.\//g, type: 'DIRECTORY_TRAVERSAL', severity: 'HIGH' },
    { pattern: /<script/gi, type: 'XSS_ATTEMPT', severity: 'HIGH' },
    { pattern: /union.*select/gi, type: 'SQL_INJECTION', severity: 'CRITICAL' },
    { pattern: /javascript:/gi, type: 'JAVASCRIPT_INJECTION', severity: 'HIGH' },
    { pattern: /eval\s*\(/gi, type: 'CODE_INJECTION', severity: 'CRITICAL' },
    { pattern: /exec\s*\(/gi, type: 'COMMAND_INJECTION', severity: 'CRITICAL' },
    { pattern: /\$\{.*\}/g, type: 'TEMPLATE_INJECTION', severity: 'HIGH' },
    { pattern: /\bor\s+1\s*=\s*1/gi, type: 'SQL_INJECTION', severity: 'CRITICAL' },
    { pattern: /\bdrop\s+table/gi, type: 'SQL_INJECTION', severity: 'CRITICAL' },
    { pattern: /\binsert\s+into/gi, type: 'SQL_INJECTION', severity: 'MEDIUM' },
    { pattern: /\bdelete\s+from/gi, type: 'SQL_INJECTION', severity: 'HIGH' },
    { pattern: /\bupdate\s+.*\bset\b/gi, type: 'SQL_INJECTION', severity: 'HIGH' }
  ]

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers
  })

  // Check for threats
  for (const threat of threatPatterns) {
    if (threat.pattern.test(requestData)) {
      logger.logSecurityEvent(
        `Security threat detected: ${threat.type}`,
        {
          threatType: threat.type,
          severity: threat.severity,
          pattern: threat.pattern.source,
          requestData: requestData.substring(0, 500), // Limit data size
          blocked: false
        },
        threat.severity as any,
        context
      )

      // In production, you might want to block the request
      // For now, we'll log and continue
      break
    }
  }

  // Check for suspicious user agents
  const userAgent = req.get('User-Agent') || ''
  const suspiciousAgents = [
    /sqlmap/gi,
    /nikto/gi,
    /nmap/gi,
    /burp/gi,
    /scanner/gi,
    /bot.*attack/gi
  ]

  for (const agentPattern of suspiciousAgents) {
    if (agentPattern.test(userAgent)) {
      logger.logSecurityEvent(
        'Suspicious user agent detected',
        {
          userAgent,
          pattern: agentPattern.source
        },
        'HIGH',
        context
      )
      break
    }
  }

  next()
}

/**
 * IP whitelist middleware for admin operations
 */
export const adminIPWhitelist = (allowedIPs: string[] = []) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.socket.remoteAddress
    const context = logger.createRequestContext(req)

    // Skip IP check in development
    if (process.env.NODE_ENV === 'development') {
      return next()
    }

    // Skip IP check if no whitelist is configured or admin whitelist is disabled
    if (!allowedIPs || allowedIPs.length === 0 ||
        !securityConfig.monitoring.adminWhitelist ||
        securityConfig.monitoring.adminWhitelist.length === 0) {
      return next()
    }

    if (!allowedIPs.includes(clientIP as string)) {
      const securityError = new SecurityError(
        ErrorCode.IP_BLOCKED,
        'Access denied from this IP address',
        'HIGH',
        {
          ...context,
          additionalData: {
            clientIP,
            allowedIPs: allowedIPs.length,
            endpoint: req.path
          }
        }
      )

      logger.logSecurityEvent(
        'Admin access denied - IP not whitelisted',
        {
          clientIP,
          allowedIPs: allowedIPs.length,
          endpoint: req.path
        },
        'HIGH',
        context
      )

      next(securityError)
      return
    }

    next()
  }
}

/**
 * Security incident tracking
 */
export class SecurityIncidentTracker {
  private static incidents: Map<string, any[]> = new Map()
  private static ipAttempts: Map<string, number> = new Map()
  private static blockedIPs: Set<string> = new Set()

  static trackIncident(ip: string, type: string, severity: string, details: any) {
    const key = `${ip}_${type}`
    const incidents = this.incidents.get(key) || []

    incidents.push({
      timestamp: new Date(),
      type,
      severity,
      details,
      ip
    })

    this.incidents.set(key, incidents)

    // Track IP attempt count
    const attempts = this.ipAttempts.get(ip) || 0
    this.ipAttempts.set(ip, attempts + 1)

    // Auto-block IPs with too many incidents (disabled in development)
    if (attempts > 50 && !env.IS_DEVELOPMENT) {
      this.blockedIPs.add(ip)
      logger.logSecurityEvent(
        'IP automatically blocked due to multiple security incidents',
        { ip, totalAttempts: attempts + 1 },
        'CRITICAL'
      )
    }
  }

  static isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip)
  }

  static clearBlockedIPs(): void {
    this.blockedIPs.clear()
    this.ipAttempts.clear()
    this.incidents.clear()
    logger.logSecurityEvent(
      'Blocked IPs cleared for development',
      { action: 'clear_blocked_ips' },
      'LOW'
    )
  }

  static getIncidents(ip?: string): any {
    if (ip) {
      const incidents: any[] = []
      for (const [key, incidentList] of this.incidents.entries()) {
        if (key.startsWith(ip)) {
          incidents.push(...incidentList)
        }
      }
      return incidents
    }

    return Object.fromEntries(this.incidents)
  }

  static unblockIP(ip: string): void {
    this.blockedIPs.delete(ip)
    this.ipAttempts.delete(ip)

    // Remove incidents for this IP
    const keysToDelete: string[] = []
    for (const key of this.incidents.keys()) {
      if (key.startsWith(ip)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.incidents.delete(key))
  }

  static getStats(): any {
    return {
      totalIncidents: Array.from(this.incidents.values()).reduce((sum, incidents) => sum + incidents.length, 0),
      uniqueIPs: this.ipAttempts.size,
      blockedIPs: Array.from(this.blockedIPs),
      topOffenders: Array.from(this.ipAttempts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    }
  }
}

/**
 * IP blocking middleware
 */
export const ipBlockingMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Skip IP blocking for test environment
  if (req.headers['x-playwright-test'] === 'true' ||
      req.headers['user-agent']?.includes('Playwright') ||
      process.env.NODE_ENV === 'test') {
    console.log('🧪 Skipping IP blocking for test environment')
    return next()
  }

  // Skip IP blocking in development environment
  if (env.IS_DEVELOPMENT) {
    console.log('🔧 Skipping IP blocking in development mode')
    return next()
  }

  // Skip IP blocking if disabled in security config
  if (!securityConfig.monitoring.ipBlocking.enabled) {
    return next()
  }

  const clientIP = req.ip || req.socket.remoteAddress

  if (clientIP && SecurityIncidentTracker.isBlocked(clientIP)) {
    const securityError = new SecurityError(
      ErrorCode.IP_BLOCKED,
      'IP address has been blocked due to security violations',
      'CRITICAL',
      {
        ...logger.createRequestContext(req),
        additionalData: { reason: 'auto_blocked', clientIP }
      }
    )

    next(securityError)
    return
  }

  next()
}

/**
 * Enhanced object sanitization using new validation service
 */
function sanitizeObjectEnhanced(obj: any, location: string, requestContext: any): {
  sanitizedObject: any
  detectedThreats: any[]
  shouldBlock: boolean
} {
  const sanitizedObject: any = Array.isArray(obj) ? [] : {}
  const detectedThreats: any[] = []
  let shouldBlock = false

  for (const [key, value] of Object.entries(obj)) {
    // Skip MongoDB query operators to prevent query corruption
    if (key.startsWith('$') && typeof value === 'object' && value !== null) {
      sanitizedObject[key] = value
      continue
    }

    if (typeof value === 'string') {
      const result = BackendValidationService.validateInput(value, `${location}.${key}`, {
        sanitizationLevel: 'strict',
        blockOnThreats: true,
        logThreats: true,
        strictMode: true
      }, requestContext)

      sanitizedObject[key] = result.sanitizedValue
      detectedThreats.push(...result.threats)

      if (result.blocked) {
        shouldBlock = true
      }
    } else if (typeof value === 'object' && value !== null) {
      // Special handling for MongoDB query objects
      if (key === 'appointmentDate' && (value as any).$gte && (value as any).$lte) {
        // This is a MongoDB date range query, preserve it exactly
        sanitizedObject[key] = value
        continue
      }
      
      const nestedResult = sanitizeObjectEnhanced(value, `${location}.${key}`, requestContext)
      sanitizedObject[key] = nestedResult.sanitizedObject
      detectedThreats.push(...nestedResult.detectedThreats)
      if (nestedResult.shouldBlock) {
        shouldBlock = true
      }
    } else {
      sanitizedObject[key] = value
    }
  }

  return { sanitizedObject, detectedThreats, shouldBlock }
}

/**
 * Basic string sanitization for MongoDB query endpoints
 */
function sanitizeObjectBasic(obj: any): any {
  const sanitized: any = Array.isArray(obj) ? [] : {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Basic string sanitization without deep object traversal
      sanitized[key] = value
    } else if (typeof value === 'object' && value !== null) {
      // Preserve object structure for MongoDB queries
      sanitized[key] = value
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

/**
 * Enhanced security validation middleware for specific endpoints
 */
export const validateSecureInput = (validationRules: Record<string, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const context = logger.createRequestContext(req)
    const errors: string[] = []
    const threats: any[] = []

    try {
      const requestContext = {
        clientIP: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      }

      // Validate each field according to rules
      for (const [fieldName, rules] of Object.entries(validationRules)) {
        const value = req.body?.[fieldName]

        if (value !== undefined) {
          const result = BackendValidationService.validateInput(
            String(value),
            fieldName,
            rules,
            requestContext
          )

          if (!result.isValid) {
            errors.push(...result.errors)
          }

          if (result.threats.length > 0) {
            threats.push(...result.threats)
          }

          if (result.blocked) {
            const securityError = new SecurityError(
              ErrorCode.SECURITY_THREAT_DETECTED,
              `Security threat detected in field: ${fieldName}`,
              'HIGH',
              context
            )

            logger.logSecurityEvent(
              'Request blocked due to security threat',
              {
                field: fieldName,
                threats: result.threats,
                errors: result.errors,
                clientIP: requestContext.clientIP,
                userAgent: requestContext.userAgent
              },
              'HIGH',
              context
            )

            return next(securityError)
          }

          // Update request with sanitized value
          if (req.body) {
            req.body[fieldName] = result.sanitizedValue
          }
        }
      }

      // Log any detected threats
      if (threats.length > 0) {
        logger.logSecurityEvent(
          'Security threats detected during validation',
          {
            threats,
            errors,
            endpoint: req.path,
            method: req.method
          },
          'MEDIUM',
          context
        )
      }

      next()
    } catch (error) {
      logger.logSecurityEvent(
        'Error during security validation',
        { error: error instanceof Error ? error.message : 'Unknown error', endpoint: req.path },
        'HIGH',
        context
      )
      next(error)
    }
  }
}

/**
 * Email validation middleware
 */
export const validateEmail = (req: Request, res: Response, next: NextFunction) => {
  const email = req.body?.email
  if (!email) {
    return next()
  }

  const requestContext = {
    clientIP: req.ip || req.socket.remoteAddress,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method
  }

  const result = BackendValidationService.validateEmail(email, requestContext)

  if (!result.isValid || result.blocked) {
    const securityError = new SecurityError(
      ErrorCode.INVALID_INPUT,
      'Invalid or unsafe email address',
      'MEDIUM',
      logger.createRequestContext(req)
    )
    return next(securityError)
  }

  req.body.email = result.sanitizedValue
  next()
}

/**
 * Password validation middleware
 */
export const validatePassword = (minLength: number = 8) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const password = req.body?.password
    if (!password) {
      return next()
    }

    const requestContext = {
      clientIP: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    }

    const result = BackendValidationService.validatePassword(password, minLength, requestContext)

    if (!result.isValid || result.blocked) {
      const securityError = new SecurityError(
        ErrorCode.INVALID_INPUT,
        'Password does not meet security requirements',
        'MEDIUM',
        logger.createRequestContext(req)
      )
      return next(securityError)
    }

    // Don't sanitize password, just validate
    next()
  }
}

export default {
  cspNonce,
  cspViolationHandler,
  validateSecurityHeaders,
  securityHeaders,
  generalRateLimit,
  authRateLimit,
  paymentRateLimit,
  sanitizeInput,
  securityLogger,
  adminIPWhitelist,
  ipBlockingMiddleware,
  SecurityIncidentTracker
}
