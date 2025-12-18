import express from 'express'
import authJwt from '../middlewares/authJwt'
import roleAuth from '../middlewares/roleAuth'
import * as weddingPackageController from '../controllers/weddingPackageController'

const routes = express.Router()

// Public/authenticated user routes
routes.route('/api/wedding-packages').get(authJwt.verifyToken, weddingPackageController.getWeddingPackages)
routes.route('/api/wedding-packages/:id').get(authJwt.verifyToken, weddingPackageController.getWeddingPackage)

// Admin/Owner only operations
routes.route('/api/wedding-packages').post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  weddingPackageController.createWeddingPackage
)
routes.route('/api/wedding-packages/:id').put(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  weddingPackageController.updateWeddingPackage
)
routes.route('/api/wedding-packages/:id').delete(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  weddingPackageController.deleteWeddingPackage
)

export default routes
