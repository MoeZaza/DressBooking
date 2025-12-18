import * as logger from '../common/logger'
import * as env from '../config/env.config'
import { SecurityIncidentTracker } from '../middlewares/security'
import ThreatMonitor from '../middlewares/threatMonitor'

/**
 * Real-time security monitoring and alerting system
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor
  private alertThresholds: AlertThresholds
  private monitoringInterval: NodeJS.Timeout | null = null
  private alertHistory: Map<string, AlertRecord[]> = new Map()
  private metrics: SecurityMetrics = {
    totalEvents: 0,
    criticalEvents: 0,
    highEvents: 0,
    mediumEvents: 0,
    lowEvents: 0,
    blockedRequests: 0,
    alertsSent: 0,
    lastReset: Date.now()
  }

  private constructor() {
    this.alertThresholds = this.getDefaultThresholds()
    this.startMonitoring()
  }

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  /**
   * Start real-time monitoring
   */
  private startMonitoring(): void {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performSecurityCheck()
    }, 30000)

    logger.info('Security monitoring started', {
      category: 'security_monitor',
      thresholds: this.alertThresholds
    })
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info('Security monitoring stopped', { category: 'security_monitor' })
    }
  }

  /**
   * Log security event with enhanced monitoring
   */
  logSecurityEvent(
    event: string,
    details: any,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    context: any = {}
  ): void {
    // Update metrics
    this.updateMetrics(severity)

    // Log the event
    logger.logSecurityEvent(event, details, severity, context)

    // Check for immediate alerts
    this.checkImmediateAlerts(event, details, severity, context)

    // Store event for pattern analysis
    this.storeEventForAnalysis(event, details, severity, context)
  }

  /**
   * Perform periodic security checks
   */
  private performSecurityCheck(): void {
    try {
      // Get current statistics
      const incidentStats = SecurityIncidentTracker.getStats()
      const threatStats = ThreatMonitor.getStatistics()

      // Check thresholds and generate alerts
      this.checkIncidentThresholds(incidentStats)
      this.checkThreatThresholds(threatStats)
      this.checkSystemHealth()

      // Log monitoring status
      logger.debug('Security monitoring check completed', {
        category: 'security_monitor',
        additionalData: {
          incidentStats,
          threatStats,
          metrics: this.metrics
        }
      })
    } catch (error) {
      logger.error('Error during security monitoring check', {
        category: 'security_monitor',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Check incident thresholds
   */
  private checkIncidentThresholds(stats: any): void {
    // Check blocked IPs threshold
    if (stats.blockedIPs.length > this.alertThresholds.blockedIPs) {
      this.sendAlert('HIGH_BLOCKED_IPS', {
        count: stats.blockedIPs.length,
        threshold: this.alertThresholds.blockedIPs,
        blockedIPs: stats.blockedIPs.slice(0, 10) // First 10 IPs
      }, 'HIGH')
    }

    // Check total incidents threshold
    if (stats.totalIncidents > this.alertThresholds.totalIncidents) {
      this.sendAlert('HIGH_INCIDENT_COUNT', {
        count: stats.totalIncidents,
        threshold: this.alertThresholds.totalIncidents
      }, 'MEDIUM')
    }
  }

  /**
   * Check threat monitoring thresholds
   */
  private checkThreatThresholds(stats: any): void {
    // Check recent threat patterns
    if (stats.recentPatterns > this.alertThresholds.recentThreats) {
      this.sendAlert('HIGH_THREAT_ACTIVITY', {
        count: stats.recentPatterns,
        threshold: this.alertThresholds.recentThreats,
        suspiciousIPs: stats.suspiciousIPs
      }, 'HIGH')
    }

    // Check suspicious IP count
    if (stats.suspiciousIPs > this.alertThresholds.suspiciousIPs) {
      this.sendAlert('MULTIPLE_SUSPICIOUS_IPS', {
        count: stats.suspiciousIPs,
        threshold: this.alertThresholds.suspiciousIPs
      }, 'MEDIUM')
    }
  }

  /**
   * Check system health indicators
   */
  private checkSystemHealth(): void {
    // Check critical events in last hour
    const recentCritical = this.metrics.criticalEvents
    if (recentCritical > this.alertThresholds.criticalEventsPerHour) {
      this.sendAlert('HIGH_CRITICAL_EVENTS', {
        count: recentCritical,
        threshold: this.alertThresholds.criticalEventsPerHour,
        timeWindow: '1 hour'
      }, 'CRITICAL')
    }

    // Check blocked requests rate
    const blockedRate = this.metrics.blockedRequests / (this.metrics.totalEvents || 1)
    if (blockedRate > this.alertThresholds.blockedRequestsRate) {
      this.sendAlert('HIGH_BLOCKED_REQUESTS_RATE', {
        rate: Math.round(blockedRate * 100),
        threshold: Math.round(this.alertThresholds.blockedRequestsRate * 100),
        totalRequests: this.metrics.totalEvents,
        blockedRequests: this.metrics.blockedRequests
      }, 'HIGH')
    }
  }

  /**
   * Check for immediate alerts
   */
  private checkImmediateAlerts(
    event: string,
    details: any,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    context: any
  ): void {
    // Immediate critical alerts
    if (severity === 'CRITICAL') {
      this.sendAlert('CRITICAL_SECURITY_EVENT', {
        event,
        details,
        context
      }, 'CRITICAL')
    }

    // Check for specific high-priority events
    const highPriorityEvents = [
      'SQL_INJECTION_DETECTED',
      'COMMAND_INJECTION_DETECTED',
      'COORDINATED_ATTACK_DETECTED',
      'ADMIN_BREACH_ATTEMPT',
      'SYSTEM_COMPROMISE_ATTEMPT'
    ]

    if (highPriorityEvents.some(pattern => event.includes(pattern))) {
      this.sendAlert('HIGH_PRIORITY_SECURITY_EVENT', {
        event,
        details,
        context
      }, 'HIGH')
    }
  }

  /**
   * Send security alert
   */
  private sendAlert(
    alertType: string,
    data: any,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): void {
    const now = Date.now()
    const alertKey = `${alertType}_${severity}`

    // Check if we've already sent this alert recently (rate limiting)
    const recentAlerts = this.alertHistory.get(alertKey) || []
    const fiveMinutesAgo = now - 300000
    const recentCount = recentAlerts.filter(alert => alert.timestamp > fiveMinutesAgo).length

    if (recentCount >= 3) {
      // Don't spam alerts - max 3 of same type per 5 minutes
      return
    }

    // Create alert record
    const alertRecord: AlertRecord = {
      timestamp: now,
      type: alertType,
      severity,
      data,
      sent: false
    }

    // Store alert
    recentAlerts.push(alertRecord)
    this.alertHistory.set(alertKey, recentAlerts.slice(-10)) // Keep last 10 alerts

    // Log alert
    logger.logSecurityEvent(`Security Alert: ${alertType}`, data, severity, {
      category: 'security_alert',
      additionalData: {
        alertType,
        alertId: `${alertType}_${now}`
      }
    })

    // Send alert based on environment and configuration
    this.dispatchAlert(alertRecord)

    // Update metrics
    this.metrics.alertsSent++
  }

  /**
   * Dispatch alert to appropriate channels
   */
  private dispatchAlert(alert: AlertRecord): void {
    try {
      // In development, just log to console
      if (env.IS_DEVELOPMENT) {
        console.warn(`🚨 SECURITY ALERT [${alert.severity}]: ${alert.type}`, alert.data)
        alert.sent = true
        return
      }

      // In production, implement actual alerting mechanisms
      // TODO: Implement email, SMS, Slack, webhook notifications
      this.sendEmailAlert(alert)
      this.sendSlackAlert(alert)
      this.sendWebhookAlert(alert)

      alert.sent = true
    } catch (error) {
      logger.error('Failed to dispatch security alert', {
        category: 'security_alert',
        alertType: alert.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private sendEmailAlert(alert: AlertRecord): void {
    // TODO: Implement email alerting
    logger.info('Email alert would be sent', {
      category: 'security_alert',
      alertType: alert.type,
      severity: alert.severity
    })
  }

  private sendSlackAlert(alert: AlertRecord): void {
    // TODO: Implement Slack webhook alerting
    logger.info('Slack alert would be sent', {
      category: 'security_alert',
      alertType: alert.type,
      severity: alert.severity
    })
  }

  private sendWebhookAlert(alert: AlertRecord): void {
    // TODO: Implement webhook alerting
    logger.info('Webhook alert would be sent', {
      category: 'security_alert',
      alertType: alert.type,
      severity: alert.severity
    })
  }

  /**
   * Update security metrics
   */
  private updateMetrics(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): void {
    this.metrics.totalEvents++

    switch (severity) {
      case 'CRITICAL':
        this.metrics.criticalEvents++
        break
      case 'HIGH':
        this.metrics.highEvents++
        break
      case 'MEDIUM':
        this.metrics.mediumEvents++
        break
      case 'LOW':
        this.metrics.lowEvents++
        break
    }
  }

  /**
   * Store event for pattern analysis
   */
  private storeEventForAnalysis(
    _event: string,
    _details: any,
    _severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    _context: any
  ): void {
    // TODO: Implement event storage for ML-based pattern analysis
    // This could store events in a time-series database for advanced analytics
  }

  /**
   * Get default alert thresholds
   */
  private getDefaultThresholds(): AlertThresholds {
    return {
      blockedIPs: env.IS_PRODUCTION ? 50 : 10,
      totalIncidents: env.IS_PRODUCTION ? 1000 : 100,
      recentThreats: env.IS_PRODUCTION ? 100 : 20,
      suspiciousIPs: env.IS_PRODUCTION ? 20 : 5,
      criticalEventsPerHour: env.IS_PRODUCTION ? 10 : 3,
      blockedRequestsRate: env.IS_PRODUCTION ? 0.1 : 0.05 // 10% or 5%
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): SecurityMetrics {
    return { ...this.metrics }
  }

  /**
   * Get alert history
   */
  getAlertHistory(): Map<string, AlertRecord[]> {
    return new Map(this.alertHistory)
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalEvents: 0,
      criticalEvents: 0,
      highEvents: 0,
      mediumEvents: 0,
      lowEvents: 0,
      blockedRequests: 0,
      alertsSent: 0,
      lastReset: Date.now()
    }
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds }
    logger.info('Security alert thresholds updated', {
      category: 'security_monitor',
      newThresholds: this.alertThresholds
    })
  }
}

// Type definitions
interface AlertThresholds {
  blockedIPs: number
  totalIncidents: number
  recentThreats: number
  suspiciousIPs: number
  criticalEventsPerHour: number
  blockedRequestsRate: number
}

interface AlertRecord {
  timestamp: number
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  data: any
  sent: boolean
}

interface SecurityMetrics {
  totalEvents: number
  criticalEvents: number
  highEvents: number
  mediumEvents: number
  lowEvents: number
  blockedRequests: number
  alertsSent: number
  lastReset: number
}

// Initialize security monitoring
const securityMonitor = SecurityMonitor.getInstance()

export default securityMonitor
