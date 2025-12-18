// Comprehensive Form Validation Service
// Provides consistent validation across all forms in the application

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  phone?: boolean
  url?: boolean
  numeric?: boolean
  positive?: boolean
  min?: number
  max?: number
  custom?: (value: any) => string | null
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validate a single field value against rules
 */
export const validateField = (
  fieldName: string,
  value: any,
  rules: ValidationRule,
  customLabel?: string
): ValidationError | null => {
  const label = customLabel || fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return { field: fieldName, message: `${label} is required` }
  }
  
  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null
  }
  
  const stringValue = String(value).trim()
  
  // Length validations
  if (rules.minLength && stringValue.length < rules.minLength) {
    return { 
      field: fieldName, 
      message: `${label} must be at least ${rules.minLength} characters long` 
    }
  }
  
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return { 
      field: fieldName, 
      message: `${label} must not exceed ${rules.maxLength} characters` 
    }
  }
  
  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return { field: fieldName, message: `${label} format is invalid` }
  }
  
  // Email validation
  if (rules.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(stringValue)) {
      return { field: fieldName, message: `${label} must be a valid email address` }
    }
  }
  
  // Phone validation
  if (rules.phone) {
    const phonePattern = /^[\+]?[1-9][\d]{0,15}$/
    if (!phonePattern.test(stringValue.replace(/[\s\-\(\)]/g, ''))) {
      return { field: fieldName, message: `${label} must be a valid phone number` }
    }
  }
  
  // URL validation
  if (rules.url) {
    try {
      new URL(stringValue)
    } catch {
      return { field: fieldName, message: `${label} must be a valid URL` }
    }
  }
  
  // Numeric validations
  if (rules.numeric) {
    const numValue = Number(value)
    if (isNaN(numValue)) {
      return { field: fieldName, message: `${label} must be a number` }
    }
    
    if (rules.positive && numValue <= 0) {
      return { field: fieldName, message: `${label} must be a positive number` }
    }
    
    if (rules.min !== undefined && numValue < rules.min) {
      return { field: fieldName, message: `${label} must be at least ${rules.min}` }
    }
    
    if (rules.max !== undefined && numValue > rules.max) {
      return { field: fieldName, message: `${label} must not exceed ${rules.max}` }
    }
  }
  
  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value)
    if (customError) {
      return { field: fieldName, message: customError }
    }
  }
  
  return null
}

/**
 * Validate an entire form object
 */
export const validateForm = (
  formData: Record<string, any>,
  validationRules: Record<string, ValidationRule>,
  customLabels?: Record<string, string>
): ValidationResult => {
  const errors: ValidationError[] = []
  
  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const value = formData[fieldName]
    const label = customLabels?.[fieldName]
    
    const error = validateField(fieldName, value, rules, label)
    if (error) {
      errors.push(error)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Common validation rules for different field types
 */
export const commonRules = {
  required: { required: true },
  email: { required: true, email: true },
  phone: { required: true, phone: true },
  url: { url: true },
  password: { required: true, minLength: 8 },
  name: { required: true, minLength: 2, maxLength: 50 },
  description: { maxLength: 500 },
  price: { required: true, numeric: true, positive: true },
  deposit: { required: true, numeric: true, positive: true },
  percentage: { numeric: true, min: 0, max: 100 },
  positiveInteger: { numeric: true, positive: true, custom: (value: any) => {
    const num = Number(value)
    return Number.isInteger(num) ? null : 'Must be a whole number'
  }}
}

/**
 * Dress-specific validation rules
 */
export const dressValidationRules = {
  name: commonRules.name,
  price: commonRules.price,
  deposit: commonRules.deposit,
  type: commonRules.required,
  size: commonRules.required,
  material: commonRules.required,
  color: commonRules.required,
  dressCode: { 
    required: true, 
    minLength: 3, 
    maxLength: 20,
    pattern: /^[A-Z0-9\-]+$/,
    custom: (value: string) => {
      if (value && !/^[A-Z0-9\-]+$/.test(value)) {
        return 'Dress code must contain only uppercase letters, numbers, and hyphens'
      }
      return null
    }
  },
  length: { numeric: true, positive: true, min: 50, max: 300 },
  description: { maxLength: 1000 },
  designerName: { maxLength: 100 },
  alterationNotes: { maxLength: 500 },
  careInstructions: { maxLength: 500 }
}

/**
 * Supplier validation rules
 */
export const supplierValidationRules = {
  fullName: commonRules.name,
  email: commonRules.email,
  phone: commonRules.phone,
  bio: { maxLength: 1000 },
  location: commonRules.required,
  paymentInfo: { maxLength: 500 }
}

/**
 * User validation rules
 */
export const userValidationRules = {
  fullName: commonRules.name,
  email: commonRules.email,
  phone: commonRules.phone,
  password: commonRules.password,
  type: commonRules.required,
  language: commonRules.required
}

/**
 * Booking validation rules
 */
export const bookingValidationRules = {
  dress: commonRules.required,
  supplier: commonRules.required,
  renter: commonRules.required,
  from: { required: true, custom: (value: any) => {
    const date = new Date(value)
    const now = new Date()
    return date > now ? null : 'Start date must be in the future'
  }},
  to: { required: true, custom: (value: any, formData?: any) => {
    const startDate = formData?.from ? new Date(formData.from) : null
    const endDate = new Date(value)
    
    if (startDate && endDate <= startDate) {
      return 'End date must be after start date'
    }
    return null
  }},
  status: commonRules.required
}

/**
 * Location validation rules
 */
export const locationValidationRules = {
  name: commonRules.name,
  country: commonRules.required,
  values: { required: true, custom: (value: any) => {
    return Array.isArray(value) && value.length > 0 ? null : 'At least one location value is required'
  }}
}

/**
 * Real-time validation for form fields
 */
export class FormValidator {
  private rules: Record<string, ValidationRule>
  private errors: Record<string, string> = {}
  private touched: Record<string, boolean> = {}
  
  constructor(rules: Record<string, ValidationRule>) {
    this.rules = rules
  }
  
  validateField(fieldName: string, value: any): string | null {
    const rule = this.rules[fieldName]
    if (!rule) return null
    
    const error = validateField(fieldName, value, rule)
    
    if (error) {
      this.errors[fieldName] = error.message
      return error.message
    } else {
      delete this.errors[fieldName]
      return null
    }
  }
  
  markTouched(fieldName: string) {
    this.touched[fieldName] = true
  }
  
  shouldShowError(fieldName: string): boolean {
    return this.touched[fieldName] && !!this.errors[fieldName]
  }
  
  getError(fieldName: string): string | null {
    return this.errors[fieldName] || null
  }
  
  getAllErrors(): Record<string, string> {
    return { ...this.errors }
  }
  
  isValid(): boolean {
    return Object.keys(this.errors).length === 0
  }
  
  reset() {
    this.errors = {}
    this.touched = {}
  }
  
  validateAll(formData: Record<string, any>): boolean {
    let isValid = true
    
    for (const fieldName of Object.keys(this.rules)) {
      this.markTouched(fieldName)
      const error = this.validateField(fieldName, formData[fieldName])
      if (error) {
        isValid = false
      }
    }
    
    return isValid
  }
}

/**
 * Helper to create validation messages
 */
export const createValidationMessage = (errors: ValidationError[]): string => {
  if (errors.length === 0) return ''
  
  if (errors.length === 1) {
    return errors[0].message
  }
  
  return `Please fix the following errors:\n${errors.map(e => `• ${e.message}`).join('\n')}`
}

/**
 * Sanitize input values
 */
export const sanitizeInput = (value: string): string => {
  if (typeof value !== 'string') return String(value || '')
  
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
}

/**
 * Format phone numbers
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  return phone
}
