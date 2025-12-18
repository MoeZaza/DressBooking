/**
 * Custom Error Classes for BookDress Application
 * Provides security-safe error handling with proper categorization
 */

export enum ErrorCode {
  // General Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  FOREIGN_KEY_CONSTRAINT = 'FOREIGN_KEY_CONSTRAINT',
  
  // Business Logic Errors
  DRESS_NOT_AVAILABLE = 'DRESS_NOT_AVAILABLE',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  APPOINTMENT_CONFLICT = 'APPOINTMENT_CONFLICT',
  
  // Security Errors
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  IP_BLOCKED = 'IP_BLOCKED',
  MALICIOUS_REQUEST = 'MALICIOUS_REQUEST',
  SECURITY_THREAT_DETECTED = 'SECURITY_THREAT_DETECTED',
  
  // File & Upload Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // External Service Errors
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  SMS_SERVICE_ERROR = 'SMS_SERVICE_ERROR',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorMetadata {
  userId?: string
  ip?: string
  userAgent?: string
  endpoint?: string
  method?: string
  timestamp?: Date
  requestId?: string
  additionalData?: Record<string, any>
}

/**
 * Base Application Error Class
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly severity: ErrorSeverity
  public readonly isOperational: boolean
  public readonly metadata: ErrorMetadata
  public readonly userMessage: string
  public readonly internalMessage: string

  constructor(
    code: ErrorCode,
    userMessage: string,
    internalMessage?: string,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    metadata: ErrorMetadata = {}
  ) {
    super(internalMessage || userMessage)
    
    this.code = code
    this.userMessage = userMessage
    this.internalMessage = internalMessage || userMessage
    this.statusCode = statusCode
    this.severity = severity
    this.isOperational = isOperational
    this.metadata = {
      ...metadata,
      timestamp: new Date()
    }

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Get sanitized error for client response
   */
  public toClientResponse() {
    return {
      error: {
        code: this.code,
        message: this.userMessage,
        timestamp: this.metadata.timestamp,
        requestId: this.metadata.requestId
      }
    }
  }

  /**
   * Get detailed error for logging
   */
  public toLogFormat() {
    return {
      code: this.code,
      userMessage: this.userMessage,
      internalMessage: this.internalMessage,
      statusCode: this.statusCode,
      severity: this.severity,
      stack: this.stack,
      metadata: this.metadata
    }
  }
}

/**
 * Validation Error Class
 */
export class ValidationError extends AppError {
  public readonly field?: string
  public readonly value?: any

  constructor(
    message: string,
    field?: string,
    value?: any,
    metadata: ErrorMetadata = {}
  ) {
    super(
      ErrorCode.VALIDATION_ERROR,
      message,
      `Validation failed for field '${field}' with value '${value}': ${message}`,
      400,
      ErrorSeverity.LOW,
      true,
      metadata
    )
    
    this.field = field
    this.value = value
  }
}

/**
 * Authentication Error Class
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required',
    metadata: ErrorMetadata = {}
  ) {
    super(
      ErrorCode.UNAUTHORIZED,
      message,
      `Authentication failed: ${message}`,
      401,
      ErrorSeverity.MEDIUM,
      true,
      metadata
    )
  }
}

/**
 * Authorization Error Class
 */
export class AuthorizationError extends AppError {
  public readonly requiredPermission?: string

  constructor(
    message: string = 'Insufficient permissions',
    requiredPermission?: string,
    metadata: ErrorMetadata = {}
  ) {
    super(
      ErrorCode.FORBIDDEN,
      message,
      `Authorization failed: ${message}. Required permission: ${requiredPermission}`,
      403,
      ErrorSeverity.MEDIUM,
      true,
      metadata
    )
    
    this.requiredPermission = requiredPermission
  }
}

/**
 * Database Error Class
 */
export class DatabaseError extends AppError {
  public readonly operation?: string

  constructor(
    message: string = 'Database operation failed',
    operation?: string,
    metadata: ErrorMetadata = {}
  ) {
    super(
      ErrorCode.DATABASE_ERROR,
      'An error occurred while processing your request',
      `Database error during ${operation}: ${message}`,
      500,
      ErrorSeverity.HIGH,
      true,
      metadata
    )
    
    this.operation = operation
  }
}

/**
 * Business Logic Error Class
 */
export class BusinessLogicError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    metadata: ErrorMetadata = {}
  ) {
    super(
      code,
      message,
      message,
      400,
      ErrorSeverity.LOW,
      true,
      metadata
    )
  }
}

/**
 * Security Error Class
 */
export class SecurityError extends AppError {
  public readonly threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

  constructor(
    code: ErrorCode,
    message: string,
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
    metadata: ErrorMetadata = {}
  ) {
    super(
      code,
      'Security violation detected',
      `Security error: ${message}`,
      403,
      ErrorSeverity.HIGH,
      true,
      metadata
    )
    
    this.threatLevel = threatLevel
  }
}

/**
 * Payment Error Class
 */
export class PaymentError extends AppError {
  public readonly gateway?: string
  public readonly transactionId?: string

  constructor(
    message: string,
    gateway?: string,
    transactionId?: string,
    metadata: ErrorMetadata = {}
  ) {
    super(
      ErrorCode.PAYMENT_FAILED,
      message,
      `Payment failed via ${gateway} (Transaction: ${transactionId}): ${message}`,
      400,
      ErrorSeverity.MEDIUM,
      true,
      metadata
    )
    
    this.gateway = gateway
    this.transactionId = transactionId
  }
}

/**
 * External Service Error Class
 */
export class ExternalServiceError extends AppError {
  public readonly service?: string

  constructor(
    code: ErrorCode,
    message: string,
    service?: string,
    metadata: ErrorMetadata = {}
  ) {
    super(
      code,
      'External service temporarily unavailable',
      `External service error (${service}): ${message}`,
      503,
      ErrorSeverity.MEDIUM,
      true,
      metadata
    )
    
    this.service = service
  }
}
