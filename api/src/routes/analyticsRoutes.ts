import express from 'express'
import roleAuth from '../middlewares/roleAuth'
import * as analyticsController from '../controllers/analyticsController'

const routes = express.Router()

// Dashboard analytics (admin/supplier only with data isolation)

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Get dashboard analytics
 *     description: Retrieve comprehensive dashboard analytics for admin/supplier
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Analytics period
 *       - name: supplier
 *         in: query
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Supplier ID (admin only)
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                 totalBookings:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 *                 totalDresses:
 *                   type: integer
 *                 activeBookings:
 *                   type: integer
 *                 completedBookings:
 *                   type: integer
 *                 cancelledBookings:
 *                   type: integer
 *                 averageBookingValue:
 *                   type: number
 *                 topDresses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       dressId:
 *                         type: string
 *                         format: objectId
 *                       name:
 *                         type: string
 *                       bookings:
 *                         type: integer
 *                       revenue:
 *                         type: number
 *                 revenueByMonth:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       revenue:
 *                         type: number
 *                       bookings:
 *                         type: integer
 *             example:
 *               period: "month"
 *               totalBookings: 45
 *               totalRevenue: 22500
 *               totalDresses: 120
 *               activeBookings: 12
 *               completedBookings: 30
 *               cancelledBookings: 3
 *               averageBookingValue: 500
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route('/dashboard').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierAccess,
  analyticsController.getDashboardAnalytics
)

// Monthly analytics (admin/supplier only with data isolation)
routes.route('/monthly').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierAccess,
  analyticsController.getMonthlyAnalytics
)

// Dress performance analytics (admin/supplier only with data isolation)
routes.route('/dress-performance').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierAccess,
  analyticsController.getDressAnalytics
)

export default routes
