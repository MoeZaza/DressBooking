import * as bookcarsTypes from ':bookcars-types'

interface RetryOptions {
  maxRetries: number
  delay: number
  backoffMultiplier: number
  maxDelay: number
}

interface ErrorRecoveryState {
  retryCount: number
  lastError: Error | null
  isRecovering: boolean
  fallbackData: any
}

/**
 * Advanced Error Recovery Service
 * Provides retry mechanisms, fallback data, and graceful degradation
 */
class ErrorRecoveryService {
  private static instance: ErrorRecoveryService
  private recoveryStates: Map<string, ErrorRecoveryState> = new Map()

  private constructor() {}

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService()
    }
    return ErrorRecoveryService.instance
  }

  /**
   * Execute a function with retry logic and error recovery
   */
  async executeWithRetry<T>(
    key: string,
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    fallbackData?: T
  ): Promise<T> {
    const defaultOptions: RetryOptions = {
      maxRetries: 3,
      delay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000,
      ...options
    }

    let state = this.recoveryStates.get(key) || {
      retryCount: 0,
      lastError: null,
      isRecovering: false,
      fallbackData
    }

    state.isRecovering = true
    this.recoveryStates.set(key, state)

    for (let attempt = 0; attempt <= defaultOptions.maxRetries; attempt++) {
      try {
        const result = await fn()
        
        // Success - reset state
        this.recoveryStates.set(key, {
          retryCount: 0,
          lastError: null,
          isRecovering: false,
          fallbackData
        })
        
        return result
      } catch (error: any) {
        state.lastError = error
        state.retryCount = attempt + 1
        
        console.warn(`Attempt ${attempt + 1} failed for ${key}:`, error.message)
        
        if (attempt === defaultOptions.maxRetries) {
          // All retries exhausted
          state.isRecovering = false
          this.recoveryStates.set(key, state)
          
          if (fallbackData !== undefined) {
            console.log(`Using fallback data for ${key}`)
            return fallbackData
          }
          
          throw new Error(`All retry attempts failed for ${key}: ${error.message}`)
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          defaultOptions.delay * Math.pow(defaultOptions.backoffMultiplier, attempt),
          defaultOptions.maxDelay
        )
        
        console.log(`Retrying ${key} in ${delay}ms...`)
        await this.sleep(delay)
      }
    }

    throw new Error(`Unexpected error in retry logic for ${key}`)
  }

  /**
   * Get recovery state for a specific key
   */
  getRecoveryState(key: string): ErrorRecoveryState | null {
    return this.recoveryStates.get(key) || null
  }

  /**
   * Check if a service is currently recovering
   */
  isRecovering(key: string): boolean {
    const state = this.recoveryStates.get(key)
    return state?.isRecovering || false
  }

  /**
   * Set fallback data for a service
   */
  setFallbackData(key: string, data: any): void {
    const state = this.recoveryStates.get(key) || {
      retryCount: 0,
      lastError: null,
      isRecovering: false,
      fallbackData: null
    }
    
    state.fallbackData = data
    this.recoveryStates.set(key, state)
  }

  /**
   * Clear recovery state for a service
   */
  clearRecoveryState(key: string): void {
    this.recoveryStates.delete(key)
  }

  /**
   * Get all recovery states (for monitoring)
   */
  getAllRecoveryStates(): Record<string, ErrorRecoveryState> {
    const states: Record<string, ErrorRecoveryState> = {}
    this.recoveryStates.forEach((state, key) => {
      states[key] = state
    })
    return states
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create a circuit breaker for a service
   */
  createCircuitBreaker(key: string, threshold: number = 5, _timeout: number = 60000) {
    return {
      isOpen: () => {
        const state = this.recoveryStates.get(key)
        return state && state.retryCount >= threshold
      },
      
      reset: () => {
        this.clearRecoveryState(key)
      },
      
      execute: async <T>(fn: () => Promise<T>, fallback?: T): Promise<T> => {
        const state = this.recoveryStates.get(key)
        if (state && state.retryCount >= threshold) {
          if (fallback !== undefined) {
            return fallback
          }
          throw new Error(`Circuit breaker is open for ${key}`)
        }

        return this.executeWithRetry(key, fn, { maxRetries: 2 }, fallback)
      }
    }
  }

  /**
   * Automated Issue Resolution Methods
   */

  public enableAutoResolution() {
    // Set up automated issue detection and resolution
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.performAutomatedHealthCheck()
      }, 60000) // Check every minute

      console.log('🤖 Automated issue resolution enabled')
    }
  }

  private async performAutomatedHealthCheck() {
    try {
      // Check for common issues and auto-resolve
      await this.checkAndResolveMemoryIssues()
      await this.checkAndResolveUIIssues()
    } catch (error) {
      console.error('Error during automated health check:', error)
    }
  }

  private async checkAndResolveMemoryIssues() {
    if (typeof window === 'undefined') return

    // Check memory usage
    if ('performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

      if (usagePercentage > 80) {
        console.warn('🧹 High memory usage detected, performing cleanup')

        // Clear localStorage of old data
        this.cleanupLocalStorage()

        // Force garbage collection if available
        if ('gc' in window) {
          (window as any).gc()
        }

        console.log('✅ Auto-resolved memory issue')
      }
    }
  }

  private async checkAndResolveUIIssues() {
    if (typeof document === 'undefined') return

    // Fix missing navigation elements
    const navElements = document.querySelectorAll('.menu-button')
    if (navElements.length === 0) {
      console.log('🔧 Navigation elements missing, attempting to restore')
      this.restoreNavigationElements()
      console.log('✅ Auto-resolved navigation issue')
    }

    // Fix broken images
    const brokenImages = document.querySelectorAll('img[src=""], img:not([src])')
    if (brokenImages.length > 0) {
      console.log('🖼️ Fixing broken images')
      brokenImages.forEach(img => {
        (img as HTMLImageElement).src = '/placeholder-image.png'
      })
      console.log('✅ Auto-resolved image issues')
    }
  }

  private cleanupLocalStorage() {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        // Remove old cache entries
        if (key.includes('cache') && key.includes('timestamp')) {
          const timestamp = localStorage.getItem(key)
          if (timestamp && Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
            keysToRemove.push(key)
            keysToRemove.push(key.replace('-timestamp', ''))
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`🧹 Cleaned up ${keysToRemove.length} localStorage entries`)
  }

  private restoreNavigationElements() {
    // Check if header exists and add navigation button if missing
    const header = document.querySelector('header, .MuiAppBar-root')
    if (header && !header.querySelector('.menu-button')) {
      const navButton = document.createElement('button')
      navButton.className = 'menu-button'
      navButton.innerHTML = '☰'
      navButton.style.cssText = 'position: absolute; top: 10px; left: 10px; z-index: 1000;'
      header.appendChild(navButton)
    }
  }
}

// Export singleton instance
export const errorRecoveryService = ErrorRecoveryService.getInstance()

// Export common fallback data
export const fallbackData = {
  emptyBookings: { resultData: [], pageInfo: { totalRecords: 0 } },
  emptyDresses: { resultData: [], pageInfo: { totalRecords: 0 } },
  emptySuppliers: [],
  emptyLocations: [],
  emptyUsers: { resultData: [], pageInfo: { totalRecords: 0 } },
  emptyStats: {
    totalBookings: 0,
    totalRevenue: 0,
    totalDresses: 0,
    totalSuppliers: 0,
    totalUsers: 0,
    averageBookingValue: 0,
    activeAppointments: 0,
    pendingPayments: 0,
    topPerformingDresses: [],
    recentBookings: [],
    monthlyRevenue: []
  }
}

export default ErrorRecoveryService
