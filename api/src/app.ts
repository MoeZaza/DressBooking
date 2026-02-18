import express from 'express'
import compression from 'compression'
import nocache from 'nocache'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import * as env from './config/env.config'
import * as security from './middlewares/security'
import { corsValidator } from './middlewares/corsValidator'
import allowedMethods from './middlewares/allowedMethods'
import { cachingMiddleware } from './middlewares/caching'
import { responseOptimizationMiddleware } from './middlewares/responseOptimization'
import { inputSanitizationMiddleware } from './middlewares/input-sanitization'
import { provideCSRFToken, csrfProtectionMiddleware } from './middlewares/csrf-protection'
import { requestTracker, globalErrorHandler, notFoundHandler } from './middlewares/errorHandler'
import securityRoutes from './routes/securityRoutes'
import supplierRoutes from './routes/supplierRoutes'
import bookingRoutes from './routes/bookingRoutes'
import locationRoutes from './routes/locationRoutes'
import notificationRoutes from './routes/notificationRoutes'
import adminNotificationRoutes from './routes/adminNotificationRoutes'
import dressRoutes from './routes/dressRoutes'
import fittingAppointmentRoutes from './routes/fittingAppointmentRoutes'
import paymentRoutes from './routes/paymentRoutes'
import userRoutes from './routes/userRoutes'
import stripeRoutes from './routes/stripeRoutes'
import countryRoutes from './routes/countryRoutes'
import ipinfoRoutes from './routes/ipinfoRoutes'
import bankDetailsRoutes from './routes/bankDetailsRoutes'
import accountingRoutes from './routes/accountingRoutes'
import analyticsRoutes from './routes/analyticsRoutes'
import businessIntelligenceRoutes from './routes/businessIntelligenceRoutes'
import accessorySettingsRoutes from './routes/accessorySettingsRoutes'
import dropdownRoutes from './routes/dropdownRoutes'
import paypalRoutes from './routes/paypalRoutes'
import { initializeScheduler } from './services/schedulerService'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger.config'
import helmet from 'helmet'
import getSecurityConfig from './config/security.config'

const app = express()

// Get security configuration
const securityConfig = getSecurityConfig()

// Enhanced security headers with environment-aware configuration
app.use(security.cspNonce)
app.use(security.cspViolationHandler)
app.use(security.validateSecurityHeaders)
app.use(security.securityHeaders)
app.use(helmet(securityConfig.headers as any))
app.use(nocache())
app.use(compression({ threshold: 0 }))

// Security middlewares (disabled in development for easier testing)
if (env.NODE_ENV !== 'development') {
  app.use(inputSanitizationMiddleware)
  app.use(provideCSRFToken)
  app.use(csrfProtectionMiddleware)
}

app.use(cachingMiddleware)
app.use(responseOptimizationMiddleware)
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(express.json({ limit: '50mb' }))
app.use(corsValidator)
app.use(cors(securityConfig.cors))
app.use(cookieParser(env.COOKIE_SECRET || 'default-secret'))
app.use(allowedMethods)

// Request tracking middleware
app.use(requestTracker)

// Security middleware
app.use(security.generalRateLimit)
app.use(security.sanitizeInput)
app.use(security.securityLogger)
app.use(security.ipBlockingMiddleware)

// Serve static files from CDN directory
app.use('/cdn', express.static(env.CDN_ROOT || 'public'))

// API Documentation (Swagger)
if (env.IS_DEVELOPMENT) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

// Register routes
app.use('/', securityRoutes)
app.use('/', supplierRoutes)
app.use('/', bookingRoutes)
app.use('/', locationRoutes)
app.use('/', notificationRoutes)
app.use('/', adminNotificationRoutes)
app.use('/', dressRoutes)
app.use('/', fittingAppointmentRoutes)
app.use('/', paymentRoutes)
app.use('/', userRoutes)
app.use('/', stripeRoutes)
app.use('/', countryRoutes)
app.use('/', ipinfoRoutes)
app.use('/', bankDetailsRoutes)
app.use('/', accountingRoutes)
app.use('/', analyticsRoutes)
app.use('/', businessIntelligenceRoutes)
app.use('/', accessorySettingsRoutes)
app.use('/', dropdownRoutes)
app.use('/', paypalRoutes)

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  })
})

// API version info
app.get('/api/version', (_req, res) => {
  res.json({
    version: '1.0.0',
    name: 'DressBooking API',
    environment: env.NODE_ENV
  })
})

// 404 handler - must be after all routes
app.use(notFoundHandler)

// Global error handler - must be last
app.use(globalErrorHandler)

// Initialize scheduler service
initializeScheduler()

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

export default app
