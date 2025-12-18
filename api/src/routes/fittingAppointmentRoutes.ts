import express from 'express'
import roleAuth from '../middlewares/roleAuth'
import * as fittingAppointmentController from '../controllers/fittingAppointmentController'

const routes = express.Router()

// Create a fitting appointment (authenticated users)

/**
 * @swagger
 * /api/fitting-appointments:
 *   post:
 *     tags: [Fitting Appointments]
 *     summary: Create a fitting appointment
 *     description: Schedule a new fitting appointment for dress alterations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplier
 *               - customer
 *               - location
 *               - from
 *               - to
 *             properties:
 *               supplier:
 *                 type: string
 *                 format: objectId
 *                 description: Supplier ID
 *               customer:
 *                 type: string
 *                 format: objectId
 *                 description: Customer ID
 *               location:
 *                 type: string
 *                 format: objectId
 *                 description: Appointment location
 *               from:
 *                 type: string
 *                 format: date-time
 *                 description: Appointment start time
 *               to:
 *                 type: string
 *                 format: date-time
 *                 description: Appointment end time
 *               notes:
 *                 type: string
 *                 description: Special notes or requirements
 *               measurements:
 *                 type: object
 *                 description: Customer measurements
 *               alterationRequests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Requested alterations
 *           example:
 *             supplier: "507f1f77bcf86cd799439011"
 *             customer: "507f1f77bcf86cd799439013"
 *             location: "507f1f77bcf86cd799439014"
 *             from: "2024-06-28T14:00:00Z"
 *             to: "2024-06-28T15:00:00Z"
 *             notes: "First fitting for wedding dress"
 *             alterationRequests: ["hem adjustment", "waist fitting"]
 *     responses:
 *       201:
 *         description: Fitting appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FittingAppointment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Time slot not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Conflict"
 *               message: "Selected time slot is not available"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.post('/api/fitting-appointments',
  roleAuth.verifyTokenAndUser,
  fittingAppointmentController.createAppointment
)

// Get available time slots for a supplier on a specific date (public)

/**
 * @swagger
 * /api/fitting-appointments/available-slots/{supplier}/{date}:
 *   get:
 *     tags: [Fitting Appointments]
 *     summary: Get available time slots
 *     description: Retrieve available time slots for a supplier on a specific date
 *     security: []
 *     parameters:
 *       - name: supplier
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Supplier ID
 *       - name: date
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability (YYYY-MM-DD)
 *         example: "2024-06-28"
 *     responses:
 *       200:
 *         description: Available time slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   format: date
 *                 supplier:
 *                   type: string
 *                   format: objectId
 *                 availableSlots:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       from:
 *                         type: string
 *                         format: time
 *                       to:
 *                         type: string
 *                         format: time
 *                       available:
 *                         type: boolean
 *             example:
 *               date: "2024-06-28"
 *               supplier: "507f1f77bcf86cd799439011"
 *               availableSlots:
 *                 - from: "09:00"
 *                   to: "10:00"
 *                   available: true
 *                 - from: "10:00"
 *                   to: "11:00"
 *                   available: false
 *                 - from: "14:00"
 *                   to: "15:00"
 *                   available: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.get('/api/fitting-appointments/available-slots/:supplier/:date',
  fittingAppointmentController.getAvailableTimeSlots
)

// Get customer's appointments (authenticated users)
routes.get('/api/fitting-appointments/customer',
  roleAuth.verifyTokenAndUser,
  fittingAppointmentController.getCustomerAppointments
)

// Admin/Supplier only operations with data isolation
// Get appointments for a supplier (admin/supplier view with privacy)
routes.get('/api/fitting-appointments/supplier/:supplier',
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierOwnership('supplier'),
  fittingAppointmentController.getSupplierAppointments
)

// Update appointment status and notes (admin/supplier only with ownership check)
routes.put('/api/fitting-appointments/:id',
  roleAuth.verifyTokenAndUser,
  roleAuth.requireFittingAccess,
  fittingAppointmentController.updateAppointment
)

export default routes
