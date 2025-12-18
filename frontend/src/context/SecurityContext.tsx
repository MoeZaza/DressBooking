import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import ValidationService, { SecurityThreat, ThreatLevel } from '../services/ValidationService'
import XSSProtectionService, { ProtectionLevel } from '../services/XSSProtectionService'
import ValidationMiddleware from '../middleware/ValidationMiddleware'
import { getSecurityConfig, applySecurityHeaders, initializeSecurityMonitoring } from '../config/SecurityConfig'

/**
 * Security event types
 */
export enum SecurityEventType {
  THREAT_DETECTED = 'THREAT_DETECTED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  XSS_BLOCKED = 'XSS_BLOCKED',
  CSP_VIOLATION = 'CSP_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SECURITY_WARNING = 'SECURITY_WARNING'
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  id: string
  type: SecurityEventType
  timestamp: Date
  severity: ThreatLevel
  description: string
  details?: any
  source?: string
  blocked?: boolean
}

/**
 * Security state interface
 */
export interface SecurityState {
  isInitialized: boolean
  threats: SecurityThreat[]
  events: SecurityEvent[]
  blockedRequests: number
  protectionLevel: ProtectionLevel
  threatLevel: ThreatLevel
  securityConfig: any
  monitoring: {
    enabled: boolean
    threatCount: number
    lastThreatTime?: Date
  }
}

/**
 * Security actions
 */
type SecurityAction =
  | { type: 'INITIALIZE'; payload: { config: any } }
  | { type: 'ADD_THREAT'; payload: SecurityThreat }
  | { type: 'ADD_EVENT'; payload: SecurityEvent }
  | { type: 'BLOCK_REQUEST'; payload: { reason: string } }
  | { type: 'UPDATE_PROTECTION_LEVEL'; payload: ProtectionLevel }
  | { type: 'CLEAR_THREATS' }
  | { type: 'CLEAR_EVENTS' }
  | { type: 'UPDATE_MONITORING'; payload: { enabled: boolean } }

/**
 * Security context type
 */
export interface SecurityContextType {
  state: SecurityState
  dispatch: React.Dispatch<SecurityAction>
  
  // Validation methods
  validateInput: (input: string, fieldName: string) => Promise<boolean>
  sanitizeHtml: (html: string, level?: ProtectionLevel) => string
  reportThreat: (threat: SecurityThreat) => void
  reportEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void
  
  // Protection methods
  setProtectionLevel: (level: ProtectionLevel) => void
  blockRequest: (reason: string) => void
  
  // Monitoring methods
  enableMonitoring: () => void
  disableMonitoring: () => void
  clearThreats: () => void
  clearEvents: () => void
  
  // Utility methods
  getThreatSummary: () => { total: number; byLevel: Record<ThreatLevel, number> }
  getRecentEvents: (count?: number) => SecurityEvent[]
  isSecure: () => boolean
}

/**
 * Initial security state
 */
const initialState: SecurityState = {
  isInitialized: false,
  threats: [],
  events: [],
  blockedRequests: 0,
  protectionLevel: ProtectionLevel.STANDARD,
  threatLevel: ThreatLevel.LOW,
  securityConfig: null,
  monitoring: {
    enabled: true,
    threatCount: 0
  }
}

/**
 * Security reducer
 */
const securityReducer = (state: SecurityState, action: SecurityAction): SecurityState => {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        isInitialized: true,
        securityConfig: action.payload.config
      }

    case 'ADD_THREAT':
      const newThreats = [...state.threats, action.payload]
      const newThreatLevel = calculateOverallThreatLevel(newThreats)
      
      return {
        ...state,
        threats: newThreats.slice(-100), // Keep only last 100 threats
        threatLevel: newThreatLevel,
        monitoring: {
          ...state.monitoring,
          threatCount: state.monitoring.threatCount + 1,
          lastThreatTime: new Date()
        }
      }

    case 'ADD_EVENT':
      const event: SecurityEvent = {
        ...action.payload,
        id: generateEventId(),
        timestamp: new Date()
      }
      
      return {
        ...state,
        events: [...state.events, event].slice(-50) // Keep only last 50 events
      }

    case 'BLOCK_REQUEST':
      return {
        ...state,
        blockedRequests: state.blockedRequests + 1
      }

    case 'UPDATE_PROTECTION_LEVEL':
      return {
        ...state,
        protectionLevel: action.payload
      }

    case 'CLEAR_THREATS':
      return {
        ...state,
        threats: [],
        threatLevel: ThreatLevel.LOW,
        monitoring: {
          ...state.monitoring,
          threatCount: 0,
          lastThreatTime: undefined
        }
      }

    case 'CLEAR_EVENTS':
      return {
        ...state,
        events: []
      }

    case 'UPDATE_MONITORING':
      return {
        ...state,
        monitoring: {
          ...state.monitoring,
          enabled: action.payload.enabled
        }
      }

    default:
      return state
  }
}

/**
 * Calculate overall threat level from threats array
 */
const calculateOverallThreatLevel = (threats: SecurityThreat[]): ThreatLevel => {
  if (threats.length === 0) return ThreatLevel.LOW

  const recentThreats = threats.slice(-10) // Consider only last 10 threats
  const hasCritical = recentThreats.some(t => t.severity === ThreatLevel.CRITICAL)
  const hasHigh = recentThreats.some(t => t.severity === ThreatLevel.HIGH)
  const hasMedium = recentThreats.some(t => t.severity === ThreatLevel.MEDIUM)

  if (hasCritical) return ThreatLevel.CRITICAL
  if (hasHigh) return ThreatLevel.HIGH
  if (hasMedium) return ThreatLevel.MEDIUM
  return ThreatLevel.LOW
}

/**
 * Generate unique event ID
 */
const generateEventId = (): string => {
  return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Security context
 */
const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

/**
 * Security provider props
 */
interface SecurityProviderProps {
  children: ReactNode
}

/**
 * Security provider component
 */
export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(securityReducer, initialState)

  // Initialize security on mount
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        const config = getSecurityConfig()
        
        // Apply security headers
        applySecurityHeaders(config)
        
        // Initialize monitoring
        initializeSecurityMonitoring(config)
        
        dispatch({ type: 'INITIALIZE', payload: { config } })
        
        // Report initialization event
        dispatch({
          type: 'ADD_EVENT',
          payload: {
            id: '',
            timestamp: new Date(),
            type: SecurityEventType.SECURITY_WARNING,
            severity: ThreatLevel.LOW,
            description: 'Security system initialized',
            source: 'SecurityProvider'
          }
        })
      } catch (error) {
        console.error('Failed to initialize security:', error)
        dispatch({
          type: 'ADD_EVENT',
          payload: {
            id: '',
            timestamp: new Date(),
            type: SecurityEventType.SECURITY_WARNING,
            severity: ThreatLevel.HIGH,
            description: 'Security initialization failed',
            details: error,
            source: 'SecurityProvider'
          }
        })
      }
    }

    initializeSecurity()
  }, [])

  // Validation methods
  const validateInput = async (input: string, fieldName: string): Promise<boolean> => {
    try {
      const result = ValidationService.validateInput(input, fieldName, {
        sanitizationLevel: 'strict',
        strictMode: true
      })

      if (result.threats.length > 0) {
        result.threats.forEach(threat => {
          dispatch({ type: 'ADD_THREAT', payload: threat })
        })
      }

      if (!result.isValid) {
        dispatch({
          type: 'ADD_EVENT',
          payload: {
            id: '',
            timestamp: new Date(),
            type: SecurityEventType.VALIDATION_FAILED,
            severity: result.threatLevel,
            description: `Validation failed for field: ${fieldName}`,
            details: { errors: result.errors, threats: result.threats },
            source: fieldName
          }
        })
      }

      return result.isValid
    } catch (error) {
      console.error('Validation error:', error)
      return false
    }
  }

  const sanitizeHtml = (html: string, level: ProtectionLevel = state.protectionLevel): string => {
    try {
      const result = XSSProtectionService.sanitizeHtml(html, level)
      
      if (result.threatLevel === 'HIGH' || result.threatLevel === 'CRITICAL') {
        dispatch({
          type: 'ADD_EVENT',
          payload: {
            id: '',
            timestamp: new Date(),
            type: SecurityEventType.XSS_BLOCKED,
            severity: result.threatLevel === 'CRITICAL' ? ThreatLevel.CRITICAL : ThreatLevel.HIGH,
            description: 'XSS attempt blocked',
            details: { removedElements: result.removedElements, removedAttributes: result.removedAttributes },
            blocked: true
          }
        })
      }

      return result.sanitizedContent
    } catch (error) {
      console.error('HTML sanitization error:', error)
      return ''
    }
  }

  const reportThreat = (threat: SecurityThreat): void => {
    dispatch({ type: 'ADD_THREAT', payload: threat })
  }

  const reportEvent = (event: Omit<SecurityEvent, 'id' | 'timestamp'>): void => {
    dispatch({ type: 'ADD_EVENT', payload: { ...event, id: '', timestamp: new Date() } })
  }

  const setProtectionLevel = (level: ProtectionLevel): void => {
    dispatch({ type: 'UPDATE_PROTECTION_LEVEL', payload: level })
    dispatch({
      type: 'ADD_EVENT',
      payload: {
        id: '',
        timestamp: new Date(),
        type: SecurityEventType.SECURITY_WARNING,
        severity: ThreatLevel.LOW,
        description: `Protection level changed to ${level}`,
        source: 'SecurityProvider'
      }
    })
  }

  const blockRequest = (reason: string): void => {
    dispatch({ type: 'BLOCK_REQUEST', payload: { reason } })
    dispatch({
      type: 'ADD_EVENT',
      payload: {
        id: '',
        timestamp: new Date(),
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: ThreatLevel.HIGH,
        description: `Request blocked: ${reason}`,
        blocked: true
      }
    })
  }

  const enableMonitoring = (): void => {
    dispatch({ type: 'UPDATE_MONITORING', payload: { enabled: true } })
  }

  const disableMonitoring = (): void => {
    dispatch({ type: 'UPDATE_MONITORING', payload: { enabled: false } })
  }

  const clearThreats = (): void => {
    dispatch({ type: 'CLEAR_THREATS' })
  }

  const clearEvents = (): void => {
    dispatch({ type: 'CLEAR_EVENTS' })
  }

  const getThreatSummary = () => {
    const byLevel = {
      [ThreatLevel.LOW]: 0,
      [ThreatLevel.MEDIUM]: 0,
      [ThreatLevel.HIGH]: 0,
      [ThreatLevel.CRITICAL]: 0
    }

    state.threats.forEach(threat => {
      byLevel[threat.severity]++
    })

    return {
      total: state.threats.length,
      byLevel
    }
  }

  const getRecentEvents = (count: number = 10): SecurityEvent[] => {
    return state.events.slice(-count).reverse()
  }

  const isSecure = (): boolean => {
    return state.threatLevel !== ThreatLevel.CRITICAL && state.blockedRequests < 10
  }

  const contextValue: SecurityContextType = {
    state,
    dispatch,
    validateInput,
    sanitizeHtml,
    reportThreat,
    reportEvent,
    setProtectionLevel,
    blockRequest,
    enableMonitoring,
    disableMonitoring,
    clearThreats,
    clearEvents,
    getThreatSummary,
    getRecentEvents,
    isSecure
  }

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  )
}

/**
 * Hook to use security context
 */
export const useSecurityContext = (): SecurityContextType => {
  const context = useContext(SecurityContext)
  if (context === undefined) {
    throw new Error('useSecurityContext must be used within a SecurityProvider')
  }
  return context
}

export default SecurityContext
