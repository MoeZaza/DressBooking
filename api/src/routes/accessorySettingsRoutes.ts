import express from 'express'
import authJwt from '../middlewares/authJwt'
import roleAuth from '../middlewares/roleAuth'
import * as accessorySettingsController from '../controllers/accessorySettingsController'

const routes = express.Router()

// Get accessory settings for a supplier (authenticated users)
routes.get('/api/accessory-settings/:supplierId', 
  authJwt.verifyToken,
  accessorySettingsController.getAccessorySettings
)

// Update accessory settings for a supplier (admin or supplier only)
routes.put('/api/accessory-settings/:supplierId',
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  accessorySettingsController.updateAccessorySettings
)

// Get all accessory settings (admin only)
routes.get('/api/accessory-settings',
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdmin,
  accessorySettingsController.getAllAccessorySettings
)

// Calculate accessory total (authenticated users)
routes.post('/api/accessory-settings/calculate',
  authJwt.verifyToken,
  accessorySettingsController.calculateAccessoryTotal
)

// Reset accessory settings to defaults (admin or supplier only)
routes.post('/api/accessory-settings/:supplierId/reset',
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  accessorySettingsController.resetAccessorySettings
)

// Delete accessory settings (admin only)
routes.delete('/api/accessory-settings/:supplierId',
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdmin,
  accessorySettingsController.deleteAccessorySettings
)

export default routes
