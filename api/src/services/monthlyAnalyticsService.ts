import mongoose from 'mongoose'
import MonthlyAnalytics from '../models/MonthlyAnalytics'
import Booking from '../models/Booking'
import Revenue from '../models/Revenue'
import Expense from '../models/Expense'
import Dress from '../models/Dress'
// User model imported when needed
import Review from '../models/Review'
import InventoryItem from '../models/InventoryItem'
import * as logger from '../common/logger'

/**
 * Generate monthly analytics for a specific supplier and period
 */
export const generateMonthlyAnalytics = async (
  supplierId: string,
  year: number,
  month: number
): Promise<any> => {
  try {
    logger.info(`Generating monthly analytics for supplier ${supplierId}, ${year}-${month}`)

    // Define date range for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Get previous month for growth calculations
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1)
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999)

    // Parallel data fetching
    const [
      bookingData,
      revenueData,
      expenseData,
      dressData,
      customerData,
      reviewData,
      prevBookingData,
      prevRevenueData,
      prevCustomerData
    ] = await Promise.all([
      getBookingMetrics(supplierId, startDate, endDate),
      getRevenueMetrics(supplierId, startDate, endDate),
      getExpenseMetrics(supplierId, startDate, endDate),
      getDressMetrics(supplierId, startDate, endDate),
      getCustomerMetrics(supplierId, startDate, endDate),
      getReviewMetrics(supplierId, startDate, endDate),
      getBookingMetrics(supplierId, prevStartDate, prevEndDate),
      getRevenueMetrics(supplierId, prevStartDate, prevEndDate),
      getCustomerMetrics(supplierId, prevStartDate, prevEndDate)
    ])

    // Calculate growth metrics
    const revenueGrowth = calculateGrowth(revenueData.totalRevenue, prevRevenueData.totalRevenue)
    const bookingGrowth = calculateGrowth(bookingData.totalBookings, prevBookingData.totalBookings)
    const customerGrowth = calculateGrowth(customerData.totalCustomers, prevCustomerData.totalCustomers)

    // Calculate financial metrics
    const grossProfit = revenueData.totalRevenue - expenseData.totalExpenses
    const netProfit = grossProfit // Simplified for now
    const profitMargin = revenueData.totalRevenue > 0 ? (netProfit / revenueData.totalRevenue) * 100 : 0

    // Generate insights
    const insights = generateInsights({
      revenueGrowth,
      bookingGrowth,
      customerGrowth,
      profitMargin,
      cancellationRate: bookingData.cancellationRate,
      utilizationRate: dressData.utilizationRate,
      averageRating: reviewData.averageRating
    })

    // Create or update monthly analytics record
    const analyticsData = {
      supplier: new mongoose.Types.ObjectId(supplierId),
      year,
      month,
      
      // Revenue metrics
      totalRevenue: revenueData.totalRevenue,
      rentalRevenue: revenueData.rentalRevenue,
      serviceRevenue: revenueData.serviceRevenue,
      packageRevenue: revenueData.packageRevenue,
      averageBookingValue: revenueData.averageBookingValue,
      
      // Booking metrics
      totalBookings: bookingData.totalBookings,
      confirmedBookings: bookingData.confirmedBookings,
      cancelledBookings: bookingData.cancelledBookings,
      pendingBookings: bookingData.pendingBookings,
      cancellationRate: bookingData.cancellationRate,
      
      // Dress metrics
      totalDresses: dressData.totalDresses,
      activeDresses: dressData.activeDresses,
      rentedDresses: dressData.rentedDresses,
      maintenanceDresses: dressData.maintenanceDresses,
      utilizationRate: dressData.utilizationRate,
      
      // Customer metrics
      totalCustomers: customerData.totalCustomers,
      newCustomers: customerData.newCustomers,
      returningCustomers: customerData.returningCustomers,
      customerRetentionRate: customerData.retentionRate,
      averageCustomerRating: reviewData.averageRating,
      
      // Financial metrics
      totalExpenses: expenseData.totalExpenses,
      operatingExpenses: expenseData.operatingExpenses,
      maintenanceExpenses: expenseData.maintenanceExpenses,
      marketingExpenses: expenseData.marketingExpenses,
      administrativeExpenses: expenseData.administrativeExpenses,
      grossProfit,
      netProfit,
      profitMargin,
      
      // Performance metrics
      topPerformingDresses: dressData.topPerformers,
      topCustomers: customerData.topCustomers,
      categoryBreakdown: dressData.categoryBreakdown,
      sizeDistribution: dressData.sizeDistribution,
      weeklyTrends: bookingData.weeklyTrends,
      
      // Quality metrics
      averageDressRating: reviewData.averageRating,
      maintenanceIncidents: dressData.maintenanceIncidents,
      customerComplaints: reviewData.complaints,
      onTimeDeliveryRate: bookingData.onTimeDeliveryRate,
      
      // Growth metrics
      revenueGrowth,
      bookingGrowth,
      customerGrowth,
      
      // Insights
      insights
    }

    // Upsert the analytics record
    const analytics = await MonthlyAnalytics.findOneAndUpdate(
      { supplier: supplierId, year, month },
      analyticsData,
      { upsert: true, new: true }
    )

    logger.info(`Monthly analytics generated successfully for ${year}-${month}`)
    return analytics
  } catch (error) {
    logger.error(`Error generating monthly analytics: ${error}`)
    throw error
  }
}

/**
 * Get booking metrics for the period
 */
const getBookingMetrics = async (supplierId: string, startDate: Date, endDate: Date) => {
  const bookings = await Booking.aggregate([
    {
      $match: {
        supplier: new mongoose.Types.ObjectId(supplierId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        onTimeDeliveries: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'on-time'] }, 1, 0] } }
      }
    }
  ])

  const result = bookings[0] || {
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    onTimeDeliveries: 0
  }

  // Calculate rates
  result.cancellationRate = result.totalBookings > 0 ? (result.cancelledBookings / result.totalBookings) * 100 : 0
  result.onTimeDeliveryRate = result.totalBookings > 0 ? (result.onTimeDeliveries / result.totalBookings) * 100 : 100

  // Get weekly trends
  result.weeklyTrends = await getWeeklyTrends(supplierId, startDate, endDate)

  return result
}

/**
 * Get revenue metrics for the period
 */
const getRevenueMetrics = async (supplierId: string, startDate: Date, endDate: Date) => {
  const revenues = await Revenue.aggregate([
    {
      $match: {
        supplier: new mongoose.Types.ObjectId(supplierId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        rentalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'rental'] }, '$amount', 0] } },
        serviceRevenue: { $sum: { $cond: [{ $eq: ['$type', 'service'] }, '$amount', 0] } },
        packageRevenue: { $sum: { $cond: [{ $eq: ['$type', 'package'] }, '$amount', 0] } },
        count: { $sum: 1 }
      }
    }
  ])

  const result = revenues[0] || {
    totalRevenue: 0,
    rentalRevenue: 0,
    serviceRevenue: 0,
    packageRevenue: 0,
    count: 0
  }

  result.averageBookingValue = result.count > 0 ? result.totalRevenue / result.count : 0

  return result
}

/**
 * Get expense metrics for the period
 */
const getExpenseMetrics = async (supplierId: string, startDate: Date, endDate: Date) => {
  const expenses = await Expense.aggregate([
    {
      $match: {
        supplier: new mongoose.Types.ObjectId(supplierId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        operatingExpenses: { $sum: { $cond: [{ $eq: ['$category', 'operating'] }, '$amount', 0] } },
        maintenanceExpenses: { $sum: { $cond: [{ $eq: ['$category', 'maintenance'] }, '$amount', 0] } },
        marketingExpenses: { $sum: { $cond: [{ $eq: ['$category', 'marketing'] }, '$amount', 0] } },
        administrativeExpenses: { $sum: { $cond: [{ $eq: ['$category', 'administrative'] }, '$amount', 0] } }
      }
    }
  ])

  return expenses[0] || {
    totalExpenses: 0,
    operatingExpenses: 0,
    maintenanceExpenses: 0,
    marketingExpenses: 0,
    administrativeExpenses: 0
  }
}

/**
 * Get dress metrics for the period
 */
const getDressMetrics = async (supplierId: string, startDate: Date, endDate: Date) => {
  // Get total dresses
  const totalDresses = await Dress.countDocuments({ supplier: supplierId })
  const activeDresses = await Dress.countDocuments({ supplier: supplierId, available: true })

  // Get dress performance
  const dressPerformance = await Booking.aggregate([
    {
      $match: {
        supplier: new mongoose.Types.ObjectId(supplierId),
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['confirmed', 'completed'] }
      }
    },
    {
      $lookup: {
        from: 'dresses',
        localField: 'dress',
        foreignField: '_id',
        as: 'dressInfo'
      }
    },
    {
      $unwind: '$dressInfo'
    },
    {
      $group: {
        _id: {
          dressId: '$dress',
          dressName: '$dressInfo.name',
          category: '$dressInfo.type',
          size: '$dressInfo.size'
        },
        bookings: { $sum: 1 },
        revenue: { $sum: '$price' }
      }
    },
    {
      $sort: { revenue: -1 }
    }
  ])

  // Calculate metrics
  const rentedDresses = new Set(dressPerformance.map(d => d._id.dressId.toString())).size
  const utilizationRate = totalDresses > 0 ? (rentedDresses / totalDresses) * 100 : 0

  // Get top performers
  const topPerformers = dressPerformance.slice(0, 10).map(d => ({
    dressId: d._id.dressId,
    dressName: d._id.dressName,
    bookings: d.bookings,
    revenue: d.revenue
  }))

  // Get category breakdown
  const categoryBreakdown = await getCategoryBreakdown(dressPerformance)
  const sizeDistribution = await getSizeDistribution(dressPerformance, supplierId)

  // Get maintenance data from InventoryItem model
  const maintenanceData = await InventoryItem.aggregate([
    {
      $match: {
        supplier: new mongoose.Types.ObjectId(supplierId),
        status: 'maintenance'
      }
    },
    {
      $group: {
        _id: null,
        maintenanceDresses: { $sum: 1 },
        maintenanceIncidents: { $sum: { $size: '$maintenanceHistory' } }
      }
    }
  ])

  const maintenance = maintenanceData[0] || { maintenanceDresses: 0, maintenanceIncidents: 0 }

  return {
    totalDresses,
    activeDresses,
    rentedDresses,
    maintenanceDresses: maintenance.maintenanceDresses,
    utilizationRate,
    topPerformers,
    categoryBreakdown,
    sizeDistribution,
    maintenanceIncidents: maintenance.maintenanceIncidents
  }
}

/**
 * Calculate growth percentage
 */
const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

/**
 * Generate insights based on metrics
 */
const generateInsights = (metrics: any): any[] => {
  const insights = []

  // Revenue growth insight
  if (metrics.revenueGrowth > 20) {
    insights.push({
      type: 'trend',
      title: 'Strong Revenue Growth',
      description: `Revenue increased by ${metrics.revenueGrowth.toFixed(1)}% compared to last month`,
      impact: 'high',
      actionRequired: false
    })
  } else if (metrics.revenueGrowth < -10) {
    insights.push({
      type: 'alert',
      title: 'Revenue Decline',
      description: `Revenue decreased by ${Math.abs(metrics.revenueGrowth).toFixed(1)}% compared to last month`,
      impact: 'high',
      actionRequired: true
    })
  }

  // Cancellation rate insight
  if (metrics.cancellationRate > 15) {
    insights.push({
      type: 'warning',
      title: 'High Cancellation Rate',
      description: `Cancellation rate is ${metrics.cancellationRate.toFixed(1)}%, which is above the recommended 10%`,
      impact: 'medium',
      actionRequired: true
    })
  }

  // Utilization rate insight
  if (metrics.utilizationRate < 50) {
    insights.push({
      type: 'opportunity',
      title: 'Low Dress Utilization',
      description: `Only ${metrics.utilizationRate.toFixed(1)}% of dresses were rented this month`,
      impact: 'medium',
      actionRequired: true
    })
  }

  return insights
}

/**
 * Helper functions for detailed breakdowns
 */
const getWeeklyTrends = async (supplierId: string, startDate: Date, endDate: Date) => {
  try {
    const weeklyData = await Booking.aggregate([
      {
        $match: {
          supplier: new mongoose.Types.ObjectId(supplierId),
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['confirmed', 'completed', 'paid'] }
        }
      },
      {
        $addFields: {
          week: { $week: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$week',
          bookings: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ])

    return weeklyData.map(week => ({
      week: week._id,
      bookings: week.bookings,
      revenue: week.revenue
    }))
  } catch (error) {
    logger.error('Error getting weekly trends:', error)
    return []
  }
}

const getCategoryBreakdown = async (dressPerformance: any[]) => {
  const categories = new Map()
  
  dressPerformance.forEach(dress => {
    const category = dress._id.category
    if (!categories.has(category)) {
      categories.set(category, { bookings: 0, revenue: 0 })
    }
    const cat = categories.get(category)
    cat.bookings += dress.bookings
    cat.revenue += dress.revenue
  })

  return Array.from(categories.entries()).map(([category, data]) => ({
    category,
    bookings: data.bookings,
    revenue: data.revenue,
    averagePrice: data.bookings > 0 ? data.revenue / data.bookings : 0
  }))
}

const getSizeDistribution = async (dressPerformance: any[], supplierId: string) => {
  const sizes = new Map()

  dressPerformance.forEach(dress => {
    const size = dress._id.size
    if (!sizes.has(size)) {
      sizes.set(size, { bookings: 0, revenue: 0, dressIds: new Set() })
    }
    const sizeData = sizes.get(size)
    sizeData.bookings += dress.bookings
    sizeData.revenue += dress.revenue
    sizeData.dressIds.add(dress._id.dressId.toString())
  })

  // Get total dresses by size for utilization calculation
  const dressesBySize = await Dress.aggregate([
    {
      $match: { supplier: new mongoose.Types.ObjectId(supplierId) }
    },
    {
      $group: {
        _id: '$size',
        totalDresses: { $sum: 1 }
      }
    }
  ])

  const sizeMap = new Map(dressesBySize.map((item: any) => [item._id, item.totalDresses]))

  return Array.from(sizes.entries()).map(([size, data]) => {
    const totalDressesInSize = sizeMap.get(size) || 0
    const totalDressesInSizeNum = Number(totalDressesInSize) || 0
    const utilizationRate = totalDressesInSizeNum > 0
      ? (data.dressIds.size / totalDressesInSizeNum) * 100
      : 0

    return {
      size,
      bookings: data.bookings,
      revenue: data.revenue,
      utilizationRate: Math.round(utilizationRate * 100) / 100
    }
  })
}

const getCustomerMetrics = async (supplierId: string, startDate: Date, endDate: Date) => {
  try {
    // Get all customers who booked in this period
    const currentPeriodCustomers = await Booking.aggregate([
      {
        $match: {
          supplier: new mongoose.Types.ObjectId(supplierId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$customer',
          bookings: { $sum: 1 },
          totalSpent: { $sum: '$price' },
          firstBooking: { $min: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: '$customerInfo'
      }
    ])

    // Calculate new vs returning customers
    const newCustomers = currentPeriodCustomers.filter(customer =>
      customer.firstBooking >= startDate
    ).length

    const returningCustomers = currentPeriodCustomers.length - newCustomers

    // Get previous period for retention calculation
    const prevStartDate = new Date(startDate)
    prevStartDate.setMonth(prevStartDate.getMonth() - 1)
    const prevEndDate = new Date(endDate)
    prevEndDate.setMonth(prevEndDate.getMonth() - 1)

    const previousPeriodCustomers = await Booking.distinct('customer', {
      supplier: new mongoose.Types.ObjectId(supplierId),
      createdAt: { $gte: prevStartDate, $lte: prevEndDate }
    })

    const currentCustomerIds = currentPeriodCustomers.map(c => c._id.toString())
    const retainedCustomers = previousPeriodCustomers.filter(customerId =>
      currentCustomerIds.includes(customerId.toString())
    ).length

    const retentionRate = previousPeriodCustomers.length > 0
      ? (retainedCustomers / previousPeriodCustomers.length) * 100
      : 0

    // Get top customers
    const topCustomers = currentPeriodCustomers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(customer => ({
        customerId: customer._id,
        customerName: customer.customerInfo.fullName,
        bookings: customer.bookings,
        totalSpent: customer.totalSpent
      }))

    return {
      totalCustomers: currentPeriodCustomers.length,
      newCustomers,
      returningCustomers,
      retentionRate,
      topCustomers
    }
  } catch (error) {
    logger.error('Error getting customer metrics:', error)
    return {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      retentionRate: 0,
      topCustomers: []
    }
  }
}

const getReviewMetrics = async (supplierId: string, startDate: Date, endDate: Date) => {
  try {
    // Get reviews for dresses from this supplier in the period
    const reviewStats = await Review.aggregate([
      {
        $lookup: {
          from: 'dresses',
          localField: 'dress',
          foreignField: '_id',
          as: 'dressInfo'
        }
      },
      {
        $unwind: '$dressInfo'
      },
      {
        $match: {
          'dressInfo.supplier': new mongoose.Types.ObjectId(supplierId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          lowRatings: { $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] } }
        }
      }
    ])

    const stats = reviewStats[0] || { averageRating: 0, totalReviews: 0, lowRatings: 0 }

    return {
      averageRating: Math.round(stats.averageRating * 100) / 100 || 0,
      complaints: stats.lowRatings || 0
    }
  } catch (error) {
    logger.error('Error getting review metrics:', error)
    return {
      averageRating: 0,
      complaints: 0
    }
  }
}

// Export already done above
