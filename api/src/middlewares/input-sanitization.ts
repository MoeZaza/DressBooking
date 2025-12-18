
import { Request, Response, NextFunction } from 'express'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

/**
 * Input Sanitization Middleware
 * Sanitizes all incoming request data to prevent XSS attacks
 */
export const inputSanitizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body)
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query)
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params)
    }
    
    next()
  } catch (error) {
    console.error('Input sanitization error:', error)
    res.status(400).json({ error: 'Invalid input data' })
  }
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key)
      sanitized[sanitizedKey] = sanitizeObject(value)
    }
    return sanitized
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  return obj
}

/**
 * Sanitize string input
 */
function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return input
  }
  
  // Remove HTML tags and sanitize
  let sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
  
  // Escape special characters
  sanitized = validator.escape(sanitized)
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // Limit length to prevent DoS
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000)
  }
  
  return sanitized
}

/**
 * Sanitize HTML content (for rich text fields)
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return input
  }
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: []
  })
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return ''
  }
  
  const sanitized = validator.normalizeEmail(email) || ''
  return validator.isEmail(sanitized) ? sanitized : ''
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return ''
  }
  
  // Remove all non-digit characters except + and spaces
  return phone.replace(/[^+\d\s-]/g, '').trim()
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }
  
  try {
    const sanitized = validator.escape(url)
    return validator.isURL(sanitized) ? sanitized : ''
  } catch {
    return ''
  }
}
