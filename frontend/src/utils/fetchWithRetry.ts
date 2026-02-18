/**
 * Fetch with Retry Utility
 * Provides automatic retry logic for failed requests
 */

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  retryOn?: number[]
  exponentialBackoff?: boolean
}

export interface FetchOptions extends RequestInit {
  retries?: number
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOn: [408, 429, 500, 502, 503, 504],
  exponentialBackoff: true
}

/**
 * Calculate delay with optional exponential backoff
 */
function calculateDelay(retryCount: number, options: RetryOptions): number {
  if (options.exponentialBackoff) {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return options.retryDelay! * Math.pow(2, retryCount)
  } else {
    return options.retryDelay!
  }
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown, retryOn: number[]): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const err = error as { status?: number; response?: Response }

  // Check HTTP status
  if (err.status && retryOn.includes(err.status)) {
    return true
  }

  // Check network errors
  if (error instanceof Error && error.message.includes('fetch')) {
    return true
  }

  return false
}

/**
 * Fetch with automatic retry on failure
 */
export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_OPTIONS.maxRetries,
    retryDelay = DEFAULT_RETRY_OPTIONS.retryDelay,
    retryOn = DEFAULT_RETRY_OPTIONS.retryOn,
    exponentialBackoff = DEFAULT_RETRY_OPTIONS.exponentialBackoff,
  } = retryOptions

  let lastError: Error | null = null
  let attemptCount = 0

  while (attemptCount <= maxRetries) {
    try {
      // Create abort controller for this attempt
      const controller = new AbortController()

      // Pass signal to fetch options
      const fetchOptions: RequestInit = {
        ...options,
        signal: controller.signal,
      }

      const response = await fetch(url, fetchOptions)

      if (response.ok) {
        return await response.json() as T
      }

      // Get error details
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(errorData.message || `HTTP ${response.status}`)
      ;(error as any).status = response.status

      // Check if we should retry
      if (isRetryableError(error, retryOn) && attemptCount < maxRetries) {
        lastError = error
        attemptCount++

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, calculateDelay(attemptCount, retryOptions)))
        continue
      }

      // Not retryable or max retries reached
      throw error
    } catch (error) {
      // Check if we should retry
      if (isRetryableError(error, retryOn) && attemptCount < maxRetries) {
        lastError = error as Error
        attemptCount++

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, calculateDelay(attemptCount, retryOptions)))
        continue
      }

      // Not retryable or max retries reached
      throw error as Error
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Maximum retry attempts exceeded')
}

/**
 * Get fetch statistics (useful for debugging)
 */
export function getFetchStats(lastError: Error | null, attemptCount: number): {
  success: boolean,
  error: string | null,
  attempts: number
} {
  return {
    success: lastError === null,
    error: lastError?.message || null,
    attempts: attemptCount,
  }
}

export default fetchWithRetry
