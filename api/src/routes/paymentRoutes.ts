import express from 'express'
import authJwt from '../middlewares/authJwt'
import roleAuth from '../middlewares/roleAuth'
import * as paymentController from '../controllers/paymentController'

const routes = express.Router()

// Regular payment operations (authenticated users)

/**
 * @swagger
 * /api/payments/booking/{bookingId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get booking payments
 *     description: Retrieve all payment records for a specific booking
 *     parameters:
 *       - name: bookingId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Payment records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookingId:
 *                   type: string
 *                   format: objectId
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         format: objectId
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                         example: "ILS"
 *                       method:
 *                         type: string
 *                         enum: [stripe, paypal, visa, cash]
 *                       status:
 *                         type: string
 *                         enum: [pending, completed, failed, refunded]
 *                       transactionId:
 *                         type: string
 *                       isDeposit:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 totalPaid:
 *                   type: number
 *                 remainingBalance:
 *                   type: number
 *             example:
 *               bookingId: "507f1f77bcf86cd799439015"
 *               payments:
 *                 - _id: "507f1f77bcf86cd799439016"
 *                   amount: 100
 *                   currency: "ILS"
 *                   method: "stripe"
 *                   status: "completed"
 *                   isDeposit: true
 *                   createdAt: "2024-06-25T10:00:00Z"
 *               totalPaid: 100
 *               remainingBalance: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.get('/api/payments/booking/:bookingId', authJwt.verifyToken, paymentController.getBookingPayments)

// Admin/Owner only operations
// Create a payment record (admin/owner only)
routes.post('/api/payments',
  roleAuth.verifyTokenAndUser,
  roleAuth.requirePaymentAccess,
  paymentController.createPayment
)

// Get all payments for a supplier (admin/owner only)
routes.get('/api/payments/supplier/:supplierId',
  roleAuth.verifyTokenAndUser,
  roleAuth.requirePaymentAccess,
  paymentController.getSupplierPayments
)

// Update payment status (admin/owner only)
routes.put('/api/payments/:id/status',
  roleAuth.verifyTokenAndUser,
  roleAuth.requirePaymentAccess,
  paymentController.updatePaymentStatus
)

// Get payment analytics for a supplier (admin/owner only)
routes.get('/api/payments/analytics/:supplierId',
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAccountingAccess,
  paymentController.getPaymentAnalytics
)

// Process a refund (admin/owner only)
routes.post('/api/payments/:id/refund',
  roleAuth.verifyTokenAndUser,
  roleAuth.requirePaymentAccess,
  paymentController.processRefund
)

export default routes
