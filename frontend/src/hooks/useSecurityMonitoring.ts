import { useCallback, useEffect, useState } from 'react'
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
  // State
  isMonitoring: boolean
  threatLevel: ThreatLevel
  recentEvents: SecurityEvent[]
  threatCount: number
  blockedRequests: number
  
  // Actions
  startMonitoring: () => void
  stopMonitoring: () => void
  reportSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void
  clearEvents: () => void
  
  // Utilities
  getThreatSummary: () => { total: number; byLevel: Record<ThreatLevel, number> }
  isSecure: () => boolean
  getSecurityScore: () => number
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
    reportEvent,
    clearEvents: contextClearEvents,
    getThreatSummary: contextGetThreatSummary,
    isSecure: contextIsSecure,
    enableMonitoring,
    disableMonitoring
  } = useSecurityContext()

  const [isMonitoring, setIsMonitoring] = useState(state.monitoring.enabled)
  const [alertShown, setAlertShown] = useState(false)

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
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
    setIsMonitoring(false)
    disableMonitoring()
    
    reportEvent({
      type: SecurityEventType.SECURITY_WARNING,
      severity: ThreatLevel.LOW,
      description: 'Security monitoring stopped',
      source: 'useSecurityMonitoring'
    })
  }, [disableMonitoring, reportEvent])

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
      setTimeout(() => setAlertShown(false), 5000)
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('Security Alert', {
          body: `${event.type}: ${event.description}`,
          icon: '/favicon.ico'
        })
      }
    }
  }, [reportEvent, opts.enableRealTimeAlerts, opts.alertThreshold, alertShown])

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
   * Calculate security score (0-100)
   */
  const getSecurityScore = useCallback(() => {
    const summary = getThreatSummary()
    const totalThreats = summary.total
    const criticalThreats = summary.byLevel[ThreatLevel.CRITICAL]
    const highThreats = summary.byLevel[ThreatLevel.HIGH]
    const mediumThreats = summary.byLevel[ThreatLevel.MEDIUM]
    
    // Base score
    let score = 100
    
    // Deduct points for threats
    score -= criticalThreats * 20
    score -= highThreats * 10
    score -= mediumThreats * 5
    score -= state.blockedRequests * 2
    
    // Bonus for no recent threats
    if (totalThreats === 0) {
      score = Math.min(100, score + 10)
    }
    
    return Math.max(0, score)
  }, [getThreatSummary, state.blockedRequests])

  /**
   * Request notification permission on mount
   */
  useEffect(() => {
    if (opts.enableRealTimeAlerts && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [opts.enableRealTimeAlerts])

  /**
   * Auto-start monitoring if enabled
   */
  useEffect(() => {
    if (state.monitoring.enabled && !isMonitoring) {
      setIsMonitoring(true)
    }
  }, [state.monitoring.enabled, isMonitoring])

  return {
    isMonitoring,
    threatLevel: state.threatLevel,
    recentEvents: state.events.slice(-opts.maxEventsToTrack!),
    threatCount: state.monitoring.threatCount,
    blockedRequests: state.blockedRequests,
    startMonitoring,
    stopMonitoring,
    reportSecurityEvent,
    clearEvents,
    getThreatSummary,
    isSecure,
    getSecurityScore
  }
}

/**
 * Hook for form security monitoring
 */
export const useFormSecurityMonitoring = (formName: string) => {
  const { reportSecurityEvent } = useSecurityMonitoring()
  
  const reportFormThreat = useCallback((
    threatType: string,
    fieldName: string,
    details?: any
  ) => {
    reportSecurityEvent({
      type: SecurityEventType.THREAT_DETECTED,
      severity: ThreatLevel.MEDIUM,
      description: `Form security threat in ${formName}.${fieldName}`,
      details: { threatType, fieldName, formName, ...details },
      source: formName
    })
  }, [reportSecurityEvent, formName])

  const reportValidationFailure = useCallback((
    fieldName: string,
    errors: string[]
  ) => {
    reportSecurityEvent({
      type: SecurityEventType.VALIDATION_FAILED,
      severity: ThreatLevel.LOW,
      description: `Validation failed in ${formName}.${fieldName}`,
      details: { fieldName, formName, errors },
      source: formName
    })
  }, [reportSecurityEvent, formName])

  return {
    reportFormThreat,
    reportValidationFailure
  }
}

/**
 * Hook for API security monitoring
 */
export const useApiSecurityMonitoring = () => {
  const { reportSecurityEvent } = useSecurityMonitoring()
  
  const reportApiThreat = useCallback((
    endpoint: string,
    threatType: string,
    details?: any
  ) => {
    reportSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: ThreatLevel.HIGH,
      description: `API security threat detected: ${endpoint}`,
      details: { endpoint, threatType, ...details },
      source: 'API'
    })
  }, [reportSecurityEvent])

  const reportBlockedRequest = useCallback((
    endpoint: string,
    reason: string
  ) => {
    reportSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: ThreatLevel.HIGH,
      description: `API request blocked: ${endpoint}`,
      details: { endpoint, reason },
      source: 'API',
      blocked: true
    })
  }, [reportSecurityEvent])

  return {
    reportApiThreat,
    reportBlockedRequest
  }
}

/**
 * Hook for XSS monitoring
 */
export const useXSSMonitoring = () => {
  const { reportSecurityEvent } = useSecurityMonitoring()
  
  const reportXSSAttempt = useCallback((
    location: string,
    payload: string,
    blocked: boolean = true
  ) => {
    reportSecurityEvent({
      type: SecurityEventType.XSS_BLOCKED,
      severity: ThreatLevel.CRITICAL,
      description: `XSS attempt ${blocked ? 'blocked' : 'detected'}: ${location}`,
      details: { location, payload: payload.substring(0, 100) }, // Truncate payload
      source: location,
      blocked
    })
  }, [reportSecurityEvent])

  return {
    reportXSSAttempt
  }
}

/**
 * Hook for CSP violation monitoring
 */
export const useCSPMonitoring = () => {
  const { reportSecurityEvent } = useSecurityMonitoring()
  
  const reportCSPViolation = useCallback((
    violatedDirective: string,
    blockedURI: string,
    sourceFile?: string
  ) => {
    reportSecurityEvent({
      type: SecurityEventType.CSP_VIOLATION,
      severity: ThreatLevel.HIGH,
      description: `CSP violation: ${violatedDirective}`,
      details: { violatedDirective, blockedURI, sourceFile },
      source: 'CSP'
    })
  }, [reportSecurityEvent])

  // Set up CSP violation listener
  useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      reportCSPViolation(
        event.violatedDirective,
        event.blockedURI,
        event.sourceFile
      )
    }

    document.addEventListener('securitypolicyviolation', handleCSPViolation)
    
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation)
    }
  }, [reportCSPViolation])

  return {
    reportCSPViolation
  }
}

export default useSecurityMonitoring
