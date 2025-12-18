/**
 * Frontend Security Configuration
 * Implements CSP, security headers, and client-side security measures
 */

/**
 * Content Security Policy configuration
 */
export interface CSPConfig {
  'default-src': string[]
  'script-src': string[]
  'style-src': string[]
  'img-src': string[]
  'font-src': string[]
  'connect-src': string[]
  'media-src': string[]
  'object-src': string[]
  'child-src': string[]
  'worker-src': string[]
  'frame-src': string[]
  'form-action': string[]
  'base-uri': string[]
  'manifest-src': string[]
  'upgrade-insecure-requests'?: boolean
  'block-all-mixed-content'?: boolean
}

/**
 * Security headers configuration
 */
export interface SecurityHeaders {
  'X-Content-Type-Options': string
  'X-Frame-Options': string
  'X-XSS-Protection': string
  'Referrer-Policy': string
  'Permissions-Policy': string
  'Strict-Transport-Security': string
  'Cross-Origin-Embedder-Policy': string
  'Cross-Origin-Opener-Policy': string
  'Cross-Origin-Resource-Policy': string
}

/**
 * Environment-specific security configuration
 */
export interface SecurityConfig {
  csp: CSPConfig
  headers: SecurityHeaders
  features: {
    enableCSP: boolean
    enableHSTS: boolean
    enableXSSProtection: boolean
    enableClickjackingProtection: boolean
    enableMixedContentBlocking: boolean
    enableReferrerPolicy: boolean
    enablePermissionsPolicy: boolean
  }
  monitoring: {
    enableThreatLogging: boolean
    enablePerformanceMonitoring: boolean
    enableErrorReporting: boolean
    reportUri?: string
  }
}

/**
 * Get current environment
 */
const getEnvironment = (): 'development' | 'production' | 'test' => {
  return (import.meta.env.MODE as 'development' | 'production' | 'test') || 'development'
}

/**
 * Development security configuration
 */
const developmentConfig: SecurityConfig = {
  csp: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Allow inline scripts in development
      "'unsafe-eval'", // Allow eval in development
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://accounts.google.com',
      'https://apis.google.com',
      'https://maps.googleapis.com',
      'https://js.stripe.com',
      'https://www.paypal.com',
      'https://www.paypalobjects.com',
      'https://connect.facebook.net'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Allow inline styles
      'https://fonts.googleapis.com',
      'https://unpkg.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'http:' // Allow HTTP images in development
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'connect-src': [
      "'self'",
      'http://localhost:*',
      'https://api.stripe.com',
      'https://www.paypal.com',
      'https://maps.googleapis.com',
      'https://accounts.google.com',
      'https://www.googleapis.com',
      'https://oauth2.googleapis.com',
      'https://graph.facebook.com',
      'https://connect.facebook.net',
      'ws://localhost:*',
      'wss://localhost:*'
    ],
    'media-src': ["'self'", 'data:', 'blob:'],
    'object-src': ["'none'"],
    'child-src': ["'self'", 'https://js.stripe.com', 'https://www.paypal.com'],
    'worker-src': ["'self'", 'blob:'],
    'frame-src': ["'self'", 'https://js.stripe.com', 'https://www.paypal.com'],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': false // Disabled in development
  },
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Strict-Transport-Security': '', // Disabled in development
    'Cross-Origin-Embedder-Policy': 'unsafe-none',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Resource-Policy': 'cross-origin'
  },
  features: {
    enableCSP: true,
    enableHSTS: false,
    enableXSSProtection: true,
    enableClickjackingProtection: true,
    enableMixedContentBlocking: false,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true
  },
  monitoring: {
    enableThreatLogging: true,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true
  }
}

/**
 * Production security configuration
 */
const productionConfig: SecurityConfig = {
  csp: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://maps.googleapis.com',
      'https://js.stripe.com',
      'https://www.paypal.com',
      'https://www.paypalobjects.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Material-UI
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://www.paypal.com',
      'https://maps.googleapis.com'
    ],
    'media-src': ["'self'", 'data:', 'blob:'],
    'object-src': ["'none'"],
    'child-src': ["'self'", 'https://js.stripe.com', 'https://www.paypal.com'],
    'worker-src': ["'self'", 'blob:'],
    'frame-src': ["'self'", 'https://js.stripe.com', 'https://www.paypal.com'],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true
  },
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  },
  features: {
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
    enableClickjackingProtection: true,
    enableMixedContentBlocking: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true
  },
  monitoring: {
    enableThreatLogging: true,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true,
    reportUri: '/api/security/csp-report'
  }
}

/**
 * Test security configuration
 */
const testConfig: SecurityConfig = {
  ...developmentConfig,
  features: {
    ...developmentConfig.features,
    enableCSP: false // Disable CSP in tests to avoid interference
  },
  monitoring: {
    enableThreatLogging: false,
    enablePerformanceMonitoring: false,
    enableErrorReporting: false
  }
}

/**
 * Get security configuration based on environment
 */
export const getSecurityConfig = (): SecurityConfig => {
  const env = getEnvironment()
  
  switch (env) {
    case 'production':
      return productionConfig
    case 'test':
      return testConfig
    case 'development':
    default:
      return developmentConfig
  }
}

/**
 * Generate CSP header string
 */
export const generateCSPHeader = (config: CSPConfig): string => {
  const directives: string[] = []
  
  for (const [directive, sources] of Object.entries(config)) {
    if (directive === 'upgrade-insecure-requests' && sources === true) {
      directives.push('upgrade-insecure-requests')
    } else if (directive === 'block-all-mixed-content' && sources === true) {
      directives.push('block-all-mixed-content')
    } else if (Array.isArray(sources) && sources.length > 0) {
      directives.push(`${directive} ${sources.join(' ')}`)
    }
  }
  
  return directives.join('; ')
}

/**
 * Apply security headers to document
 */
export const applySecurityHeaders = (config: SecurityConfig): void => {
  // Apply CSP via meta tag (fallback if server headers not available)
  if (config.features.enableCSP) {
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (!existingCSP) {
      const cspMeta = document.createElement('meta')
      cspMeta.httpEquiv = 'Content-Security-Policy'
      cspMeta.content = generateCSPHeader(config.csp)
      document.head.appendChild(cspMeta)
    }
  }

  // Apply other security headers via meta tags where possible
  const securityMetas = [
    { httpEquiv: 'X-Content-Type-Options', content: config.headers['X-Content-Type-Options'] },
    { httpEquiv: 'X-XSS-Protection', content: config.headers['X-XSS-Protection'] },
    { name: 'referrer', content: config.headers['Referrer-Policy'] }
  ]

  securityMetas.forEach(meta => {
    const existing = document.querySelector(`meta[http-equiv="${meta.httpEquiv}"], meta[name="${meta.name}"]`)
    if (!existing && meta.content) {
      const metaElement = document.createElement('meta')
      if ('httpEquiv' in meta) {
        metaElement.httpEquiv = meta.httpEquiv!
      } else {
        metaElement.name = meta.name!
      }
      metaElement.content = meta.content
      document.head.appendChild(metaElement)
    }
  })
}

/**
 * Initialize security monitoring
 */
export const initializeSecurityMonitoring = (config: SecurityConfig): void => {
  if (!config.monitoring.enableThreatLogging) {
    return
  }

  // CSP violation reporting
  document.addEventListener('securitypolicyviolation', (event) => {
    const violation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      timestamp: new Date().toISOString()
    }

    console.warn('CSP Violation:', violation)

    // Send to monitoring endpoint if configured
    if (config.monitoring.reportUri) {
      fetch(config.monitoring.reportUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(violation)
      }).catch(error => {
        console.error('Failed to report CSP violation:', error)
      })
    }
  })

  // Performance monitoring
  if (config.monitoring.enablePerformanceMonitoring) {
    // Monitor for potential security-related performance issues
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) { // Log slow operations
          console.warn('Slow security operation detected:', entry)
        }
      }
    })
    
    observer.observe({ entryTypes: ['measure', 'navigation'] })
  }

  // Error monitoring
  if (config.monitoring.enableErrorReporting) {
    window.addEventListener('error', (event) => {
      // Log security-related errors
      if (event.message.includes('CSP') || event.message.includes('security')) {
        console.error('Security-related error:', event)
      }
    })
  }
}

/**
 * Validate current security configuration
 */
export const validateSecurityConfig = (config: SecurityConfig): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = []
  let isValid = true

  // Check for common security misconfigurations
  if (config.csp['script-src'].includes("'unsafe-eval'") && getEnvironment() === 'production') {
    warnings.push("'unsafe-eval' should not be used in production")
  }

  if (config.csp['script-src'].includes("'unsafe-inline'") && getEnvironment() === 'production') {
    warnings.push("'unsafe-inline' for scripts should be avoided in production")
  }

  if (!config.features.enableHSTS && getEnvironment() === 'production') {
    warnings.push('HSTS should be enabled in production')
  }

  if (config.csp['img-src'].includes('http:') && getEnvironment() === 'production') {
    warnings.push('HTTP image sources should be avoided in production')
  }

  return { isValid, warnings }
}

// Export default configuration
export default getSecurityConfig()
