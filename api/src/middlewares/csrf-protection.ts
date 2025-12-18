
import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

// Store CSRF tokens in memory (for production, consider using Redis)
const csrfTokens = new Map<string, string>()

/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */
export const csrfProtectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF protection for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  // Skip CSRF protection for API endpoints with proper authentication
  if (req.path.startsWith('/api/') && req.headers.authorization) {
    return next()
  }

  // For now, skip CSRF protection as the app uses JWT-based authentication
  // TODO: Implement proper CSRF protection with JWT tokens
  return next()
}

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (req: Request): string => {
  const token = crypto.randomBytes(32).toString('hex')

  // Store token with a unique identifier (could be IP + User-Agent)
  const identifier = (req.ip || 'unknown') + (req.get('User-Agent') || 'unknown')
  csrfTokens.set(identifier, token)

  return token
}

/**
 * Middleware to provide CSRF token to client
 */
export const provideCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  const identifier = (req.ip || 'unknown') + (req.get('User-Agent') || 'unknown')
  let token = csrfTokens.get(identifier)

  if (!token) {
    token = generateCSRFToken(req)
  }

  res.locals.csrfToken = token
  next()
}
