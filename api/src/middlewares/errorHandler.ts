/**
 * Global Error Handling Middleware for BookDress Application
 * Provides centralized error processing, sanitization, and logging
 */

import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AppError, ErrorCode, ErrorSeverity, ErrorMetadata } from '../common/errors'
import * as logger from '../common/logger'


/**
 * Request interface with error tracking
 */
export interface ErrorTrackingRequest extends Request {
  requestId?: string
  startTime?: number
}

/**
 * Add request tracking middleware
 */
export const requestTracker = (req: ErrorTrackingRequest, res: Response, next: NextFunction) => {
  req.requestId = uuidv4()
  req.startTime = Date.now()
  
  // Add request ID to response headers for debugging
  res.setHeader('X-Request-ID', req.requestId)
  
  next()
}

/**
 * Error sanitization utility
 */
class ErrorSanitizer {
  private static sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'credit', 'card', 'ssn', 'social'
  ]

  /**
   * Remove sensitive information from error data
   */
  static sanitize(data: any): any {
    if (!data || typeof data !== 'object') {
      return data
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item))
    }

    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      
      if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitize(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * Sanitize error stack trace for production
   */
  static sanitizeStack(stack?: string): string | undefined {
    if (!stack || process.env.NODE_ENV === 'production') {
      return undefined
    }

    // Remove sensitive file paths and internal details in production
    return stack
      .split('\n')
      .filter(line => !line.includes('node_modules'))
      .join('\n')
  }
}

/**
 * Convert unknown errors to AppError instances
 */
class ErrorConverter {
  static convert(error: any, metadata: ErrorMetadata): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error
    }

    // MongoDB/Mongoose errors
    if (error.name === 'ValidationError') {
      return new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid data provided',
        `Validation error: ${error.message}`,
        400,
        ErrorSeverity.LOW,
        true,
        metadata
      )
    }

    if (error.code === 11000) {
      return new AppError(
        ErrorCode.DUPLICATE_ENTRY,
        'Resource already exists',
        `Duplicate entry error: ${error.message}`,
        409,
        ErrorSeverity.LOW,
        true,
        metadata
      )
    }

    if (error.name === 'CastError') {
      return new AppError(
        ErrorCode.INVALID_REQUEST,
        'Invalid request format',
        `Cast error: ${error.message}`,
        400,
        ErrorSeverity.LOW,
        true,
        metadata
      )
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return new AppError(
        ErrorCode.TOKEN_INVALID,
        'Invalid authentication token',
        `JWT error: ${error.message}`,
        401,
        ErrorSeverity.MEDIUM,
        true,
        metadata
      )
    }

    if (error.name === 'TokenExpiredError') {
      return new AppError(
        ErrorCode.TOKEN_EXPIRED,
        'Authentication token expired',
        `Token expired: ${error.message}`,
        401,
        ErrorSeverity.MEDIUM,
        true,
        metadata
      )
    }

    // Multer errors (file upload)
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new AppError(
        ErrorCode.FILE_TOO_LARGE,
        'File size exceeds limit',
        `File upload error: ${error.message}`,
        413,
        ErrorSeverity.LOW,
        true,
        metadata
      )
    }

    // Generic errors
    if (error instanceof Error) {
      return new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred',
        error.message,
        500,
        ErrorSeverity.HIGH,
        false,
        metadata
      )
    }

    // Unknown error type
    return new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred',
      `Unknown error: ${JSON.stringify(error)}`,
      500,
      ErrorSeverity.CRITICAL,
      false,
      metadata
    )
  }
}

/**
 * Global error handling middleware
 */
export const globalErrorHandler = (
  error: any,
  req: ErrorTrackingRequest,
  res: Response,
  next: NextFunction
) => {
  // Create error metadata
  const metadata: ErrorMetadata = {
    userId: (req as any).user?.id,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('User-Agent'),
    endpoint: req.path,
    method: req.method,
    requestId: req.requestId,
    additionalData: {
      body: ErrorSanitizer.sanitize(req.body),
      query: ErrorSanitizer.sanitize(req.query),
      params: ErrorSanitizer.sanitize(req.params),
      duration: req.startTime ? Date.now() - req.startTime : undefined
    }
  }

  // Convert to AppError
  const appError = ErrorConverter.convert(error, metadata)

  // Log the error
  logError(appError)

  // Send response
  sendErrorResponse(res, appError)
}

/**
 * Log error with appropriate level
 */
function logError(error: AppError) {
  const logData = {
    ...error.toLogFormat(),
    stack: ErrorSanitizer.sanitizeStack(error.stack)
  }

  switch (error.severity) {
    case ErrorSeverity.LOW:
      logger.info(`Error [${error.code}]: ${error.userMessage}`, logData)
      break
    case ErrorSeverity.MEDIUM:
      logger.warn(`Error [${error.code}]: ${error.userMessage}`, logData)
      break
    case ErrorSeverity.HIGH:
    case ErrorSeverity.CRITICAL:
      logger.error(`Error [${error.code}]: ${error.userMessage}`, logData)
      break
  }

  // Log security events separately
  if (error.code.includes('SECURITY') || error.code.includes('SUSPICIOUS')) {
    logSecurityEvent(error)
  }
}

/**
 * Log security-related events
 */
function logSecurityEvent(error: AppError) {
  const securityLog = {
    type: 'SECURITY_EVENT',
    severity: error.severity,
    code: error.code,
    ip: error.metadata.ip,
    userAgent: error.metadata.userAgent,
    endpoint: error.metadata.endpoint,
    method: error.metadata.method,
    userId: error.metadata.userId,
    timestamp: error.metadata.timestamp,
    message: error.internalMessage
  }

  logger.warn('Security Event Detected', securityLog)
}

/**
 * Send error response to client
 */
function sendErrorResponse(res: Response, error: AppError) {
  // Don't send response if already sent
  if (res.headersSent) {
    return
  }

  const response = error.toClientResponse()

  // Add additional debug info in development
  if (process.env.NODE_ENV === 'development') {
    (response.error as any).stack = ErrorSanitizer.sanitizeStack(error.stack);
    (response.error as any).internal = error.internalMessage
  }

  res.status(error.statusCode).json(response)
}

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    ErrorCode.RESOURCE_NOT_FOUND,
    `Resource not found: ${req.method} ${req.path}`,
    `404 - Resource not found: ${req.method} ${req.path}`,
    404,
    ErrorSeverity.LOW,
    true,
    {
      endpoint: req.path,
      method: req.method,
      ip: req.ip
    }
  )

  next(error)
}

export default {
  requestTracker,
  globalErrorHandler,
  asyncHandler,
  notFoundHandler,
  ErrorSanitizer,
  ErrorConverter
}
