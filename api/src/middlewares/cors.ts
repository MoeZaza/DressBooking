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
  const corsMiddleware = cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true)

      // Validate origin against whitelist
      const allowedOrigins = [
        env.FRONTEND_HOST,
        env.BACKEND_HOST,
        'http://localhost:3000',
        'http://localhost:3001',
      ].filter(Boolean) as string[]

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        // Log CORS violation for security monitoring
        logger.logSecurityEvent(
          'CORS violation detected',
          {
            origin: origin || 'unknown',
            requestedMethod: origin ? 'N/A (same-origin)' : 'cross-origin',
            requestedHeaders: 'Origin',
            path: 'N/A',
            userAgent: origin ? 'N/A (same-origin)' : 'cross-origin',
            referer: origin ? 'N/A (same-origin)' : 'cross-origin',
            clientIP: origin ? 'N/A (same-origin)' : 'cross-origin',
            timestamp: new Date().toISOString()
          },
          'LOW'
        )

        callback(new Error(`Origin not allowed by CORS policy`))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'X-Access-Token',
      'X-Forwarded-For',
      'X-Real-IP',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers'
    ],
    maxAge: securityConfig.monitoring ? 86400 : 86400, // 24 hours
  })

  return corsMiddleware
}
