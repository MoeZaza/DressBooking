import { Response } from 'express'
import mongoose from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'

import i18n from '../lang/i18n'
import * as logger from '../common/logger'
import * as helper from '../common/helper'
import Expense from '../models/Expense'
import Revenue from '../models/Revenue'
import Booking from '../models/Booking'
import Dress from '../models/Dress'
import InventoryItem from '../models/InventoryItem'
import MonthlyAnalytics from '../models/MonthlyAnalytics'
import * as monthlyAnalyticsService from '../services/monthlyAnalyticsService'
import { AuthenticatedRequest } from '../middlewares/roleAuth'

/**
 * Create expense record
 */
export const createExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, description, amount, currency, date, dress, receiptUrl, notes, isRecurring, recurringFrequency, tags } = req.body
    const supplierId = req.user?.id

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    if (!category || !description || !amount) {
      res.status(400).send('Category, description, and amount are required')
      return
    }

    const expense = new Expense({
      supplier: supplierId,
      category,
      description,
      amount: Number(amount),
      currency: currency || 'ILS',
      date: date ? new Date(date) : new Date(),
      dress: dress ? mongoose.Types.ObjectId.createFromHexString(dress) : undefined,
      receiptUrl,
      notes,
      isRecurring: Boolean(isRecurring),
      recurringFrequency,
      tags: tags || []
    })

    await expense.save()
    res.status(200).json(expense)
  } catch (err) {
    logger.error(`[accounting.createExpense] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get single expense by ID
 */
export const getExpenseById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const supplierId = req.user?.id

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    const expense = await Expense.findOne({ _id: id, supplier: supplierId })
      .populate('dress', 'name')

    if (!expense) {
      res.status(404).send('Expense not found')
      return
    }

    res.status(200).json(expense)
  } catch (err) {
    logger.error(`[accounting.getExpenseById] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update expense
 */
export const updateExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const supplierId = req.user?.id
    const updateData = req.body

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    const expense = await Expense.findOne({ _id: id, supplier: supplierId })

    if (!expense) {
      res.status(404).send('Expense not found')
      return
    }

    // Update expense fields
    Object.assign(expense, {
      ...updateData,
      amount: updateData.amount ? Number(updateData.amount) : expense.amount,
      date: updateData.date ? new Date(updateData.date) : expense.date,
      dress: updateData.dress ? mongoose.Types.ObjectId.createFromHexString(updateData.dress) : expense.dress,
      isRecurring: updateData.isRecurring !== undefined ? Boolean(updateData.isRecurring) : expense.isRecurring,
    })

    await expense.save()
    await expense.populate('dress', 'name')

    res.status(200).json(expense)
  } catch (err) {
    logger.error(`[accounting.updateExpense] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete expense
 */
export const deleteExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const supplierId = req.user?.id

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    const expense = await Expense.findOne({ _id: id, supplier: supplierId })

    if (!expense) {
      res.status(404).send('Expense not found')
      return
    }

    await Expense.findByIdAndDelete(id)
    res.status(200).json({ message: 'Expense deleted successfully' })
  } catch (err) {
    logger.error(`[accounting.deleteExpense] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get expenses for supplier
 */
export const getExpenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const userType = req.user?.type
    const { page = 1, size = 10, category, startDate, endDate, dress } = req.query

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Ensure only admin and suppliers can access expenses
    if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(userType as bookcarsTypes.UserType)) {
      res.status(403).json({ error: 'Access denied: Expense access requires admin or supplier privileges' })
      return
    }

    // Admin can see all expenses, suppliers only their own
    const isAdmin = userType === bookcarsTypes.UserType.Admin
    const query: any = isAdmin ? {} : { supplier: supplierId }

    if (category) {
      query.category = category
    }

    if (dress) {
      query.dress = dress
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        query.date.$gte = new Date(startDate as string)
      }
      if (endDate) {
        query.date.$lte = new Date(endDate as string)
      }
    }

    const expenses = await Expense.find(query)
      .populate('dress', 'name')
      .sort({ date: -1 })
      .skip((Number(page) - 1) * Number(size))
      .limit(Number(size))

    const total = await Expense.countDocuments(query)

    res.status(200).json({
      expenses,
      total,
      page: Number(page),
      size: Number(size),
      totalPages: Math.ceil(total / Number(size))
    })
  } catch (err) {
    logger.error(`[accounting.getExpenses] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Create revenue record (automatically called when booking is paid)
 */
export const createRevenue = async (bookingId: string, type: string = 'rental'): Promise<void> => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('dress')
      .populate('supplier')
      .populate('customer')

    if (!booking) {
      logger.error(`[accounting.createRevenue] Booking not found: ${bookingId}`)
      return
    }

    const revenue = new Revenue({
      supplier: booking.supplier,
      booking: booking._id,
      dress: booking.dress,
      customer: booking.customer,
      amount: booking.price || 0,
      currency: 'ILS',
      type,
      date: new Date(),
      paymentMethod: 'card', // Default, should be updated based on actual payment method
      notes: `Revenue from booking ${bookingId}`
    })

    await revenue.save()
    logger.info(`Revenue record created for booking ${bookingId}`)
  } catch (err) {
    logger.error('[accounting.createRevenue] Error creating revenue record:', err)
  }
}

/**
 * Get revenues for supplier
 */
export const getRevenues = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const { page = 1, size = 10, type, startDate, endDate, dress } = req.query

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Validate ObjectId
    if (!helper.isValidObjectId(supplierId)) {
      res.status(400).json({ error: 'Invalid supplier ID format' })
      return
    }

    const query: any = { supplier: supplierId }

    if (type) {
      query.type = type
    }

    if (dress) {
      query.dress = dress
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        query.date.$gte = new Date(startDate as string)
      }
      if (endDate) {
        query.date.$lte = new Date(endDate as string)
      }
    }

    const revenues = await Revenue.find(query)
      .populate('dress', 'name')
      .populate('customer', 'fullName email')
      .populate('booking', 'from to')
      .sort({ date: -1 })
      .skip((Number(page) - 1) * Number(size))
      .limit(Number(size))

    const total = await Revenue.countDocuments(query)

    res.status(200).json({
      revenues,
      total,
      page: Number(page),
      size: Number(size),
      totalPages: Math.ceil(total / Number(size))
    })
  } catch (err) {
    logger.error(`[accounting.getRevenues] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get financial summary for supplier
 */
export const getFinancialSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const userType = req.user?.type
    const { startDate, endDate } = req.query

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Ensure only admin and suppliers can access financial data
    if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(userType as bookcarsTypes.UserType)) {
      res.status(403).json({ error: 'Access denied: Financial data access requires admin or supplier privileges' })
      return
    }

    const dateFilter: any = {}
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string)
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string)
    }

    // Admin can see all data, suppliers only their own
    const isAdmin = userType === bookcarsTypes.UserType.Admin
    const supplierFilter = isAdmin ? {} : { supplier: mongoose.Types.ObjectId.createFromHexString(supplierId) }

    // Get total revenue
    const revenueAgg = await Revenue.aggregate([
      { $match: { ...supplierFilter, ...(Object.keys(dateFilter).length && { date: dateFilter }) } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])

    // Get total expenses
    const expenseAgg = await Expense.aggregate([
      { $match: { ...supplierFilter, ...(Object.keys(dateFilter).length && { date: dateFilter }) } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])

    // Get revenue by category
    const revenueByType = await Revenue.aggregate([
      { $match: { ...supplierFilter, ...(Object.keys(dateFilter).length && { date: dateFilter }) } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])

    // Get expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: { ...supplierFilter, ...(Object.keys(dateFilter).length && { date: dateFilter }) } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])

    const totalRevenue = revenueAgg[0]?.total || 0
    const totalExpenses = expenseAgg[0]?.total || 0
    const netProfit = totalRevenue - totalExpenses

    res.status(200).json({
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        revenueCount: revenueAgg[0]?.count || 0,
        expenseCount: expenseAgg[0]?.count || 0
      },
      revenueByType,
      expensesByCategory
    })
  } catch (err) {
    logger.error(`[accounting.getFinancialSummary] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get monthly financial report
 */
export const getMonthlyReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const { year = new Date().getFullYear() } = req.query

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Validate ObjectId
    if (!helper.isValidObjectId(supplierId)) {
      res.status(400).json({ error: 'Invalid supplier ID format' })
      return
    }

    const startDate = new Date(Number(year), 0, 1)
    const endDate = new Date(Number(year), 11, 31)

    // Monthly revenue
    const monthlyRevenue = await Revenue.aggregate([
      {
        $match: {
          supplier: new mongoose.Types.ObjectId(supplierId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ])

    // Monthly expenses
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          supplier: new mongoose.Types.ObjectId(supplierId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ])

    res.status(200).json({
      year: Number(year),
      monthlyRevenue,
      monthlyExpenses
    })
  } catch (err) {
    logger.error(`[accounting.getMonthlyReport] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get comprehensive inventory analytics
 */
export const getInventoryAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const { startDate, endDate } = req.query

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Validate ObjectId
    if (!helper.isValidObjectId(supplierId)) {
      res.status(400).json({ error: 'Invalid supplier ID format' })
      return
    }

    const dateFilter: any = {}
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string)
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string)
    }

    // Get inventory summary
    const inventorySummary = await InventoryItem.getInventorySummary(supplierId)

    // Get dress performance metrics
    const dressPerformance = await Dress.aggregate([
      { $match: { supplier: mongoose.Types.ObjectId.createFromHexString(supplierId) } },
      {
        $lookup: {
          from: 'inventoryitems',
          localField: '_id',
          foreignField: 'dress',
          as: 'inventory'
        }
      },
      {
        $addFields: {
          inventoryData: { $arrayElemAt: ['$inventory', 0] }
        }
      },
      {
        $project: {
          name: 1,
          type: 1,
          size: 1,
          color: 1,
          price: 1,
          bookingCount: 1,
          totalRevenue: 1,
          rating: 1,
          condition: '$inventoryData.condition',
          status: '$inventoryData.status',
          roi: '$inventoryData.roi',
          maintenanceCost: {
            $sum: '$inventoryData.maintenanceHistory.cost'
          },
          lastRental: {
            $max: '$inventoryData.rentalHistory.endDate'
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])

    // Get maintenance alerts
    const maintenanceAlerts = await InventoryItem.find({
      supplier: mongoose.Types.ObjectId.createFromHexString(supplierId),
      'alerts.resolved': false
    })
    .populate('dress', 'name type')
    .select('dress alerts condition status')

    // Get revenue trends by category
    const categoryRevenue = await Revenue.aggregate([
      {
        $match: {
          supplier: mongoose.Types.ObjectId.createFromHexString(supplierId),
          ...(Object.keys(dateFilter).length && { date: dateFilter })
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
        $addFields: {
          dressType: { $arrayElemAt: ['$dressInfo.type', 0] }
        }
      },
      {
        $group: {
          _id: '$dressType',
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 },
          averageRevenue: { $avg: '$amount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])

    // Get monthly revenue trends
    const monthlyTrends = await Revenue.aggregate([
      {
        $match: {
          supplier: mongoose.Types.ObjectId.createFromHexString(supplierId),
          ...(Object.keys(dateFilter).length && { date: dateFilter })
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    const analytics = {
      inventorySummary: inventorySummary[0] || {},
      dressPerformance,
      maintenanceAlerts,
      categoryRevenue,
      monthlyTrends,
      summary: {
        totalDresses: dressPerformance.length,
        activeAlerts: maintenanceAlerts.length,
        topPerformer: dressPerformance[0] || null,
        averageROI: dressPerformance.reduce((sum: number, dress: any) => sum + (dress.roi || 0), 0) / dressPerformance.length || 0
      }
    }

    res.json(analytics)
  } catch (err: any) {
    logger.error(`[accounting.getInventoryAnalytics] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Create or update inventory item
 */
export const updateInventoryItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const { dressId } = req.params
    const inventoryData = req.body

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Check if dress belongs to supplier
    const dress = await Dress.findOne({ _id: dressId, supplier: supplierId })
    if (!dress) {
      res.status(404).send('Dress not found or access denied')
      return
    }

    // Find or create inventory item
    let inventoryItem = await InventoryItem.findOne({ dress: dressId, supplier: supplierId })

    if (inventoryItem) {
      // Update existing item
      Object.assign(inventoryItem, inventoryData)
      await inventoryItem.save()
    } else {
      // Create new inventory item
      inventoryItem = new InventoryItem({
        dress: dressId,
        supplier: supplierId,
        ...inventoryData
      })
      await inventoryItem.save()
    }

    await inventoryItem.populate('dress', 'name type size color')
    res.json(inventoryItem)
  } catch (err: any) {
    logger.error(`[accounting.updateInventoryItem] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Add maintenance record to inventory item
 */
export const addMaintenanceRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const { dressId } = req.params
    const maintenanceData = req.body

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    const inventoryItem = await InventoryItem.findOne({
      dress: dressId,
      supplier: supplierId
    })

    if (!inventoryItem) {
      res.status(404).send('Inventory item not found')
      return
    }

    // Add maintenance record
    inventoryItem.maintenanceHistory.push({
      date: new Date(),
      type: maintenanceData.type,
      description: maintenanceData.description,
      cost: maintenanceData.cost,
      performedBy: maintenanceData.performedBy,
      nextMaintenanceDate: maintenanceData.nextMaintenanceDate
    })

    // Update condition if provided
    if (maintenanceData.newCondition) {
      inventoryItem.condition = maintenanceData.newCondition
    }

    await inventoryItem.save()
    await inventoryItem.populate('dress', 'name type')

    res.json(inventoryItem)
  } catch (err: any) {
    logger.error(`[accounting.addMaintenanceRecord] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get profit and loss statement
 */
export const getProfitLossStatement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const { startDate, endDate } = req.query

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    // Validate ObjectId
    if (!helper.isValidObjectId(supplierId)) {
      res.status(400).json({ error: 'Invalid supplier ID format' })
      return
    }

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1)
    const end = endDate ? new Date(endDate as string) : new Date()

    // Get revenues
    const revenues = await Revenue.aggregate([
      {
        $match: {
          supplier: mongoose.Types.ObjectId.createFromHexString(supplierId),
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          rentalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'rental'] }, '$amount', 0] } },
          serviceRevenue: { $sum: { $cond: [{ $eq: ['$type', 'service'] }, '$amount', 0] } },
          packageRevenue: { $sum: { $cond: [{ $eq: ['$type', 'package'] }, '$amount', 0] } }
        }
      }
    ])

    // Get expenses
    const expenses = await Expense.aggregate([
      {
        $match: {
          supplier: mongoose.Types.ObjectId.createFromHexString(supplierId),
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          operatingExpenses: { $sum: { $cond: [{ $eq: ['$category', 'operating'] }, '$amount', 0] } },
          maintenanceExpenses: { $sum: { $cond: [{ $eq: ['$category', 'maintenance'] }, '$amount', 0] } },
          marketingExpenses: { $sum: { $cond: [{ $eq: ['$category', 'marketing'] }, '$amount', 0] } },
          adminExpenses: { $sum: { $cond: [{ $eq: ['$category', 'administrative'] }, '$amount', 0] } }
        }
      }
    ])

    const revenueData = revenues[0] || { totalRevenue: 0, rentalRevenue: 0, serviceRevenue: 0, packageRevenue: 0 }
    const expenseData = expenses[0] || { totalExpenses: 0, operatingExpenses: 0, maintenanceExpenses: 0, marketingExpenses: 0, adminExpenses: 0 }

    const grossProfit = revenueData.totalRevenue - expenseData.totalExpenses
    const profitMargin = revenueData.totalRevenue > 0 ? (grossProfit / revenueData.totalRevenue) * 100 : 0

    const statement = {
      period: { start, end },
      revenue: revenueData,
      expenses: expenseData,
      grossProfit,
      profitMargin,
      summary: {
        totalRevenue: revenueData.totalRevenue,
        totalExpenses: expenseData.totalExpenses,
        netProfit: grossProfit,
        profitMargin: Math.round(profitMargin * 100) / 100
      }
    }

    res.json(statement)
  } catch (err: any) {
    logger.error(`[accounting.getProfitLossStatement] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get monthly analytics for a specific year
 */
export const getMonthlyAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const { year } = req.params

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    const analytics = await MonthlyAnalytics.getYearToDateAnalytics(supplierId, parseInt(year))
    res.json(analytics)
  } catch (err: any) {
    logger.error(`[accounting.getMonthlyAnalytics] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Generate monthly analytics for a specific period
 */
export const generateMonthlyAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.user?.id
    const { year, month } = req.params

    if (!supplierId) {
      res.status(401).send('Unauthorized')
      return
    }

    const analytics = await monthlyAnalyticsService.generateMonthlyAnalytics(
      supplierId,
      parseInt(year),
      parseInt(month)
    )

    res.json(analytics)
  } catch (err: any) {
    logger.error(`[accounting.generateMonthlyAnalytics] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
