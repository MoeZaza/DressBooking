import express from 'express'
import mongoose from 'mongoose'
import * as env from '../config/env.config'
import * as logger from '../common/logger'
import { SecurityIncidentTracker } from '../middlewares/security'
import { generateCorsSecurityReport } from '../middlewares/corsValidator'
import ThreatMonitor from '../middlewares/threatMonitor'
import securityMonitor from '../monitoring/securityMonitor'
import SecurityDashboard from '../monitoring/securityDashboard'
import databaseSecurityService from '../services/DatabaseSecurityService'
import { DatabaseSecurityTester } from '../scripts/testDatabaseSecurity'

const router = express.Router()

/**
 * CSP violation reporting endpoint
 */
router.post('/api/security/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  try {
    const report = req.body['csp-report'] || req.body
    
    if (report) {
      const context = logger.createRequestContext(req)
      
      logger.logSecurityEvent(
        'CSP Violation Report',
        {
          documentUri: report['document-uri'],
          violatedDirective: report['violated-directive'],
          blockedUri: report['blocked-uri'],
          sourceFile: report['source-file'],
          lineNumber: report['line-number'],
          columnNumber: report['column-number'],
          originalPolicy: report['original-policy'],
          disposition: report.disposition,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer')
        },
        'MEDIUM',
        context
      )

      // Track CSP violations as security incidents
      SecurityIncidentTracker.trackIncident(
        req.ip || 'unknown',
        'CSP_VIOLATION',
        'MEDIUM',
        {
          violatedDirective: report['violated-directive'],
          blockedUri: report['blocked-uri'],
          documentUri: report['document-uri']
        }
      )
    }
    
    res.status(204).send() // No content response for CSP reports
  } catch (error) {
    logger.error('Error processing CSP report:', error)
    res.status(400).json({ error: 'Invalid CSP report' })
  }
})

/**
 * Security incident statistics endpoint (admin only)
 */
router.get('/api/security/incidents', (_req, res) => {
  try {
    const stats = SecurityIncidentTracker.getStats()
    const incidents = SecurityIncidentTracker.getIncidents()

    res.json({
      stats,
      recentIncidents: Object.values(incidents)
        .flat()
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50) // Last 50 incidents
    })
  } catch (error) {
    logger.error('Error retrieving security incidents:', error)
    res.status(500).json({ error: 'Failed to retrieve security incidents' })
  }
})

/**
 * Unblock IP endpoint (admin only)
 */
router.post('/api/security/unblock-ip', (req: any, res: any) => {
  try {
    const { ip } = req.body

    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' })
    }

    SecurityIncidentTracker.unblockIP(ip)

    logger.logSecurityEvent(
      'IP manually unblocked',
      { ip, adminUser: (req as any).user?.email || 'unknown' },
      'LOW',
      logger.createRequestContext(req)
    )

    return res.json({ message: `IP ${ip} has been unblocked` })
  } catch (error) {
    logger.error('Error unblocking IP:', error)
    return res.status(500).json({ error: 'Failed to unblock IP' })
  }
})

/**
 * CORS security report endpoint (admin only)
 */
router.get('/api/security/cors-report', (_req, res) => {
  try {
    const corsReport = generateCorsSecurityReport()

    res.json({
      cors: corsReport,
      recommendations: generateCorsRecommendations(corsReport)
    })
  } catch (error) {
    logger.error('Error generating CORS report:', error)
    res.status(500).json({ error: 'Failed to generate CORS report' })
  }
})

/**
 * Generate CORS security recommendations
 */
function generateCorsRecommendations(report: any) {
  const recommendations = []

  if (report.suspiciousActivity > 0) {
    recommendations.push({
      type: 'warning',
      message: `${report.suspiciousActivity} origins showing suspicious activity patterns`,
      action: 'Review and consider blocking suspicious origins'
    })
  }

  if (report.activeOrigins > 50) {
    recommendations.push({
      type: 'info',
      message: `High number of active origins (${report.activeOrigins})`,
      action: 'Consider implementing origin allowlist restrictions'
    })
  }

  const topOrigin = report.topOrigins[0]
  if (topOrigin && topOrigin.requests > 1000) {
    recommendations.push({
      type: 'info',
      message: `High request volume from ${topOrigin.origin} (${topOrigin.requests} requests)`,
      action: 'Monitor for potential abuse or implement rate limiting'
    })
  }

  return recommendations
}

/**
 * Security health check endpoint
 */
router.get('/api/security/health', (_req, res) => {
  try {
    const stats = SecurityIncidentTracker.getStats()
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      security: {
        totalIncidents: stats.totalIncidents,
        blockedIPs: stats.blockedIPs.length,
        uniqueIPs: stats.uniqueIPs,
        topOffenders: stats.topOffenders.slice(0, 5)
      },
      checks: {
        rateLimiting: 'active',
        ipBlocking: 'active',
        cspReporting: 'active',
        threatDetection: 'active'
      }
    }
    
    // Determine overall health status
    if (stats.blockedIPs.length > 100) {
      health.status = 'warning'
    }
    
    if (stats.totalIncidents > 1000) {
      health.status = 'critical'
    }
    
    res.json(health)
  } catch (error) {
    logger.error('Error checking security health:', error)
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to check security health' 
    })
  }
})

/**
 * Threat monitoring statistics endpoint (admin only)
 */
router.get('/api/security/threat-monitor', (_req, res) => {
  try {
    const stats = ThreatMonitor.getStatistics()

    res.json({
      threatMonitoring: stats,
      status: 'active',
      recommendations: generateThreatRecommendations(stats)
    })
  } catch (error) {
    logger.error('Error retrieving threat monitoring data:', error)
    res.status(500).json({ error: 'Failed to retrieve threat monitoring data' })
  }
})

/**
 * Generate threat monitoring recommendations
 */
function generateThreatRecommendations(stats: any) {
  const recommendations = []

  if (stats.recentPatterns > 100) {
    recommendations.push({
      type: 'warning',
      message: `High threat activity detected (${stats.recentPatterns} patterns in last hour)`,
      action: 'Consider implementing additional security measures'
    })
  }

  if (stats.suspiciousIPs > 20) {
    recommendations.push({
      type: 'warning',
      message: `Multiple suspicious IPs detected (${stats.suspiciousIPs})`,
      action: 'Review and consider blocking persistent offenders'
    })
  }

  if (stats.totalTrackedIPs > 1000) {
    recommendations.push({
      type: 'info',
      message: `Large number of tracked IPs (${stats.totalTrackedIPs})`,
      action: 'Consider implementing IP reputation filtering'
    })
  }

  return recommendations
}

/**
 * Security monitoring metrics endpoint (admin only)
 */
router.get('/api/security/monitoring', (_req, res) => {
  try {
    const metrics = securityMonitor.getMetrics()
    const alertHistory = securityMonitor.getAlertHistory()

    // Convert Map to object for JSON serialization
    const alertHistoryObj: Record<string, any[]> = {}
    for (const [key, value] of alertHistory.entries()) {
      alertHistoryObj[key] = value
    }

    res.json({
      metrics,
      alertHistory: alertHistoryObj,
      status: 'active',
      uptime: Date.now() - metrics.lastReset
    })
  } catch (error) {
    logger.error('Error retrieving security monitoring data:', error)
    res.status(500).json({ error: 'Failed to retrieve security monitoring data' })
  }
})

/**
 * Security logs aggregation endpoint (admin only)
 */
router.get('/api/security/logs', (req, res) => {
  try {
    const timeWindow = parseInt(req.query.timeWindow as string) || 3600000 // 1 hour default
    const format = (req.query.format as string) || 'json'

    const aggregatedLogs = logger.logAggregator.aggregateSecurityEvents(timeWindow)
    const eventPatterns = logger.logAggregator.getEventPatterns(timeWindow)

    res.json({
      aggregatedLogs,
      eventPatterns,
      timeWindow,
      format,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error retrieving security logs:', error)
    res.status(500).json({ error: 'Failed to retrieve security logs' })
  }
})

/**
 * Update security monitoring thresholds (admin only)
 */
router.put('/api/security/thresholds', (req: any, res: any) => {
  try {
    const { thresholds } = req.body

    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({ error: 'Invalid thresholds data' })
    }

    securityMonitor.updateThresholds(thresholds)

    logger.logSecurityEvent(
      'Security monitoring thresholds updated',
      { newThresholds: thresholds, adminUser: (req as any).user?.email || 'unknown' },
      'LOW',
      logger.createRequestContext(req)
    )

    return res.json({
      message: 'Security monitoring thresholds updated successfully',
      thresholds
    })
  } catch (error) {
    logger.error('Error updating security thresholds:', error)
    return res.status(500).json({ error: 'Failed to update security thresholds' })
  }
})

/**
 * Reset security monitoring metrics (admin only)
 */
router.post('/api/security/reset-metrics', (req, res) => {
  try {
    securityMonitor.resetMetrics()

    logger.logSecurityEvent(
      'Security monitoring metrics reset',
      { adminUser: (req as any).user?.email || 'unknown' },
      'LOW',
      logger.createRequestContext(req)
    )

    res.json({ message: 'Security monitoring metrics reset successfully' })
  } catch (error) {
    logger.error('Error resetting security metrics:', error)
    res.status(500).json({ error: 'Failed to reset security metrics' })
  }
})

/**
 * Export security logs (admin only)
 */
router.post('/api/security/export-logs', (req, res) => {
  try {
    const { format = 'json', timeRange } = req.body

    const exportResult = logger.logAggregator.exportLogs(format, timeRange)

    logger.logSecurityEvent(
      'Security logs exported',
      {
        format,
        timeRange,
        adminUser: (req as any).user?.email || 'unknown',
        recordCount: exportResult.recordCount
      },
      'LOW',
      logger.createRequestContext(req)
    )

    res.json({
      message: 'Security logs exported successfully',
      export: exportResult
    })
  } catch (error) {
    logger.error('Error exporting security logs:', error)
    res.status(500).json({ error: 'Failed to export security logs' })
  }
})

/**
 * Security dashboard overview endpoint (admin only)
 */
router.get('/api/security/dashboard', (_req, res) => {
  try {
    const overview = SecurityDashboard.getSecurityOverview()
    res.json(overview)
  } catch (error) {
    logger.error('Error retrieving security dashboard data:', error)
    res.status(500).json({ error: 'Failed to retrieve security dashboard data' })
  }
})

/**
 * Real-time security metrics endpoint (admin only)
 */
router.get('/api/security/realtime', (_req, res) => {
  try {
    const metrics = SecurityDashboard.getRealTimeMetrics()
    res.json(metrics)
  } catch (error) {
    logger.error('Error retrieving real-time security metrics:', error)
    res.status(500).json({ error: 'Failed to retrieve real-time security metrics' })
  }
})

/**
 * Security event timeline endpoint (admin only)
 */
router.get('/api/security/timeline', (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange as string) || 86400000 // 24 hours default
    const timeline = SecurityDashboard.getEventTimeline(timeRange)
    res.json(timeline)
  } catch (error) {
    logger.error('Error retrieving security event timeline:', error)
    res.status(500).json({ error: 'Failed to retrieve security event timeline' })
  }
})

/**
 * Threat intelligence endpoint (admin only)
 */
router.get('/api/security/threat-intelligence', (_req, res) => {
  try {
    const intelligence = SecurityDashboard.getThreatIntelligence()
    res.json(intelligence)
  } catch (error) {
    logger.error('Error retrieving threat intelligence:', error)
    res.status(500).json({ error: 'Failed to retrieve threat intelligence' })
  }
})

/**
 * Database security health check endpoint
 */
router.get('/api/security/database-health', async (_req, res) => {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      database: {
        connected: mongoose.connection.readyState === 1,
        readyState: mongoose.connection.readyState,
        name: mongoose.connection.name || 'unknown',
        host: mongoose.connection.host || 'unknown'
      },
      security: {
        config: databaseSecurityService.getConfig(),
        mongooseSettings: {
          sanitizeFilter: mongoose.get('sanitizeFilter'),
          runValidators: mongoose.get('runValidators'),
          strictQuery: mongoose.get('strictQuery')
        }
      },
      status: 'healthy'
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      healthCheck.status = 'unhealthy'
      res.status(503).json(healthCheck)
      return
    }

    res.json(healthCheck)
  } catch (error) {
    logger.error('Error checking database security health:', error)
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: 'Failed to check database security health'
    })
  }
})

/**
 * Database security test endpoint (admin only)
 */
router.post('/api/security/database-test', async (_req, res) => {
  try {
    const tester = new DatabaseSecurityTester()

    // Run a subset of tests for API endpoint
    await tester.testConnectionSecurity()
    await tester.testQuerySanitization()
    await tester.testFieldEncryption()

    const results = (tester as any).results || []
    const totalTests = results.length
    const passedTests = results.filter((r: any) => r.passed).length

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) + '%' : '0%'
      },
      results,
      status: passedTests === totalTests ? 'all_passed' : 'some_failed'
    })
  } catch (error) {
    logger.error('Error running database security tests:', error)
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: 'Failed to run database security tests'
    })
  }
})

/**
 * Development endpoint to clear blocked IPs
 */
router.post('/api/security/clear-blocked-ips', async (_req: any, res: any) => {
  // Only allow in development environment
  if (env.NODE_ENV !== 'development') {
    return res.status(403).json({
      error: 'This endpoint is only available in development environment'
    })
  }

  try {
    SecurityIncidentTracker.clearBlockedIPs()

    logger.logSecurityEvent(
      'Blocked IPs cleared via API endpoint',
      { endpoint: '/api/security/clear-blocked-ips' },
      'LOW'
    )

    return res.json({
      success: true,
      message: 'All blocked IPs have been cleared',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error clearing blocked IPs:', error)
    return res.status(500).json({
      error: 'Failed to clear blocked IPs',
      timestamp: new Date().toISOString()
    })
  }
})

export default router
