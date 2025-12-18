/**
 * Bundle Optimization Utilities
 * 
 * This file contains utilities for optimizing frontend bundle size
 * through code splitting, lazy loading, and dynamic imports.
 */

import { lazy } from 'react'

// Lazy load heavy Material-UI components
export const LazyDataGrid = lazy(() => import('@mui/x-data-grid').then(module => ({ default: module.DataGrid as any })))
export const LazyDatePicker = lazy(() => import('@mui/x-date-pickers').then(module => ({ default: module.DatePicker })))
export const LazyLocalizationProvider = lazy(() => import('@mui/x-date-pickers').then(module => ({ default: module.LocalizationProvider })))
// AdapterDateFns is not a component, so we don't lazy load it
// export const LazyAdapterDateFns = lazy(() => import('@mui/x-date-pickers/AdapterDateFns').then(module => ({ default: module.AdapterDateFns })))

// Lazy load chart components (if using charts)
export const LazyChart = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })))
export const LazyLineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })))
export const LazyBarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })))
export const LazyPieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })))

// Lazy load heavy pages
export const LazySuppliers = lazy(() => import('../pages/Suppliers'))
export const LazyDresses = lazy(() => import('../pages/Dresses'))
export const LazyUsers = lazy(() => import('../pages/Users'))
export const LazyLocations = lazy(() => import('../pages/Locations'))

// Bundle optimization utilities
export const preloadComponent = (componentLoader: () => Promise<any>) => {
  // Preload component on idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      componentLoader()
    })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      componentLoader()
    }, 100)
  }
}

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  preloadComponent(() => import('@mui/x-data-grid'))
  preloadComponent(() => import('@mui/x-date-pickers'))
}

// Memory optimization utilities
export const cleanupUnusedComponents = () => {
  // Clear any cached modules that are no longer needed
  if ('performance' in window && 'memory' in (window.performance as any)) {
    const memory = (window.performance as any).memory
    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      // If memory usage is high, trigger garbage collection hints
      if ('gc' in window) {
        (window as any).gc()
      }
    }
  }
}

// Resource hints for better loading performance
export const addResourceHints = () => {
  const head = document.head

  // Preconnect to external resources
  const preconnectLinks = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ]

  preconnectLinks.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = href
    link.crossOrigin = 'anonymous'
    head.appendChild(link)
  })

  // DNS prefetch for external domains
  const dnsPrefetchLinks = [
    'https://api.example.com', // Replace with actual API domain
    'https://cdn.example.com'  // Replace with actual CDN domain
  ]

  dnsPrefetchLinks.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = href
    head.appendChild(link)
  })
}

// Initialize bundle optimizations
export const initializeBundleOptimizations = () => {
  // Add resource hints
  addResourceHints()
  
  // Preload critical components after initial render
  setTimeout(() => {
    preloadCriticalComponents()
  }, 1000)

  // Set up periodic cleanup
  setInterval(() => {
    cleanupUnusedComponents()
  }, 5 * 60 * 1000) // Every 5 minutes
}

// Performance monitoring
export const monitorBundlePerformance = () => {
  if ('performance' in window) {
    // Monitor bundle loading times
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          console.log('Bundle Performance Metrics:', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            totalTime: navEntry.loadEventEnd - navEntry.fetchStart
          })
        }
      })
    })

    observer.observe({ entryTypes: ['navigation'] })
  }
}

export default {
  LazyDataGrid,
  LazyDatePicker,
  LazyLocalizationProvider,
  LazyChart,
  LazyLineChart,
  LazyBarChart,
  LazyPieChart,
  LazySuppliers,
  LazyDresses,
  LazyUsers,
  LazyLocations,
  preloadComponent,
  preloadCriticalComponents,
  cleanupUnusedComponents,
  addResourceHints,
  initializeBundleOptimizations,
  monitorBundlePerformance
}
