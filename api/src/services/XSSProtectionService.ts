import DOMPurify from 'dompurify'
import xss from 'xss'
import sanitizeHtml from 'sanitize-html'
import * as logger from '../common/logger.js'

/**
 * XSS Protection levels for backend
 */
export enum BackendProtectionLevel {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  STRICT = 'STRICT',
  PARANOID = 'PARANOID'
}

/**
 * Backend sanitization result interface
 */
export interface BackendSanitizationResult {
  sanitizedContent: string
  removedElements: string[]
  removedAttributes: string[]
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isModified: boolean
  blocked: boolean
}

/**
 * Backend XSS Protection configuration
 */
export interface BackendXSSProtectionConfig {
  level: BackendProtectionLevel
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  allowedSchemes?: string[]
  allowDataAttributes?: boolean
  allowComments?: boolean
  stripIgnoreTag?: boolean
  stripIgnoreTagBody?: boolean | string[]
  logThreats?: boolean
  blockOnThreats?: boolean
}

/**
 * Default configurations for different protection levels
 */
const DEFAULT_CONFIGS: Record<BackendProtectionLevel, BackendXSSProtectionConfig> = {
  [BackendProtectionLevel.BASIC]: {
    level: BackendProtectionLevel.BASIC,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div'],
    allowedAttributes: {
      '*': ['class'],
      'a': ['href'],
      'img': ['src', 'alt']
    },
    allowedSchemes: ['https'],
    allowDataAttributes: false,
    allowComments: false,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
    logThreats: true,
    blockOnThreats: false
  },
  [BackendProtectionLevel.STANDARD]: {
    level: BackendProtectionLevel.STANDARD,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {
      '*': [],
      'a': ['href']
    },
    allowedSchemes: ['https'],
    allowDataAttributes: false,
    allowComments: false,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    logThreats: true,
    blockOnThreats: true
  },
  [BackendProtectionLevel.STRICT]: {
    level: BackendProtectionLevel.STRICT,
    allowedTags: ['b', 'i', 'em', 'strong'],
    allowedAttributes: {},
    allowedSchemes: ['https'],
    allowDataAttributes: false,
    allowComments: false,
    stripIgnoreTag: true,
    stripIgnoreTagBody: true,
    logThreats: true,
    blockOnThreats: true
  },
  [BackendProtectionLevel.PARANOID]: {
    level: BackendProtectionLevel.PARANOID,
    allowedTags: [],
    allowedAttributes: {},
    allowedSchemes: [],
    allowDataAttributes: false,
    allowComments: false,
    stripIgnoreTag: true,
    stripIgnoreTagBody: true,
    logThreats: true,
    blockOnThreats: true
  }
}

/**
 * Backend XSS Protection Service
 */
class BackendXSSProtectionService {
  private static instance: BackendXSSProtectionService

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): BackendXSSProtectionService {
    if (!BackendXSSProtectionService.instance) {
      BackendXSSProtectionService.instance = new BackendXSSProtectionService()
    }
    return BackendXSSProtectionService.instance
  }

  /**
   * Sanitize HTML content with backend-specific protection
   */
  public sanitizeHtml(
    content: string,
    protectionLevel: BackendProtectionLevel = BackendProtectionLevel.STANDARD,
    customConfig?: Partial<BackendXSSProtectionConfig>,
    requestContext?: any
  ): BackendSanitizationResult {
    const config = { ...DEFAULT_CONFIGS[protectionLevel], ...customConfig }
    const originalContent = content
    let sanitizedContent = content
    const removedElements: string[] = []
    const removedAttributes: string[] = []
    let blocked = false

    try {
      // First pass: DOMPurify sanitization (server-side)
      sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: config.allowedTags || [],
        ALLOWED_ATTR: this.flattenAllowedAttributes(config.allowedAttributes || {}),
        ALLOWED_URI_REGEXP: this.createSchemeRegex(config.allowedSchemes || []),
        ALLOW_DATA_ATTR: config.allowDataAttributes || false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        FORBID_TAGS: ['script', 'object', 'embed', 'applet', 'meta', 'link', 'iframe'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        SANITIZE_DOM: true
      })

      // Second pass: XSS library for additional protection
      const xssOptions = {
        whiteList: this.convertToXSSWhitelist(config.allowedTags || [], config.allowedAttributes || {}),
        stripIgnoreTag: config.stripIgnoreTag,
        stripIgnoreTagBody: config.stripIgnoreTagBody,
        allowCommentTag: config.allowComments,
        onIgnoreTag: (tag: string) => {
          removedElements.push(tag)
          return ''
        },
        onIgnoreTagAttr: (tag: string, name: string) => {
          removedAttributes.push(`${tag}.${name}`)
          return ''
        }
      }

      sanitizedContent = xss(sanitizedContent, xssOptions)

      // Third pass: sanitize-html for maximum security on strict/paranoid levels
      if (protectionLevel === BackendProtectionLevel.STRICT || protectionLevel === BackendProtectionLevel.PARANOID) {
        sanitizedContent = sanitizeHtml(sanitizedContent, {
          allowedTags: config.allowedTags || [],
          allowedAttributes: config.allowedAttributes || {},
          disallowedTagsMode: 'discard',
          allowedSchemes: config.allowedSchemes || []
        })
      }

      // Additional backend-specific security measures
      sanitizedContent = this.applyBackendSecurity(sanitizedContent)

      // Assess threat level and blocking
      const threatLevel = this.assessThreatLevel(originalContent, sanitizedContent, removedElements)
      
      if (config.blockOnThreats && (threatLevel === 'HIGH' || threatLevel === 'CRITICAL')) {
        blocked = true
      }

      // Log threats if enabled
      if (config.logThreats && (removedElements.length > 0 || removedAttributes.length > 0)) {
        this.logXSSThreats(originalContent, sanitizedContent, removedElements, removedAttributes, threatLevel, requestContext)
      }

    } catch (error) {
      logger.error('XSS sanitization error:', error)
      // Fallback to most restrictive sanitization
      sanitizedContent = this.emergencySanitize(content)
      blocked = true
    }

    return {
      sanitizedContent,
      removedElements: [...new Set(removedElements)],
      removedAttributes: [...new Set(removedAttributes)],
      threatLevel: this.assessThreatLevel(originalContent, sanitizedContent, removedElements),
      isModified: originalContent !== sanitizedContent,
      blocked
    }
  }

  /**
   * Sanitize text content (no HTML allowed)
   */
  public sanitizeText(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true
    })
  }

  /**
   * Sanitize URL to prevent javascript: and data: schemes
   */
  public sanitizeUrl(url: string): string {
    const sanitized = DOMPurify.sanitize(url, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp):\/\/|mailto:|tel:)/i
    })

    // Additional URL validation for backend
    if (sanitized.match(/^(javascript|data|vbscript):/i)) {
      return ''
    }

    return sanitized
  }

  /**
   * Apply backend-specific security measures
   */
  private applyBackendSecurity(content: string): string {
    return content
      // Remove any remaining script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove javascript: protocols
      .replace(/javascript:/gi, '')
      // Remove data: URIs that could contain scripts
      .replace(/data:text\/html/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove style attributes that could contain expressions
      .replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove potential template injection patterns
      .replace(/\{\{.*\}\}/g, '')
      .replace(/\$\{.*\}/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Emergency sanitization fallback
   */
  private emergencySanitize(content: string): string {
    return content
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
  }

  /**
   * Flatten allowed attributes for DOMPurify
   */
  private flattenAllowedAttributes(allowedAttributes: Record<string, string[]>): string[] {
    const flattened: string[] = []
    for (const [tag, attrs] of Object.entries(allowedAttributes)) {
      if (tag === '*') {
        flattened.push(...attrs)
      } else {
        flattened.push(...attrs.map(attr => `${tag}-${attr}`))
      }
    }
    return flattened
  }

  /**
   * Create regex for allowed URI schemes
   */
  private createSchemeRegex(schemes: string[]): RegExp {
    if (schemes.length === 0) {
      return /^$/
    }
    const schemePattern = schemes.join('|')
    return new RegExp(`^(${schemePattern}):`, 'i')
  }

  /**
   * Convert configuration to XSS library whitelist format
   */
  private convertToXSSWhitelist(
    allowedTags: string[],
    allowedAttributes: Record<string, string[]>
  ): Record<string, string[]> {
    const whitelist: Record<string, string[]> = {}
    
    for (const tag of allowedTags) {
      whitelist[tag] = allowedAttributes[tag] || allowedAttributes['*'] || []
    }
    
    return whitelist
  }

  /**
   * Assess threat level based on sanitization results
   */
  private assessThreatLevel(
    original: string,
    sanitized: string,
    removedElements: string[]
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (original === sanitized) {
      return 'LOW'
    }

    const dangerousElements = ['script', 'iframe', 'object', 'embed', 'applet', 'meta', 'link']
    const hasDangerousElements = removedElements.some(el => 
      dangerousElements.includes(el.toLowerCase())
    )

    if (hasDangerousElements) {
      return 'CRITICAL'
    }

    const modificationRatio = (original.length - sanitized.length) / original.length
    if (modificationRatio > 0.5) {
      return 'HIGH'
    } else if (modificationRatio > 0.2) {
      return 'MEDIUM'
    }

    return 'LOW'
  }

  /**
   * Log XSS threats with backend-specific context
   */
  private logXSSThreats(
    originalContent: string,
    sanitizedContent: string,
    removedElements: string[],
    removedAttributes: string[],
    threatLevel: string,
    requestContext?: any
  ): void {
    logger.logSecurityEvent(
      'XSS threat detected and sanitized',
      {
        threatLevel,
        removedElements,
        removedAttributes,
        originalLength: originalContent.length,
        sanitizedLength: sanitizedContent.length,
        modificationRatio: (originalContent.length - sanitizedContent.length) / originalContent.length,
        clientIP: requestContext?.clientIP,
        userAgent: requestContext?.userAgent,
        endpoint: requestContext?.path,
        method: requestContext?.method
      },
      threatLevel as any,
      requestContext
    )
  }

  /**
   * Check if content is safe (no modifications needed)
   */
  public isSafe(content: string, protectionLevel: BackendProtectionLevel = BackendProtectionLevel.STANDARD): boolean {
    const result = this.sanitizeHtml(content, protectionLevel)
    return !result.isModified
  }

  /**
   * Get protection level recommendation based on content
   */
  public recommendProtectionLevel(content: string): BackendProtectionLevel {
    const hasHtml = /<[^>]+>/.test(content)
    const hasScripts = /<script/i.test(content)
    const hasEvents = /on\w+\s*=/i.test(content)
    const hasJavascript = /javascript:/i.test(content)

    if (hasScripts || hasJavascript || hasEvents) {
      return BackendProtectionLevel.PARANOID
    } else if (hasHtml) {
      return BackendProtectionLevel.STRICT
    } else {
      return BackendProtectionLevel.STANDARD
    }
  }
}

// Export singleton instance
export default BackendXSSProtectionService.getInstance()
