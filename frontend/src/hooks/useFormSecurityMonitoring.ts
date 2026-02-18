import { useCallback } from 'react'
import { useSecurityMonitoring } from './useSecurityMonitoring'
import { SecurityEventType } from '../context/SecurityContext'
import { ThreatLevel } from '../services/ValidationService'
import ValidationService from '../services/ValidationService'

/**
 * Form security monitoring hook
 * Provides security monitoring specifically for forms
 */
export const useFormSecurityMonitoring = (formName: string = 'UnknownForm') => {
  const {
    reportSecurityEvent,
    threatLevel,
    isSecure
  } = useSecurityMonitoring()

  /**
   * Report form-specific threat
   */
  const reportFormThreat = useCallback((
    threatType: string,
    description: string,
    severity: ThreatLevel = ThreatLevel.MEDIUM,
    details?: any
  ) => {
    reportSecurityEvent({
      type: SecurityEventType.SECURITY_WARNING,
      severity,
      description: `[${formName}] ${threatType}: ${description}`,
      source: 'form-security',
      details: {
        formName,
        threatType,
        ...details
      }
    })
  }, [reportSecurityEvent, formName])

  /**
   * Report validation failure
   */
  const reportValidationFailure = useCallback((
    fieldName: string,
    value: string,
    validationError: string,
    severity: ThreatLevel = ThreatLevel.LOW
  ) => {
    // Use validateInput instead of analyzeThreat
    const result = ValidationService.validateInput(value, fieldName, {
      sanitizationLevel: 'strict',
      strictMode: true
    })
    
    reportSecurityEvent({
      type: SecurityEventType.VALIDATION_FAILED,
      severity: result.threatLevel > ThreatLevel.LOW ? result.threatLevel : severity,
      description: `[${formName}] Validation failed for ${fieldName}: ${validationError}`,
      source: 'form-validation',
      details: {
        formName,
        fieldName,
        value: result.sanitizedValue,
        threatLevel: result.threatLevel,
        threats: result.threats,
        validationError
      }
    })
  }, [reportSecurityEvent, formName])

  /**
   * Report suspicious form behavior
   */
  const reportSuspiciousBehavior = useCallback((
    behavior: string,
    details?: any,
    severity: ThreatLevel = ThreatLevel.MEDIUM
  ) => {
    reportSecurityEvent({
      type: SecurityEventType.SECURITY_WARNING,
      severity,
      description: `[${formName}] Suspicious behavior detected: ${behavior}`,
      source: 'form-behavior',
      details: {
        formName,
        behavior,
        ...details
      }
    })
  }, [reportSecurityEvent, formName])

  /**
   * Report successful form submission
   */
  const reportFormSuccess = useCallback(() => {
    reportSecurityEvent({
      type: SecurityEventType.SECURITY_WARNING,
      severity: ThreatLevel.LOW,
      description: `[${formName}] Form submitted successfully`,
      source: 'form-success'
    })
  }, [reportSecurityEvent, formName])

  return {
    // Inherited from useSecurityMonitoring
    threatLevel,
    isSecure,
    
    // Form-specific methods
    reportFormThreat,
    reportValidationFailure,
    reportSuspiciousBehavior,
    reportFormSuccess
  }
}

export default useFormSecurityMonitoring