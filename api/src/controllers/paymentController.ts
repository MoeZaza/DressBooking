import { Request, Response } from 'express'

import Payment from '../models/Payment'
import Booking from '../models/Booking'
import * as helper from '../common/helper'


/**
 * Create a payment record.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      booking,
      amount,
      paymentMethod,
      transactionId,
      notes,
    } = req.body

    // Input validation
    if (!booking || !helper.isValidObjectId(booking)) {
      res.status(400).json({ error: 'Valid booking ID is required' })
      return
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' })
      return
    }

    const validPaymentMethods = ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'paypal', 'stripe']
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      res.status(400).json({ error: 'Valid payment method is required' })
      return
    }

    // Get the booking to calculate remaining amount
    const bookingDoc = await Booking.findById(booking)
    if (!bookingDoc) {
      res.status(404).json({ error: 'Booking not found' })
      return
    }

    const totalAmount = bookingDoc.price
    const currentPaidAmount = bookingDoc.paidAmount || 0
    const newPaidAmount = currentPaidAmount + amount
    const remainingAmount = Math.max(0, totalAmount - newPaidAmount)

    // Create payment record
    const payment = new Payment({
      booking,
      amount,
      remainingAmount,
      totalAmount,
      status: remainingAmount === 0 ? 'fully-paid' : 'partially-paid',
      paymentMethod,
      transactionId,
      paymentDate: new Date(),
      notes,
    })

    await payment.save()

    // Update booking payment status
    await Booking.findByIdAndUpdate(booking, {
      paidAmount: newPaidAmount,
      remainingAmount,
      paymentStatus: payment.status,
    })

    const populatedPayment = await Payment.findById(payment._id)
      .populate('booking', 'from to price')

    res.status(201).json(populatedPayment)
  } catch (err: any) {
    console.error(`[paymentController.createPayment] ${err}`)
    res.status(500).json({ error: err.message })
  }
}

/**
 * Get payments for a booking.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getBookingPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params

    const payments = await Payment.find({ booking: bookingId })
      .sort({ paymentDate: -1 })

    res.json(payments)
  } catch (err: any) {
    console.error(`[paymentController.getBookingPayments] ${err}`)
    res.status(500).json({ error: err.message })
  }
}

/**
 * Get all payments for a supplier.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getSupplierPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params
    const { status, startDate, endDate } = req.query

    // First get all bookings for this supplier
    const bookings = await Booking.find({ supplier: supplierId }).select('_id')
    const bookingIds = bookings.map(b => b._id)

    let query: any = { booking: { $in: bookingIds } }

    if (status) {
      query.status = status
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string)
      const end = new Date(endDate as string)

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ error: 'Invalid date format' })
        return
      }

      query.paymentDate = {
        $gte: start,
        $lte: end,
      }
    }

    const payments = await Payment.find(query)
      .populate({
        path: 'booking',
        select: 'from to price customer dress',
        populate: [
          { path: 'customer', select: 'fullName email' },
          { path: 'dress', select: 'name dressCode' },
        ],
      })
      .sort({ paymentDate: -1 })

    res.json(payments)
  } catch (err: any) {
    console.error(`[paymentController.getSupplierPayments] ${err}`)
    res.status(500).json({ error: err.message })
  }
}

/**
 * Update payment status.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const payment = await Payment.findByIdAndUpdate(
      id,
      { status, notes },
      { new: true }
    ).populate('booking', 'from to price')

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' })
      return
    }

    // Update booking payment status if needed
    if (status === 'refunded') {
      const booking = await Booking.findById(payment.booking)
      if (booking) {
        const newPaidAmount = Math.max(0, (booking.paidAmount || 0) - payment.amount)
        const newRemainingAmount = booking.price - newPaidAmount
        
        await Booking.findByIdAndUpdate(payment.booking, {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          paymentStatus: newPaidAmount === 0 ? 'pending' : newRemainingAmount === 0 ? 'fully-paid' : 'partially-paid',
        })
      }
    }

    res.json(payment)
  } catch (err: any) {
    console.error(`[paymentController.updatePaymentStatus] ${err}`)
    res.status(500).json({ error: err.message })
  }
}

/**
 * Get payment analytics for a supplier.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const getPaymentAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params
    const { period = '30' } = req.query // days

    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string))

    // Get all bookings for this supplier
    const bookings = await Booking.find({ supplier: supplierId }).select('_id')
    const bookingIds = bookings.map(b => b._id)

    // Aggregate payment data
    const analytics = await Payment.aggregate([
      {
        $match: {
          booking: { $in: bookingIds },
          paymentDate: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          averagePayment: { $avg: '$amount' },
          paymentsByStatus: {
            $push: {
              status: '$status',
              amount: '$amount',
            },
          },
          paymentsByMethod: {
            $push: {
              method: '$paymentMethod',
              amount: '$amount',
            },
          },
        },
      },
    ])

    const result = analytics[0] || {
      totalRevenue: 0,
      totalPayments: 0,
      averagePayment: 0,
      paymentsByStatus: [],
      paymentsByMethod: [],
    }

    // Process status breakdown
    const statusBreakdown = result.paymentsByStatus.reduce((acc: any, payment: any) => {
      acc[payment.status] = (acc[payment.status] || 0) + payment.amount
      return acc
    }, {})

    // Process method breakdown
    const methodBreakdown = result.paymentsByMethod.reduce((acc: any, payment: any) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount
      return acc
    }, {})

    res.json({
      totalRevenue: result.totalRevenue,
      totalPayments: result.totalPayments,
      averagePayment: result.averagePayment,
      statusBreakdown,
      methodBreakdown,
      period: parseInt(period as string),
    })
  } catch (err: any) {
    console.error(`[paymentController.getPaymentAnalytics] ${err}`)
    res.status(500).json({ error: err.message })
  }
}

/**
 * Process a refund.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const processRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { refundAmount, reason } = req.body

    // Input validation
    if (typeof refundAmount !== 'number' || refundAmount <= 0) {
      res.status(400).json({ error: 'Refund amount must be a positive number' })
      return
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({ error: 'Refund reason is required' })
      return
    }

    const payment = await Payment.findById(id)
    if (!payment) {
      res.status(404).json({ error: 'Payment not found' })
      return
    }

    // Validate refund amount doesn't exceed payment amount
    if (refundAmount > payment.amount) {
      res.status(400).json({ error: 'Refund amount cannot exceed original payment amount' })
      return
    }

    if (payment.status === 'refunded') {
      res.status(400).json({ error: 'Payment already refunded' })
      return
    }

    // Create refund record
    const refund = new Payment({
      booking: payment.booking,
      amount: -Math.abs(refundAmount), // Negative amount for refund
      remainingAmount: payment.remainingAmount + refundAmount,
      totalAmount: payment.totalAmount,
      status: 'refunded',
      paymentMethod: payment.paymentMethod,
      transactionId: `REFUND-${payment.transactionId}`,
      paymentDate: new Date(),
      notes: `Refund: ${reason}`,
    })

    await refund.save()

    // Update original payment status
    await Payment.findByIdAndUpdate(id, { status: 'refunded' })

    // Update booking
    const booking = await Booking.findById(payment.booking)
    if (booking) {
      const newPaidAmount = Math.max(0, (booking.paidAmount || 0) - refundAmount)
      const newRemainingAmount = booking.price - newPaidAmount
      
      await Booking.findByIdAndUpdate(payment.booking, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus: newPaidAmount === 0 ? 'pending' : newRemainingAmount === 0 ? 'fully-paid' : 'partially-paid',
      })
    }

    res.json(refund)
  } catch (err: any) {
    console.error(`[paymentController.processRefund] ${err}`)
    res.status(500).json({ error: err.message })
  }
}
