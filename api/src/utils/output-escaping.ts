
import validator from 'validator'

/**
 * Output Escaping Utilities
 * Safely escape output data to prevent XSS attacks
 */

/**
 * Escape HTML entities in string
 */
export function escapeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return input
  }
  
  return validator.escape(input)
}

/**
 * Escape for use in HTML attributes
 */
export function escapeHTMLAttribute(input: string): string {
  if (!input || typeof input !== 'string') {
    return input
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Escape for use in JavaScript context
 */
export function escapeJavaScript(input: string): string {
  if (!input || typeof input !== 'string') {
    return input
  }
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
}

/**
 * Escape for use in CSS context
 */
export function escapeCSS(input: string): string {
  if (!input || typeof input !== 'string') {
    return input
  }
  
  return input.replace(/[^a-zA-Z0-9\s-_]/g, (char) => {
    return '\\' + char.charCodeAt(0).toString(16).padStart(6, '0')
  })
}

/**
 * Safe JSON stringify with XSS protection
 */
export function safeJSONStringify(obj: any): string {
  try {
    const jsonString = JSON.stringify(obj)
    // Escape script tags and other dangerous patterns
    return jsonString
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/'/g, '\\u0027')
      .replace(/"/g, '\\u0022')
  } catch {
    return '{}'
  }
}

/**
 * Sanitize object for safe output
 */
export function sanitizeForOutput(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForOutput(item))
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeForOutput(value)
    }
    return sanitized
  }
  
  if (typeof obj === 'string') {
    return escapeHTML(obj)
  }
  
  return obj
}

/**
 * Create safe response wrapper
 */
export function createSafeResponse(data: any) {
  return {
    success: true,
    data: sanitizeForOutput(data),
    timestamp: new Date().toISOString()
  }
}
