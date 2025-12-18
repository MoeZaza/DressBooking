import cors from 'cors'
import * as env from '../config/env.config'
import * as logger from '../common/logger'
import getSecurityConfig from '../config/security.config'

// Get environment-specific security configuration
const securityConfig = getSecurityConfig()

/**
 * Enhanced CORS middleware with security configuration
 *
 * @export
 * @returns {*}
 */
export default () => {
  const corsMiddleware = cors(securityConfig.cors)

  return async (req: any, res: any, next: any) => {
    const originalOrigin = req.get('Origin')
    const method = req.method
    const path = req.path

    // Always set basic CORS headers to prevent missing header warnings
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Access-Token, X-CSRF-Token, X-Forwarded-For, X-Real-IP, Access-Control-Allow-Methods, Access-Control-Allow-Headers')
    res.setHeader('Access-Control-Allow-Credentials', 'true')

    // TODO: In development mode, always allow localhost origins
    if (env.IS_DEVELOPMENT && originalOrigin && originalOrigin.includes('localhost')) {
      res.setHeader('Access-Control-Allow-Origin', originalOrigin)
    }

    // Enhanced preflight handling
    if (method === 'OPTIONS') {
      // Set preflight cache duration based on environment
      const maxAge = env.IS_PRODUCTION ? '86400' : '3600' // 24h prod, 1h dev
      res.setHeader('Access-Control-Max-Age', maxAge)

      // Add additional preflight headers
      res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers')

      // Log preflight requests for monitoring
      if (securityConfig.monitoring.enableLogging) {
        logger.logSecurityEvent(
          'CORS preflight request',
          {
            origin: originalOrigin,
            requestedMethod: req.get('Access-Control-Request-Method'),
            requestedHeaders: req.get('Access-Control-Request-Headers'),
            path,
            userAgent: req.get('User-Agent')
          },
          'LOW',
          logger.createRequestContext(req)
        )
      }
    }

    // Enhanced origin validation and logging
    if (originalOrigin) {
      corsMiddleware(req, res, async (err: any) => {
        if (err) {
          // Log CORS violations with detailed information
          logger.logSecurityEvent(
            'CORS violation detected',
            {
              origin: originalOrigin,
              method,
              path,
              userAgent: req.get('User-Agent'),
              referer: req.get('Referer'),
              requestedHeaders: req.get('Access-Control-Request-Headers'),
              clientIP: req.ip,
              timestamp: new Date().toISOString()
            },
            'MEDIUM',
            logger.createRequestContext(req)
          )

          // Track CORS violations as security incidents
          if (securityConfig.monitoring.enableThreatDetection) {
            const { SecurityIncidentTracker } = await import('./security')
            SecurityIncidentTracker.trackIncident(
              req.ip || 'unknown',
              'CORS_VIOLATION',
              'MEDIUM',
              {
                origin: originalOrigin,
                path,
                method
              }
            )
          }

          // Add security headers to error response
          res.setHeader('X-CORS-Error', 'Origin not allowed')
          res.setHeader('X-Security-Policy', 'CORS-Violation-Detected')
        } else {
          // Log successful CORS requests in development
          if (env.IS_DEVELOPMENT && securityConfig.monitoring.enableLogging) {
            logger.logSecurityEvent(
              'CORS request allowed',
              {
                origin: originalOrigin,
                method,
                path
              },
              'LOW',
              logger.createRequestContext(req)
            )
          }
        }
        next(err)
      })
    } else {
      // Handle requests without Origin header (same-origin, mobile apps, etc.)
      corsMiddleware(req, res, next)
    }
  }
}
