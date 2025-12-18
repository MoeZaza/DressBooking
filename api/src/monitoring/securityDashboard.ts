import { SecurityIncidentTracker } from '../middlewares/security'
import ThreatMonitor from '../middlewares/threatMonitor'
import securityMonitor from './securityMonitor'

/**
 * Security dashboard data aggregator
 */
export class SecurityDashboard {
  /**
   * Get comprehensive security overview
   */
  static getSecurityOverview(): SecurityOverview {
    const incidentStats = SecurityIncidentTracker.getStats()
    const threatStats = ThreatMonitor.getStatistics()
    const monitoringMetrics = securityMonitor.getMetrics()
    const alertHistory = securityMonitor.getAlertHistory()

    return {
      timestamp: new Date().toISOString(),
      status: this.determineOverallStatus(incidentStats, threatStats, monitoringMetrics),
      incidents: {
        total: incidentStats.totalIncidents,
        blocked: incidentStats.blockedIPs.length,
        uniqueIPs: incidentStats.uniqueIPs,
        topOffenders: incidentStats.topOffenders.slice(0, 5)
      },
      threats: {
        totalTracked: threatStats.totalTrackedIPs,
        suspicious: threatStats.suspiciousIPs,
        recentPatterns: threatStats.recentPatterns,
        knownSignatures: threatStats.knownSignatures
      },
      monitoring: {
        totalEvents: monitoringMetrics.totalEvents,
        criticalEvents: monitoringMetrics.criticalEvents,
        alertsSent: monitoringMetrics.alertsSent,
        uptime: Date.now() - monitoringMetrics.lastReset
      },
      alerts: {
        total: Array.from(alertHistory.values()).flat().length,
        recent: this.getRecentAlerts(alertHistory, 3600000), // Last hour
        critical: this.getCriticalAlerts(alertHistory, 86400000) // Last 24 hours
      },
      recommendations: this.generateSecurityRecommendations(incidentStats, threatStats, monitoringMetrics)
    }
  }

  /**
   * Get real-time security metrics
   */
  static getRealTimeMetrics(): RealTimeMetrics {
    const incidentStats = SecurityIncidentTracker.getStats()
    const threatStats = ThreatMonitor.getStatistics()
    const monitoringMetrics = securityMonitor.getMetrics()

    return {
      timestamp: new Date().toISOString(),
      current: {
        activeThreats: threatStats.suspiciousIPs,
        blockedIPs: incidentStats.blockedIPs.length,
        eventsPerMinute: this.calculateEventsPerMinute(monitoringMetrics),
        riskLevel: this.calculateRiskLevel(incidentStats, threatStats, monitoringMetrics)
      },
      trends: {
        hourly: this.calculateHourlyTrends(monitoringMetrics),
        daily: this.calculateDailyTrends(monitoringMetrics)
      },
      performance: {
        responseTime: this.getAverageResponseTime(),
        throughput: this.getThroughput(),
        errorRate: this.getErrorRate(monitoringMetrics)
      }
    }
  }

  /**
   * Get security event timeline
   */
  static getEventTimeline(timeRange: number = 86400000): EventTimeline {
    const alertHistory = securityMonitor.getAlertHistory()
    const events: TimelineEvent[] = []

    // Convert alerts to timeline events
    for (const [alertType, alerts] of alertHistory.entries()) {
      for (const alert of alerts) {
        if (Date.now() - alert.timestamp <= timeRange) {
          events.push({
            timestamp: alert.timestamp,
            type: 'alert',
            severity: alert.severity,
            title: alertType,
            description: this.formatAlertDescription(alert),
            data: alert.data
          })
        }
      }
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp)

    return {
      timeRange,
      totalEvents: events.length,
      events: events.slice(0, 100), // Limit to 100 most recent events
      summary: this.summarizeEvents(events)
    }
  }

  /**
   * Get threat intelligence summary
   */
  static getThreatIntelligence(): ThreatIntelligence {
    const threatStats = ThreatMonitor.getStatistics()
    const incidentStats = SecurityIncidentTracker.getStats()

    return {
      timestamp: new Date().toISOString(),
      threatLevel: this.calculateThreatLevel(threatStats, incidentStats),
      attackVectors: this.getTopAttackVectors(),
      geographicDistribution: this.getGeographicDistribution(incidentStats),
      timePatterns: this.getAttackTimePatterns(),
      predictions: this.generateThreatPredictions(threatStats, incidentStats)
    }
  }

  /**
   * Determine overall security status
   */
  private static determineOverallStatus(
    incidentStats: any,
    threatStats: any,
    monitoringMetrics: any
  ): 'healthy' | 'warning' | 'critical' {
    if (
      monitoringMetrics.criticalEvents > 5 ||
      incidentStats.blockedIPs.length > 100 ||
      threatStats.recentPatterns > 200
    ) {
      return 'critical'
    }

    if (
      monitoringMetrics.criticalEvents > 0 ||
      incidentStats.blockedIPs.length > 20 ||
      threatStats.recentPatterns > 50
    ) {
      return 'warning'
    }

    return 'healthy'
  }

  /**
   * Get recent alerts
   */
  private static getRecentAlerts(alertHistory: Map<string, any[]>, timeWindow: number): any[] {
    const now = Date.now()
    const recentAlerts: any[] = []

    for (const alerts of alertHistory.values()) {
      for (const alert of alerts) {
        if (now - alert.timestamp <= timeWindow) {
          recentAlerts.push(alert)
        }
      }
    }

    return recentAlerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
  }

  /**
   * Get critical alerts
   */
  private static getCriticalAlerts(alertHistory: Map<string, any[]>, timeWindow: number): any[] {
    const now = Date.now()
    const criticalAlerts: any[] = []

    for (const alerts of alertHistory.values()) {
      for (const alert of alerts) {
        if (alert.severity === 'CRITICAL' && now - alert.timestamp <= timeWindow) {
          criticalAlerts.push(alert)
        }
      }
    }

    return criticalAlerts.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Generate security recommendations
   */
  private static generateSecurityRecommendations(
    incidentStats: any,
    threatStats: any,
    monitoringMetrics: any
  ): string[] {
    const recommendations: string[] = []

    if (incidentStats.blockedIPs.length > 50) {
      recommendations.push('Consider implementing IP reputation filtering')
    }

    if (threatStats.recentPatterns > 100) {
      recommendations.push('Increase threat detection sensitivity')
    }

    if (monitoringMetrics.criticalEvents > 3) {
      recommendations.push('Review and strengthen critical security controls')
    }

    if (threatStats.suspiciousIPs > 20) {
      recommendations.push('Implement automated IP blocking for repeat offenders')
    }

    if (monitoringMetrics.alertsSent > 50) {
      recommendations.push('Review alert thresholds to reduce noise')
    }

    return recommendations
  }

  /**
   * Calculate events per minute
   */
  private static calculateEventsPerMinute(metrics: any): number {
    const uptime = Date.now() - metrics.lastReset
    const minutes = uptime / 60000
    return minutes > 0 ? Math.round(metrics.totalEvents / minutes) : 0
  }

  /**
   * Calculate risk level
   */
  private static calculateRiskLevel(
    incidentStats: any,
    threatStats: any,
    monitoringMetrics: any
  ): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0

    riskScore += Math.min(incidentStats.blockedIPs.length / 10, 10)
    riskScore += Math.min(threatStats.recentPatterns / 20, 10)
    riskScore += Math.min(monitoringMetrics.criticalEvents * 5, 20)

    if (riskScore >= 30) return 'critical'
    if (riskScore >= 20) return 'high'
    if (riskScore >= 10) return 'medium'
    return 'low'
  }

  /**
   * Calculate hourly trends (placeholder)
   */
  private static calculateHourlyTrends(_metrics: any): any {
    // This would analyze hourly patterns from stored metrics
    return {
      events: [],
      trend: 'stable'
    }
  }

  /**
   * Calculate daily trends (placeholder)
   */
  private static calculateDailyTrends(_metrics: any): any {
    // This would analyze daily patterns from stored metrics
    return {
      events: [],
      trend: 'stable'
    }
  }

  /**
   * Get average response time (placeholder)
   */
  private static getAverageResponseTime(): number {
    // This would calculate from performance metrics
    return 150 // ms
  }

  /**
   * Get throughput (placeholder)
   */
  private static getThroughput(): number {
    // This would calculate requests per second
    return 25
  }

  /**
   * Get error rate
   */
  private static getErrorRate(metrics: any): number {
    const totalEvents = metrics.totalEvents || 1
    const errorEvents = metrics.criticalEvents + metrics.highEvents
    return Math.round((errorEvents / totalEvents) * 100 * 100) / 100 // 2 decimal places
  }

  /**
   * Format alert description
   */
  private static formatAlertDescription(alert: any): string {
    switch (alert.type) {
      case 'HIGH_BLOCKED_IPS':
        return `${alert.data.count} IPs have been blocked`
      case 'HIGH_THREAT_ACTIVITY':
        return `${alert.data.count} threat patterns detected`
      case 'CRITICAL_SECURITY_EVENT':
        return `Critical security event: ${alert.data.event}`
      default:
        return alert.type.replace(/_/g, ' ').toLowerCase()
    }
  }

  /**
   * Summarize events
   */
  private static summarizeEvents(events: TimelineEvent[]): any {
    const summary = {
      total: events.length,
      bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
      byType: {} as Record<string, number>
    }

    events.forEach(event => {
      summary.bySeverity[event.severity]++
      summary.byType[event.type] = (summary.byType[event.type] || 0) + 1
    })

    return summary
  }

  /**
   * Calculate threat level (placeholder)
   */
  private static calculateThreatLevel(_threatStats: any, _incidentStats: any): string {
    // This would use ML algorithms to assess current threat level
    return 'moderate'
  }

  /**
   * Get top attack vectors (placeholder)
   */
  private static getTopAttackVectors(): any[] {
    // This would analyze attack patterns
    return []
  }

  /**
   * Get geographic distribution (placeholder)
   */
  private static getGeographicDistribution(_incidentStats: any): any {
    // This would map IPs to geographic locations
    return {}
  }

  /**
   * Get attack time patterns (placeholder)
   */
  private static getAttackTimePatterns(): any {
    // This would analyze temporal patterns
    return {}
  }

  /**
   * Generate threat predictions (placeholder)
   */
  private static generateThreatPredictions(_threatStats: any, _incidentStats: any): any[] {
    // This would use ML to predict future threats
    return []
  }
}

// Type definitions
interface SecurityOverview {
  timestamp: string
  status: 'healthy' | 'warning' | 'critical'
  incidents: any
  threats: any
  monitoring: any
  alerts: any
  recommendations: string[]
}

interface RealTimeMetrics {
  timestamp: string
  current: any
  trends: any
  performance: any
}

interface EventTimeline {
  timeRange: number
  totalEvents: number
  events: TimelineEvent[]
  summary: any
}

interface TimelineEvent {
  timestamp: number
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  data: any
}

interface ThreatIntelligence {
  timestamp: string
  threatLevel: string
  attackVectors: any[]
  geographicDistribution: any
  timePatterns: any
  predictions: any[]
}

export default SecurityDashboard
