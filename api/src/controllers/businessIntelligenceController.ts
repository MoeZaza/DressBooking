import { Request, Response } from 'express'
import mongoose from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import i18n from '../lang/i18n'
import * as logger from '../common/logger'
import DressMaintenance from '../models/DressMaintenance'
import CustomerInsight from '../models/CustomerInsight'
import Booking from '../models/Booking'
import Dress from '../models/Dress'


// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    type: string
  }
}

/**
 * Create dress maintenance record
 */
export const createMaintenance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { dress, type, description, cost, scheduledDate, priority, serviceProvider, notes, isRecurring, recurringInterval } = req.body
    const supplierId = req.user?.id

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    const maintenance = new DressMaintenance({
      dress: new mongoose.Types.ObjectId(dress),
      supplier: supplierId,
      type,
      description,
      cost: Number(cost),
      currency: 'ILS',
      scheduledDate: new Date(scheduledDate),
      priority: priority || 'medium',
      serviceProvider,
      notes,
      isRecurring: Boolean(isRecurring),
      recurringInterval: recurringInterval ? Number(recurringInterval) : undefined
    })

    await maintenance.save()
    res.status(200).json(maintenance)
  } catch (err) {
    logger.error(`[businessIntelligence.createMaintenance] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get maintenance records
 */
export const getMaintenanceRecords = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const { page = 1, size = 10, status, type, dress } = req.query

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    const query: any = { supplier: supplierId }

    if (status) {
      query.status = status
    }
    if (type) {
      query.type = type
    }
    if (dress) {
      query.dress = dress
    }

    const maintenanceRecords = await DressMaintenance.find(query)
      .populate('dress', 'name image')
      .sort({ scheduledDate: -1 })
      .skip((Number(page) - 1) * Number(size))
      .limit(Number(size))

    const total = await DressMaintenance.countDocuments(query)

    res.status(200).json({
      maintenanceRecords,
      total,
      page: Number(page),
      size: Number(size),
      totalPages: Math.ceil(total / Number(size))
    })
  } catch (err) {
    logger.error(`[businessIntelligence.getMaintenanceRecords] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update maintenance status
 */
export const updateMaintenanceStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, completedDate, afterImages, notes } = req.body
    const supplierId = req.user?.id

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    const maintenance = await DressMaintenance.findOneAndUpdate(
      { _id: id, supplier: supplierId },
      {
        status,
        completedDate: completedDate ? new Date(completedDate) : undefined,
        afterImages: afterImages || [],
        notes
      },
      { new: true }
    )

    if (!maintenance) {
      res.status(404).send('Maintenance record not found')
      return
    }

    res.status(200).json(maintenance)
  } catch (err) {
    logger.error(`[businessIntelligence.updateMaintenanceStatus] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get customer insights
 */
export const getCustomerInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const { page = 1, size = 10, sortBy = 'totalSpent', sortOrder = 'desc' } = req.query

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    const sortOptions: any = {}
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1

    const insights = await CustomerInsight.find({ supplier: supplierId })
      .populate('customer', 'fullName email phone')
      .sort(sortOptions)
      .skip((Number(page) - 1) * Number(size))
      .limit(Number(size))

    const total = await CustomerInsight.countDocuments({ supplier: supplierId })

    res.status(200).json({
      insights,
      total,
      page: Number(page),
      size: Number(size),
      totalPages: Math.ceil(total / Number(size))
    })
  } catch (err) {
    logger.error(`[businessIntelligence.getCustomerInsights] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update customer insights (automatically called when booking is created/updated)
 */
export const updateCustomerInsights = async (customerId: string, supplierId: string): Promise<void> => {
  try {
    // Get all bookings for this customer and supplier
    const bookings = await Booking.find({ customer: customerId, supplier: supplierId })
      .populate('dress', 'type size color')

    if (bookings.length === 0) {
      return
    }

    const totalBookings = bookings.length
    const totalSpent = bookings.reduce((sum, booking) => sum + (booking.price || 0), 0)
    const averageBookingValue = totalSpent / totalBookings

    const cancelledBookings = bookings.filter(b => b.status === bookcarsTypes.BookingStatus.Cancelled).length
    const cancellationRate = (cancelledBookings / totalBookings) * 100

    const ratings = bookings.filter(b => (b as any).rating).map(b => (b as any).rating!)
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0

    // Extract preferences
    const dressTypes = bookings.map(b => (b.dress as any)?.type).filter(Boolean)
    const sizes = bookings.map(b => (b.dress as any)?.size).filter(Boolean)
    const colors = bookings.map(b => (b.dress as any)?.color).filter(Boolean)

    const preferredDressTypes = [...new Set(dressTypes)]
    const preferredSizes = [...new Set(sizes)]
    const preferredColors = [...new Set(colors)]

    const firstBookingDate = bookings.reduce((earliest, booking) =>
      (booking as any).createdAt < earliest ? (booking as any).createdAt : earliest, (bookings[0] as any).createdAt)

    const lastBookingDate = bookings.reduce((latest, booking) =>
      (booking as any).createdAt > latest ? (booking as any).createdAt : latest, (bookings[0] as any).createdAt)

    // Calculate loyalty score (0-100)
    const daysSinceFirst = Math.floor((Date.now() - firstBookingDate.getTime()) / (1000 * 60 * 60 * 24))
    const bookingFrequency = totalBookings / Math.max(daysSinceFirst / 30, 1) // bookings per month
    const loyaltyScore = Math.min(100, Math.floor(
      (totalSpent / 1000) * 20 + // spending component
      bookingFrequency * 15 + // frequency component
      (100 - cancellationRate) * 0.3 + // reliability component
      averageRating * 10 // satisfaction component
    ))

    // Calculate risk score (0-100, higher = more risk)
    const daysSinceLastBooking = Math.floor((Date.now() - lastBookingDate.getTime()) / (1000 * 60 * 60 * 24))
    const riskScore = Math.min(100, Math.floor(
      cancellationRate * 0.5 + // cancellation risk
      Math.min(daysSinceLastBooking / 30, 50) + // inactivity risk
      (5 - averageRating) * 10 // dissatisfaction risk
    ))

    await CustomerInsight.findOneAndUpdate(
      { customer: customerId, supplier: supplierId },
      {
        totalBookings,
        totalSpent,
        averageBookingValue,
        preferredDressTypes,
        preferredSizes,
        preferredColors,
        firstBookingDate,
        lastBookingDate,
        customerLifetimeValue: totalSpent,
        loyaltyScore,
        riskScore,
        cancellationRate,
        averageRating,
        isVip: totalSpent > 5000 || loyaltyScore > 80
      },
      { upsert: true, new: true }
    )

    logger.info(`Customer insights updated for customer ${customerId}`)
  } catch (err) {
    logger.error('[businessIntelligence.updateCustomerInsights] Error updating customer insights:', err)
  }
}

/**
 * Get business intelligence summary
 */
export const getBusinessSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Maintenance summary
    const maintenanceSummary = await DressMaintenance.aggregate([
      { $match: { supplier: new mongoose.Types.ObjectId(supplierId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      }
    ])

    // Customer insights summary
    const customerSummary = await CustomerInsight.aggregate([
      { $match: { supplier: new mongoose.Types.ObjectId(supplierId) } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          vipCustomers: { $sum: { $cond: ['$isVip', 1, 0] } },
          averageLoyaltyScore: { $avg: '$loyaltyScore' },
          averageLifetimeValue: { $avg: '$customerLifetimeValue' },
          highRiskCustomers: { $sum: { $cond: [{ $gt: ['$riskScore', 70] }, 1, 0] } }
        }
      }
    ])

    // Dress utilization
    const dressUtilization = await Dress.aggregate([
      { $match: { supplier: new mongoose.Types.ObjectId(supplierId) } },
      {
        $lookup: {
          from: 'Booking',
          localField: '_id',
          foreignField: 'dress',
          as: 'bookings'
        }
      },
      {
        $addFields: {
          bookingCount: { $size: '$bookings' },
          utilizationRate: {
            $cond: [
              { $gt: [{ $size: '$bookings' }, 0] },
              { $divide: [{ $size: '$bookings' }, 365] }, // bookings per day
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalDresses: { $sum: 1 },
          activeDresses: { $sum: { $cond: [{ $gt: ['$bookingCount', 0] }, 1, 0] } },
          averageUtilization: { $avg: '$utilizationRate' }
        }
      }
    ])

    res.status(200).json({
      maintenance: maintenanceSummary,
      customers: customerSummary[0] || {},
      dresses: dressUtilization[0] || {}
    })
  } catch (err) {
    logger.error(`[businessIntelligence.getBusinessSummary] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
