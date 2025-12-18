import DOMPurify from 'dompurify'
import xss from 'xss'
import sanitizeHtml from 'sanitize-html'
import validator from 'validator'
// import { z } from 'zod'
// import Joi from 'joi'
import * as logger from '../common/logger.js'

/**
 * Security threat levels
 */
export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  sanitizedValue: string
  threats: SecurityThreat[]
  threatLevel: ThreatLevel
  errors: string[]
  blocked: boolean
}

/**
 * Security threat interface
 */
export interface SecurityThreat {
  type: string
  description: string
  severity: ThreatLevel
  pattern: string
  location: string
  timestamp: Date
  clientIP?: string
  userAgent?: string
}

/**
 * Validation options interface
 */
export interface ValidationOptions {
  allowHtml?: boolean
  maxLength?: number
  minLength?: number
  allowSpecialChars?: boolean
  strictMode?: boolean
  customPatterns?: RegExp[]
  sanitizationLevel?: 'basic' | 'strict' | 'paranoid'
  blockOnThreats?: boolean
  logThreats?: boolean
}

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: ValidationOptions = {
  allowHtml: false,
  maxLength: 1000,
  minLength: 0,
  allowSpecialChars: false,
  strictMode: true,
  customPatterns: [],
  sanitizationLevel: 'strict',
  blockOnThreats: true,
  logThreats: true
}

/**
 * Enhanced security patterns for backend threat detection
 */
const SECURITY_PATTERNS = {
  XSS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /<svg\b[^>]*onload/gi,
    /<img\b[^>]*onerror/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*javascript:/gi
  ],
  SQL_INJECTION: [
    /(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bFROM\b)/gi,
    /\b(DROP|DELETE|UPDATE|INSERT)\b.*\b(TABLE|FROM|INTO)\b/gi,
    /\bOR\s+1\s*=\s*1/gi,
    /\bAND\s+1\s*=\s*1/gi,
    /\b(EXEC|EXECUTE)\b/gi,
    /\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/gi,
    /\bINTO\s+OUTFILE\b/gi,
    /\bLOAD_FILE\s*\(/gi,
    /\bINTO\s+DUMPFILE\b/gi
  ],
  NOSQL_INJECTION: [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$regex/gi,
    /\$or/gi,
    /\$and/gi,
    /\$nor/gi,
    /\$not/gi,
    /\$exists/gi,
    /\$in/gi,
    /\$nin/gi
  ],
  COMMAND_INJECTION: [
    /[;&|`$(){}[\]]/g,
    /\.\.\//g,
    /\.\.\\/g,
    /\|\s*(cat|ls|dir|type|echo|ping|curl|wget|nc|netcat)/gi,
    /\$\(.*\)/g,
    /`.*`/g,
    /\beval\s*\(/gi,
    /\bexec\s*\(/gi,
    /\bsystem\s*\(/gi,
    /\bpassthru\s*\(/gi
  ],
  TEMPLATE_INJECTION: [
    /\{\{.*\}\}/g,
    /\$\{.*\}/g,
    /<\%.*\%>/g,
    /\[\[.*\]\]/g,
    /#\{.*\}/g,
    /\{\%.*\%\}/g,
    /\{\#.*\#\}/g
  ],
  PATH_TRAVERSAL: [
    /\.\.\//g,
    /\.\.\\/g,
    /\.\.%2F/gi,
    /\.\.%5C/gi,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.\/.*\/etc\/passwd/gi,
    /\.\.\\.*\\windows\\system32/gi
  ],
  LDAP_INJECTION: [
    /\*\)/g,
    /\|\(/g,
    /&\(/g,
    /!\(/g,
    /\(\|/g,
    /\(&/g,
    /\(!/g,
    /\)\(/g
  ],
  XXE_INJECTION: [
    /<!ENTITY/gi,
    /<!DOCTYPE.*ENTITY/gi,
    /SYSTEM\s+["']file:/gi,
    /SYSTEM\s+["']http:/gi,
    /SYSTEM\s+["']ftp:/gi
  ],
  HEADER_INJECTION: [
    /\r\n/g,
    /\n/g,
    /\r/g,
    /%0d%0a/gi,
    /%0a/gi,
    /%0d/gi
  ]
}

/**
 * Backend Validation Service
 */
class BackendValidationService {
  private static instance: BackendValidationService
  private threatLog: SecurityThreat[] = []

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): BackendValidationService {
    if (!BackendValidationService.instance) {
      BackendValidationService.instance = new BackendValidationService()
    }
    return BackendValidationService.instance
  }

  /**
   * Validate and sanitize input with enhanced backend security
   */
  public validateInput(
    input: string,
    fieldName: string,
    options: Partial<ValidationOptions> = {},
    requestContext?: any
  ): ValidationResult {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const threats: SecurityThreat[] = []
    let sanitizedValue = input
    const errors: string[] = []
    let blocked = false

    // Basic validation
    if (typeof input !== 'string') {
      errors.push('Input must be a string')
      return {
        isValid: false,
        sanitizedValue: '',
        threats,
        threatLevel: ThreatLevel.HIGH,
        errors,
        blocked: true
      }
    }

    // Length validation
    if (input.length > opts.maxLength!) {
      errors.push(`Input exceeds maximum length of ${opts.maxLength}`)
      sanitizedValue = input.substring(0, opts.maxLength!)
    }

    if (input.length < opts.minLength!) {
      errors.push(`Input is below minimum length of ${opts.minLength}`)
    }

    // Enhanced threat detection
    const detectedThreats = this.detectThreats(input, fieldName, requestContext)
    threats.push(...detectedThreats)

    // Sanitization based on level
    switch (opts.sanitizationLevel) {
      case 'basic':
        sanitizedValue = this.basicSanitize(sanitizedValue)
        break
      case 'strict':
        sanitizedValue = this.strictSanitize(sanitizedValue, opts)
        break
      case 'paranoid':
        sanitizedValue = this.paranoidSanitize(sanitizedValue)
        break
    }

    // Custom pattern validation
    if (opts.customPatterns && opts.customPatterns.length > 0) {
      for (const pattern of opts.customPatterns) {
        if (pattern.test(sanitizedValue)) {
          threats.push({
            type: 'CUSTOM_PATTERN_VIOLATION',
            description: 'Input matches restricted custom pattern',
            severity: ThreatLevel.MEDIUM,
            pattern: pattern.toString(),
            location: fieldName,
            timestamp: new Date(),
            clientIP: requestContext?.clientIP,
            userAgent: requestContext?.userAgent
          })
        }
      }
    }

    // Determine threat level and blocking
    const threatLevel = this.calculateThreatLevel(threats)
    if (opts.blockOnThreats && (threatLevel === ThreatLevel.HIGH || threatLevel === ThreatLevel.CRITICAL)) {
      blocked = true
    }

    // Log threats
    if (opts.logThreats && threats.length > 0) {
      this.logThreats(threats, requestContext)
    }

    return {
      isValid: errors.length === 0 && !blocked,
      sanitizedValue,
      threats,
      threatLevel,
      errors,
      blocked
    }
  }

  /**
   * Enhanced threat detection for backend
   */
  private detectThreats(input: string, fieldName: string, requestContext?: any): SecurityThreat[] {
    const threats: SecurityThreat[] = []
    const timestamp = new Date()

    // Check all security patterns
    Object.entries(SECURITY_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(input)) {
          const severity = this.getThreatSeverity(category)
          threats.push({
            type: category,
            description: `Potential ${category.replace('_', ' ').toLowerCase()} attack detected`,
            severity,
            pattern: pattern.toString(),
            location: fieldName,
            timestamp,
            clientIP: requestContext?.clientIP,
            userAgent: requestContext?.userAgent
          })
        }
      })
    })

    return threats
  }

  /**
   * Get threat severity based on category
   */
  private getThreatSeverity(category: string): ThreatLevel {
    const severityMap: Record<string, ThreatLevel> = {
      'XSS': ThreatLevel.HIGH,
      'SQL_INJECTION': ThreatLevel.CRITICAL,
      'NOSQL_INJECTION': ThreatLevel.CRITICAL,
      'COMMAND_INJECTION': ThreatLevel.CRITICAL,
      'TEMPLATE_INJECTION': ThreatLevel.HIGH,
      'PATH_TRAVERSAL': ThreatLevel.HIGH,
      'LDAP_INJECTION': ThreatLevel.MEDIUM,
      'XXE_INJECTION': ThreatLevel.CRITICAL,
      'HEADER_INJECTION': ThreatLevel.HIGH
    }
    return severityMap[category] || ThreatLevel.MEDIUM
  }

  /**
   * Basic sanitization
   */
  private basicSanitize(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/['"]/g, '') // Remove quotes
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
  }

  /**
   * Strict sanitization using multiple libraries
   */
  private strictSanitize(input: string, options: ValidationOptions): string {
    let sanitized = input

    // Use DOMPurify for HTML content (server-side)
    if (options.allowHtml) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      })
    } else {
      // Strip all HTML
      sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [], KEEP_CONTENT: true })
    }

    // Use XSS library for additional protection
    sanitized = xss(sanitized, {
      whiteList: options.allowHtml ? { b: [], i: [], em: [], strong: [], p: [], br: [] } : {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    })

    // Remove dangerous patterns
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/\0/g, '') // Remove null bytes

    // Handle special characters
    if (!options.allowSpecialChars) {
      sanitized = sanitized.replace(/[;&|`$(){}[\]]/g, '')
    }

    return sanitized.trim()
  }

  /**
   * Paranoid sanitization - maximum security
   */
  private paranoidSanitize(input: string): string {
    // Use sanitize-html with very restrictive settings
    let sanitized = sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard'
    })

    // Remove all potentially dangerous characters
    sanitized = sanitized
      .replace(/[<>'"&;|`$(){}[\]\\]/g, '')
      .replace(/[^\w\s\-.,!?@#%^*+=:]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    return sanitized
  }

  /**
   * Calculate overall threat level
   */
  private calculateThreatLevel(threats: SecurityThreat[]): ThreatLevel {
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
   * Log security threats with enhanced backend logging
   */
  private logThreats(threats: SecurityThreat[], requestContext?: any): void {
    this.threatLog.push(...threats)
    
    threats.forEach(threat => {
      logger.logSecurityEvent(
        `Security threat detected: ${threat.type}`,
        {
          threatType: threat.type,
          severity: threat.severity,
          location: threat.location,
          pattern: threat.pattern,
          clientIP: threat.clientIP,
          userAgent: threat.userAgent,
          timestamp: threat.timestamp,
          requestContext
        },
        threat.severity,
        requestContext
      )
    })

    // Keep only last 1000 threats to prevent memory issues
    if (this.threatLog.length > 1000) {
      this.threatLog = this.threatLog.slice(-1000)
    }
  }

  /**
   * Validate email with enhanced security
   */
  public validateEmail(email: string, requestContext?: any): ValidationResult {
    const result = this.validateInput(email, 'email', {
      maxLength: 254,
      sanitizationLevel: 'strict',
      allowSpecialChars: false
    }, requestContext)

    // Additional email validation
    if (result.isValid && !validator.isEmail(result.sanitizedValue)) {
      result.isValid = false
      result.errors.push('Invalid email format')
    }

    return result
  }

  /**
   * Validate password with security requirements
   */
  public validatePassword(password: string, minLength: number = 8, requestContext?: any): ValidationResult {
    const result = this.validateInput(password, 'password', {
      maxLength: 128,
      minLength,
      sanitizationLevel: 'basic', // Don't over-sanitize passwords
      allowSpecialChars: true
    }, requestContext)

    // Additional password validation
    if (result.isValid) {
      const hasUpperCase = /[A-Z]/.test(password)
      const hasLowerCase = /[a-z]/.test(password)
      const hasNumbers = /\d/.test(password)
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

      if (!hasUpperCase) result.errors.push('Password must contain uppercase letters')
      if (!hasLowerCase) result.errors.push('Password must contain lowercase letters')
      if (!hasNumbers) result.errors.push('Password must contain numbers')
      if (!hasSpecialChar) result.errors.push('Password must contain special characters')

      result.isValid = result.errors.length === 0
    }

    return result
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
}

// Export singleton instance
export default BackendValidationService.getInstance()
