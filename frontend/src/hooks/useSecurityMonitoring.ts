import { useCallback, useEffect, useState, useRef } from 'react'
import { useSecurityContext } from '../context/SecurityContext'
import { SecurityEvent, SecurityEventType } from '../context/SecurityContext'
import { ThreatLevel } from '../services/ValidationService'

/**
 * Security monitoring hook options
 */
export interface SecurityMonitoringOptions {
  enableRealTimeAlerts?: boolean
  alertThreshold?: ThreatLevel
  maxEventsToTrack?: number
  autoReportThreats?: boolean
}

/**
 * Security monitoring hook result
 */
export interface SecurityMonitoringResult {
  isMonitoring: boolean
  threatLevel: ThreatLevel
  recentEvents: SecurityEvent[]
  threatCount: number
  blockedRequests: number
  securityScore: number

  // Actions
  startMonitoring: () => void
  stopMonitoring: () => void
  reportSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void
  clearEvents: () => void
  getThreatSummary: () => { total: number; byLevel: Record<ThreatLevel, number> }
  isSecure: () => boolean
  enable: () => void
  disable: () => void
}

/**
 * Default monitoring options
 */
const DEFAULT_OPTIONS: SecurityMonitoringOptions = {
  enableRealTimeAlerts: true,
  alertThreshold: ThreatLevel.HIGH,
  maxEventsToTrack: 50,
  autoReportThreats: true
}

/**
 * Security monitoring hook
 */
export const useSecurityMonitoring = (
  options: SecurityMonitoringOptions = {}
): SecurityMonitoringResult => {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const {
    state,
    enableMonitoring,
    disableMonitoring,
    reportEvent,
    clearEvents: contextClearEvents,
    getThreatSummary: contextGetThreatSummary,
    isSecure: contextIsSecure,
    getSecurityScore
  } = useSecurityContext()

  const [alertShown, setAlertShown] = useState(false)
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(() => {
    enableMonitoring()

    reportEvent({
      type: SecurityEventType.SECURITY_WARNING,
      severity: ThreatLevel.LOW,
      description: 'Security monitoring started',
      source: 'useSecurityMonitoring'
    })
  }, [enableMonitoring, reportEvent])

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    disableMonitoring()
  }, [disableMonitoring])

  /**
   * Report security event
   */
  const reportSecurityEvent = useCallback((
    event: Omit<SecurityEvent, 'id' | 'timestamp'>
  ) => {
    reportEvent(event)

    // Show alert if threshold is met
    if (opts.enableRealTimeAlerts &&
      event.severity >= opts.alertThreshold! &&
      !alertShown) {
      setAlertShown(true)

      // Reset alert flag after 5 seconds
      alertTimeoutRef.current = setTimeout(() => setAlertShown(false), 5000)

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('Security Alert', {
          body: `${event.type}: ${event.description}`,
          icon: '/favicon.ico'
        })
      }
    }
  }, [opts.enableRealTimeAlerts, opts.alertThreshold, alertShown, reportEvent])

  /**
   * Clear events
   */
  const clearEvents = useCallback(() => {
    contextClearEvents()
    setAlertShown(false)
  }, [contextClearEvents])

  /**
   * Get threat summary
   */
  const getThreatSummary = useCallback(() => {
    return contextGetThreatSummary()
  }, [contextGetThreatSummary])

  /**
   * Check if system is secure
   */
  const isSecure = useCallback(() => {
    return contextIsSecure()
  }, [contextIsSecure])

  /**
   * Enable monitoring (alias for startMonitoring)
   */
  const enable = useCallback(() => {
    enableMonitoring()
  }, [enableMonitoring])

  /**
   * Disable monitoring (alias for stopMonitoring)
   */
  const disable = useCallback(() => {
    disableMonitoring()
  }, [disableMonitoring])

  const securityScore = getSecurityScore()

  return {
    isMonitoring: state.monitoring.enabled,
    threatLevel: securityScore < 70 ? ThreatLevel.HIGH : ThreatLevel.LOW,
    recentEvents: state.events.slice(-opts.maxEventsToTrack!),
    threatCount: state.monitoring.threatCount,
    blockedRequests: state.blockedRequests,
    securityScore,
    startMonitoring,
    stopMonitoring,
    reportSecurityEvent,
    clearEvents,
    getThreatSummary,
    isSecure,
    enable,
    disable
  }
}

export default useSecurityMonitoring
