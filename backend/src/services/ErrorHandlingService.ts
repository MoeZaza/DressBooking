// Comprehensive Error Handling Service
// Provides consistent error handling across all API calls and components

import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/common/helper'

export interface ApiError {
  error: boolean
  message: string
  status: number
  details?: any
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
}

/**
 * Handle API errors with consistent messaging and logging
 */
export const handleApiError = (error: any, fallbackMessage: string = 'An error occurred'): ApiError => {
  console.error('API Error:', error)
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status
    const message = error.response.data?.message || error.response.data?.error || fallbackMessage
    
    if (status === 401) {
      // Unauthorized - redirect to login
      console.warn('Unauthorized access - redirecting to login')
      window.location.href = '/sign-in'
      return { error: true, message: 'Session expired', status }
    }
    
    if (status === 403) {
      return { error: true, message: 'Access denied', status }
    }
    
    if (status === 404) {
      return { error: true, message: 'Resource not found', status }
    }
    
    if (status >= 500) {
      return { error: true, message: 'Server error - please try again later', status }
    }
    
    return { error: true, message, status, details: error.response.data }
  } else if (error.request) {
    // Network error
    console.error('Network Error:', error.request)
    return { 
      error: true, 
      message: 'Network connection failed - please check your internet connection', 
      status: 0 
    }
  } else {
    // Other error
    console.error('Error:', error.message)
    return { error: true, message: fallbackMessage, status: -1 }
  }
}

/**
 * Wrapper for API calls with consistent error handling
 */
export const apiCall = async <T = any>(
  apiFunction: () => Promise<T>,
  fallbackMessage: string = 'Operation failed'
): Promise<ApiResponse<T>> => {
  try {
    const data = await apiFunction()
    return { success: true, data }
  } catch (error) {
    const apiError = handleApiError(error, fallbackMessage)
    return { success: false, error: apiError }
  }
}

/**
 * Show user-friendly error messages
 */
export const showError = (error: ApiError | string, showToast: boolean = true) => {
  const message = typeof error === 'string' ? error : error.message
  
  if (showToast) {
    helper.error(null, message)
  }
  
  console.error('User Error:', message)
}

/**
 * Handle loading states with error recovery
 */
export class LoadingManager {
  private loadingStates: Map<string, boolean> = new Map()
  private errorStates: Map<string, ApiError | null> = new Map()
  
  setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading)
    if (loading) {
      // Clear previous errors when starting new operation
      this.errorStates.set(key, null)
    }
  }
  
  setError(key: string, error: ApiError | null) {
    this.errorStates.set(key, error)
    this.loadingStates.set(key, false)
  }
  
  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false
  }
  
  getError(key: string): ApiError | null {
    return this.errorStates.get(key) || null
  }
  
  clearError(key: string) {
    this.errorStates.set(key, null)
  }
  
  reset(key: string) {
    this.loadingStates.delete(key)
    this.errorStates.delete(key)
  }
}

/**
 * Retry mechanism for failed API calls
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error

      if (attempt === maxRetries) {
        throw error
      }

      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error
      }
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }
  
  throw lastError
}

/**
 * Validate data before API calls
 */
export const validateRequired = (data: Record<string, any>, requiredFields: string[]): string[] => {
  const missing: string[] = []
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field)
    }
  }
  
  return missing
}

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (missingFields: string[]): string => {
  if (missingFields.length === 0) return ''
  
  if (missingFields.length === 1) {
    return `${missingFields[0]} is required`
  }
  
  const lastField = missingFields.pop()
  return `${missingFields.join(', ')} and ${lastField} are required`
}

/**
 * Safe data access with fallbacks
 */
export const safeGet = <T>(obj: any, path: string, fallback: T): T => {
  try {
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return fallback
      }
      current = current[key]
    }
    
    return current !== undefined ? current : fallback
  } catch {
    return fallback
  }
}

/**
 * Debounced error reporting to prevent spam
 */
class ErrorReporter {
  private reportedErrors: Set<string> = new Set()
  private reportTimeout: number = 5000 // 5 seconds
  
  report(error: string | ApiError) {
    const errorKey = typeof error === 'string' ? error : `${error.status}-${error.message}`
    
    if (this.reportedErrors.has(errorKey)) {
      return // Already reported recently
    }
    
    this.reportedErrors.add(errorKey)
    console.error('Reported Error:', error)
    
    // Clear after timeout
    setTimeout(() => {
      this.reportedErrors.delete(errorKey)
    }, this.reportTimeout)
  }
}

export const errorReporter = new ErrorReporter()

/**
 * Global error boundary for unhandled errors
 */
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    errorReporter.report(`Unhandled promise rejection: ${event.reason}`)
    
    // Prevent the default browser error handling
    event.preventDefault()
  })
  
  // Handle general errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    errorReporter.report(`Global error: ${event.error?.message || event.message}`)
  })
  
  console.log('🛡️ Global error handling initialized')
}

/**
 * Component error boundary helper
 */
export const createErrorBoundary = (componentName: string) => {
  return {
    componentDidCatch: (error: Error, errorInfo: any) => {
      console.error(`Error in ${componentName}:`, error, errorInfo)
      errorReporter.report(`Component error in ${componentName}: ${error.message}`)
    }
  }
}

// Initialize global error handling
if (typeof window !== 'undefined') {
  setupGlobalErrorHandling()
}
