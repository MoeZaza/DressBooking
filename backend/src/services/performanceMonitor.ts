/**
 * Real-time Performance Monitoring Service
 * 
 * Monitors page load times, API response times, user interactions,
 * and system performance metrics in real-time.
 */

interface PerformanceMetric {
  id: string
  timestamp: number
  type: 'page_load' | 'api_call' | 'user_interaction' | 'error' | 'memory' | 'network'
  name: string
  duration?: number
  value?: number
  metadata?: Record<string, any>
}

interface PerformanceThresholds {
  pageLoadWarning: number // ms
  pageLoadCritical: number // ms
  apiResponseWarning: number // ms
  apiResponseCritical: number // ms
  memoryUsageWarning: number // percentage
  memoryUsageCritical: number // percentage
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []
  private thresholds: PerformanceThresholds = {
    pageLoadWarning: 2000,    // Reduced from 3000ms
    pageLoadCritical: 5000,   // Reduced from 8000ms
    apiResponseWarning: 1000, // Reduced from 2000ms
    apiResponseCritical: 3000, // Reduced from 5000ms
    memoryUsageWarning: 60,   // Reduced from 70%
    memoryUsageCritical: 80   // Reduced from 85%
  }
  private isMonitoring = false

  constructor() {
    this.initializeMonitoring()
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return

    // Monitor navigation timing
    this.observeNavigationTiming()
    
    // Monitor resource loading
    this.observeResourceTiming()
    
    // Monitor long tasks
    this.observeLongTasks()
    
    // Monitor memory usage
    this.observeMemoryUsage()
    
    // Monitor user interactions
    this.observeUserInteractions()

    this.isMonitoring = true
    console.log('🔍 Performance monitoring initialized')
  }

  private observeNavigationTiming() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          
          const pageLoadTime = navEntry.loadEventEnd - navEntry.fetchStart
          const domContentLoadedTime = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
          
          this.addMetric({
            type: 'page_load',
            name: 'navigation',
            duration: pageLoadTime,
            metadata: {
              domContentLoaded: domContentLoadedTime,
              domInteractive: navEntry.domInteractive - navEntry.fetchStart,
              firstPaint: navEntry.fetchStart,
              url: window.location.pathname
            }
          })

          // Check thresholds
          if (pageLoadTime > this.thresholds.pageLoadCritical) {
            this.reportPerformanceIssue('critical', 'Page load time exceeded critical threshold', {
              duration: pageLoadTime,
              threshold: this.thresholds.pageLoadCritical,
              url: window.location.pathname
            })
          } else if (pageLoadTime > this.thresholds.pageLoadWarning) {
            this.reportPerformanceIssue('warning', 'Page load time exceeded warning threshold', {
              duration: pageLoadTime,
              threshold: this.thresholds.pageLoadWarning,
              url: window.location.pathname
            })
          }
        }
      })
    })

    observer.observe({ entryTypes: ['navigation'] })
    this.observers.push(observer)
  }

  private observeResourceTiming() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          
          // Monitor API calls specifically
          if (resourceEntry.name.includes('/api/')) {
            const duration = resourceEntry.responseEnd - resourceEntry.requestStart
            
            this.addMetric({
              type: 'api_call',
              name: resourceEntry.name,
              duration,
              metadata: {
                method: 'GET', // Default, could be enhanced to detect actual method
                status: 'unknown', // Would need to be set by axios interceptor
                size: resourceEntry.transferSize
              }
            })

            // Check API response time thresholds
            if (duration > this.thresholds.apiResponseCritical) {
              this.reportPerformanceIssue('critical', 'API response time exceeded critical threshold', {
                api: resourceEntry.name,
                duration,
                threshold: this.thresholds.apiResponseCritical
              })
            } else if (duration > this.thresholds.apiResponseWarning) {
              this.reportPerformanceIssue('warning', 'API response time exceeded warning threshold', {
                api: resourceEntry.name,
                duration,
                threshold: this.thresholds.apiResponseWarning
              })
            }
          }
        }
      })
    })

    observer.observe({ entryTypes: ['resource'] })
    this.observers.push(observer)
  }

  private observeLongTasks() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'longtask') {
            this.addMetric({
              type: 'user_interaction',
              name: 'long_task',
              duration: entry.duration,
              metadata: {
                startTime: entry.startTime,
                attribution: (entry as any).attribution
              }
            })

            // Long tasks are always performance issues
            this.reportPerformanceIssue('warning', 'Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime
            })
          }
        })
      })

      observer.observe({ entryTypes: ['longtask'] })
      this.observers.push(observer)
    } catch (e) {
      // longtask might not be supported in all browsers
      console.warn('Long task monitoring not supported')
    }
  }

  private observeMemoryUsage() {
    if (!('performance' in window) || !('memory' in (window.performance as any))) return

    const checkMemory = () => {
      const memory = (window.performance as any).memory
      const usedPercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

      this.addMetric({
        type: 'memory',
        name: 'heap_usage',
        value: usedPercentage,
        metadata: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      })

      // Check memory thresholds
      if (usedPercentage > this.thresholds.memoryUsageCritical) {
        this.reportPerformanceIssue('critical', 'Memory usage exceeded critical threshold', {
          usage: usedPercentage,
          threshold: this.thresholds.memoryUsageCritical
        })
      } else if (usedPercentage > this.thresholds.memoryUsageWarning) {
        this.reportPerformanceIssue('warning', 'Memory usage exceeded warning threshold', {
          usage: usedPercentage,
          threshold: this.thresholds.memoryUsageWarning
        })
      }
    }

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000)
    checkMemory() // Initial check
  }

  private observeUserInteractions() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'event') {
            this.addMetric({
              type: 'user_interaction',
              name: entry.name,
              duration: entry.duration,
              metadata: {
                startTime: entry.startTime,
                processingStart: (entry as any).processingStart,
                processingEnd: (entry as any).processingEnd
              }
            })
          }
        })
      })

      observer.observe({ entryTypes: ['event'] })
      this.observers.push(observer)
    } catch (e) {
      // event timing might not be supported in all browsers
      console.warn('Event timing monitoring not supported')
    }
  }

  private addMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: Date.now()
    }

    this.metrics.push(fullMetric)

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log significant metrics
    if (metric.type === 'page_load' || metric.type === 'api_call') {
      console.log(`📊 Performance: ${metric.name} - ${metric.duration}ms`)
    }
  }

  private reportPerformanceIssue(severity: 'warning' | 'critical', message: string, metadata: any) {
    console.warn(`⚠️ Performance ${severity}: ${message}`, metadata)
    
    // In production, this could send to monitoring service
    this.addMetric({
      type: 'error',
      name: 'performance_issue',
      metadata: {
        severity,
        message,
        ...metadata
      }
    })
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11)
  }

  // Public API
  public getMetrics(type?: PerformanceMetric['type'], limit = 100): PerformanceMetric[] {
    let filtered = this.metrics
    
    if (type) {
      filtered = filtered.filter(m => m.type === type)
    }
    
    return filtered.slice(-limit)
  }

  public getAveragePageLoadTime(minutes = 10): number {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    const pageLoads = this.metrics.filter(m => 
      m.type === 'page_load' && 
      m.timestamp > cutoff && 
      m.duration
    )
    
    if (pageLoads.length === 0) return 0
    
    const total = pageLoads.reduce((sum, m) => sum + (m.duration || 0), 0)
    return Math.round(total / pageLoads.length)
  }

  public getAverageApiResponseTime(minutes = 10): number {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    const apiCalls = this.metrics.filter(m => 
      m.type === 'api_call' && 
      m.timestamp > cutoff && 
      m.duration
    )
    
    if (apiCalls.length === 0) return 0
    
    const total = apiCalls.reduce((sum, m) => sum + (m.duration || 0), 0)
    return Math.round(total / apiCalls.length)
  }

  public getCurrentMemoryUsage(): number {
    if (!('performance' in window) || !('memory' in (window.performance as any))) return 0
    
    const memory = (window.performance as any).memory
    return Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
  }

  public updateThresholds(newThresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds }
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics = []
    this.isMonitoring = false
    console.log('🔍 Performance monitoring stopped')
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

export default performanceMonitor
