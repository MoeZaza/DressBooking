import express from 'express'
import * as roleAuth from '../middlewares/roleAuth'
import * as businessIntelligenceController from '../controllers/businessIntelligenceController'

const routes = express.Router()

// Maintenance routes
routes.route('/create-maintenance').post(roleAuth.verifyTokenAndUser, businessIntelligenceController.createMaintenance)
routes.route('/maintenance-records').get(roleAuth.verifyTokenAndUser, businessIntelligenceController.getMaintenanceRecords)
routes.route('/maintenance/:id/status').put(roleAuth.verifyTokenAndUser, businessIntelligenceController.updateMaintenanceStatus)

// Customer insights routes
routes.route('/customer-insights').get(roleAuth.verifyTokenAndUser, businessIntelligenceController.getCustomerInsights)

// Business summary
routes.route('/business-summary').get(roleAuth.verifyTokenAndUser, businessIntelligenceController.getBusinessSummary)

export default routes
