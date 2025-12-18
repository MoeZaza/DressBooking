import { CorsOptions } from 'cors'
import * as env from './env.config'

/**
 * Environment-aware security configuration
 */
export interface SecurityConfig {
  csp: CSPConfig
  cors: CorsOptions
  headers: SecurityHeaders
  rateLimit: RateLimitConfig
  monitoring: MonitoringConfig
}

/**
 * Content Security Policy configuration
 */
export interface CSPConfig {
  directives: Record<string, string[]>
  reportOnly: boolean
  reportUri?: string
  useNonces: boolean
  upgradeInsecureRequests: boolean
}

/**
 * Security headers configuration
 */
export interface SecurityHeaders {
  hsts: {
    maxAge: number
    includeSubDomains: boolean
    preload: boolean
  }
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'
  contentTypeOptions: boolean
  referrerPolicy: string
  permissionsPolicy: Record<string, string[]>
  crossOriginEmbedderPolicy: boolean
  crossOriginOpenerPolicy: string
  crossOriginResourcePolicy: string
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  general: {
    windowMs: number
    max: number
    message: string
  }
  auth: {
    windowMs: number
    max: number
    message: string
  }
  payment: {
    windowMs: number
    max: number
    message: string
  }
}

/**
 * Security monitoring configuration
 */
export interface MonitoringConfig {
  enableLogging: boolean
  enableThreatDetection: boolean
  blockSuspiciousRequests: boolean
  ipBlocking: {
    enabled: boolean
    threshold: number
    duration: number
  }
  adminWhitelist: string[]
}

/**
 * Get environment-specific security configuration
 */
export function getSecurityConfig(): SecurityConfig {
  const baseConfig: SecurityConfig = {
    csp: getCSPConfig(),
    cors: getCORSConfig(),
    headers: getSecurityHeaders(),
    rateLimit: getRateLimitConfig(),
    monitoring: getMonitoringConfig()
  }

  // Environment-specific overrides
  if (env.IS_DEVELOPMENT) {
    return getDevelopmentConfig(baseConfig)
  } else if (env.IS_STAGING) {
    return getStagingConfig(baseConfig)
  } else {
    return getProductionConfig(baseConfig)
  }
}

/**
 * Base Content Security Policy configuration
 */
function getCSPConfig(): CSPConfig {
  const baseDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Payment gateways
      'https://js.stripe.com',
      'https://www.paypal.com',
      'https://www.paypalobjects.com',
      // Google services (reCAPTCHA, Analytics, Sign-In)
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://accounts.google.com',
      'https://apis.google.com',
      // Facebook
      'https://connect.facebook.net',
      // CDNs
      'https://cdnjs.cloudflare.com',
      'https://cdn.jsdelivr.net'
    ],
    'style-src': [
      "'self'",
      // Google Fonts
      'https://fonts.googleapis.com',
      // CDNs
      'https://cdnjs.cloudflare.com',
      'https://cdn.jsdelivr.net'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdnjs.cloudflare.com',
      'https://cdn.jsdelivr.net'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      // Allow HTTPS images from any source
      'https:',
      // BookDress CDN
      'https://cdn.bookdress.com',
      'https://images.bookdress.com',
      // Payment providers
      'https://www.paypal.com',
      'https://www.paypalobjects.com',
      // Google services
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://www.google-analytics.com'
    ],
    'connect-src': [
      "'self'",
      // API endpoints
      'https://api.bookdress.com',
      // Payment gateways
      'https://api.stripe.com',
      'https://api.paypal.com',
      'https://www.paypal.com',
      // Google services
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://accounts.google.com',
      'https://www.googleapis.com',
      'https://oauth2.googleapis.com',
      // Facebook
      'https://graph.facebook.com',
      'https://connect.facebook.net',
      // Development WebSockets
      ...(env.IS_DEVELOPMENT ? ['wss://localhost:*', 'ws://localhost:*', 'http://localhost:*'] : [])
    ],
    'frame-src': [
      "'self'",
      // Payment gateways
      'https://js.stripe.com',
      'https://www.paypal.com',
      'https://www.paypalobjects.com',
      // Google services
      'https://www.google.com',
      'https://www.gstatic.com'
    ],
    'object-src': ["'none'"],
    'media-src': ["'self'", 'blob:', 'data:'],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'child-src': ["'self'", 'blob:'],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"]
    // Note: upgrade-insecure-requests removed to avoid report-only policy issues
  }

  // Remove undefined values and ensure proper typing
  const directives: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(baseDirectives)) {
    if (value !== undefined) {
      directives[key] = value
    }
  }

  return {
    directives,
    reportOnly: env.SECURITY_CONFIG.CSP_REPORT_ONLY,
    reportUri: env.SECURITY_CONFIG.CSP_REPORT_URI,
    useNonces: !env.IS_DEVELOPMENT,
    upgradeInsecureRequests: env.IS_PRODUCTION
  }
}

/**
 * CORS configuration
 */
function getCORSConfig(): CorsOptions {
  const allowedOrigins = [
    env.BACKEND_HOST.replace(/\/$/, ''),
    env.FRONTEND_HOST.replace(/\/$/, ''),
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4002',
    'https://bookdress.com',
    'https://admin.bookdress.com',
    'https://api.bookdress.com'
  ].filter(Boolean)

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true)
      }

      // In development, be more permissive with localhost origins
      if (env.IS_DEVELOPMENT && origin.includes('localhost')) {
        return callback(null, true)
      }

      const cleanOrigin = origin.replace(/\/$/, '')
      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true)
      } else {
        // In development, log but allow the request
        if (env.IS_DEVELOPMENT) {
          console.warn(`CORS: Origin ${origin} not in allowlist but allowing in development`)
          return callback(null, true)
        }
        callback(new Error(`CORS: Origin ${origin} not allowed`))
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400, // 24 hours
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Access-Token',
      'X-CSRF-Token',
      'X-Forwarded-For',
      'X-Real-IP',
      'X-Playwright-Test',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Rate-Limit-Limit',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ]
  }
}

/**
 * Security headers configuration
 */
function getSecurityHeaders(): SecurityHeaders {
  return {
    hsts: {
      maxAge: env.SECURITY_CONFIG.HSTS_MAX_AGE,
      includeSubDomains: env.SECURITY_CONFIG.HSTS_INCLUDE_SUBDOMAINS,
      preload: env.SECURITY_CONFIG.HSTS_PRELOAD
    },
    frameOptions: 'DENY',
    contentTypeOptions: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      // Disable potentially dangerous features
      'camera': ["'none'"],
      'microphone': ["'none'"],
      'usb': ["'none'"],
      'bluetooth': ["'none'"],
      'magnetometer': ["'none'"],
      'gyroscope': ["'none'"],
      'accelerometer': ["'none'"],
      'ambient-light-sensor': ["'none'"],
      'autoplay': ["'none'"],
      'encrypted-media': ["'none'"],
      'picture-in-picture': ["'none'"],
      'display-capture': ["'none'"],
      'screen-wake-lock': ["'none'"],
      'web-share': ["'none'"],
      'xr-spatial-tracking': ["'none'"],

      // Allow necessary features
      'geolocation': ["'self'"],
      'payment': ["'self'", 'https://js.stripe.com', 'https://www.paypal.com'],
      'fullscreen': ["'self'"],
      'clipboard-read': ["'none'"],
      'clipboard-write': ["'self'"],
      'notifications': ["'self'"],
      'push': ["'self'"],
      'sync-xhr': ["'self'"],
      'document-domain': ["'none'"]
    },
    crossOriginEmbedderPolicy: false, // Allow CDN images
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'cross-origin'
  }
}

/**
 * Rate limiting configuration
 */
function getRateLimitConfig(): RateLimitConfig {
  return {
    general: {
      windowMs: env.SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
      max: env.SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
      message: 'Too many requests from this IP, please try again later.'
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: env.SECURITY_CONFIG.AUTH_RATE_LIMIT_MAX,
      message: 'Too many authentication attempts, please try again later.'
    },
    payment: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: env.SECURITY_CONFIG.PAYMENT_RATE_LIMIT_MAX,
      message: 'Too many payment attempts, please try again later.'
    }
  }
}

/**
 * Security monitoring configuration
 */
function getMonitoringConfig(): MonitoringConfig {
  return {
    enableLogging: env.SECURITY_CONFIG.ENABLE_SECURITY_LOGGING,
    enableThreatDetection: env.SECURITY_CONFIG.ENABLE_THREAT_DETECTION,
    blockSuspiciousRequests: env.SECURITY_CONFIG.BLOCK_SUSPICIOUS_REQUESTS,
    ipBlocking: {
      enabled: env.SECURITY_CONFIG.ENABLE_IP_BLOCKING,
      threshold: env.SECURITY_CONFIG.IP_BLOCK_THRESHOLD,
      duration: env.SECURITY_CONFIG.IP_BLOCK_DURATION
    },
    adminWhitelist: env.SECURITY_CONFIG.ADMIN_IP_WHITELIST
  }
}

/**
 * Development environment configuration
 */
function getDevelopmentConfig(baseConfig: SecurityConfig): SecurityConfig {
  return {
    ...baseConfig,
    csp: {
      ...baseConfig.csp,
      reportOnly: true, // Always report-only in development
      useNonces: false, // Disable nonces for easier development
      directives: {
        ...baseConfig.csp.directives,
        'script-src': [
          ...baseConfig.csp.directives['script-src'],
          "'unsafe-eval'", // Allow eval for development tools
          "'unsafe-inline'", // Allow inline scripts for development
          'http://localhost:*',
          'ws://localhost:*',
          'wss://localhost:*'
        ],
        'style-src': [
          ...baseConfig.csp.directives['style-src'],
          "'unsafe-inline'" // Allow inline styles for development
        ],
        'connect-src': [
          ...baseConfig.csp.directives['connect-src'],
          'http://localhost:*',
          'ws://localhost:*',
          'wss://localhost:*'
        ]
      }
    },
    headers: {
      ...baseConfig.headers,
      hsts: {
        ...baseConfig.headers.hsts,
        maxAge: 0, // Disable HSTS in development
        includeSubDomains: false,
        preload: false
      }
    },
    rateLimit: {
      ...baseConfig.rateLimit,
      general: {
        ...baseConfig.rateLimit.general,
        max: 1000 // Higher limits for development
      },
      auth: {
        ...baseConfig.rateLimit.auth,
        max: 50 // Higher limits for development
      },
      payment: {
        ...baseConfig.rateLimit.payment,
        max: 100 // Higher limits for development
      }
    },
    monitoring: {
      ...baseConfig.monitoring,
      enableLogging: true, // Keep logging for debugging
      enableThreatDetection: false, // Disable threat detection in development
      blockSuspiciousRequests: false, // Never block in development
      ipBlocking: {
        ...baseConfig.monitoring.ipBlocking,
        enabled: false // Disable IP blocking in development
      },
      adminWhitelist: [] // Empty whitelist in development (allow all)
    }
  }
}

/**
 * Staging environment configuration
 */
function getStagingConfig(baseConfig: SecurityConfig): SecurityConfig {
  return {
    ...baseConfig,
    csp: {
      ...baseConfig.csp,
      reportOnly: true // Keep report-only in staging for testing
    },
    monitoring: {
      ...baseConfig.monitoring,
      blockSuspiciousRequests: true,
      ipBlocking: {
        ...baseConfig.monitoring.ipBlocking,
        enabled: true,
        threshold: 20 // Higher threshold in staging
      }
    }
  }
}

/**
 * Production environment configuration
 */
function getProductionConfig(baseConfig: SecurityConfig): SecurityConfig {
  return {
    ...baseConfig,
    csp: {
      ...baseConfig.csp,
      reportOnly: false, // Enforce CSP in production
      directives: {
        ...baseConfig.csp.directives,
        'script-src': baseConfig.csp.directives['script-src'].filter(src => 
          !src.includes('unsafe-eval') && !src.includes('localhost')
        )
      }
    },
    headers: {
      ...baseConfig.headers,
      hsts: {
        ...baseConfig.headers.hsts,
        maxAge: 31536000, // 1 year in production
        preload: true
      }
    },
    monitoring: {
      ...baseConfig.monitoring,
      blockSuspiciousRequests: true,
      ipBlocking: {
        ...baseConfig.monitoring.ipBlocking,
        enabled: true
      }
    }
  }
}

export default getSecurityConfig
