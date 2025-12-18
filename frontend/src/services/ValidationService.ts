import DOMPurify from 'dompurify'
import xss from 'xss'
import CryptoJS from 'crypto-js'
import validator from 'validator'

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
  sanitizationLevel: 'strict'
}

/**
 * Security patterns for threat detection
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
    /<img\b[^>]*onerror/gi
  ],
  SQL_INJECTION: [
    /(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bFROM\b)/gi,
    /\b(DROP|DELETE|UPDATE|INSERT)\b.*\b(TABLE|FROM|INTO)\b/gi,
    /\bOR\s+1\s*=\s*1/gi,
    /\bAND\s+1\s*=\s*1/gi,
    /\b(EXEC|EXECUTE)\b/gi,
    /\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/gi
  ],
  COMMAND_INJECTION: [
    /[;&|`$(){}[\]]/g,
    /\.\.\//g,
    /\.\.\\/g,
    /\|\s*(cat|ls|dir|type|echo|ping|curl|wget)/gi,
    /\$\(.*\)/g,
    /`.*`/g
  ],
  TEMPLATE_INJECTION: [
    /\{\{.*\}\}/g,
    /\$\{.*\}/g,
    /<\%.*\%>/g,
    /\[\[.*\]\]/g,
    /#\{.*\}/g
  ],
  PATH_TRAVERSAL: [
    /\.\.\//g,
    /\.\.\\/g,
    /\.\.%2F/gi,
    /\.\.%5C/gi,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi
  ],
  LDAP_INJECTION: [
    /\*\)/g,
    /\|\(/g,
    /&\(/g,
    /!\(/g,
    /\(\|/g,
    /\(&/g,
    /\(!/g
  ]
}

/**
 * Comprehensive Input Validation Service
 */
class ValidationService {
  private static instance: ValidationService
  private threatLog: SecurityThreat[] = []

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService()
    }
    return ValidationService.instance
  }

  /**
   * Validate and sanitize input string
   */
  public validateInput(
    input: string,
    fieldName: string,
    options: Partial<ValidationOptions> = {}
  ): ValidationResult {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const threats: SecurityThreat[] = []
    let sanitizedValue = input
    const errors: string[] = []

    // Basic validation
    if (typeof input !== 'string') {
      errors.push('Input must be a string')
      return {
        isValid: false,
        sanitizedValue: '',
        threats,
        threatLevel: ThreatLevel.HIGH,
        errors
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

    // Threat detection
    const detectedThreats = this.detectThreats(input, fieldName)
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
            location: fieldName
          })
        }
      }
    }

    // Determine threat level
    const threatLevel = this.calculateThreatLevel(threats)

    // Log threats
    this.logThreats(threats)

    return {
      isValid: errors.length === 0 && threatLevel !== ThreatLevel.CRITICAL,
      sanitizedValue,
      threats,
      threatLevel,
      errors
    }
  }

  /**
   * Detect security threats in input
   */
  private detectThreats(input: string, fieldName: string): SecurityThreat[] {
    const threats: SecurityThreat[] = []

    // Check for XSS patterns
    for (const pattern of SECURITY_PATTERNS.XSS) {
      if (pattern.test(input)) {
        threats.push({
          type: 'XSS',
          description: 'Potential Cross-Site Scripting attack detected',
          severity: ThreatLevel.HIGH,
          pattern: pattern.toString(),
          location: fieldName
        })
      }
    }

    // Check for SQL injection patterns
    for (const pattern of SECURITY_PATTERNS.SQL_INJECTION) {
      if (pattern.test(input)) {
        threats.push({
          type: 'SQL_INJECTION',
          description: 'Potential SQL injection attack detected',
          severity: ThreatLevel.CRITICAL,
          pattern: pattern.toString(),
          location: fieldName
        })
      }
    }

    // Check for command injection patterns
    for (const pattern of SECURITY_PATTERNS.COMMAND_INJECTION) {
      if (pattern.test(input)) {
        threats.push({
          type: 'COMMAND_INJECTION',
          description: 'Potential command injection attack detected',
          severity: ThreatLevel.HIGH,
          pattern: pattern.toString(),
          location: fieldName
        })
      }
    }

    // Check for template injection patterns
    for (const pattern of SECURITY_PATTERNS.TEMPLATE_INJECTION) {
      if (pattern.test(input)) {
        threats.push({
          type: 'TEMPLATE_INJECTION',
          description: 'Potential template injection attack detected',
          severity: ThreatLevel.MEDIUM,
          pattern: pattern.toString(),
          location: fieldName
        })
      }
    }

    // Check for path traversal patterns
    for (const pattern of SECURITY_PATTERNS.PATH_TRAVERSAL) {
      if (pattern.test(input)) {
        threats.push({
          type: 'PATH_TRAVERSAL',
          description: 'Potential path traversal attack detected',
          severity: ThreatLevel.HIGH,
          pattern: pattern.toString(),
          location: fieldName
        })
      }
    }

    // Check for LDAP injection patterns
    for (const pattern of SECURITY_PATTERNS.LDAP_INJECTION) {
      if (pattern.test(input)) {
        threats.push({
          type: 'LDAP_INJECTION',
          description: 'Potential LDAP injection attack detected',
          severity: ThreatLevel.MEDIUM,
          pattern: pattern.toString(),
          location: fieldName
        })
      }
    }

    return threats
  }

  /**
   * Basic sanitization - removes dangerous characters
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
   * Strict sanitization - comprehensive cleaning
   */
  private strictSanitize(input: string, options: ValidationOptions): string {
    let sanitized = input

    // Use DOMPurify for HTML content
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
    // Use DOMPurify with very restrictive settings (browser-compatible)
    let sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      FORBID_TAGS: ['script', 'object', 'embed', 'applet', 'meta', 'link', 'iframe', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'style', 'class', 'id']
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
    if (threats.length === 0) {
      return ThreatLevel.LOW
    }

    const hasCritical = threats.some(t => t.severity === ThreatLevel.CRITICAL)
    const hasHigh = threats.some(t => t.severity === ThreatLevel.HIGH)
    const hasMedium = threats.some(t => t.severity === ThreatLevel.MEDIUM)

    if (hasCritical) {
      return ThreatLevel.CRITICAL
    }
    if (hasHigh) {
      return ThreatLevel.HIGH
    }
    if (hasMedium) {
      return ThreatLevel.MEDIUM
    }
    
    return ThreatLevel.LOW
  }

  /**
   * Log security threats
   */
  private logThreats(threats: SecurityThreat[]): void {
    this.threatLog.push(...threats)

    // Log to console in development
    if (process.env.NODE_ENV === 'development' && threats.length > 0) {
      console.warn('Security threats detected:', threats)
    }

    // Keep only last 1000 threats to prevent memory issues
    if (this.threatLog.length > 1000) {
      this.threatLog = this.threatLog.slice(-1000)
    }
  }

  /**
   * Validate email with enhanced security
   */
  public validateEmail(email: string): ValidationResult {
    const result = this.validateInput(email, 'email', {
      maxLength: 254,
      sanitizationLevel: 'strict',
      allowSpecialChars: false
    })

    // Additional email validation
    if (result.isValid && !validator.isEmail(result.sanitizedValue)) {
      result.isValid = false
      result.errors.push('Invalid email format')
    }

    return result
  }

  /**
   * Validate phone number with security checks
   */
  public validatePhone(phone: string): ValidationResult {
    const result = this.validateInput(phone, 'phone', {
      maxLength: 20,
      sanitizationLevel: 'strict',
      allowSpecialChars: true,
      customPatterns: [/[a-zA-Z]/] // No letters in phone numbers
    })

    // Additional phone validation
    if (result.isValid && !validator.isMobilePhone(result.sanitizedValue)) {
      result.isValid = false
      result.errors.push('Invalid phone number format')
    }

    return result
  }

  /**
   * Validate password with security requirements
   */
  public validatePassword(password: string, minLength: number = 8): ValidationResult {
    const result = this.validateInput(password, 'password', {
      maxLength: 128,
      minLength,
      sanitizationLevel: 'basic', // Don't over-sanitize passwords
      allowSpecialChars: true
    })

    // Additional password validation
    if (result.isValid) {
      const hasUpperCase = /[A-Z]/.test(password)
      const hasLowerCase = /[a-z]/.test(password)
      const hasNumbers = /\d/.test(password)
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

      if (!hasUpperCase) {
        result.errors.push('Password must contain uppercase letters')
      }
      if (!hasLowerCase) {
        result.errors.push('Password must contain lowercase letters')
      }
      if (!hasNumbers) {
        result.errors.push('Password must contain numbers')
      }
      if (!hasSpecialChar) {
        result.errors.push('Password must contain special characters')
      }

      result.isValid = result.errors.length === 0
    }

    return result
  }

  /**
   * Validate URL with security checks
   */
  public validateUrl(url: string): ValidationResult {
    const result = this.validateInput(url, 'url', {
      maxLength: 2048,
      sanitizationLevel: 'strict',
      allowSpecialChars: true
    })

    // Additional URL validation
    if (result.isValid && !validator.isURL(result.sanitizedValue, {
      protocols: ['http', 'https'],
      require_protocol: true
    })) {
      result.isValid = false
      result.errors.push('Invalid URL format')
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

  /**
   * Generate secure hash
   */
  public generateHash(input: string): string {
    return CryptoJS.SHA256(input).toString()
  }

  /**
   * Validate and sanitize object properties
   */
  public validateObject(
    obj: Record<string, any>,
    schema: Record<string, ValidationOptions>
  ): { isValid: boolean; sanitizedObject: Record<string, any>; threats: SecurityThreat[] } {
    const sanitizedObject: Record<string, any> = {}
    const allThreats: SecurityThreat[] = []
    let isValid = true

    for (const [key, value] of Object.entries(obj)) {
      if (schema[key] && typeof value === 'string') {
        const result = this.validateInput(value, key, schema[key])
        sanitizedObject[key] = result.sanitizedValue
        allThreats.push(...result.threats)
        if (!result.isValid) {
          isValid = false
        }
      } else {
        sanitizedObject[key] = value
      }
    }

    return { isValid, sanitizedObject, threats: allThreats }
  }
}

// Export singleton instance
export default ValidationService.getInstance()
