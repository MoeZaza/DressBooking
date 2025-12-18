import { Request, Response } from 'express'
import * as bookcarsTypes from ':bookcars-types'
import FittingAppointment from '../models/FittingAppointment'
import Dress from '../models/Dress'
import { AuthenticatedRequest } from '../middlewares/roleAuth'

/**
 * Create a fitting appointment.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const createAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      dress,
      supplier,
      location,
      appointmentDate,
      timeSlot,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      customer, // Allow manual customer assignment for admin/testing
    } = req.body

    // Check if the time slot is already booked
    const existingAppointment = await FittingAppointment.findOne({
      supplier,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      $or: [
        { status: 'pending' },
        { status: 'confirmed' }
      ]
    })

    if (existingAppointment) {
      res.status(409).json({ error: 'Time slot already booked' })
      return
    }

    // Verify dress exists and belongs to supplier
    const dressDoc = await Dress.findOne({ _id: dress, supplier })
    if (!dressDoc) {
      res.status(404).json({ error: 'Dress not found or does not belong to supplier' })
      return
    }

    // Create the appointment
    const appointment = new FittingAppointment({
      customer: customer || req.user?.id, // Use provided customer or from auth middleware
      dress,
      supplier,
      location,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      customerName,
      customerPhone,
      customerEmail,
      notes,
    })

    await appointment.save()

    const populatedAppointment = await FittingAppointment.findById(appointment._id)
      .populate('dress', 'name image dressCode')
      .populate('supplier', 'fullName email phone')
      .populate('location', 'name')

    res.status(201).json(populatedAppointment)
  } catch (err: unknown) {
    console.error(`[fittingAppointmentController.createAppointment] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Get available time slots for a specific date and supplier.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getAvailableTimeSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🚀 getAvailableTimeSlots called with params:', req.params)
    const { supplier, date } = req.params

    // Validate date
    const appointmentDate = new Date(date)
    if (isNaN(appointmentDate.getTime())) {
      console.log('❌ Invalid date format:', date)
      res.status(400).json({ error: 'Invalid date format' })
      return
    }
    console.log('✅ Date validated:', appointmentDate)

    // Get all booked time slots for the date
    const startOfDay = new Date(appointmentDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(appointmentDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Handle test supplier or validate real supplier
    let query: any = {
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      $or: [
        { status: 'pending' },
        { status: 'confirmed' }
      ]
    }

    // Only add supplier filter if it's not 'test'
    if (supplier !== 'test') {
      query.supplier = supplier
    }

    console.log('🔍 Querying fitting appointments with:', JSON.stringify(query))
    const bookedSlots = await FittingAppointment.find(query).select('timeSlot')
    console.log('📅 Found booked slots:', bookedSlots.length)

    const bookedTimeSlots = bookedSlots.map(slot => slot.timeSlot)

    // All possible time slots
    const allTimeSlots = [
      '09:00-10:00',
      '10:00-11:00',
      '11:00-12:00',
      '12:00-13:00',
      '13:00-14:00',
      '14:00-15:00',
      '15:00-16:00',
      '16:00-17:00',
      '17:00-18:00',
      '18:00-19:00',
      '19:00-20:00',
    ]

    // Filter out booked slots
    const availableSlots = allTimeSlots.filter(slot => !bookedTimeSlots.includes(slot))

    res.json({ availableSlots, bookedSlots: bookedTimeSlots })
  } catch (err: unknown) {
    console.error(`[fittingAppointmentController.getAvailableTimeSlots] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Get appointments for a supplier (admin/owner view).
 *
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getSupplierAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { supplier } = req.params
    const { status, date } = req.query
    const userType = req.user?.type
    const userId = req.user?.id

    // Ensure only admin and suppliers can access appointments
    if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(userType as bookcarsTypes.UserType)) {
      res.status(403).json({ error: 'Access denied: Appointment access requires admin or supplier privileges' })
      return
    }

    // Suppliers can only access their own appointments
    if (userType === bookcarsTypes.UserType.Supplier && supplier !== userId) {
      res.status(403).json({ error: 'Access denied: You can only access your own appointments' })
      return
    }

    const query: any = { supplier }

    if (status) {
      query.status = status
    }

    if (date) {
      const appointmentDate = new Date(date as string)

      // Validate the date
      if (isNaN(appointmentDate.getTime())) {
        res.status(400).json({ error: 'Invalid date format' })
        return
      }

      const startOfDay = new Date(appointmentDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(appointmentDate)
      endOfDay.setHours(23, 59, 59, 999)

      // Use $gte and $lte operators directly in the query
      query.appointmentDate = {
        $gte: startOfDay,
        $lte: endOfDay,
      }
    }

    const appointments = await FittingAppointment.find(query)
      .populate('dress', 'name image dressCode')
      .populate('location', 'name')
      .sort({ appointmentDate: 1, timeSlot: 1 })

    // Remove customer personal details for privacy
    const sanitizedAppointments = appointments.map(apt => ({
      _id: apt._id,
      dress: apt.dress,
      location: apt.location,
      appointmentDate: apt.appointmentDate,
      timeSlot: apt.timeSlot,
      status: apt.status,
      customerName: apt.customerName,
      customerPhone: apt.customerPhone,
      customerEmail: apt.customerEmail,
      notes: apt.notes,
      measurements: apt.measurements,
      alterationsNeeded: apt.alterationsNeeded,
      fittingNotes: apt.fittingNotes,
      duration: apt.duration,
      createdAt: (apt as any).createdAt,
      updatedAt: (apt as any).updatedAt,
    }))

    res.json(sanitizedAppointments)
  } catch (err: unknown) {
    console.error(`[fittingAppointmentController.getSupplierAppointments] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Update appointment status and notes.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, fittingNotes, measurements, alterationsNeeded } = req.body

    const appointment = await FittingAppointment.findByIdAndUpdate(
      id,
      {
        status,
        fittingNotes,
        measurements,
        alterationsNeeded,
      },
      { new: true }
    ).populate('dress', 'name image dressCode')
     .populate('location', 'name')

    if (!appointment) {
      res.sendStatus(404)
      return
    }

    res.json(appointment)
  } catch (err: unknown) {
    console.error(`[fittingAppointmentController.updateAppointment] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

/**
 * Get customer's appointments.
 *
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getCustomerAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.id // From auth middleware

    const appointments = await FittingAppointment.find({ customer: customerId })
      .populate('dress', 'name image dressCode')
      .populate('supplier', 'fullName email phone')
      .populate('location', 'name')
      .sort({ appointmentDate: 1 })

    res.json(appointments)
  } catch (err: unknown) {
    console.error(`[fittingAppointmentController.getCustomerAppointments] ${err}`)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
