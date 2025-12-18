import { z } from 'zod'
import ValidationService, { SecurityThreat, ThreatLevel } from '../services/ValidationService'
import XSSProtectionService, { ProtectionLevel } from '../services/XSSProtectionService'

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  threats?: SecurityThreat[]
}

/**
 * Validation middleware result
 */
export interface ValidationMiddlewareResult<T = any> {
  isValid: boolean
  data?: T
  sanitizedData?: T
  errors: ValidationError[]
  threats: SecurityThreat[]
  threatLevel: ThreatLevel
  blocked: boolean
}

/**
 * Validation middleware options
 */
export interface ValidationMiddlewareOptions {
  sanitize?: boolean
  blockOnThreats?: boolean
  logThreats?: boolean
  strictMode?: boolean
  protectionLevel?: ProtectionLevel
  customValidators?: Record<string, (value: any) => boolean>
}

/**
 * Default middleware options
 */
const DEFAULT_OPTIONS: ValidationMiddlewareOptions = {
  sanitize: true,
  blockOnThreats: true,
  logThreats: true,
  strictMode: true,
  protectionLevel: ProtectionLevel.STANDARD,
  customValidators: {}
}

/**
 * Validation Middleware Class
 */
class ValidationMiddleware {
  private static instance: ValidationMiddleware
  private validationService: typeof ValidationService
  private xssProtectionService: typeof XSSProtectionService
  private threatLog: SecurityThreat[] = []

  private constructor() {
    this.validationService = ValidationService
    this.xssProtectionService = XSSProtectionService
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ValidationMiddleware {
    if (!ValidationMiddleware.instance) {
      ValidationMiddleware.instance = new ValidationMiddleware()
    }
    return ValidationMiddleware.instance
  }

  /**
   * Validate data against Zod schema with security checks
   */
  public async validateWithSchema<T>(
    data: unknown,
    schema: z.ZodSchema<T>,
    options: Partial<ValidationMiddlewareOptions> = {}
  ): Promise<ValidationMiddlewareResult<T>> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const errors: ValidationError[] = []
    const threats: SecurityThreat[] = []
    let sanitizedData = data
    let blocked = false

    try {
      // First, sanitize the data if requested
      if (opts.sanitize && typeof data === 'object' && data !== null) {
        const sanitizationResult = await this.sanitizeObject(data, opts)
        sanitizedData = sanitizationResult.sanitizedData
        threats.push(...sanitizationResult.threats)
      }

      // Validate against schema
      const result = schema.safeParse(sanitizedData)
      
      if (!result.success) {
        // Convert Zod errors to validation errors
        for (const issue of result.error.issues) {
          errors.push({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
            severity: this.mapZodErrorSeverity(issue.code)
          })
        }
      }

      // Additional security validation for string fields
      if (result.success && opts.strictMode) {
        const securityResult = await this.performSecurityValidation(result.data, opts)
        threats.push(...securityResult.threats)
        errors.push(...securityResult.errors)
      }

      // Determine if request should be blocked
      const threatLevel = this.calculateOverallThreatLevel(threats)
      if (opts.blockOnThreats && (threatLevel === ThreatLevel.HIGH || threatLevel === ThreatLevel.CRITICAL)) {
        blocked = true
      }

      // Log threats if enabled
      if (opts.logThreats && threats.length > 0) {
        this.logSecurityThreats(threats)
      }

      return {
        isValid: result.success && errors.length === 0 && !blocked,
        data: result.success ? result.data : undefined,
        sanitizedData: sanitizedData as T,
        errors,
        threats,
        threatLevel,
        blocked
      }

    } catch (error) {
      console.error('Validation middleware error:', error)
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Validation failed due to internal error',
          code: 'INTERNAL_ERROR',
          severity: 'critical'
        }],
        threats: [],
        threatLevel: ThreatLevel.CRITICAL,
        blocked: true
      }
    }
  }

  /**
   * Validate form data with real-time feedback
   */
  public async validateFormField(
    fieldName: string,
    value: any,
    schema: z.ZodSchema,
    options: Partial<ValidationMiddlewareOptions> = {}
  ): Promise<ValidationMiddlewareResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const errors: ValidationError[] = []
    const threats: SecurityThreat[] = []
    let sanitizedValue = value

    try {
      // Sanitize if it's a string
      if (typeof value === 'string' && opts.sanitize) {
        const validationResult = this.validationService.validateInput(value, fieldName, {
          sanitizationLevel: 'strict',
          strictMode: opts.strictMode
        })
        
        sanitizedValue = validationResult.sanitizedValue
        threats.push(...validationResult.threats)
        
        if (!validationResult.isValid) {
          errors.push({
            field: fieldName,
            message: validationResult.errors.join(', '),
            code: 'SECURITY_VIOLATION',
            severity: this.mapThreatLevelToSeverity(validationResult.threatLevel),
            threats: validationResult.threats
          })
        }
      }

      // Validate against schema
      const result = schema.safeParse(sanitizedValue)
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: fieldName,
            message: issue.message,
            code: issue.code,
            severity: this.mapZodErrorSeverity(issue.code)
          })
        }
      }

      const threatLevel = this.calculateOverallThreatLevel(threats)
      const blocked = opts.blockOnThreats && (threatLevel === ThreatLevel.HIGH || threatLevel === ThreatLevel.CRITICAL)

      return {
        isValid: result.success && errors.length === 0 && !blocked,
        data: result.success ? result.data : undefined,
        sanitizedData: sanitizedValue,
        errors,
        threats,
        threatLevel,
        blocked: blocked || false
      }

    } catch (error) {
      console.error('Field validation error:', error)
      return {
        isValid: false,
        errors: [{
          field: fieldName,
          message: 'Field validation failed',
          code: 'VALIDATION_ERROR',
          severity: 'high'
        }],
        threats: [],
        threatLevel: ThreatLevel.HIGH,
        blocked: true
      }
    }
  }

  /**
   * Sanitize object recursively
   */
  private async sanitizeObject(
    obj: any,
    options: ValidationMiddlewareOptions
  ): Promise<{ sanitizedData: any; threats: SecurityThreat[] }> {
    const threats: SecurityThreat[] = []
    
    if (typeof obj !== 'object' || obj === null) {
      return { sanitizedData: obj, threats }
    }

    const sanitizedData: any = Array.isArray(obj) ? [] : {}

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const result = this.validationService.validateInput(value, key, {
          sanitizationLevel: 'strict',
          strictMode: options.strictMode
        })
        sanitizedData[key] = result.sanitizedValue
        threats.push(...result.threats)
      } else if (typeof value === 'object' && value !== null) {
        const nestedResult = await this.sanitizeObject(value, options)
        sanitizedData[key] = nestedResult.sanitizedData
        threats.push(...nestedResult.threats)
      } else {
        sanitizedData[key] = value
      }
    }

    return { sanitizedData, threats }
  }

  /**
   * Perform additional security validation
   */
  private async performSecurityValidation(
    data: any,
    options: ValidationMiddlewareOptions
  ): Promise<{ threats: SecurityThreat[]; errors: ValidationError[] }> {
    const threats: SecurityThreat[] = []
    const errors: ValidationError[] = []

    if (typeof data !== 'object' || data === null) {
      return { threats, errors }
    }

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Check for XSS threats
        const xssResult = this.xssProtectionService.sanitizeHtml(value, options.protectionLevel)
        if (xssResult.threatLevel === 'HIGH' || xssResult.threatLevel === 'CRITICAL') {
          threats.push({
            type: 'XSS',
            description: 'Potential XSS attack detected',
            severity: xssResult.threatLevel === 'CRITICAL' ? ThreatLevel.CRITICAL : ThreatLevel.HIGH,
            pattern: 'XSS_PATTERN',
            location: key
          })
        }

        // Custom validators
        if (options.customValidators && options.customValidators[key]) {
          if (!options.customValidators[key](value)) {
            errors.push({
              field: key,
              message: `Custom validation failed for ${key}`,
              code: 'CUSTOM_VALIDATION_FAILED',
              severity: 'medium'
            })
          }
        }
      }
    }

    return { threats, errors }
  }

  /**
   * Calculate overall threat level
   */
  private calculateOverallThreatLevel(threats: SecurityThreat[]): ThreatLevel {
    if (threats.length === 0) return ThreatLevel.LOW

    const hasCritical = threats.some(t => t.severity === ThreatLevel.CRITICAL)
    const hasHigh = threats.some(t => t.severity === ThreatLevel.HIGH)
    const hasMedium = threats.some(t => t.severity === ThreatLevel.MEDIUM)

    if (hasCritical) return ThreatLevel.CRITICAL
    if (hasHigh) return ThreatLevel.HIGH
    if (hasMedium) return ThreatLevel.MEDIUM
    return ThreatLevel.LOW
  }

  /**
   * Map Zod error codes to severity levels
   */
  private mapZodErrorSeverity(code: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'invalid_type': 'medium',
      'invalid_literal': 'medium',
      'custom': 'high',
      'invalid_union': 'medium',
      'invalid_enum_value': 'low',
      'unrecognized_keys': 'low',
      'invalid_arguments': 'medium',
      'invalid_return_type': 'medium',
      'invalid_date': 'low',
      'invalid_string': 'medium',
      'too_small': 'low',
      'too_big': 'low',
      'invalid_intersection_types': 'medium',
      'not_multiple_of': 'low',
      'not_finite': 'medium'
    }

    return severityMap[code] || 'medium'
  }

  /**
   * Map threat level to severity
   */
  private mapThreatLevelToSeverity(threatLevel: ThreatLevel): 'low' | 'medium' | 'high' | 'critical' {
    const map: Record<ThreatLevel, 'low' | 'medium' | 'high' | 'critical'> = {
      [ThreatLevel.LOW]: 'low',
      [ThreatLevel.MEDIUM]: 'medium',
      [ThreatLevel.HIGH]: 'high',
      [ThreatLevel.CRITICAL]: 'critical'
    }
    return map[threatLevel]
  }

  /**
   * Log security threats
   */
  private logSecurityThreats(threats: SecurityThreat[]): void {
    this.threatLog.push(...threats)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security threats detected in validation:', threats)
    }

    // Keep only last 1000 threats
    if (this.threatLog.length > 1000) {
      this.threatLog = this.threatLog.slice(-1000)
    }
  }

  /**
   * Get threat log
   */
  public getThreatLog(): SecurityThreat[] {
    return [...this.threatLog]
  }

  /**
   * Clear threat log
   */
  public clearThreatLog(): void {
    this.threatLog = []
  }

  /**
   * Create validation error response
   */
  public createErrorResponse(errors: ValidationError[]): {
    success: false
    errors: ValidationError[]
    message: string
  } {
    return {
      success: false,
      errors,
      message: `Validation failed: ${errors.map(e => e.message).join(', ')}`
    }
  }
}

// Export singleton instance
export default ValidationMiddleware.getInstance()
