import winston, { format, transports } from 'winston'
import path from 'path'
import fs from 'fs'
import { AppError, ErrorSeverity, ErrorCode } from './errors'
import { errorSanitizer } from './errorSanitizer'


let ENABLE_LOGGING = true
let ENABLE_ERROR_LOGGING = true

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Enhanced log format with structured data
const structuredFormat = format.printf((info) => {
  const { timestamp, level, message, ...meta } = info
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  }
  return JSON.stringify(logEntry)
})

const consoleFormat = format.printf((info) => {
  const { timestamp, level, message, requestId, userId, ...meta } = info
  let logMessage = `${timestamp} [${level.toUpperCase()}]`

  if (requestId) logMessage += ` [${requestId}]`
  if (userId) logMessage += ` [User:${userId}]`

  logMessage += `: ${message}`

  if (Object.keys(meta).length > 0) {
    logMessage += ` ${JSON.stringify(meta)}`
  }

  return logMessage
})

// Create enhanced logger with multiple transports
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  transports: [
    // Console transport with colored output
    new transports.Console({
      format: format.combine(
        format.colorize(),
        consoleFormat
      ),
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
    }),

    // General application logs
    new transports.File({
      filename: path.join(logsDir, 'application.log'),
      level: 'info',
      format: structuredFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),

    // Error logs
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: structuredFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    }),

    // Security logs
    new transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      format: structuredFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    }),

    // Audit logs for important business events
    new transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'info',
      format: structuredFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 20
    })
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: structuredFormat
    })
  ],

  rejectionHandlers: [
    new transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: structuredFormat
    })
  ]
})

// Enhanced logging interface
export interface LogContext {
  requestId?: string
  userId?: string
  ip?: string
  userAgent?: string
  endpoint?: string
  method?: string
  category?: string
  type?: string
  severity?: ErrorSeverity
  code?: ErrorCode
  duration?: number
  additionalData?: Record<string, any>
}

/**
 * Enhanced error tracking service
 */
export class ErrorTracker {
  private static errorCounts: Map<string, number> = new Map()
  private static lastErrors: Map<string, Date> = new Map()

  static track(error: AppError): void {
    const key = `${error.code}_${error.statusCode}`
    const count = this.errorCounts.get(key) || 0
    this.errorCounts.set(key, count + 1)
    this.lastErrors.set(key, new Date())
  }

  static getStats(): any {
    const stats: any = {}
    for (const [key, count] of this.errorCounts.entries()) {
      stats[key] = {
        count,
        lastOccurrence: this.lastErrors.get(key)
      }
    }
    return stats
  }

  static reset(): void {
    this.errorCounts.clear()
    this.lastErrors.clear()
  }
}

// Enhanced logging functions with context support
export const debug = (message: string, context: LogContext = {}) => {
  if (ENABLE_LOGGING) {
    logger.debug(message, context)
  }
}

export const info = (message: string, context: LogContext | any = {}) => {
  if (ENABLE_LOGGING) {
    // Handle legacy calls where second parameter might be any object
    if (typeof context === 'object' && context !== null && !context.requestId) {
      context = { additionalData: context }
    }
    logger.info(message, context)
  }
}

export const warn = (message: string, context: LogContext | any = {}) => {
  if (ENABLE_LOGGING) {
    // Handle legacy calls where second parameter might be any object
    if (typeof context === 'object' && context !== null && !context.requestId) {
      context = { additionalData: context }
    }
    logger.warn(message, context)
  }
}

export const error = (message: string, context: LogContext | any = {}) => {
  if (ENABLE_LOGGING && ENABLE_ERROR_LOGGING) {
    // Handle legacy calls where second parameter might be any object or Error
    if (context instanceof Error) {
      context = { additionalData: { error: context.message, stack: context.stack } }
    } else if (typeof context === 'object' && context !== null && !context.requestId) {
      context = { additionalData: context }
    } else if (typeof context === 'string') {
      context = { additionalData: { details: context } }
    }
    logger.error(message, context)
  }
}

/**
 * Log application errors with enhanced tracking
 */
export const logAppError = (appError: AppError) => {
  if (!ENABLE_LOGGING || !ENABLE_ERROR_LOGGING) return

  // Track error statistics
  ErrorTracker.track(appError)

  // Sanitize error data for logging
  const sanitizedError = errorSanitizer.sanitizeForLogging(appError)

  const logContext: LogContext = {
    ...sanitizedError.metadata,
    category: 'application_error',
    type: 'APP_ERROR',
    severity: appError.severity,
    code: appError.code
  }

  // Log with appropriate level based on severity
  switch (appError.severity) {
    case ErrorSeverity.LOW:
      info(`Application Error: ${sanitizedError.userMessage}`, logContext)
      break
    case ErrorSeverity.MEDIUM:
      warn(`Application Error: ${sanitizedError.userMessage}`, logContext)
      break
    case ErrorSeverity.HIGH:
    case ErrorSeverity.CRITICAL:
      error(`Application Error: ${sanitizedError.userMessage}`, logContext)
      break
  }
}

/**
 * Log security events with enhanced monitoring integration
 */
export const logSecurityEvent = (
  event: string,
  details: any,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
  context: LogContext = {}
) => {
  if (!ENABLE_LOGGING) return

  const securityContext: LogContext = {
    ...context,
    category: 'security',
    type: 'SECURITY_EVENT',
    severity: severity as ErrorSeverity,
    additionalData: {
      ...details,
      eventId: generateEventId(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  }

  // Log to appropriate level based on severity
  switch (severity) {
    case 'CRITICAL':
      logger.error(`🚨 CRITICAL Security Event: ${event}`, securityContext)
      break
    case 'HIGH':
      logger.error(`⚠️ HIGH Security Event: ${event}`, securityContext)
      break
    case 'MEDIUM':
      logger.warn(`⚡ MEDIUM Security Event: ${event}`, securityContext)
      break
    case 'LOW':
      logger.info(`ℹ️ LOW Security Event: ${event}`, securityContext)
      break
    default:
      logger.warn(`Security Event: ${event}`, securityContext)
  }

  // Send to security monitoring system
  try {
    const securityMonitor = require('../monitoring/securityMonitor').default
    securityMonitor.logSecurityEvent(event, details, severity, context)
  } catch (error) {
    // Fallback if monitoring system is not available
    logger.debug('Security monitoring system not available', { error })
  }
}

/**
 * Log audit events for business operations
 */
export const logAuditEvent = (
  action: string,
  resource: string,
  details: any,
  context: LogContext = {}
) => {
  if (!ENABLE_LOGGING) return

  const auditContext: LogContext = {
    ...context,
    category: 'audit',
    type: 'AUDIT_EVENT',
    additionalData: {
      action,
      resource,
      ...details
    }
  }

  info(`Audit: ${action} on ${resource}`, auditContext)
}

/**
 * Log performance metrics
 */
export const logPerformance = (
  operation: string,
  duration: number,
  context: LogContext = {}
) => {
  if (!ENABLE_LOGGING) return

  const perfContext: LogContext = {
    ...context,
    category: 'performance',
    type: 'PERFORMANCE',
    duration,
    additionalData: { operation }
  }

  if (duration > 5000) { // Log slow operations as warnings
    warn(`Slow Operation: ${operation} took ${duration}ms`, perfContext)
  } else {
    debug(`Performance: ${operation} took ${duration}ms`, perfContext)
  }
}

// Configuration functions
export const enableLogging = () => {
  ENABLE_LOGGING = true
}

export const disableLogging = () => {
  ENABLE_LOGGING = false
}

export const enableErrorLogging = () => {
  ENABLE_ERROR_LOGGING = true
}

export const disableErrorLogging = () => {
  ENABLE_ERROR_LOGGING = false
}

/**
 * Get error statistics
 */
export const getErrorStats = () => {
  return ErrorTracker.getStats()
}

/**
 * Reset error tracking
 */
export const resetErrorTracking = () => {
  ErrorTracker.reset()
}

/**
 * Create request context for logging
 */
export const createRequestContext = (req: any): LogContext => {
  return {
    requestId: req.requestId,
    userId: req.user?.id,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get?.('User-Agent'),
    endpoint: req.path,
    method: req.method
  }
}

/**
 * Log request completion
 */
export const logRequestCompletion = (
  req: any,
  res: any,
  duration: number,
  error?: AppError
) => {
  const context = createRequestContext(req)
  context.duration = duration
  context.additionalData = {
    statusCode: res.statusCode,
    contentLength: res.get?.('content-length')
  }

  if (error) {
    context.category = 'request_error'
    logAppError(error)
  } else if (res.statusCode >= 400) {
    context.category = 'request_warning'
    warn(`Request completed with error status: ${req.method} ${req.path}`, context)
  } else {
    context.category = 'request_success'
    info(`Request completed: ${req.method} ${req.path}`, context)
  }
}

/**
 * Generate unique event ID for tracking
 */
function generateEventId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `evt_${timestamp}_${random}`
}

/**
 * Enhanced log aggregation for security events
 */
export const logAggregator = {
  /**
   * Aggregate security events by type and severity
   */
  aggregateSecurityEvents(timeWindow: number = 3600000): SecurityEventSummary {
    // This would typically read from log files or a log aggregation service
    // For now, return a placeholder structure
    return {
      timeWindow,
      totalEvents: 0,
      eventsByType: {},
      eventsBySeverity: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      topSources: [],
      trends: {
        increasing: [],
        decreasing: [],
        stable: []
      }
    }
  },

  /**
   * Get security event patterns
   */
  getEventPatterns(_timeWindow: number = 3600000): EventPattern[] {
    // This would analyze log patterns for anomaly detection
    return []
  },

  /**
   * Export logs for external analysis
   */
  exportLogs(format: 'json' | 'csv' | 'siem' = 'json', timeRange?: { start: Date; end: Date }) {
    // This would export logs in various formats for SIEM integration
    return {
      format,
      timeRange,
      exported: new Date().toISOString(),
      recordCount: 0
    }
  }
}

/**
 * Real-time log streaming for monitoring dashboards
 */
export const logStreamer = {
  subscribers: new Set<(logEntry: any) => void>(),

  /**
   * Subscribe to real-time log events
   */
  subscribe(callback: (logEntry: any) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  },

  /**
   * Broadcast log entry to all subscribers
   */
  broadcast(logEntry: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback(logEntry)
      } catch (error) {
        console.error('Error in log stream subscriber:', error)
      }
    })
  }
}

// Type definitions for enhanced logging
interface SecurityEventSummary {
  timeWindow: number
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  topSources: Array<{ source: string; count: number }>
  trends: {
    increasing: string[]
    decreasing: string[]
    stable: string[]
  }
}

interface EventPattern {
  pattern: string
  frequency: number
  severity: string
  confidence: number
  description: string
}

// Export the winston logger instance for advanced usage
export { logger }
