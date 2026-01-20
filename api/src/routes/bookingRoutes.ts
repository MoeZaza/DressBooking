import express from 'express'
import routeNames from '../config/bookingRoutes.config'
import authJwt from '../middlewares/authJwt'
import roleAuth from '../middlewares/roleAuth'
import * as bookingController from '../controllers/bookingController'
import { enhancedDatabaseSecurityStack, databaseSecurityStack } from '../middlewares/databaseSecurity'
import { compressionMiddleware } from '../middlewares/compression'

const routes = express.Router()

// Regular booking operations (authenticated users)

/**
 * @swagger
 * /api/create-booking:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a new booking
 *     description: Create a new dress rental booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingCreateRequest'
 *           example:
 *             supplier: "507f1f77bcf86cd799439011"
 *             dress: "507f1f77bcf86cd799439012"
 *             customer: "507f1f77bcf86cd799439013"
 *             location: "507f1f77bcf86cd799439014"
 *             from: "2024-07-01T10:00:00Z"
 *             to: "2024-07-03T18:00:00Z"
 *             price: 500
 *             fittingRequired: true
 *             fittingDate: "2024-06-28T14:00:00Z"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Dress not available for selected dates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Conflict"
 *               message: "Dress is not available for the selected dates"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.create).post(...enhancedDatabaseSecurityStack, authJwt.verifyToken, bookingController.create)

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     tags: [Bookings]
 *     summary: Process booking payment
 *     description: Process payment for a booking using various payment methods
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - paymentMethod
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: objectId
 *                 description: Booking ID to process payment for
 *               paymentMethod:
 *                 type: string
 *                 enum: [stripe, paypal, visa]
 *                 description: Payment method to use
 *               sessionId:
 *                 type: string
 *                 description: Payment session ID (for Stripe)
 *               paymentIntentId:
 *                 type: string
 *                 description: Payment intent ID (for Stripe)
 *               isDeposit:
 *                 type: boolean
 *                 description: Whether this is a deposit payment
 *                 default: false
 *           example:
 *             bookingId: "507f1f77bcf86cd799439015"
 *             paymentMethod: "stripe"
 *             isDeposit: false
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 booking:
 *                   $ref: '#/components/schemas/Booking'
 *                 paymentDetails:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                       example: "ILS"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       402:
 *         description: Payment failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Payment Failed"
 *               message: "Payment could not be processed"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.checkout).post(bookingController.checkout)
routes.route(routeNames.update).put(authJwt.verifyToken, bookingController.update)
routes.route(routeNames.deleteTempBooking).delete(bookingController.deleteTempBooking)
routes.route(routeNames.getBooking).get(bookingController.getBooking)
routes.route(routeNames.getBookingId).get(bookingController.getBookingId)
routes.route(routeNames.getBookings).post(
  ...databaseSecurityStack,
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierAccess,
  compressionMiddleware,
  bookingController.getBookings
)
routes.route(routeNames.hasBookings).get(authJwt.verifyToken, bookingController.hasBookings)
/**
 * @swagger
 * /api/cancel-booking/{id}:
 *   post:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     description: Cancel an existing booking and process refund if applicable
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *               refundAmount:
 *                 type: number
 *                 description: Amount to refund (calculated based on cancellation policy)
 *           example:
 *             reason: "Change of plans"
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking cancelled successfully"
 *                 booking:
 *                   $ref: '#/components/schemas/Booking'
 *                 refundDetails:
 *                   type: object
 *                   properties:
 *                     refundAmount:
 *                       type: number
 *                     cancellationFee:
 *                       type: number
 *                     refundMethod:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Booking cannot be cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Conflict"
 *               message: "Booking cannot be cancelled at this time"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.cancelBooking).post(authJwt.verifyToken, bookingController.cancelBooking)

// Admin/Owner only operations
routes.route('/api/admin-create-booking').post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireBookingAccess,
  bookingController.adminCreateBooking
)
routes.route('/api/admin-update-booking/:id').put(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireBookingAccess,
  bookingController.adminUpdateBooking
)
routes.route(routeNames.updateStatus).post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireBookingAccess,
  bookingController.updateStatus
)
routes.route(routeNames.delete).post(
  ...enhancedDatabaseSecurityStack,
  roleAuth.verifyTokenAndUser,
  roleAuth.requireBookingAccess,
  bookingController.deleteBookings
)
routes.route('/api/analytics').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAccountingAccess,
  bookingController.getAnalytics
)
routes.route('/api/booking-conflicts').post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireBookingAccess,
  bookingController.getBookingConflicts
)
routes.route('/api/validate-booking-availability').post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireBookingAccess,
  bookingController.validateBookingAvailability
)
routes.route('/api/customer-bookings/:customerId').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireBookingAccess,
  bookingController.getCustomerBookingHistory
)

// Booking calendar endpoint for admin view
routes.route('/api/booking-calendar').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireBookingAccess,
  bookingController.getBookingCalendar
)

export default routes
