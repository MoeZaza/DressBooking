import express from 'express'
import userRoutes from './userRoutes'
import dressRoutes from './dressRoutes'
import bookingRoutes from './bookingRoutes'
import locationRoutes from './locationRoutes'
import notificationRoutes from './notificationRoutes'
import weddingPackageRoutes from './weddingPackageRoutes'
import reviewRoutes from './reviewRoutes'
import paymentRoutes from './paymentRoutes'
import fittingAppointmentRoutes from './fittingAppointmentRoutes'
import stripeRoutes from './stripeRoutes'
import paypalRoutes from './paypalRoutes'
import countryRoutes from './countryRoutes'
import bankDetailsRoutes from './bankDetailsRoutes'
import accountingRoutes from './accountingRoutes'
import analyticsRoutes from './analyticsRoutes'
import businessIntelligenceRoutes from './businessIntelligenceRoutes'
import accessorySettingsRoutes from './accessorySettingsRoutes'
import adminNotificationRoutes from './adminNotificationRoutes'
import supplierRoutes from './supplierRoutes'
import ipinfoRoutes from './ipinfoRoutes'
import dropdownRoutes from './dropdownRoutes'

console.log('🚀 Main routes module loaded, registering all routes...')

const router = express.Router()

// Register all routes
router.use(userRoutes)
router.use(dressRoutes)
router.use(bookingRoutes)
router.use(locationRoutes)
router.use(notificationRoutes)
router.use(weddingPackageRoutes)
router.use(reviewRoutes)
router.use(paymentRoutes)
router.use(fittingAppointmentRoutes)
router.use(stripeRoutes)
router.use(paypalRoutes)
router.use(countryRoutes)
router.use(bankDetailsRoutes)
router.use(accountingRoutes)
router.use(analyticsRoutes)
router.use(businessIntelligenceRoutes)
router.use(accessorySettingsRoutes)
router.use(adminNotificationRoutes)
router.use(supplierRoutes)
router.use(ipinfoRoutes)
router.use(dropdownRoutes)
console.log('✅ Dropdown routes registered!')

export default router
