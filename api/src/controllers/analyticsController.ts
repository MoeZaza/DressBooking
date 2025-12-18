import { Response } from 'express'
import * as bookcarsTypes from ':bookcars-types'
import i18n from '../lang/i18n'
import * as logger from '../common/logger'
import Booking from '../models/Booking'
import Dress from '../models/Dress'
import Revenue from '../models/Revenue'
import Expense from '../models/Expense'
import User from '../models/User'
import { AuthenticatedRequest } from '../middlewares/roleAuth'

/**
 * Get comprehensive dashboard analytics
 */
export const getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const userType = req.user?.type

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Ensure only admin and suppliers can access analytics
    if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(userType as bookcarsTypes.UserType)) {
      res.status(403).json({ error: 'Access denied: Analytics access requires admin or supplier privileges' })
      return
    }

    const isAdmin = userType === bookcarsTypes.UserType.Admin
    const supplierFilter = isAdmin ? {} : { supplier: supplierId }

    // Current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Previous month for comparison
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Total dresses
    const totalDresses = await Dress.countDocuments(supplierFilter)

    // Available dresses
    const availableDresses = await Dress.countDocuments({ ...supplierFilter, available: true })

    // Current month bookings
    const currentMonthBookings = await Booking.countDocuments({
      ...supplierFilter,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    })

    // Previous month bookings for comparison
    const prevMonthBookings = await Booking.countDocuments({
      ...supplierFilter,
      createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
    })

    // Current month cancellations
    const currentMonthCancellations = await Booking.countDocuments({
      ...supplierFilter,
      status: bookcarsTypes.BookingStatus.Cancelled,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    })

    // Current month revenue
    const currentMonthRevenue = await Revenue.aggregate([
      {
        $match: {
          ...supplierFilter,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])

    // Previous month revenue
    const prevMonthRevenue = await Revenue.aggregate([
      {
        $match: {
          ...supplierFilter,
          date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])

    // Current month expenses
    const currentMonthExpenses = await Expense.aggregate([
      {
        $match: {
          ...supplierFilter,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])

    // Top performing dresses
    const topDresses = await Booking.aggregate([
      { $match: supplierFilter },
      { $group: { _id: '$dress', bookingCount: { $sum: 1 }, totalRevenue: { $sum: '$price' } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'Dress',
          localField: '_id',
          foreignField: '_id',
          as: 'dressInfo'
        }
      },
      { $unwind: '$dressInfo' }
    ])

    // Recent bookings
    const recentBookings = await Booking.find(supplierFilter)
      .populate('dress', 'name image')
      .populate('customer', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(10)

    // Customer insights
    const totalCustomers = await User.countDocuments({ type: bookcarsTypes.UserType.User })
    const repeatCustomers = await Booking.aggregate([
      { $match: supplierFilter },
      { $group: { _id: '$customer', bookingCount: { $sum: 1 } } },
      { $match: { bookingCount: { $gt: 1 } } },
      { $count: 'repeatCustomers' }
    ])

    const currentRevenue = currentMonthRevenue[0]?.total || 0
    const prevRevenue = prevMonthRevenue[0]?.total || 0
    const currentExpenses = currentMonthExpenses[0]?.total || 0

    const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0
    const bookingGrowth = prevMonthBookings > 0 ? ((currentMonthBookings - prevMonthBookings) / prevMonthBookings) * 100 : 0

    res.status(200).json({
      overview: {
        totalDresses,
        availableDresses,
        totalCustomers,
        repeatCustomers: repeatCustomers[0]?.repeatCustomers || 0
      },
      currentMonth: {
        bookings: currentMonthBookings,
        cancellations: currentMonthCancellations,
        revenue: currentRevenue,
        expenses: currentExpenses,
        netProfit: currentRevenue - currentExpenses
      },
      growth: {
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        bookingGrowth: Math.round(bookingGrowth * 100) / 100,
        cancellationRate: currentMonthBookings > 0 ? Math.round((currentMonthCancellations / currentMonthBookings) * 100) : 0
      },
      topDresses,
      recentBookings
    })
  } catch (err) {
    logger.error(`[analytics.getDashboardAnalytics] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get monthly analytics data
 */
export const getMonthlyAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const userType = req.user?.type
    const { year = new Date().getFullYear(), months = 12 } = req.query

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Ensure only admin and suppliers can access analytics
    if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(userType as bookcarsTypes.UserType)) {
      res.status(403).json({ error: 'Access denied: Analytics access requires admin or supplier privileges' })
      return
    }

    const isAdmin = userType === bookcarsTypes.UserType.Admin
    const supplierFilter = isAdmin ? {} : { supplier: supplierId }

    const startDate = new Date(Number(year), 0, 1)
    const endDate = new Date(Number(year), Number(months), 0)

    // Monthly bookings
    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          ...supplierFilter,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: 1 },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$status', bookcarsTypes.BookingStatus.Cancelled] }, 1, 0]
            }
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', bookcarsTypes.BookingStatus.Paid] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    // Monthly revenue
    const monthlyRevenue = await Revenue.aggregate([
      {
        $match: {
          ...supplierFilter,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    // Monthly expenses
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          ...supplierFilter,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    res.status(200).json({
      year: Number(year),
      monthlyBookings,
      monthlyRevenue,
      monthlyExpenses
    })
  } catch (err) {
    logger.error(`[analytics.getMonthlyAnalytics] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get dress performance analytics
 */
export const getDressAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const userType = req.user?.type

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Ensure only admin and suppliers can access analytics
    if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(userType as bookcarsTypes.UserType)) {
      res.status(403).json({ error: 'Access denied: Analytics access requires admin or supplier privileges' })
      return
    }

    const isAdmin = userType === bookcarsTypes.UserType.Admin
    const supplierFilter = isAdmin ? {} : { supplier: supplierId }

    // Dress performance by bookings
    const dressPerformance = await Booking.aggregate([
      { $match: supplierFilter },
      {
        $group: {
          _id: '$dress',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          averageRating: { $avg: '$rating' },
          lastBooked: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'Dress',
          localField: '_id',
          foreignField: '_id',
          as: 'dressInfo'
        }
      },
      { $unwind: '$dressInfo' },
      { $sort: { totalBookings: -1 } }
    ])

    // Dress utilization rate
    const totalDresses = await Dress.countDocuments(supplierFilter)
    const bookedDresses = await Booking.distinct('dress', supplierFilter)
    const utilizationRate = totalDresses > 0 ? (bookedDresses.length / totalDresses) * 100 : 0

    // Most popular dress categories
    const categoryPerformance = await Booking.aggregate([
      { $match: supplierFilter },
      {
        $lookup: {
          from: 'Dress',
          localField: 'dress',
          foreignField: '_id',
          as: 'dressInfo'
        }
      },
      { $unwind: '$dressInfo' },
      {
        $group: {
          _id: '$dressInfo.type',
          bookings: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { bookings: -1 } }
    ])

    res.status(200).json({
      dressPerformance,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      categoryPerformance,
      totalDresses,
      activeDresses: bookedDresses.length
    })
  } catch (err) {
    logger.error(`[analytics.getDressAnalytics] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
