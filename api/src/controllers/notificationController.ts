import mongoose from 'mongoose'
import { Request, Response } from 'express'
import i18n from '../lang/i18n'
import Notification from '../models/Notification'
import NotificationCounter from '../models/NotificationCounter'
import EmailNotificationService from '../services/EmailNotificationService'
import SmsNotificationService from '../services/SmsNotificationService'
import * as logger from '../common/logger'


/**
 * Get NotificationCounter by UserID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const notificationCounter = async (req: Request, res: Response) => {
  const { userId } = req.params
  try {
    const counter = await NotificationCounter.findOne({ user: userId })

    if (counter) {
      res.json(counter)
      return
    }
    const cnt = new NotificationCounter({ user: userId })
    await cnt.save()
    res.json(cnt)
  } catch (err) {
    logger.error(`[notification.notificationCounter] ${i18n.t('DB_ERROR')} ${userId}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Get Notifications by UserID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getNotifications = async (req: Request, res: Response) => {
  const { userId: _userId, page: _page, size: _size } = req.params

  try {
    const userId = new mongoose.Types.ObjectId(_userId)
    const page = Number.parseInt(_page, 10)
    const size = Number.parseInt(_size, 10)

    const notifications = await Notification.aggregate([
      { $match: { user: userId } },
      {
        $facet: {
          resultData: [{ $sort: { createdAt: -1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
          pageInfo: [
            {
              $count: 'totalRecords',
            },
          ],
        },
      },
    ])

    res.json(notifications)
  } catch (err) {
    logger.error(`[notification.getNotifications] ${i18n.t('DB_ERROR')} ${_userId}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Mark Notifications as read.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { body }: { body: { ids: string[] } } = req
    const { ids: _ids } = body

    // Validate ObjectId formats
    const validIds = _ids.filter(id => mongoose.Types.ObjectId.isValid(id))
    if (validIds.length !== _ids.length) {
      res.status(400).send(i18n.t('INVALID_ID'))
      return
    }

    const ids = validIds.map((id) => new mongoose.Types.ObjectId(id))
    const { userId: _userId } = req.params

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(_userId)) {
      res.status(400).send(i18n.t('INVALID_ID'))
      return
    }

    const userId = new mongoose.Types.ObjectId(_userId)

    const notifications = await Notification.find({
      _id: { $in: ids },
      isRead: false,
    })
    const { length } = notifications

    // Use bulkWrite instead of deprecated initializeOrderedBulkOp
    if (length > 0) {
      const bulkOps = ids.map(id => ({
        updateOne: {
          filter: { _id: id, isRead: false },
          update: { $set: { isRead: true } }
        }
      }))
      await Notification.bulkWrite(bulkOps)
    }

    const counter = await NotificationCounter.findOne({ user: userId })
    if (!counter || typeof counter.count === 'undefined') {
      res.json({ success: true, modifiedCount: length })
      return
    }
    counter.count -= length
    await counter.save()

    res.json({ success: true, modifiedCount: length })
  } catch (err) {
    logger.error(`[notification.markAsRead] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Mark Notifications as unread.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const markAsUnRead = async (req: Request, res: Response) => {
  try {
    const { body }: { body: { ids: string[] } } = req
    const { ids: _ids } = body

    // Validate ObjectId formats
    const validIds = _ids.filter(id => mongoose.Types.ObjectId.isValid(id))
    if (validIds.length !== _ids.length) {
      res.status(400).send(i18n.t('INVALID_ID'))
      return
    }

    const ids = validIds.map((id) => new mongoose.Types.ObjectId(id))
    const { userId: _userId } = req.params

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(_userId)) {
      res.status(400).send(i18n.t('INVALID_ID'))
      return
    }

    const userId = new mongoose.Types.ObjectId(_userId)

    const notifications = await Notification.find({
      _id: { $in: ids },
      isRead: true,
    })
    const { length } = notifications

    // Use bulkWrite instead of deprecated initializeOrderedBulkOp
    if (length > 0) {
      const bulkOps = ids.map(id => ({
        updateOne: {
          filter: { _id: id, isRead: true },
          update: { $set: { isRead: false } }
        }
      }))
      await Notification.bulkWrite(bulkOps)
    }

    const counter = await NotificationCounter.findOne({ user: userId })
    if (!counter || typeof counter.count === 'undefined') {
      res.json({ success: true, modifiedCount: length })
      return
    }
    counter.count += length
    await counter.save()

    res.json({ success: true, modifiedCount: length })
  } catch (err) {
    logger.error(`[notification.markAsUnRead] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete Notifications.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteNotifications = async (req: Request, res: Response) => {
  try {
    const { body }: { body: { ids: string[] } } = req
    const { ids: _ids } = body

    // Validate ObjectId formats
    const validIds = _ids.filter(id => mongoose.Types.ObjectId.isValid(id))
    if (validIds.length !== _ids.length) {
      res.status(400).send(i18n.t('INVALID_ID'))
      return
    }

    const ids = validIds.map((id) => new mongoose.Types.ObjectId(id))
    const { userId: _userId } = req.params

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(_userId)) {
      res.status(400).send(i18n.t('INVALID_ID'))
      return
    }

    const userId = new mongoose.Types.ObjectId(_userId)

    const count = await Notification
      .find({ _id: { $in: ids }, isRead: false })
      .countDocuments()

    await Notification.deleteMany({ _id: { $in: ids } })

    const counter = await NotificationCounter.findOne({ user: userId })
    if (!counter || typeof counter.count === 'undefined') {
      res.json({ success: true, deletedCount: count })
      return
    }
    counter.count -= count
    await counter.save()

    res.json({ success: true, deletedCount: count })
  } catch (err) {
    logger.error(`[notification.deleteNotifications] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Create notification for booking status change.
 *
 * @export
 * @async
 * @param {string} userId
 * @param {string} bookingId
 * @param {string} status
 * @param {string} dressName
 * @param {string} supplierName
 * @param {string} supplierId
 * @returns {Promise<void>}
 */
export const createBookingStatusNotification = async (
  userId: string,
  bookingId: string,
  status: string,
  dressName: string,
  supplierName?: string,
  supplierId?: string
): Promise<void> => {
  try {
    const supplierInfo = supplierName ? ` from ${supplierName}` : ''

    const statusConfig = {
      'confirmed': {
        title: 'Booking Confirmed',
        message: `Your booking for "${dressName}"${supplierInfo} has been confirmed!`,
        category: 'success' as const,
        actionUrl: `/booking?b=${bookingId}`,
        actionText: 'View Booking'
      },
      'paid': {
        title: 'Payment Received',
        message: `Payment received for your booking of "${dressName}"${supplierInfo}.`,
        category: 'success' as const,
        actionUrl: `/booking?b=${bookingId}`,
        actionText: 'View Booking'
      },
      'cancelled': {
        title: 'Booking Cancelled',
        message: `Your booking for '${dressName}'${supplierInfo} has been cancelled.`,
        category: 'warning' as const,
        actionUrl: '/bookings',
        actionText: 'View Bookings'
      },
      'completed': {
        title: 'Rental Complete',
        message: `Your rental of '${dressName}'${supplierInfo} is complete. Please leave a review!`,
        category: 'info' as const,
        actionUrl: `/booking?b=${bookingId}#review`,
        actionText: 'Write Review'
      },
      'ready': {
        title: 'Dress Ready',
        message: `Your dress "${dressName}"${supplierInfo} is ready for pickup!`,
        category: 'info' as const,
        actionUrl: `/booking?b=${bookingId}`,
        actionText: 'View Details'
      },
      'returned': {
        title: 'Thank You',
        message: `Thank you for returning "${dressName}"${supplierInfo}. We hope you had a wonderful experience!`,
        category: 'success' as const,
        actionUrl: `/booking?b=${bookingId}#review`,
        actionText: 'Leave Review'
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      title: 'Booking Update',
      message: `Your booking status for "${dressName}"${supplierInfo} has been updated to ${status}.`,
      category: 'info' as const,
      actionUrl: `/booking?b=${bookingId}`,
      actionText: 'View Booking'
    }

    const notification = new Notification({
      user: new mongoose.Types.ObjectId(userId),
      title: config.title,
      message: config.message,
      type: 'booking',
      category: config.category,
      priority: status === 'cancelled' ? 'high' : 'medium',
      booking: new mongoose.Types.ObjectId(bookingId),
      supplier: supplierId ? new mongoose.Types.ObjectId(supplierId) : undefined,
      actionUrl: config.actionUrl,
      actionText: config.actionText,
      isRead: false,
    })

    await notification.save()

    // Send email and SMS notifications for important status changes
    if (['confirmed', 'paid', 'ready', 'completed'].includes(status)) {
      try {
        if (status === 'confirmed') {
          await EmailNotificationService.sendBookingConfirmationEmail(userId, bookingId, dressName, supplierName)
          await SmsNotificationService.sendBookingConfirmationSms(userId, bookingId, dressName, supplierName)
        } else if (status === 'ready') {
          await SmsNotificationService.sendPickupReadySms(userId, bookingId, dressName, supplierName)
        }
        notification.emailSent = true
        await notification.save()
      } catch (error) {
        logger.error('[notification.createBookingStatusNotification] Notification sending failed:', error)
      }
    }

    // Update notification counter
    const counter = await NotificationCounter.findOne({ user: userId })
    if (counter) {
      counter.count = (counter.count || 0) + 1
      await counter.save()
    } else {
      const newCounter = new NotificationCounter({ user: userId, count: 1 })
      await newCounter.save()
    }

    logger.info(`[notification.createBookingStatusNotification] Created notification for user ${userId}`)
  } catch (err) {
    logger.error('[notification.createBookingStatusNotification] Error creating notification:', err)
  }
}

/**
 * Create notification for payment updates.
 *
 * @export
 * @async
 * @param {string} userId
 * @param {string} bookingId
 * @param {string} paymentStatus
 * @param {number} amount
 * @param {string} dressName
 * @param {string} supplierName
 * @param {string} supplierId
 * @returns {Promise<void>}
 */
export const createPaymentNotification = async (
  userId: string,
  bookingId: string,
  paymentStatus: string,
  amount: number,
  dressName: string,
  supplierName?: string,
  supplierId?: string
): Promise<void> => {
  try {
    const supplierInfo = supplierName ? ` from ${supplierName}` : ''

    const paymentConfig = {
      'pending': {
        title: 'Payment Pending',
        message: `Payment of $${amount} is pending for your booking of "${dressName}"${supplierInfo}.`,
        category: 'warning' as const,
        priority: 'medium' as const
      },
      'partially-paid': {
        title: 'Partial Payment Received',
        message: `Partial payment of $${amount} received for "${dressName}"${supplierInfo}. Remaining balance due.`,
        category: 'info' as const,
        priority: 'medium' as const
      },
      'fully-paid': {
        title: 'Payment Complete',
        message: `Full payment of $${amount} received for "${dressName}"${supplierInfo}. Thank you!`,
        category: 'success' as const,
        priority: 'medium' as const
      },
      'refunded': {
        title: 'Refund Processed',
        message: `Refund of $${amount} has been processed for your booking of "${dressName}"${supplierInfo}.`,
        category: 'info' as const,
        priority: 'high' as const
      },
      'failed': {
        title: 'Payment Failed',
        message: `Payment of $${amount} failed for "${dressName}"${supplierInfo}. Please try again or contact support.`,
        category: 'error' as const,
        priority: 'high' as const
      },
    }

    const config = paymentConfig[paymentStatus as keyof typeof paymentConfig] || {
      title: 'Payment Update',
      message: `Payment status updated for "${dressName}"${supplierInfo}: ${paymentStatus}`,
      category: 'info' as const,
      priority: 'medium' as const
    }

    const notification = new Notification({
      user: new mongoose.Types.ObjectId(userId),
      title: config.title,
      message: config.message,
      type: 'payment',
      category: config.category,
      priority: config.priority,
      booking: new mongoose.Types.ObjectId(bookingId),
      supplier: supplierId ? new mongoose.Types.ObjectId(supplierId) : undefined,
      actionUrl: `/booking?b=${bookingId}`,
      actionText: 'View Payment Details',
      isRead: false,
    })

    await notification.save()

    // Send email and SMS notifications for successful payments
    if (paymentStatus === 'fully-paid') {
      try {
        await EmailNotificationService.sendPaymentConfirmationEmail(userId, bookingId, amount, dressName, supplierName)
        await SmsNotificationService.sendPaymentConfirmationSms(userId, bookingId, amount, dressName, supplierName)
        notification.emailSent = true
        await notification.save()
      } catch (error) {
        logger.error('[notification.createPaymentNotification] Notification sending failed:', error)
      }
    } else if (paymentStatus === 'failed') {
      try {
        await SmsNotificationService.sendPaymentFailedSms(userId, bookingId, dressName, supplierName)
      } catch (error) {
        logger.error('[notification.createPaymentNotification] SMS sending failed:', error)
      }
    }

    // Update notification counter
    const counter = await NotificationCounter.findOne({ user: userId })
    if (counter) {
      counter.count = (counter.count || 0) + 1
      await counter.save()
    } else {
      const newCounter = new NotificationCounter({ user: userId, count: 1 })
      await newCounter.save()
    }

    logger.info(`[notification.createPaymentNotification] Created payment notification for user ${userId}`)
  } catch (err) {
    logger.error('[notification.createPaymentNotification] Error creating payment notification:', err)
  }
}

/**
 * Create notification for fitting appointments.
 *
 * @export
 * @async
 * @param {string} userId
 * @param {string} bookingId
 * @param {Date} fittingDate
 * @param {string} dressName
 * @param {string} supplierName
 * @param {string} supplierId
 * @returns {Promise<void>}
 */
export const createFittingNotification = async (
  userId: string,
  bookingId: string,
  fittingDate: Date,
  dressName: string,
  supplierName?: string,
  supplierId?: string
): Promise<void> => {
  try {
    const formattedDate = fittingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const supplierInfo = supplierName ? ` from ${supplierName}` : ''
    const message = `Your fitting appointment for "${dressName}"${supplierInfo} is scheduled for ${formattedDate}.`

    const notification = new Notification({
      user: new mongoose.Types.ObjectId(userId),
      message,
      booking: new mongoose.Types.ObjectId(bookingId),
      supplier: supplierId ? new mongoose.Types.ObjectId(supplierId) : undefined,
      isRead: false,
    })

    await notification.save()

    // Update notification counter
    const counter = await NotificationCounter.findOne({ user: userId })
    if (counter) {
      counter.count = (counter.count || 0) + 1
      await counter.save()
    } else {
      const newCounter = new NotificationCounter({ user: userId, count: 1 })
      await newCounter.save()
    }

    logger.info(`[notification.createFittingNotification] Created fitting notification for user ${userId}`)
  } catch (err) {
    logger.error('[notification.createFittingNotification] Error creating fitting notification:', err)
  }
}

/**
 * Create reminder notification.
 *
 * @export
 * @async
 * @param {string} userId
 * @param {string} bookingId
 * @param {string} reminderType
 * @param {string} dressName
 * @param {Date} eventDate
 * @param {string} supplierName
 * @param {string} supplierId
 * @returns {Promise<void>}
 */
export const createReminderNotification = async (
  userId: string,
  bookingId: string,
  reminderType: 'rental_start' | 'rental_end' | 'fitting',
  dressName: string,
  eventDate: Date,
  supplierName?: string,
  supplierId?: string
): Promise<void> => {
  try {
    const supplierInfo = supplierName ? ` from ${supplierName}` : ''

    const reminderConfig = {
      'rental_start': {
        title: 'Rental Starting Soon',
        message: `Reminder: Your dress "${dressName}"${supplierInfo} rental starts soon!`,
        category: 'info' as const,
        priority: 'medium' as const
      },
      'rental_end': {
        title: 'Return Reminder',
        message: `Reminder: Please return "${dressName}"${supplierInfo} by ${eventDate.toLocaleDateString()}.`,
        category: 'warning' as const,
        priority: 'high' as const
      },
      'fitting': {
        title: 'Fitting Appointment Tomorrow',
        message: `Reminder: Your fitting appointment for "${dressName}"${supplierInfo} is tomorrow at ${eventDate.toLocaleTimeString()}.`,
        category: 'info' as const,
        priority: 'medium' as const
      },
    }

    const config = reminderConfig[reminderType]

    const notification = new Notification({
      user: new mongoose.Types.ObjectId(userId),
      title: config.title,
      message: config.message,
      type: 'reminder',
      category: config.category,
      priority: config.priority,
      booking: new mongoose.Types.ObjectId(bookingId),
      supplier: supplierId ? new mongoose.Types.ObjectId(supplierId) : undefined,
      actionUrl: `/booking?b=${bookingId}`,
      actionText: 'View Details',
      isRead: false,
    })

    await notification.save()

    // Send email and SMS reminders for important events
    if (reminderType === 'fitting') {
      try {
        await EmailNotificationService.sendFittingReminderEmail(userId, bookingId, eventDate, dressName, supplierName)
        await SmsNotificationService.sendFittingReminderSms(userId, dressName, eventDate.toLocaleTimeString(), supplierName)
        notification.emailSent = true
        await notification.save()
      } catch (error) {
        logger.error('[notification.createReminderNotification] Notification sending failed:', error)
      }
    } else if (reminderType === 'rental_end') {
      try {
        await EmailNotificationService.sendRentalReminderEmail(userId, bookingId, dressName, 'return', supplierName)
        await SmsNotificationService.sendReturnReminderSms(userId, dressName, eventDate.toLocaleDateString(), supplierName)
        notification.emailSent = true
        await notification.save()
      } catch (error) {
        logger.error('[notification.createReminderNotification] Notification sending failed:', error)
      }
    }

    // Update notification counter
    const counter = await NotificationCounter.findOne({ user: userId })
    if (counter) {
      counter.count = (counter.count || 0) + 1
      await counter.save()
    } else {
      const newCounter = new NotificationCounter({ user: userId, count: 1 })
      await newCounter.save()
    }

    logger.info(`[notification.createReminderNotification] Created ${reminderType} reminder for user ${userId}`)
  } catch (err) {
    logger.error('[notification.createReminderNotification] Error creating reminder notification:', err)
  }
}

/**
 * Get notifications with filtering and pagination.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getFilteredNotifications = async (req: Request, res: Response) => {
  const { userId } = req.params
  const {
    page = 1,
    size = 20,
    type,
    category,
    priority,
    isRead,
    startDate,
    endDate
  } = req.query

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId)
    const pageNum = Number.parseInt(page as string, 10)
    const sizeNum = Number.parseInt(size as string, 10)

    // Build filter query
    const filter: any = { user: userObjectId }

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

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string)
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string)
      }
    }

    const notifications = await Notification.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'Booking',
          localField: 'booking',
          foreignField: '_id',
          as: 'bookingDetails'
        }
      },
      {
        $lookup: {
          from: 'Dress',
          localField: 'dress',
          foreignField: '_id',
          as: 'dressDetails'
        }
      },
      {
        $lookup: {
          from: 'User',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplierDetails',
          pipeline: [
            { $project: { fullName: 1, email: 1, avatar: 1 } }
          ]
        }
      },
      {
        $facet: {
          resultData: [
            { $sort: { priority: -1, createdAt: -1, _id: 1 } },
            { $skip: (pageNum - 1) * sizeNum },
            { $limit: sizeNum }
          ],
          pageInfo: [{ $count: 'totalRecords' }],
          stats: [
            {
              $group: {
                _id: null,
                totalUnread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
                byType: {
                  $push: {
                    type: '$type',
                    count: 1
                  }
                },
                byPriority: {
                  $push: {
                    priority: '$priority',
                    count: 1
                  }
                }
              }
            }
          ]
        }
      }
    ])

    res.json(notifications[0])
  } catch (err) {
    logger.error(`[notification.getFilteredNotifications] ${i18n.t('DB_ERROR')} ${userId}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Mark all notifications as read for a user.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const result = await Notification.updateMany(
      { user: userObjectId, isRead: false },
      { $set: { isRead: true } }
    )

    // Reset notification counter
    await NotificationCounter.findOneAndUpdate(
      { user: userObjectId },
      { $set: { count: 0 } },
      { upsert: true }
    )

    res.json({ modifiedCount: result.modifiedCount })
  } catch (err) {
    logger.error(`[notification.markAllAsRead] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete old notifications (cleanup job).
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const cleanupOldNotifications = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - Number(days))

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    })

    logger.info(`[notification.cleanupOldNotifications] Deleted ${result.deletedCount} old notifications`)
    res.json({ deletedCount: result.deletedCount })
  } catch (err) {
    logger.error(`[notification.cleanupOldNotifications] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
