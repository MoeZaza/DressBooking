import mongoose from 'mongoose'
import express from 'express'
import compression from 'compression'
import nocache from 'nocache'
import cookieParser from 'cookie-parser'
import i18n from './lang/i18n'
import * as env from './config/env.config'
import cors from './middlewares/cors'
import { corsValidator } from './middlewares/corsValidator'
import allowedMethods from './middlewares/allowedMethods'
import security from './middlewares/security'
import { cachingMiddleware } from './middlewares/caching'
import { responseOptimizationMiddleware } from './middlewares/responseOptimization'
import { requestTracker, globalErrorHandler, notFoundHandler } from './middlewares/errorHandler'
import { inputSanitizationMiddleware } from './middlewares/input-sanitization'
import { provideCSRFToken, csrfProtectionMiddleware } from './middlewares/csrf-protection'
import supplierRoutes from './routes/supplierRoutes'
import bookingRoutes from './routes/bookingRoutes'
import locationRoutes from './routes/locationRoutes'
import notificationRoutes from './routes/notificationRoutes'
import securityRoutes from './routes/securityRoutes'
import adminNotificationRoutes from './routes/adminNotificationRoutes'

import dressRoutes from './routes/dressRoutes'
import fittingAppointmentRoutes from './routes/fittingAppointmentRoutes'
import paymentRoutes from './routes/paymentRoutes'
import userRoutes from './routes/userRoutes'
import stripeRoutes from './routes/stripeRoutes'
import countryRoutes from './routes/countryRoutes'
import paypalRoutes from './routes/paypalRoutes'
import ipinfoRoutes from './routes/ipinfoRoutes'
import bankDetailsRoutes from './routes/bankDetailsRoutes'
import accountingRoutes from './routes/accountingRoutes'
import analyticsRoutes from './routes/analyticsRoutes'
import businessIntelligenceRoutes from './routes/businessIntelligenceRoutes'
import accessorySettingsRoutes from './routes/accessorySettingsRoutes'
import dropdownRoutes from './routes/dropdownRoutes'
import * as helper from './common/helper'
import * as schedulerService from './services/schedulerService'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger.config'

const app = express()

// Enhanced security headers with environment-aware configuration
app.use(security.cspNonce)
app.use(security.cspViolationHandler)
app.use(security.validateSecurityHeaders)
app.use(security.securityHeaders)

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
app.use(cors())
app.use(cookieParser(env.COOKIE_SECRET))
app.use(allowedMethods)

// Request tracking middleware
app.use(requestTracker)

// Security middleware
app.use(security.generalRateLimit)
app.use(security.sanitizeInput) // Re-enabled now that MongoDB query issue is fixed
app.use(security.securityLogger)
app.use(security.ipBlockingMiddleware)

// Serve static files from the CDN directory
app.use('/cdn', express.static(env.CDN_ROOT))

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
app.use('/', paypalRoutes)
app.use('/', ipinfoRoutes)
app.use('/', bankDetailsRoutes)
app.use('/api/accounting', accountingRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/business-intelligence', businessIntelligenceRoutes)
app.use('/', accessorySettingsRoutes)
app.use('/', dropdownRoutes)

// API Documentation with Swagger UI
const swaggerOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
  `,
  customSiteTitle: 'BookDress API Documentation',
  customfavIcon: '/favicon.ico'
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions))

// API specification endpoint (JSON)
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '7.2.0',
    environment: env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'BookDress API',
    version: '7.2.0',
    description: 'Dress rental management system API',
    documentation: '/api-docs',
    health: '/api/health',
    security: '/api/security/health',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware (must be last)
app.use(notFoundHandler)
app.use(globalErrorHandler)

i18n.locale = env.DEFAULT_LANGUAGE

await helper.mkdir(env.CDN_USERS)
await helper.mkdir(env.CDN_TEMP_USERS)

await helper.mkdir(env.CDN_DRESSES)
await helper.mkdir(env.CDN_TEMP_DRESSES)
await helper.mkdir(env.CDN_LOCATIONS)
await helper.mkdir(env.CDN_TEMP_LOCATIONS)
await helper.mkdir(env.CDN_CONTRACTS)
await helper.mkdir(env.CDN_TEMP_CONTRACTS)
await helper.mkdir(env.CDN_LICENSES)
await helper.mkdir(env.CDN_TEMP_LICENSES)

// Initialize scheduler for rental count updates
schedulerService.initializeScheduler()

export default app
