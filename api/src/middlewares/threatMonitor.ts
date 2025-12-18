import { Request } from 'express'

/**
 * Advanced threat monitoring and pattern detection
 */
export class ThreatMonitor {
  private static patterns: Map<string, ThreatPattern[]> = new Map()
  private static suspiciousIPs: Map<string, SuspiciousActivity> = new Map()
  private static attackSignatures: AttackSignature[] = []

  /**
   * Initialize threat monitoring with known attack signatures
   */
  static initialize() {
    this.loadAttackSignatures()
    
    // Clean up old data periodically
    setInterval(() => {
      this.cleanupOldData()
    }, 300000) // Every 5 minutes
  }

  /**
   * Monitor request for threat patterns
   */
  static monitorRequest(req: Request, threats: string[]): ThreatAnalysis {
    const clientIP = req.ip || 'unknown'
    const userAgent = req.get('User-Agent') || ''
    const path = req.path
    const method = req.method
    
    const analysis: ThreatAnalysis = {
      riskScore: 0,
      patterns: [],
      recommendations: [],
      shouldBlock: false
    }

    // Analyze current request
    analysis.riskScore += this.calculateBaseRiskScore(threats)
    
    // Check for attack patterns
    const attackPatterns = this.detectAttackPatterns(req, threats)
    analysis.patterns.push(...attackPatterns)
    analysis.riskScore += attackPatterns.length * 10

    // Analyze IP behavior
    const ipAnalysis = this.analyzeIPBehavior(clientIP, req, threats)
    analysis.riskScore += ipAnalysis.riskScore
    analysis.patterns.push(...ipAnalysis.patterns)

    // Check for coordinated attacks
    const coordinatedAttack = this.detectCoordinatedAttack(req, threats)
    if (coordinatedAttack) {
      analysis.riskScore += 50
      analysis.patterns.push('COORDINATED_ATTACK')
    }

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis.riskScore, analysis.patterns)
    
    // Determine if request should be blocked
    analysis.shouldBlock = analysis.riskScore >= 80 || 
                          analysis.patterns.includes('COORDINATED_ATTACK') ||
                          analysis.patterns.includes('KNOWN_ATTACK_SIGNATURE')

    // Update tracking data
    this.updateThreatPatterns(clientIP, {
      timestamp: Date.now(),
      path,
      method,
      threats,
      userAgent,
      riskScore: analysis.riskScore
    })

    return analysis
  }

  /**
   * Calculate base risk score from detected threats
   */
  private static calculateBaseRiskScore(threats: string[]): number {
    const threatScores: Record<string, number> = {
      'SQL_INJECTION_SELECT': 30,
      'SQL_INJECTION_MODIFY': 40,
      'XSS_SCRIPT_TAG': 25,
      'COMMAND_INJECTION_COMMANDS': 35,
      'CODE_INJECTION_EVAL': 30,
      'PATH_TRAVERSAL': 20,
      'XXE_ENTITY': 35,
      'SSRF_LOCALHOST': 30,
      'TEMPLATE_INJECTION_ES6': 25,
      'SUSPICIOUS_USER_AGENT': 15,
      'HEADER_CRLF_INJECTION': 20,
      'POTENTIAL_IP_SPOOFING': 15
    }

    return threats.reduce((score, threat) => {
      return score + (threatScores[threat] || 5)
    }, 0)
  }

  /**
   * Detect known attack patterns
   */
  private static detectAttackPatterns(req: Request, threats: string[]): string[] {
    const patterns: string[] = []
    
    // Check against known attack signatures
    for (const signature of this.attackSignatures) {
      if (this.matchesSignature(req, threats, signature)) {
        patterns.push('KNOWN_ATTACK_SIGNATURE')
        break
      }
    }

    // Detect common attack patterns
    if (threats.includes('SQL_INJECTION_SELECT') && threats.includes('SQL_INJECTION_BOOLEAN')) {
      patterns.push('SQL_INJECTION_COMBO')
    }

    if (threats.includes('XSS_SCRIPT_TAG') && threats.includes('XSS_EVENT_HANDLER')) {
      patterns.push('XSS_MULTI_VECTOR')
    }

    if (threats.includes('COMMAND_INJECTION_COMMANDS') && threats.includes('PATH_TRAVERSAL')) {
      patterns.push('SYSTEM_COMPROMISE_ATTEMPT')
    }

    return patterns
  }

  /**
   * Analyze IP behavior patterns
   */
  private static analyzeIPBehavior(ip: string, req: Request, threats: string[]): IPAnalysis {
    const analysis: IPAnalysis = {
      riskScore: 0,
      patterns: []
    }

    const activity = this.suspiciousIPs.get(ip) || {
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      requestCount: 0,
      threatCount: 0,
      uniquePaths: new Set(),
      userAgents: new Set(),
      methods: new Set()
    }

    // Update activity
    activity.lastSeen = Date.now()
    activity.requestCount++
    activity.threatCount += threats.length
    activity.uniquePaths.add(req.path)
    activity.userAgents.add(req.get('User-Agent') || '')
    activity.methods.add(req.method)

    this.suspiciousIPs.set(ip, activity)

    // Analyze patterns
    const timeWindow = 300000 // 5 minutes
    const recentActivity = Date.now() - activity.firstSeen < timeWindow

    if (recentActivity && activity.requestCount > 100) {
      analysis.patterns.push('HIGH_FREQUENCY_REQUESTS')
      analysis.riskScore += 20
    }

    if (activity.threatCount > 10) {
      analysis.patterns.push('PERSISTENT_THREAT_ACTIVITY')
      analysis.riskScore += 25
    }

    if (activity.uniquePaths.size > 50 && recentActivity) {
      analysis.patterns.push('RECONNAISSANCE_SCAN')
      analysis.riskScore += 15
    }

    if (activity.userAgents.size > 5 && recentActivity) {
      analysis.patterns.push('USER_AGENT_ROTATION')
      analysis.riskScore += 10
    }

    return analysis
  }

  /**
   * Detect coordinated attacks from multiple IPs
   */
  private static detectCoordinatedAttack(req: Request, threats: string[]): boolean {
    if (threats.length === 0) return false

    const timeWindow = 60000 // 1 minute
    const now = Date.now()
    const recentPatterns: ThreatPattern[] = []

    // Collect recent patterns from all IPs
    for (const patterns of this.patterns.values()) {
      recentPatterns.push(...patterns.filter(p => now - p.timestamp < timeWindow))
    }

    // Check for similar attack patterns from different IPs
    const similarAttacks = recentPatterns.filter(p => 
      p.threats.some(threat => threats.includes(threat)) &&
      p.path === req.path
    )

    return similarAttacks.length >= 3 // 3 or more similar attacks from different IPs
  }

  /**
   * Generate security recommendations
   */
  private static generateRecommendations(riskScore: number, patterns: string[]): string[] {
    const recommendations: string[] = []

    if (riskScore >= 80) {
      recommendations.push('IMMEDIATE_BLOCK_RECOMMENDED')
    } else if (riskScore >= 50) {
      recommendations.push('ENHANCED_MONITORING_RECOMMENDED')
    }

    if (patterns.includes('SQL_INJECTION_COMBO')) {
      recommendations.push('IMPLEMENT_SQL_INJECTION_PROTECTION')
    }

    if (patterns.includes('XSS_MULTI_VECTOR')) {
      recommendations.push('STRENGTHEN_XSS_PROTECTION')
    }

    if (patterns.includes('HIGH_FREQUENCY_REQUESTS')) {
      recommendations.push('IMPLEMENT_RATE_LIMITING')
    }

    if (patterns.includes('RECONNAISSANCE_SCAN')) {
      recommendations.push('IMPLEMENT_HONEYPOT_DETECTION')
    }

    if (patterns.includes('COORDINATED_ATTACK')) {
      recommendations.push('ACTIVATE_DDoS_PROTECTION')
    }

    return recommendations
  }

  /**
   * Update threat patterns for an IP
   */
  private static updateThreatPatterns(ip: string, pattern: ThreatPattern): void {
    const patterns = this.patterns.get(ip) || []
    patterns.push(pattern)
    
    // Keep only recent patterns (last hour)
    const oneHourAgo = Date.now() - 3600000
    const recentPatterns = patterns.filter(p => p.timestamp > oneHourAgo)
    
    this.patterns.set(ip, recentPatterns)
  }

  /**
   * Load known attack signatures
   */
  private static loadAttackSignatures(): void {
    this.attackSignatures = [
      {
        name: 'SQLMap Automated Attack',
        userAgentPattern: /sqlmap/i,
        threatPatterns: ['SQL_INJECTION_SELECT', 'SQL_INJECTION_BOOLEAN'],
        pathPatterns: [/\/\?.*=/]
      },
      {
        name: 'Nikto Web Scanner',
        userAgentPattern: /nikto/i,
        threatPatterns: ['PATH_TRAVERSAL', 'XSS_SCRIPT_TAG'],
        pathPatterns: [/\/cgi-bin\//, /\/admin\//]
      },
      {
        name: 'Directory Traversal Attack',
        threatPatterns: ['PATH_TRAVERSAL'],
        pathPatterns: [/\.\.\/.*\.\.\//, /\.\.\\.*\.\.\\/, /\/etc\/passwd/, /\/proc\/self\/environ/]
      }
    ]
  }

  /**
   * Check if request matches attack signature
   */
  private static matchesSignature(req: Request, threats: string[], signature: AttackSignature): boolean {
    const userAgent = req.get('User-Agent') || ''
    
    // Check user agent pattern
    if (signature.userAgentPattern && !signature.userAgentPattern.test(userAgent)) {
      return false
    }

    // Check threat patterns
    if (signature.threatPatterns && 
        !signature.threatPatterns.some(pattern => threats.includes(pattern))) {
      return false
    }

    // Check path patterns
    if (signature.pathPatterns && 
        !signature.pathPatterns.some(pattern => pattern.test(req.path))) {
      return false
    }

    return true
  }

  /**
   * Clean up old tracking data
   */
  private static cleanupOldData(): void {
    const oneHourAgo = Date.now() - 3600000
    
    // Clean up old patterns
    for (const [ip, patterns] of this.patterns.entries()) {
      const recentPatterns = patterns.filter(p => p.timestamp > oneHourAgo)
      if (recentPatterns.length === 0) {
        this.patterns.delete(ip)
      } else {
        this.patterns.set(ip, recentPatterns)
      }
    }

    // Clean up old suspicious IP data
    for (const [ip, activity] of this.suspiciousIPs.entries()) {
      if (Date.now() - activity.lastSeen > oneHourAgo) {
        this.suspiciousIPs.delete(ip)
      }
    }
  }

  /**
   * Get threat monitoring statistics
   */
  static getStatistics(): ThreatStatistics {
    const now = Date.now()
    const oneHourAgo = now - 3600000
    
    let totalPatterns = 0
    let recentPatterns = 0
    
    for (const patterns of this.patterns.values()) {
      totalPatterns += patterns.length
      recentPatterns += patterns.filter(p => p.timestamp > oneHourAgo).length
    }

    return {
      totalTrackedIPs: this.patterns.size,
      suspiciousIPs: this.suspiciousIPs.size,
      totalPatterns,
      recentPatterns,
      knownSignatures: this.attackSignatures.length,
      lastCleanup: now
    }
  }
}

// Type definitions
interface ThreatPattern {
  timestamp: number
  path: string
  method: string
  threats: string[]
  userAgent: string
  riskScore: number
}

interface SuspiciousActivity {
  firstSeen: number
  lastSeen: number
  requestCount: number
  threatCount: number
  uniquePaths: Set<string>
  userAgents: Set<string>
  methods: Set<string>
}

interface AttackSignature {
  name: string
  userAgentPattern?: RegExp
  threatPatterns?: string[]
  pathPatterns?: RegExp[]
}

interface ThreatAnalysis {
  riskScore: number
  patterns: string[]
  recommendations: string[]
  shouldBlock: boolean
}

interface IPAnalysis {
  riskScore: number
  patterns: string[]
}

interface ThreatStatistics {
  totalTrackedIPs: number
  suspiciousIPs: number
  totalPatterns: number
  recentPatterns: number
  knownSignatures: number
  lastCleanup: number
}

// Initialize threat monitoring
ThreatMonitor.initialize()

export default ThreatMonitor
