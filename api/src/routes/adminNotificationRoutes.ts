import express from 'express'
import authJwt from '../middlewares/authJwt'
import * as adminNotificationController from '../controllers/adminNotificationController'

const routes = express.Router()

// Admin notification routes
routes.route('/api/admin/notifications/:userId').get(
  authJwt.verifyToken, 
  adminNotificationController.getAdminNotifications
)

routes.route('/api/admin/notifications/:userId/stats').get(
  authJwt.verifyToken, 
  adminNotificationController.getAdminNotificationStats
)

routes.route('/api/admin/notifications/:notificationId/read').put(
  authJwt.verifyToken, 
  adminNotificationController.markAsRead
)

routes.route('/api/admin/notifications/:userId/read-all').put(
  authJwt.verifyToken, 
  adminNotificationController.markAllAsRead
)

routes.route('/api/admin/notifications/:notificationId').delete(
  authJwt.verifyToken, 
  adminNotificationController.deleteNotification
)

routes.route('/api/admin/notifications').post(
  authJwt.verifyToken, 
  adminNotificationController.createAdminNotification
)

routes.route('/api/admin/notifications/:userId/realtime').get(
  authJwt.verifyToken, 
  adminNotificationController.getRealtimeNotifications
)

export default routes
