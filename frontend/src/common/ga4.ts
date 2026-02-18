import ga4 from 'react-ga4'
import env from '@/config/env.config'

const TRACKING_ID = env.GOOGLE_ANALYTICS_ID
const { isProduction } = env

// Store cleanup function reference
let cleanupGa4: (() => void) | null = null

export const init = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  let fired = false
  const loadAnalyticsScript = () => {
    if (!fired) {
      ga4.initialize(TRACKING_ID, { testMode: !isProduction })
      fired = true
    }
  }

  window.addEventListener('mousemove', loadAnalyticsScript, { once: true })
  window.addEventListener('touchstart', loadAnalyticsScript, { once: true })

  // Return cleanup function
  return () => {
    // Note: The listeners use { once: true } so they auto-cleanup
    // This function is mainly for ensuring clean shutdown if needed
    if (typeof cleanupGa4 === 'function') {
      cleanupGa4()
      cleanupGa4 = null
    }
  }
}

export const sendEvent = (name: string) => ga4.event('screen_view', {
  app_name: 'bookdress',
  screen_name: name,
})

export const sendPageview = (path: string) => ga4.send({
  hitType: 'pageview',
  page: path
})

// Export cleanup function
export const setCleanupGa4 = (cleanup: () => void) => {
  cleanupGa4 = cleanup
}

// Manual cleanup for testing
export const cleanup = () => {
  if (cleanupGa4) {
    cleanupGa4()
  }
}
