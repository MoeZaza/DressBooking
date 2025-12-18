const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { Server } = require('socket.io')
const http = require('http')
const cron = require('node-cron')
const winston = require('winston')
const axios = require('axios')
const moment = require('moment')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:4002"],
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 4002

// Check if database security is enabled
const isDatabaseSecurityEnabled = process.env.BC_ENABLE_DATABASE_SECURITY === 'true'

if (!isDatabaseSecurityEnabled) {
  console.log('🛡️ Database security is disabled (BC_ENABLE_DATABASE_SECURITY=false)')
  console.log('🚫 Security monitor will not start - security monitoring is disabled')
  console.log('💡 To enable security monitoring, set BC_ENABLE_DATABASE_SECURITY=true')

  // Start a minimal server that just returns a disabled status
  const express = require('express')
  const disabledApp = express()

  disabledApp.use(express.json())

  disabledApp.get('/api/security/health', (req, res) => {
    res.json({
      status: 'disabled',
      message: 'Security monitoring is disabled (BC_ENABLE_DATABASE_SECURITY=false)',
      timestamp: new Date().toISOString()
    })
  })

  disabledApp.get('/api/security/status', (req, res) => {
    res.json({
      enabled: false,
      reason: 'BC_ENABLE_DATABASE_SECURITY is not set to true',
      timestamp: new Date().toISOString()
    })
  })

  disabledApp.listen(PORT, () => {
    console.log(`🚫 Security monitor (disabled) listening on port ${PORT}`)
    console.log(`📍 Health check available at: http://localhost:${PORT}/api/security/health`)
  })

  return
}

console.log('🛡️ Database security is enabled - starting security monitor')

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security-monitor-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/security-monitor.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}))

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:4002"],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})
app.use('/api/', limiter)

// In-memory storage for security data (in production, use Redis or database)
let securityData = {
  incidents: [],
  metrics: {
    totalIncidents: 0,
    criticalIncidents: 0,
    highIncidents: 0,
    blockedRequests: 0,
    lastUpdate: new Date()
  },
  blacklistedIPs: new Set(),
  suspiciousIPs: new Map(),
  systemStatus: {
    api: 'unknown',
    frontend: 'unknown',
    backend: 'unknown',
    database: 'unknown'
  },
  alerts: [],
  configuration: {
    securityLevel: 'standard',
    threatBlocking: false,
    monitoring: true,
    alerting: true
  }
}

// Security monitoring functions
async function checkSystemHealth() {
  const services = [
    { name: 'api', url: 'http://localhost:4001/health' },
    { name: 'frontend', url: 'http://localhost:3000' },
    { name: 'backend', url: 'http://localhost:3001' }
  ]

  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 5000 })
      securityData.systemStatus[service.name] = response.status === 200 ? 'healthy' : 'unhealthy'
    } catch (error) {
      securityData.systemStatus[service.name] = 'down'
      logger.warn(`Service ${service.name} is down: ${error.message}`)
    }
  }
}

async function fetchSecurityMetrics() {
  try {
    // Fetch metrics from main API
    const response = await axios.get('http://localhost:3001/api/security/metrics', { timeout: 5000 })
    if (response.data) {
      securityData.metrics = {
        ...securityData.metrics,
        ...response.data,
        lastUpdate: new Date()
      }
    }
  } catch (error) {
    logger.warn(`Failed to fetch security metrics: ${error.message}`)
  }
}

async function fetchSecurityIncidents() {
  try {
    // Fetch recent incidents from main API
    const response = await axios.get('http://localhost:3001/api/security/incidents', { timeout: 5000 })
    if (response.data && Array.isArray(response.data)) {
      securityData.incidents = response.data.slice(-100) // Keep last 100 incidents
    }
  } catch (error) {
    logger.warn(`Failed to fetch security incidents: ${error.message}`)
  }
}

function analyzeSecurityTrends() {
  const now = moment()
  const last24h = now.clone().subtract(24, 'hours')
  const last7d = now.clone().subtract(7, 'days')

  const recent24h = securityData.incidents.filter(incident => 
    moment(incident.timestamp).isAfter(last24h)
  )

  const recent7d = securityData.incidents.filter(incident => 
    moment(incident.timestamp).isAfter(last7d)
  )

  return {
    last24Hours: {
      total: recent24h.length,
      critical: recent24h.filter(i => i.severity === 'CRITICAL').length,
      high: recent24h.filter(i => i.severity === 'HIGH').length,
      blocked: recent24h.filter(i => i.blocked).length
    },
    last7Days: {
      total: recent7d.length,
      critical: recent7d.filter(i => i.severity === 'CRITICAL').length,
      high: recent7d.filter(i => i.severity === 'HIGH').length,
      blocked: recent7d.filter(i => i.blocked).length
    },
    trends: {
      increasing: recent24h.length > (recent7d.length / 7),
      criticalTrend: recent24h.filter(i => i.severity === 'CRITICAL').length > 0
    }
  }
}

// API Routes
app.get('/api/security', (req, res) => {
  res.json({
    status: 'active',
    service: 'BookDress Security Monitor',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date()
  })
})

app.get('/api/security/dashboard', (req, res) => {
  const trends = analyzeSecurityTrends()
  
  res.json({
    systemStatus: securityData.systemStatus,
    metrics: securityData.metrics,
    trends,
    recentIncidents: securityData.incidents.slice(-10),
    alerts: securityData.alerts.slice(-5),
    configuration: securityData.configuration,
    timestamp: new Date()
  })
})

app.get('/api/security/incidents', (req, res) => {
  const { limit = 50, severity, type, since } = req.query
  let incidents = [...securityData.incidents]

  if (severity) {
    incidents = incidents.filter(i => i.severity === severity.toUpperCase())
  }

  if (type) {
    incidents = incidents.filter(i => i.type === type.toUpperCase())
  }

  if (since) {
    const sinceDate = moment(since)
    incidents = incidents.filter(i => moment(i.timestamp).isAfter(sinceDate))
  }

  incidents = incidents.slice(-parseInt(limit))

  res.json({
    incidents,
    total: incidents.length,
    timestamp: new Date()
  })
})

app.get('/api/security/metrics', (req, res) => {
  const trends = analyzeSecurityTrends()
  
  res.json({
    ...securityData.metrics,
    trends,
    systemHealth: securityData.systemStatus,
    timestamp: new Date()
  })
})

app.get('/api/security/alerts', (req, res) => {
  res.json({
    alerts: securityData.alerts,
    count: securityData.alerts.length,
    timestamp: new Date()
  })
})

app.post('/api/security/alerts', (req, res) => {
  const { type, severity, message, source } = req.body
  
  const alert = {
    id: Date.now().toString(),
    type,
    severity,
    message,
    source,
    timestamp: new Date(),
    acknowledged: false
  }

  securityData.alerts.unshift(alert)
  
  // Keep only last 100 alerts
  if (securityData.alerts.length > 100) {
    securityData.alerts = securityData.alerts.slice(0, 100)
  }

  // Emit real-time alert
  io.emit('security-alert', alert)
  
  logger.info(`Security alert created: ${type} - ${message}`)
  
  res.status(201).json({ success: true, alert })
})

app.put('/api/security/alerts/:id/acknowledge', (req, res) => {
  const { id } = req.params
  const alert = securityData.alerts.find(a => a.id === id)
  
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' })
  }

  alert.acknowledged = true
  alert.acknowledgedAt = new Date()
  alert.acknowledgedBy = req.body.acknowledgedBy || 'system'

  res.json({ success: true, alert })
})

app.get('/api/security/blacklist', (req, res) => {
  res.json({
    blacklistedIPs: Array.from(securityData.blacklistedIPs),
    count: securityData.blacklistedIPs.size,
    timestamp: new Date()
  })
})

app.post('/api/security/blacklist', (req, res) => {
  const { ip, reason } = req.body
  
  if (!ip) {
    return res.status(400).json({ error: 'IP address is required' })
  }

  securityData.blacklistedIPs.add(ip)
  
  logger.info(`IP ${ip} added to blacklist: ${reason || 'No reason provided'}`)
  
  res.status(201).json({ 
    success: true, 
    message: `IP ${ip} added to blacklist`,
    blacklistedIPs: Array.from(securityData.blacklistedIPs)
  })
})

app.delete('/api/security/blacklist/:ip', (req, res) => {
  const { ip } = req.params
  
  if (securityData.blacklistedIPs.has(ip)) {
    securityData.blacklistedIPs.delete(ip)
    logger.info(`IP ${ip} removed from blacklist`)
    res.json({ 
      success: true, 
      message: `IP ${ip} removed from blacklist`,
      blacklistedIPs: Array.from(securityData.blacklistedIPs)
    })
  } else {
    res.status(404).json({ error: 'IP not found in blacklist' })
  }
})

app.get('/api/security/config', (req, res) => {
  res.json({
    configuration: securityData.configuration,
    timestamp: new Date()
  })
})

app.put('/api/security/config', (req, res) => {
  const { securityLevel, threatBlocking, monitoring, alerting } = req.body
  
  if (securityLevel) securityData.configuration.securityLevel = securityLevel
  if (typeof threatBlocking === 'boolean') securityData.configuration.threatBlocking = threatBlocking
  if (typeof monitoring === 'boolean') securityData.configuration.monitoring = monitoring
  if (typeof alerting === 'boolean') securityData.configuration.alerting = alerting

  logger.info('Security configuration updated', securityData.configuration)
  
  res.json({ 
    success: true, 
    configuration: securityData.configuration 
  })
})

app.get('/api/security/health', (req, res) => {
  res.json({
    status: 'healthy',
    systemStatus: securityData.systemStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date()
  })
})

// WebSocket connections for real-time monitoring
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)
  
  // Send initial data
  socket.emit('security-status', {
    systemStatus: securityData.systemStatus,
    metrics: securityData.metrics,
    recentIncidents: securityData.incidents.slice(-10)
  })

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// Scheduled tasks
cron.schedule('*/30 * * * * *', async () => { // Every 30 seconds
  await checkSystemHealth()
  await fetchSecurityMetrics()
  
  // Emit real-time updates
  io.emit('security-update', {
    systemStatus: securityData.systemStatus,
    metrics: securityData.metrics,
    timestamp: new Date()
  })
})

cron.schedule('*/2 * * * *', async () => { // Every 2 minutes
  await fetchSecurityIncidents()
})

cron.schedule('0 */6 * * *', () => { // Every 6 hours
  // Clean old incidents (keep last 1000)
  if (securityData.incidents.length > 1000) {
    securityData.incidents = securityData.incidents.slice(-1000)
  }
  
  // Clean old alerts (keep last 100)
  if (securityData.alerts.length > 100) {
    securityData.alerts = securityData.alerts.slice(-100)
  }
  
  logger.info('Cleaned old security data')
})

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Start server
server.listen(PORT, () => {
  logger.info(`BookDress Security Monitor running on port ${PORT}`)
  logger.info(`Dashboard available at: http://localhost:${PORT}/api/security/dashboard`)
  
  // Initial health check
  checkSystemHealth()
  fetchSecurityMetrics()
  fetchSecurityIncidents()
})
