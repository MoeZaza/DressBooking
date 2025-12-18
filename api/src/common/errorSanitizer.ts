/**
 * Error Sanitization and Security Module
 * Prevents information leakage and ensures security-safe error messages
 */

import { AppError, ErrorCode, ErrorSeverity } from './errors'


/**
 * Security configuration for error handling
 */
export interface SecurityConfig {
  enableStackTrace: boolean
  enableDetailedErrors: boolean
  enableInternalMessages: boolean
  maxErrorMessageLength: number
  sensitiveFields: string[]
  blockedPatterns: RegExp[]
}

/**
 * Default security configuration
 */
const defaultSecurityConfig: SecurityConfig = {
  enableStackTrace: process.env.NODE_ENV === 'development',
  enableDetailedErrors: process.env.NODE_ENV === 'development',
  enableInternalMessages: process.env.NODE_ENV === 'development',
  maxErrorMessageLength: 500,
  sensitiveFields: [
    'password', 'token', 'secret', 'key', 'authorization', 'cookie', 
    'session', 'credit', 'card', 'ssn', 'social', 'pin', 'otp',
    'jwt', 'refresh', 'access', 'bearer', 'api_key', 'private',
    'confidential', 'sensitive', 'internal', 'admin', 'root'
  ],
  blockedPatterns: [
    /password/gi,
    /token/gi,
    /secret/gi,
    /key/gi,
    /authorization/gi,
    /bearer/gi,
    /jwt/gi,
    /api[_-]?key/gi,
    /credit[_-]?card/gi,
    /ssn/gi,
    /social[_-]?security/gi,
    /private[_-]?key/gi,
    /access[_-]?token/gi,
    /refresh[_-]?token/gi
  ]
}

/**
 * Error Sanitization Service
 */
export class ErrorSanitizationService {
  private config: SecurityConfig

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultSecurityConfig, ...config }
  }

  /**
   * Sanitize error for client response
   */
  sanitizeForClient(error: AppError): any {
    const sanitized: any = {
      error: {
        code: error.code,
        message: this.sanitizeMessage(error.userMessage),
        timestamp: error.metadata.timestamp,
        requestId: error.metadata.requestId
      }
    }

    // Add development-only information
    if (this.config.enableDetailedErrors) {
      sanitized.error.statusCode = error.statusCode
      sanitized.error.severity = error.severity
    }

    if (this.config.enableStackTrace && error.stack) {
      sanitized.error.stack = this.sanitizeStackTrace(error.stack)
    }

    if (this.config.enableInternalMessages) {
      sanitized.error.internal = this.sanitizeMessage(error.internalMessage)
    }

    return sanitized
  }

  /**
   * Sanitize error for logging
   */
  sanitizeForLogging(error: AppError): any {
    const logData = {
      code: error.code,
      userMessage: this.sanitizeMessage(error.userMessage),
      internalMessage: this.sanitizeMessage(error.internalMessage),
      statusCode: error.statusCode,
      severity: error.severity,
      isOperational: error.isOperational,
      metadata: this.sanitizeMetadata(error.metadata)
    }

    if (error.stack) {
      (logData as any).stack = this.sanitizeStackTrace(error.stack)
    }

    return logData
  }

  /**
   * Sanitize error message
   */
  private sanitizeMessage(message: string): string {
    if (!message) return message

    let sanitized = message

    // Remove sensitive patterns
    for (const pattern of this.config.blockedPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    }

    // Truncate if too long
    if (sanitized.length > this.config.maxErrorMessageLength) {
      sanitized = sanitized.substring(0, this.config.maxErrorMessageLength) + '...'
    }

    // Remove potential file paths in production
    if (process.env.NODE_ENV === 'production') {
      sanitized = sanitized.replace(/\/[^\s]+\.(js|ts|json)/g, '[FILE_PATH]')
      sanitized = sanitized.replace(/C:\\[^\s]+/g, '[FILE_PATH]')
    }

    return sanitized
  }

  /**
   * Sanitize stack trace
   */
  private sanitizeStackTrace(stack: string): string | undefined {
    if (!this.config.enableStackTrace) {
      return undefined
    }

    let sanitized = stack

    // Remove sensitive file paths
    sanitized = sanitized.replace(/\/[^\s]+node_modules[^\s]*/g, '[NODE_MODULES]')
    
    if (process.env.NODE_ENV === 'production') {
      // Remove all file paths in production
      sanitized = sanitized.replace(/\/[^\s]+\.(js|ts)/g, '[FILE]')
      sanitized = sanitized.replace(/C:\\[^\s]+/g, '[FILE]')
      
      // Keep only first few lines
      const lines = sanitized.split('\n')
      sanitized = lines.slice(0, 5).join('\n')
    }

    return sanitized
  }

  /**
   * Sanitize metadata
   */
  private sanitizeMetadata(metadata: any): any {
    if (!metadata || typeof metadata !== 'object') {
      return metadata
    }

    const sanitized: any = {}

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase()

      // Check if key contains sensitive information
      if (this.config.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value)
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeMessage(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * Recursively sanitize objects
   */
  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => 
        typeof item === 'object' ? this.sanitizeObject(item) : item
      )
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase()
        
        if (this.config.sensitiveFields.some(field => lowerKey.includes(field))) {
          sanitized[key] = '[REDACTED]'
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value)
        } else if (typeof value === 'string') {
          sanitized[key] = this.sanitizeMessage(value)
        } else {
          sanitized[key] = value
        }
      }
      
      return sanitized
    }

    return obj
  }

  /**
   * Check if error contains sensitive information
   */
  containsSensitiveInfo(error: any): boolean {
    const errorString = JSON.stringify(error).toLowerCase()
    
    return this.config.sensitiveFields.some(field => 
      errorString.includes(field)
    ) || this.config.blockedPatterns.some(pattern => 
      pattern.test(errorString)
    )
  }

  /**
   * Create security-safe error for different environments
   */
  createSecuritySafeError(originalError: AppError): AppError {
    // In production, create a generic error for sensitive errors
    if (process.env.NODE_ENV === 'production' && this.containsSensitiveInfo(originalError)) {
      return new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'An error occurred while processing your request',
        'Sensitive error information redacted',
        500,
        ErrorSeverity.MEDIUM,
        true,
        {
          requestId: originalError.metadata.requestId,
          timestamp: originalError.metadata.timestamp
        }
      )
    }

    return originalError
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config }
  }
}

/**
 * Default sanitization service instance
 */
export const errorSanitizer = new ErrorSanitizationService()

/**
 * Security-aware error response builder
 */
export class SecurityErrorResponse {
  /**
   * Build error response with security considerations
   */
  static build(error: AppError, includeDebugInfo: boolean = false): any {
    const sanitized = errorSanitizer.sanitizeForClient(error)
    
    // Additional security headers
    const response = {
      ...sanitized,
      security: {
        sanitized: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    }

    if (includeDebugInfo && process.env.NODE_ENV === 'development') {
      response.debug = {
        originalCode: error.code,
        severity: error.severity,
        isOperational: error.isOperational
      }
    }

    return response
  }

  /**
   * Build minimal error response for high-security scenarios
   */
  static buildMinimal(requestId?: string): any {
    return {
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An error occurred',
        timestamp: new Date().toISOString(),
        requestId: requestId || 'unknown'
      }
    }
  }
}

export default {
  ErrorSanitizationService,
  errorSanitizer,
  SecurityErrorResponse
}
