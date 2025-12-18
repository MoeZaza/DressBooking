import DOMPurify from 'dompurify'
import xss from 'xss'

/**
 * XSS Protection levels
 */
export enum ProtectionLevel {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  STRICT = 'STRICT',
  PARANOID = 'PARANOID'
}

/**
 * Sanitization result interface
 */
export interface SanitizationResult {
  sanitizedContent: string
  removedElements: string[]
  removedAttributes: string[]
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isModified: boolean
}

/**
 * XSS Protection configuration
 */
export interface XSSProtectionConfig {
  level: ProtectionLevel
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  allowedSchemes?: string[]
  allowDataAttributes?: boolean
  allowComments?: boolean
  stripIgnoreTag?: boolean
  stripIgnoreTagBody?: boolean | string[]
}

/**
 * Default configurations for different protection levels
 */
const DEFAULT_CONFIGS: Record<ProtectionLevel, XSSProtectionConfig> = {
  [ProtectionLevel.BASIC]: {
    level: ProtectionLevel.BASIC,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div'],
    allowedAttributes: {
      '*': ['class', 'id'],
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'title']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowDataAttributes: false,
    allowComments: false,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  },
  [ProtectionLevel.STANDARD]: {
    level: ProtectionLevel.STANDARD,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'span'],
    allowedAttributes: {
      '*': ['class'],
      'a': ['href'],
      'img': ['src', 'alt']
    },
    allowedSchemes: ['https'],
    allowDataAttributes: false,
    allowComments: false,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
  },
  [ProtectionLevel.STRICT]: {
    level: ProtectionLevel.STRICT,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
    allowedSchemes: ['https'],
    allowDataAttributes: false,
    allowComments: false,
    stripIgnoreTag: true,
    stripIgnoreTagBody: true
  },
  [ProtectionLevel.PARANOID]: {
    level: ProtectionLevel.PARANOID,
    allowedTags: [],
    allowedAttributes: {},
    allowedSchemes: [],
    allowDataAttributes: false,
    allowComments: false,
    stripIgnoreTag: true,
    stripIgnoreTagBody: true
  }
}

/**
 * XSS Protection Service
 */
class XSSProtectionService {
  private static instance: XSSProtectionService

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): XSSProtectionService {
    if (!XSSProtectionService.instance) {
      XSSProtectionService.instance = new XSSProtectionService()
    }
    return XSSProtectionService.instance
  }

  /**
   * Sanitize HTML content with specified protection level
   */
  public sanitizeHtml(
    content: string,
    protectionLevel: ProtectionLevel = ProtectionLevel.STANDARD,
    customConfig?: Partial<XSSProtectionConfig>
  ): SanitizationResult {
    const config = { ...DEFAULT_CONFIGS[protectionLevel], ...customConfig }
    const originalContent = content
    let sanitizedContent = content
    const removedElements: string[] = []
    const removedAttributes: string[] = []

    try {
      // First pass: DOMPurify sanitization
      const domPurifyConfig: DOMPurify.Config = {
        ALLOWED_TAGS: config.allowedTags || [],
        ALLOWED_ATTR: this.flattenAllowedAttributes(config.allowedAttributes || {}),
        ALLOWED_URI_REGEXP: this.createSchemeRegex(config.allowedSchemes || []),
        ALLOW_DATA_ATTR: config.allowDataAttributes || false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        FORBID_TAGS: ['script', 'object', 'embed', 'applet', 'meta', 'link'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
      }

      sanitizedContent = DOMPurify.sanitize(content, domPurifyConfig as any) as unknown as string

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

      // Third pass: Additional DOMPurify sanitization for maximum security on paranoid level
      if (protectionLevel === ProtectionLevel.PARANOID) {
        sanitizedContent = DOMPurify.sanitize(sanitizedContent, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
          KEEP_CONTENT: true,
          ALLOW_DATA_ATTR: false,
          ALLOW_UNKNOWN_PROTOCOLS: false,
          FORBID_TAGS: ['script', 'object', 'embed', 'applet', 'meta', 'link', 'iframe', 'form', 'input', 'button'],
          FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'style', 'class', 'id']
        })
      }

      // Additional security measures
      sanitizedContent = this.applyAdditionalSecurity(sanitizedContent)
    } catch (error) {
      console.error('XSS sanitization error:', error)
      // Fallback to most restrictive sanitization
      sanitizedContent = this.emergencySanitize(content)
    }

    return {
      sanitizedContent,
      removedElements: [...new Set(removedElements)],
      removedAttributes: [...new Set(removedAttributes)],
      threatLevel: this.assessThreatLevel(originalContent, sanitizedContent, removedElements),
      isModified: originalContent !== sanitizedContent
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

    // Additional URL validation
    if (sanitized.match(/^(javascript|data|vbscript):/i)) {
      return ''
    }

    return sanitized
  }

  /**
   * Sanitize CSS to prevent CSS injection attacks
   */
  public sanitizeCSS(css: string): string {
    return css
      .replace(/javascript:/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/@import/gi, '')
      .replace(/behavior\s*:/gi, '')
      .replace(/binding\s*:/gi, '')
      .replace(/url\s*\(\s*["']?\s*javascript:/gi, '')
      .replace(/url\s*\(\s*["']?\s*data:/gi, '')
  }

  /**
   * Apply additional security measures
   */
  private applyAdditionalSecurity(content: string): string {
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

    const dangerousElements = ['script', 'iframe', 'object', 'embed', 'applet']
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
   * Check if content is safe (no modifications needed)
   */
  public isSafe(content: string, protectionLevel: ProtectionLevel = ProtectionLevel.STANDARD): boolean {
    const result = this.sanitizeHtml(content, protectionLevel)
    return !result.isModified
  }

  /**
   * Get protection level recommendation based on content
   */
  public recommendProtectionLevel(content: string): ProtectionLevel {
    const hasHtml = /<[^>]+>/.test(content)
    const hasScripts = /<script/i.test(content)
    const hasEvents = /on\w+\s*=/i.test(content)
    const hasJavascript = /javascript:/i.test(content)

    if (hasScripts || hasJavascript || hasEvents) {
      return ProtectionLevel.PARANOID
    } else if (hasHtml) {
      return ProtectionLevel.STRICT
    } else {
      return ProtectionLevel.STANDARD
    }
  }
}

// Export singleton instance
export default XSSProtectionService.getInstance()
