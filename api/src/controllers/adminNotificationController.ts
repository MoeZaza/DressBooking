import mongoose from 'mongoose'
import { Request, Response } from 'express'
import i18n from '../lang/i18n'
import Notification from '../models/Notification'
import NotificationCounter from '../models/NotificationCounter'
import User from '../models/User'
import * as logger from '../common/logger'
import * as bookcarsTypes from ':bookcars-types'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    type: string
  }
}

/**
 * Get admin notifications with filtering and pagination.
 *
 * @export
 * @async
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getAdminNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category, 
      priority, 
      isRead 
    } = req.query

    // Verify admin access
    if (req.user?.type !== bookcarsTypes.UserType.Admin) {
      res.status(403).send('Admin access required')
      return
    }

    const pageNum = Number.parseInt(page as string, 10)
    const limitNum = Number.parseInt(limit as string, 10)

    // Build filter for admin notifications
    const filter: any = {
      $or: [
        { user: new mongoose.Types.ObjectId(userId) }, // Direct admin notifications
        { type: { $in: ['system', 'booking', 'payment', 'review'] } } // System-wide notifications
      ]
    }
    
    if (type) {
      filter.type = type
    }
    if (category) {
      filter.category = category
    }
    if (priority) {
      filter.priority = priority
    }
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true'
    }

    const notifications = await Notification.find(filter)
      .populate('booking', 'customer dress from to status')
      .populate('dress', 'name supplier')
      .populate('user', 'fullName email')
      .sort({ priority: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()

    const total = await Notification.countDocuments(filter)
    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false
    })

    res.json({
      notifications,
      unreadCount,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    })
  } catch (err: any) {
    logger.error(`[adminNotification.getAdminNotifications] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get admin notification statistics.
 *
 * @export
 * @async
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getAdminNotificationStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params

    if (req.user?.type !== bookcarsTypes.UserType.Admin) {
      res.status(403).send('Admin access required')
      return
    }

    const filter = {
      $or: [
        { user: new mongoose.Types.ObjectId(userId) },
        { type: { $in: ['system', 'booking', 'payment', 'review'] } }
      ]
    }

    const stats = await Notification.aggregate([
      { $match: filter },
      {
        $facet: {
          total: [{ $count: 'count' }],
          unread: [
            { $match: { isRead: false } },
            { $count: 'count' }
          ],
          byType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 }
              }
            }
          ],
          byPriority: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 }
              }
            }
          ],
          recentActivity: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ]
        }
      }
    ])

    const result = stats[0]
    
    res.json({
      totalNotifications: result.total[0]?.count || 0,
      unreadCount: result.unread[0]?.count || 0,
      byType: result.byType.reduce((acc: any, item: any) => {
        acc[item._id] = item.count
        return acc
      }, {}),
      byPriority: result.byPriority.reduce((acc: any, item: any) => {
        acc[item._id] = item.count
        return acc
      }, {}),
      recentActivity: result.recentActivity.map((item: any) => ({
        date: item._id,
        count: item.count
      }))
    })
  } catch (err: any) {
    logger.error(`[adminNotification.getAdminNotificationStats] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Mark admin notification as read.
 *
 * @export
 * @async
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {unknown}
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params

    if (req.user?.type !== bookcarsTypes.UserType.Admin) {
      res.status(403).send('Admin access required')
      return
    }

    await Notification.findByIdAndUpdate(notificationId, { isRead: true })
    res.status(200).send('Notification marked as read')
  } catch (err: any) {
    logger.error(`[adminNotification.markAsRead] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Mark all admin notifications as read.
 *
 * @export
 * @async
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {unknown}
 */
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params

    if (req.user?.type !== bookcarsTypes.UserType.Admin) {
      res.status(403).send('Admin access required')
      return
    }

    const filter = {
      $or: [
        { user: new mongoose.Types.ObjectId(userId) },
        { type: { $in: ['system', 'booking', 'payment', 'review'] } }
      ],
      isRead: false
    }

    await Notification.updateMany(filter, { isRead: true })
    res.status(200).send('All notifications marked as read')
  } catch (err: any) {
    logger.error(`[adminNotification.markAllAsRead] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete admin notification.
 *
 * @export
 * @async
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params

    if (req.user?.type !== bookcarsTypes.UserType.Admin) {
      res.status(403).send('Admin access required')
      return
    }

    await Notification.findByIdAndDelete(notificationId)
    res.status(200).send('Notification deleted')
  } catch (err: any) {
    logger.error(`[adminNotification.deleteNotification] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Create admin notification.
 *
 * @export
 * @async
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {unknown}
 */
export const createAdminNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      message,
      type,
      category = 'info',
      priority = 'medium',
      actionUrl,
      actionText,
      bookingId,
      dressId
    } = req.body

    if (req.user?.type !== bookcarsTypes.UserType.Admin) {
      res.status(403).send('Admin access required')
      return
    }

    // Get all admin users
    const adminUsers = await User.find({ type: bookcarsTypes.UserType.Admin }).select('_id')

    // Create notifications for all admins
    const notifications = adminUsers.map(admin => ({
      user: admin._id,
      title,
      message,
      type,
      category,
      priority,
      actionUrl,
      actionText,
      booking: bookingId ? new mongoose.Types.ObjectId(bookingId) : undefined,
      dress: dressId ? new mongoose.Types.ObjectId(dressId) : undefined,
      isRead: false
    }))

    const result = await Notification.insertMany(notifications)
    
    // Update notification counters
    for (const admin of adminUsers) {
      const counter = await NotificationCounter.findOne({ user: admin._id })
      if (counter) {
        counter.count = (counter.count || 0) + 1
        await counter.save()
      } else {
        const newCounter = new NotificationCounter({ user: admin._id, count: 1 })
        await newCounter.save()
      }
    }

    res.json(result[0])
  } catch (err: any) {
    logger.error(`[adminNotification.createAdminNotification] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get real-time admin notifications.
 *
 * @export
 * @async
 * @param {AuthenticatedRequest} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getRealtimeNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const { since } = req.query

    if (req.user?.type !== bookcarsTypes.UserType.Admin) {
      res.status(403).send('Admin access required')
      return
    }

    const filter: any = {
      $or: [
        { user: new mongoose.Types.ObjectId(userId) },
        { type: { $in: ['system', 'booking', 'payment', 'review'] } }
      ]
    }

    if (since) {
      filter.createdAt = { $gt: new Date(since as string) }
    }

    const notifications = await Notification.find(filter)
      .populate('booking', 'customer dress from to status')
      .populate('dress', 'name supplier')
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    res.json(notifications)
  } catch (err: any) {
    logger.error(`[adminNotification.getRealtimeNotifications] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
