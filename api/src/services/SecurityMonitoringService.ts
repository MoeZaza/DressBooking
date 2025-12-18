import { Request } from 'express'
import * as logger from '../common/logger.js'
import BackendValidationService, { SecurityThreat, ThreatLevel } from './ValidationService'
// import BackendXSSProtectionService from './XSSProtectionService'

/**
 * Security event types for backend monitoring
 */
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  AUTHORIZATION_FAILURE = 'AUTHORIZATION_FAILURE',
  INPUT_VALIDATION_FAILURE = 'INPUT_VALIDATION_FAILURE',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  COMMAND_INJECTION_ATTEMPT = 'COMMAND_INJECTION_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  MALICIOUS_FILE_UPLOAD = 'MALICIOUS_FILE_UPLOAD',
  API_ABUSE = 'API_ABUSE'
}

/**
 * Security incident interface
 */
export interface SecurityIncident {
  id: string
  type: SecurityEventType
  severity: ThreatLevel
  timestamp: Date
  description: string
  clientIP: string
  userAgent?: string
  userId?: string
  endpoint: string
  method: string
  payload?: any
  threats: SecurityThreat[]
  blocked: boolean
  resolved: boolean
  responseTime?: number
}

/**
 * Security metrics interface
 */
export interface SecurityMetrics {
  totalIncidents: number
  incidentsByType: Record<SecurityEventType, number>
  incidentsBySeverity: Record<ThreatLevel, number>
  blockedRequests: number
  topAttackers: Array<{ ip: string; count: number }>
  topTargets: Array<{ endpoint: string; count: number }>
  averageResponseTime: number
  lastIncidentTime?: Date
}

/**
 * Security alert configuration
 */
export interface SecurityAlertConfig {
  enabled: boolean
  thresholds: {
    criticalIncidents: number
    highIncidents: number
    blockedRequests: number
    timeWindow: number // minutes
  }
  notifications: {
    email?: string[]
    webhook?: string
    slack?: string
  }
}

/**
 * Backend Security Monitoring Service
 */
class SecurityMonitoringService {
  private static instance: SecurityMonitoringService
  private incidents: SecurityIncident[] = []
  private metrics: SecurityMetrics
  private alertConfig: SecurityAlertConfig
  private ipBlacklist: Set<string> = new Set()
  private suspiciousIPs: Map<string, { count: number; lastSeen: Date }> = new Map()

  private constructor() {
    this.metrics = this.initializeMetrics()
    this.alertConfig = this.getDefaultAlertConfig()
    this.startCleanupTimer()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService()
    }
    return SecurityMonitoringService.instance
  }

  /**
   * Monitor and analyze incoming request for security threats
   */
  public monitorRequest(req: Request, additionalThreats: SecurityThreat[] = []): {
    riskScore: number
    shouldBlock: boolean
    threats: SecurityThreat[]
    recommendations: string[]
  } {
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown'
    const userAgent = req.get('User-Agent') || 'unknown'
    const endpoint = req.path
    const method = req.method
    const startTime = Date.now()

    // Check if IP is blacklisted
    if (this.ipBlacklist.has(clientIP)) {
      this.recordIncident({
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        severity: ThreatLevel.CRITICAL,
        description: 'Request from blacklisted IP',
        clientIP,
        userAgent,
        endpoint,
        method,
        threats: [],
        blocked: true
      })

      return {
        riskScore: 100,
        shouldBlock: true,
        threats: [],
        recommendations: ['Block request from blacklisted IP']
      }
    }

    // Analyze request for threats
    const threats: SecurityThreat[] = [...additionalThreats]
    let riskScore = 0
    const recommendations: string[] = []

    // Analyze request body, query, and params
    if (req.body) {
      const bodyThreats = this.analyzeRequestData(req.body, 'body', { clientIP, userAgent, endpoint, method })
      threats.push(...bodyThreats)
    }

    if (req.query) {
      const queryThreats = this.analyzeRequestData(req.query, 'query', { clientIP, userAgent, endpoint, method })
      threats.push(...queryThreats)
    }

    if (req.params) {
      const paramThreats = this.analyzeRequestData(req.params, 'params', { clientIP, userAgent, endpoint, method })
      threats.push(...paramThreats)
    }

    // Calculate risk score
    riskScore = this.calculateRiskScore(threats, clientIP, userAgent, endpoint)

    // Check for suspicious patterns
    if (this.isSuspiciousRequest(req, threats)) {
      riskScore += 20
      recommendations.push('Monitor for suspicious patterns')
    }

    // Update suspicious IP tracking
    this.updateSuspiciousIPTracking(clientIP, riskScore)

    // Determine if request should be blocked
    const shouldBlock = riskScore >= 80 || threats.some(t => t.severity === ThreatLevel.CRITICAL)

    // Record incident if significant threats detected
    if (threats.length > 0 || riskScore > 50) {
      this.recordIncident({
        type: this.determineIncidentType(threats),
        severity: this.calculateOverallSeverity(threats),
        description: `Security threats detected: ${threats.map(t => t.type).join(', ')}`,
        clientIP,
        userAgent,
        endpoint,
        method,
        threats,
        blocked: shouldBlock,
        responseTime: Date.now() - startTime
      })
    }

    return {
      riskScore,
      shouldBlock,
      threats,
      recommendations
    }
  }

  /**
   * Record security incident
   */
  public recordIncident(incident: Omit<SecurityIncident, 'id' | 'timestamp' | 'resolved'>): void {
    const fullIncident: SecurityIncident = {
      ...incident,
      id: this.generateIncidentId(),
      timestamp: new Date(),
      resolved: false
    }

    this.incidents.push(fullIncident)
    this.updateMetrics(fullIncident)

    // Log incident
    logger.logSecurityEvent(
      `Security incident: ${incident.type}`,
      {
        incidentId: fullIncident.id,
        severity: incident.severity,
        clientIP: incident.clientIP,
        endpoint: incident.endpoint,
        threats: incident.threats,
        blocked: incident.blocked
      },
      incident.severity,
      {
        ip: incident.clientIP,
        userAgent: incident.userAgent,
        endpoint: incident.endpoint,
        method: incident.method
      }
    )

    // Check for alert thresholds
    this.checkAlertThresholds()

    // Auto-blacklist IPs with critical incidents
    if (incident.severity === ThreatLevel.CRITICAL && incident.blocked) {
      this.addToBlacklist(incident.clientIP, 'Critical security incident')
    }

    // Keep only last 10000 incidents to prevent memory issues
    if (this.incidents.length > 10000) {
      this.incidents = this.incidents.slice(-10000)
    }
  }

  /**
   * Analyze request data for security threats
   */
  private analyzeRequestData(data: any, location: string, context: any): SecurityThreat[] {
    const threats: SecurityThreat[] = []

    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          const result = BackendValidationService.validateInput(value, `${location}.${key}`, {
            sanitizationLevel: 'strict',
            blockOnThreats: false,
            logThreats: false
          }, context)

          threats.push(...result.threats)
        } else if (typeof value === 'object' && value !== null) {
          const nestedThreats = this.analyzeRequestData(value, `${location}.${key}`, context)
          threats.push(...nestedThreats)
        }
      }
    }

    return threats
  }

  /**
   * Calculate risk score based on various factors
   */
  private calculateRiskScore(threats: SecurityThreat[], clientIP: string, userAgent: string, endpoint: string): number {
    let score = 0

    // Base score from threats
    threats.forEach(threat => {
      switch (threat.severity) {
        case ThreatLevel.CRITICAL:
          score += 40
          break
        case ThreatLevel.HIGH:
          score += 25
          break
        case ThreatLevel.MEDIUM:
          score += 15
          break
        case ThreatLevel.LOW:
          score += 5
          break
      }
    })

    // IP reputation score
    const suspiciousIP = this.suspiciousIPs.get(clientIP)
    if (suspiciousIP) {
      score += Math.min(suspiciousIP.count * 2, 20)
    }

    // User agent analysis
    if (!userAgent || userAgent === 'unknown' || this.isSuspiciousUserAgent(userAgent)) {
      score += 10
    }

    // Endpoint sensitivity
    if (this.isSensitiveEndpoint(endpoint)) {
      score += 10
    }

    return Math.min(score, 100)
  }

  /**
   * Check if request matches suspicious patterns
   */
  private isSuspiciousRequest(req: Request, threats: SecurityThreat[]): boolean {
    // Multiple threat types in single request
    const threatTypes = new Set(threats.map(t => t.type))
    if (threatTypes.size > 2) return true

    // Unusual request patterns
    const path = req.path.toLowerCase()
    const suspiciousPatterns = [
      /\.\./,
      /\/admin/,
      /\/config/,
      /\/backup/,
      /\/debug/,
      /\/test/,
      /\/phpinfo/,
      /\/wp-admin/,
      /\/wp-content/
    ]

    return suspiciousPatterns.some(pattern => pattern.test(path))
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scanner/i,
      /curl/i,
      /wget/i,
      /python/i,
      /perl/i,
      /php/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  /**
   * Check if endpoint is sensitive
   */
  private isSensitiveEndpoint(endpoint: string): boolean {
    const sensitivePatterns = [
      /\/admin/,
      /\/api\/users/,
      /\/api\/auth/,
      /\/api\/payments/,
      /\/api\/bookings/,
      /\/api\/suppliers/
    ]

    return sensitivePatterns.some(pattern => pattern.test(endpoint))
  }

  /**
   * Update suspicious IP tracking
   */
  private updateSuspiciousIPTracking(clientIP: string, riskScore: number): void {
    if (riskScore > 30) {
      const current = this.suspiciousIPs.get(clientIP) || { count: 0, lastSeen: new Date() }
      this.suspiciousIPs.set(clientIP, {
        count: current.count + 1,
        lastSeen: new Date()
      })

      // Auto-blacklist IPs with high suspicious activity
      if (current.count > 10) {
        this.addToBlacklist(clientIP, 'High suspicious activity')
      }
    }
  }

  /**
   * Add IP to blacklist
   */
  public addToBlacklist(ip: string, reason: string): void {
    this.ipBlacklist.add(ip)
    
    logger.logSecurityEvent(
      'IP added to blacklist',
      { ip, reason },
      'HIGH',
      { ip }
    )
  }

  /**
   * Remove IP from blacklist
   */
  public removeFromBlacklist(ip: string): void {
    this.ipBlacklist.delete(ip)
    this.suspiciousIPs.delete(ip)
    
    logger.logSecurityEvent(
      'IP removed from blacklist',
      { ip },
      'LOW',
      { ip }
    )
  }

  /**
   * Get current security metrics
   */
  public getMetrics(): SecurityMetrics {
    return { ...this.metrics }
  }

  /**
   * Get recent incidents
   */
  public getRecentIncidents(limit: number = 100): SecurityIncident[] {
    return this.incidents.slice(-limit).reverse()
  }

  /**
   * Get incidents by type
   */
  public getIncidentsByType(type: SecurityEventType): SecurityIncident[] {
    return this.incidents.filter(incident => incident.type === type)
  }

  /**
   * Get blacklisted IPs
   */
  public getBlacklistedIPs(): string[] {
    return Array.from(this.ipBlacklist)
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): SecurityMetrics {
    return {
      totalIncidents: 0,
      incidentsByType: {} as Record<SecurityEventType, number>,
      incidentsBySeverity: {} as Record<ThreatLevel, number>,
      blockedRequests: 0,
      topAttackers: [],
      topTargets: [],
      averageResponseTime: 0
    }
  }

  /**
   * Get default alert configuration
   */
  private getDefaultAlertConfig(): SecurityAlertConfig {
    return {
      enabled: true,
      thresholds: {
        criticalIncidents: 5,
        highIncidents: 20,
        blockedRequests: 50,
        timeWindow: 60 // 1 hour
      },
      notifications: {
        email: [],
        webhook: undefined,
        slack: undefined
      }
    }
  }

  /**
   * Update metrics with new incident
   */
  private updateMetrics(incident: SecurityIncident): void {
    this.metrics.totalIncidents++
    
    // Update by type
    this.metrics.incidentsByType[incident.type] = (this.metrics.incidentsByType[incident.type] || 0) + 1
    
    // Update by severity
    this.metrics.incidentsBySeverity[incident.severity] = (this.metrics.incidentsBySeverity[incident.severity] || 0) + 1
    
    // Update blocked requests
    if (incident.blocked) {
      this.metrics.blockedRequests++
    }

    // Update last incident time
    this.metrics.lastIncidentTime = incident.timestamp

    // Update response time
    if (incident.responseTime) {
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime + incident.responseTime) / 2
    }
  }

  /**
   * Determine incident type from threats
   */
  private determineIncidentType(threats: SecurityThreat[]): SecurityEventType {
    if (threats.some(t => t.type === 'XSS')) return SecurityEventType.XSS_ATTEMPT
    if (threats.some(t => t.type === 'SQL_INJECTION')) return SecurityEventType.SQL_INJECTION_ATTEMPT
    if (threats.some(t => t.type === 'COMMAND_INJECTION')) return SecurityEventType.COMMAND_INJECTION_ATTEMPT
    return SecurityEventType.SUSPICIOUS_REQUEST
  }

  /**
   * Calculate overall severity from threats
   */
  private calculateOverallSeverity(threats: SecurityThreat[]): ThreatLevel {
    if (threats.some(t => t.severity === ThreatLevel.CRITICAL)) return ThreatLevel.CRITICAL
    if (threats.some(t => t.severity === ThreatLevel.HIGH)) return ThreatLevel.HIGH
    if (threats.some(t => t.severity === ThreatLevel.MEDIUM)) return ThreatLevel.MEDIUM
    return ThreatLevel.LOW
  }

  /**
   * Check alert thresholds and send notifications
   */
  private checkAlertThresholds(): void {
    if (!this.alertConfig.enabled) return

    const recentIncidents = this.getRecentIncidents(1000)
    const timeWindow = this.alertConfig.thresholds.timeWindow * 60 * 1000 // Convert to milliseconds
    const cutoffTime = new Date(Date.now() - timeWindow)

    const recentCritical = recentIncidents.filter(i => 
      i.severity === ThreatLevel.CRITICAL && i.timestamp > cutoffTime
    ).length

    const recentHigh = recentIncidents.filter(i => 
      i.severity === ThreatLevel.HIGH && i.timestamp > cutoffTime
    ).length

    const recentBlocked = recentIncidents.filter(i => 
      i.blocked && i.timestamp > cutoffTime
    ).length

    // Check thresholds and send alerts
    if (recentCritical >= this.alertConfig.thresholds.criticalIncidents) {
      this.sendAlert('CRITICAL', `${recentCritical} critical security incidents in the last ${this.alertConfig.thresholds.timeWindow} minutes`)
    }

    if (recentHigh >= this.alertConfig.thresholds.highIncidents) {
      this.sendAlert('HIGH', `${recentHigh} high-severity security incidents in the last ${this.alertConfig.thresholds.timeWindow} minutes`)
    }

    if (recentBlocked >= this.alertConfig.thresholds.blockedRequests) {
      this.sendAlert('MEDIUM', `${recentBlocked} requests blocked in the last ${this.alertConfig.thresholds.timeWindow} minutes`)
    }
  }

  /**
   * Send security alert
   */
  private sendAlert(severity: string, message: string): void {
    logger.logSecurityEvent(
      `Security alert: ${severity}`,
      { message, metrics: this.metrics },
      severity as any,
      {}
    )

    // TODO: Implement email, webhook, and Slack notifications
  }

  /**
   * Generate unique incident ID
   */
  private generateIncidentId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Start cleanup timer for old data
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      
      // Clean old incidents
      this.incidents = this.incidents.filter(incident => incident.timestamp > cutoffTime)
      
      // Clean old suspicious IPs
      for (const [ip, data] of this.suspiciousIPs.entries()) {
        if (data.lastSeen < cutoffTime) {
          this.suspiciousIPs.delete(ip)
        }
      }
    }, 60 * 60 * 1000) // Run every hour
  }
}

// Export singleton instance
export default SecurityMonitoringService.getInstance()
