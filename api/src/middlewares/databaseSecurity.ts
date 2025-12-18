import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import * as logger from '../common/logger.js'
import DatabaseSecurityService from '../services/DatabaseSecurityService'

// Extend Request interface to include database context
declare module 'express-serve-static-core' {
  interface Request {
    databaseContext?: {
      operations: any[]
      securityChecks: any[]
    }
    securityAnalysis?: any
  }
}

/**
 * Database security middleware for MongoDB operations
 */
export const databaseSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const context = logger.createRequestContext(req)
  
  try {
    // Override mongoose query methods to add security
    const originalExec = mongoose.Query.prototype.exec
    // Store original methods for potential restoration (commented out to fix unused variable warnings)
    // const originalFindOne = mongoose.Model.findOne
    // const originalFind = mongoose.Model.find
    // const originalUpdateOne = mongoose.Model.updateOne
    // const originalUpdateMany = mongoose.Model.updateMany
    // const originalDeleteOne = mongoose.Model.deleteOne
    // const originalDeleteMany = mongoose.Model.deleteMany

    // Secure query execution
    mongoose.Query.prototype.exec = function(callback?: any) {
      const query = this.getQuery()
      const { sanitizedQuery, threats } = DatabaseSecurityService.sanitizeQuery(query, {
        clientIP: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      })

      if (threats.length > 0) {
        logger.logSecurityEvent(
          'Database query threats detected',
          {
            originalQuery: query,
            sanitizedQuery,
            threats,
            collection: this.model.collection.name
          },
          'MEDIUM',
          context
        )
      }

      this.setQuery(sanitizedQuery)
      return originalExec.call(this)
    }

    // Add request context to track database operations
    req.databaseContext = {
      operations: [],
      // startTime: Date.now(),
      securityChecks: []
    }

    next()
  } catch (error) {
    logger.logSecurityEvent(
      'Database security middleware error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'HIGH',
      context
    )
    next(error)
  }
}

/**
 * Database operation logging middleware
 */
export const databaseAuditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const context = logger.createRequestContext(req)
  const startTime = Date.now()

  // Override response.json to log database operations
  const originalJson = res.json
  res.json = function(data: any) {
    const duration = Date.now() - startTime
    
    // Log database operation summary
    if (req.databaseContext) {
      logger.logSecurityEvent(
        'Database operation completed',
        {
          endpoint: req.path,
          method: req.method,
          operations: req.databaseContext.operations.length,
          securityChecks: req.databaseContext.securityChecks,
          duration,
          clientIP: req.ip
        },
        'LOW',
        context
      )
    }

    return originalJson.call(this, data)
  }

  next()
}

/**
 * Collection-specific security middleware
 */
export const collectionSecurityMiddleware = (allowedCollections: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const context = logger.createRequestContext(req)

    // Skip collection validation for authentication and non-collection endpoints
    const authEndpoints = ['sign-in', 'sign-up', 'sign-out', 'activate', 'resend-link', 'reset-password', 'update-password', 'check-token']
    const systemEndpoints = ['health', 'status', 'security', 'countries', 'locations']

    // Extract collection name from request path
    const pathParts = req.path.split('/')
    const collectionName = pathParts[2] // Assuming /api/collection/...

    // Skip validation for authentication and system endpoints
    if (authEndpoints.includes(collectionName) || systemEndpoints.includes(collectionName)) {
      next()
      return
    }

    if (collectionName && !allowedCollections.includes(collectionName)) {
      logger.logSecurityEvent(
        'Unauthorized collection access attempt',
        {
          collection: collectionName,
          allowedCollections,
          endpoint: req.path,
          clientIP: req.ip
        },
        'HIGH',
        context
      )

      res.status(403).json({
        error: 'Access to this collection is not allowed'
      })
      return
    }

    next()
  }
}

/**
 * Query complexity validation middleware
 */
export const queryComplexityMiddleware = (maxComplexity: number = 100) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const context = logger.createRequestContext(req)
    
    try {
      // Check query complexity in request parameters
      const queries = [req.query, req.body?.query, req.body?.filter].filter(Boolean)
      
      for (const query of queries) {
        const { threats } = DatabaseSecurityService.sanitizeQuery(query, {
          clientIP: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path
        })

        const complexityThreats = threats.filter(t => t.type === 'QUERY_COMPLEXITY')
        
        if (complexityThreats.length > 0) {
          logger.logSecurityEvent(
            'Query complexity limit exceeded',
            {
              query,
              maxComplexity,
              endpoint: req.path,
              clientIP: req.ip
            },
            'MEDIUM',
            context
          )

          res.status(400).json({
            error: 'Query too complex',
            maxComplexity
          })
          return
        }
      }

      next()
    } catch (error) {
      logger.logSecurityEvent(
        'Query complexity validation error',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'HIGH',
        context
      )
      next(error)
    }
  }
}

/**
 * Database connection security middleware
 */
export const connectionSecurityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const context = logger.createRequestContext(req)
  
  // Check database connection status
  if (mongoose.connection.readyState !== 1) {
    logger.logSecurityEvent(
      'Database connection not ready',
      {
        readyState: mongoose.connection.readyState,
        endpoint: req.path,
        clientIP: req.ip
      },
      'HIGH',
      context
    )

    res.status(503).json({
      error: 'Database service unavailable'
    })
    return
  }

  // Check for database connection security
  const connectionString = mongoose.connection.db?.databaseName
  if (!connectionString) {
    logger.logSecurityEvent(
      'Database connection security check failed',
      {
        endpoint: req.path,
        clientIP: req.ip
      },
      'MEDIUM',
      context
    )
  }

  next()
}

/**
 * Field encryption middleware for sensitive data
 */
export const fieldEncryptionMiddleware = (encryptedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Encrypt sensitive fields in request body
      if (req.body && typeof req.body === 'object') {
        for (const field of encryptedFields) {
          if (req.body[field] && typeof req.body[field] === 'string') {
            req.body[field] = DatabaseSecurityService.encryptField(req.body[field])
          }
        }
      }

      // Override response to decrypt fields
      const originalJson = res.json
      res.json = function(data: any) {
        if (data && typeof data === 'object') {
          const decryptData = (obj: any): any => {
            if (Array.isArray(obj)) {
              return obj.map(decryptData)
            } else if (obj && typeof obj === 'object') {
              const decrypted = { ...obj }
              for (const field of encryptedFields) {
                if (decrypted[field] && typeof decrypted[field] === 'string') {
                  decrypted[field] = DatabaseSecurityService.decryptField(decrypted[field])
                }
              }
              return decrypted
            }
            return obj
          }

          data = decryptData(data)
        }

        return originalJson.call(this, data)
      }

      next()
    } catch (error) {
      const context = logger.createRequestContext(req)
      logger.logSecurityEvent(
        'Field encryption middleware error',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'HIGH',
        context
      )
      next(error)
    }
  }
}

/**
 * Database security headers middleware
 */
export const databaseSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add database security headers
  res.setHeader('X-Database-Security', 'enabled')
  res.setHeader('X-Query-Sanitization', 'active')
  res.setHeader('X-Connection-Encryption', 'true')
  
  next()
}

/**
 * Check if database security is enabled
 */
const isDatabaseSecurityEnabled = () => {
  return process.env.BC_ENABLE_DATABASE_SECURITY === 'true'
}

/**
 * Database security middleware stack
 */
export const databaseSecurityStack = isDatabaseSecurityEnabled() ? [
  connectionSecurityMiddleware,
  databaseSecurityMiddleware,
  databaseAuditMiddleware,
  queryComplexityMiddleware(100),
  databaseSecurityHeaders
] : []

/**
 * Enhanced database security stack for sensitive operations
 */
export const enhancedDatabaseSecurityStack = isDatabaseSecurityEnabled() ? [
  connectionSecurityMiddleware,
  collectionSecurityMiddleware(['users', 'bookings', 'payments', 'suppliers']),
  databaseSecurityMiddleware,
  databaseAuditMiddleware,
  queryComplexityMiddleware(50), // Lower complexity limit
  fieldEncryptionMiddleware(['email', 'phone', 'bankDetails']),
  databaseSecurityHeaders
] : []

export default {
  databaseSecurityMiddleware,
  databaseAuditMiddleware,
  collectionSecurityMiddleware,
  queryComplexityMiddleware,
  connectionSecurityMiddleware,
  fieldEncryptionMiddleware,
  databaseSecurityHeaders,
  databaseSecurityStack,
  enhancedDatabaseSecurityStack
}
