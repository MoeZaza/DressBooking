import { useState, useCallback, useEffect } from 'react'
import { useSecurityContext } from '../context/SecurityContext'
import ValidationService, { ValidationResult, ValidationOptions } from '../services/ValidationService'
import { ProtectionLevel } from '../services/XSSProtectionService'

/**
 * Secure input hook options
 */
export interface SecureInputOptions extends Partial<ValidationOptions> {
  debounceMs?: number
  validateOnChange?: boolean
  validateOnBlur?: boolean
  protectionLevel?: ProtectionLevel
  fieldName?: string
  required?: boolean
  customValidator?: (value: string) => Promise<boolean> | boolean
}

/**
 * Secure input hook result
 */
export interface SecureInputResult {
  value: string
  sanitizedValue: string
  isValid: boolean
  isValidating: boolean
  errors: string[]
  threats: any[]
  threatLevel: string
  
  // Event handlers
  onChange: (value: string) => void
  onBlur: () => void
  onFocus: () => void
  
  // Methods
  validate: () => Promise<boolean>
  clear: () => void
  setValue: (value: string) => void
  
  // State
  touched: boolean
  focused: boolean
  dirty: boolean
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: SecureInputOptions = {
  debounceMs: 300,
  validateOnChange: true,
  validateOnBlur: true,
  protectionLevel: ProtectionLevel.STANDARD,
  sanitizationLevel: 'strict',
  maxLength: 1000,
  minLength: 0,
  allowSpecialChars: false,
  strictMode: true,
  required: false
}

/**
 * Secure input hook
 */
export const useSecureInput = (
  initialValue: string = '',
  options: SecureInputOptions = {}
): SecureInputResult => {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { validateInput, sanitizeHtml, reportThreat } = useSecurityContext()
  
  // State
  const [value, setValue] = useState(initialValue)
  const [sanitizedValue, setSanitizedValue] = useState(initialValue)
  const [isValid, setIsValid] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [threats, setThreats] = useState<any[]>([])
  const [threatLevel, setThreatLevel] = useState('LOW')
  const [touched, setTouched] = useState(false)
  const [focused, setFocused] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  /**
   * Validate input value
   */
  const validateValue = useCallback(async (inputValue: string): Promise<boolean> => {
    setIsValidating(true)
    
    try {
      // Basic validation
      if (opts.required && !inputValue.trim()) {
        setErrors(['This field is required'])
        setIsValid(false)
        setIsValidating(false)
        return false
      }

      // Security validation
      const result: ValidationResult = ValidationService.validateInput(
        inputValue,
        opts.fieldName || 'input',
        {
          maxLength: opts.maxLength,
          minLength: opts.minLength,
          allowSpecialChars: opts.allowSpecialChars,
          strictMode: opts.strictMode,
          sanitizationLevel: opts.sanitizationLevel,
          customPatterns: opts.customPatterns
        }
      )

      // Update state based on validation result
      setSanitizedValue(result.sanitizedValue)
      setErrors(result.errors)
      setThreats(result.threats)
      setThreatLevel(result.threatLevel)
      
      // Report threats to security context
      if (result.threats.length > 0) {
        result.threats.forEach(threat => reportThreat(threat))
      }

      // Custom validation
      let customValid = true
      if (opts.customValidator) {
        customValid = await opts.customValidator(result.sanitizedValue)
        if (!customValid) {
          setErrors(prev => [...prev, 'Custom validation failed'])
        }
      }

      const finalValid = result.isValid && customValid
      setIsValid(finalValid)
      setIsValidating(false)
      
      return finalValid
    } catch (error) {
      console.error('Validation error:', error)
      setErrors(['Validation failed'])
      setIsValid(false)
      setIsValidating(false)
      return false
    }
  }, [opts, reportThreat])

  /**
   * Handle value change with debouncing
   */
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue)
    setDirty(true)
    
    // Clear previous debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    // Set new debounce timer for validation
    if (opts.validateOnChange) {
      const timer = setTimeout(() => {
        validateValue(newValue)
      }, opts.debounceMs)
      setDebounceTimer(timer)
    }
  }, [debounceTimer, opts.validateOnChange, opts.debounceMs, validateValue])

  /**
   * Handle blur event
   */
  const handleBlur = useCallback(() => {
    setTouched(true)
    setFocused(false)
    
    if (opts.validateOnBlur) {
      validateValue(value)
    }
  }, [opts.validateOnBlur, value, validateValue])

  /**
   * Handle focus event
   */
  const handleFocus = useCallback(() => {
    setFocused(true)
  }, [])

  /**
   * Manual validation trigger
   */
  const validate = useCallback(async (): Promise<boolean> => {
    return await validateValue(value)
  }, [value, validateValue])

  /**
   * Clear input
   */
  const clear = useCallback(() => {
    setValue('')
    setSanitizedValue('')
    setErrors([])
    setThreats([])
    setThreatLevel('LOW')
    setIsValid(true)
    setTouched(false)
    setDirty(false)
    
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }
  }, [debounceTimer])

  /**
   * Set value programmatically
   */
  const setValueProgrammatically = useCallback((newValue: string) => {
    setValue(newValue)
    setSanitizedValue(newValue)
    setDirty(true)
    
    if (opts.validateOnChange) {
      validateValue(newValue)
    }
  }, [opts.validateOnChange, validateValue])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  // Initial validation if value is provided
  useEffect(() => {
    if (initialValue && opts.validateOnChange) {
      validateValue(initialValue)
    }
  }, []) // Only run on mount

  return {
    value,
    sanitizedValue,
    isValid,
    isValidating,
    errors,
    threats,
    threatLevel,
    onChange: handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
    validate,
    clear,
    setValue: setValueProgrammatically,
    touched,
    focused,
    dirty
  }
}

/**
 * Secure email input hook
 */
export const useSecureEmailInput = (
  initialValue: string = '',
  options: Omit<SecureInputOptions, 'customValidator'> = {}
): SecureInputResult => {
  return useSecureInput(initialValue, {
    ...options,
    fieldName: 'email',
    maxLength: 254,
    customValidator: async (value: string) => {
      if (!value) return !options.required
      const result = ValidationService.validateEmail(value)
      return result.isValid
    }
  })
}

/**
 * Secure phone input hook
 */
export const useSecurePhoneInput = (
  initialValue: string = '',
  options: Omit<SecureInputOptions, 'customValidator'> = {}
): SecureInputResult => {
  return useSecureInput(initialValue, {
    ...options,
    fieldName: 'phone',
    maxLength: 20,
    allowSpecialChars: true,
    customValidator: async (value: string) => {
      if (!value) return !options.required
      const result = ValidationService.validatePhone(value)
      return result.isValid
    }
  })
}

/**
 * Secure password input hook
 */
export const useSecurePasswordInput = (
  initialValue: string = '',
  minLength: number = 8,
  options: Omit<SecureInputOptions, 'customValidator' | 'minLength'> = {}
): SecureInputResult => {
  return useSecureInput(initialValue, {
    ...options,
    fieldName: 'password',
    maxLength: 128,
    minLength,
    allowSpecialChars: true,
    sanitizationLevel: 'basic', // Don't over-sanitize passwords
    customValidator: async (value: string) => {
      if (!value) return !options.required
      const result = ValidationService.validatePassword(value, minLength)
      return result.isValid
    }
  })
}

/**
 * Secure URL input hook
 */
export const useSecureUrlInput = (
  initialValue: string = '',
  options: Omit<SecureInputOptions, 'customValidator'> = {}
): SecureInputResult => {
  return useSecureInput(initialValue, {
    ...options,
    fieldName: 'url',
    maxLength: 2048,
    allowSpecialChars: true,
    customValidator: async (value: string) => {
      if (!value) return !options.required
      const result = ValidationService.validateUrl(value)
      return result.isValid
    }
  })
}

/**
 * Secure text area hook
 */
export const useSecureTextAreaInput = (
  initialValue: string = '',
  maxLength: number = 2000,
  options: Omit<SecureInputOptions, 'maxLength'> = {}
): SecureInputResult => {
  return useSecureInput(initialValue, {
    ...options,
    fieldName: 'textarea',
    maxLength,
    allowSpecialChars: true,
    sanitizationLevel: 'strict'
  })
}

export default useSecureInput
