import mongoose from 'mongoose'
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'
import { Request, Response } from 'express'
import nodemailer from 'nodemailer'
import path from 'node:path'

import * as bookcarsTypes from ':bookcars-types'
import i18n from '../lang/i18n'
import Booking from '../models/Booking'
import User from '../models/User'
import Token from '../models/Token'
import Dress from '../models/Dress'
import Location from '../models/Location'
import Notification from '../models/Notification'
import NotificationCounter from '../models/NotificationCounter'
import PushToken from '../models/PushToken'
import Payment from '../models/Payment'

import * as helper from '../common/helper'
import * as mailHelper from '../common/mailHelper'
import * as env from '../config/env.config'
import * as logger from '../common/logger'
import { cache } from '../middleware/cache'
import * as notificationController from './notificationController'
import * as accountingController from './accountingController'
import * as businessIntelligenceController from './businessIntelligenceController'
import { AppError, ErrorCode, ValidationError, DatabaseError, BusinessLogicError, PaymentError } from '../common/errors'
import { asyncHandler } from '../middlewares/errorHandler'
import stripeAPI from '../stripe'
import { AuthenticatedRequest } from '../middlewares/roleAuth'

/**
 * Create a Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { body }: { body: bookcarsTypes.UpsertBookingPayload } = req
  const context = logger.createRequestContext(req)

  // Validate required fields
  if (!body.booking) {
    throw new ValidationError('Booking data is required', 'booking', body.booking, context)
  }

  const { booking: bookingData } = body

  // Validate required booking fields
  if (!bookingData.dress) {
    throw new ValidationError('Dress is required', 'dress', bookingData.dress, context)
  }

  if (!bookingData.customer) {
    throw new ValidationError('Customer is required', 'customer', bookingData.customer, context)
  }

  if (!bookingData.supplier) {
    throw new ValidationError('Supplier is required', 'supplier', bookingData.supplier, context)
  }

  if (!bookingData.location) {
    throw new ValidationError('Location is required', 'location', bookingData.location, context)
  }

  if (!bookingData.from || !bookingData.to) {
    throw new ValidationError('Booking dates are required', 'dates', { from: bookingData.from, to: bookingData.to }, context)
  }

  // Validate date range
  const fromDate = new Date(bookingData.from)
  const toDate = new Date(bookingData.to)

  if (fromDate >= toDate) {
    throw new ValidationError('From date must be before to date', 'dateRange', { from: fromDate, to: toDate }, context)
  }

  if (fromDate < new Date()) {
    throw new ValidationError('Booking cannot be in the past', 'fromDate', fromDate, context)
  }

  try {
    // Check if dress exists and is available
    const dress = await Dress.findById(bookingData.dress)
    if (!dress) {
      throw new BusinessLogicError(ErrorCode.RESOURCE_NOT_FOUND, 'Dress not found', context)
    }

    // Validate that the dress belongs to the specified supplier
    if (dress.supplier.toString() !== bookingData.supplier.toString()) {
      throw new BusinessLogicError(ErrorCode.VALIDATION_ERROR, 'Dress does not belong to the specified supplier', context)
    }

    // Validate that the dress is available at the specified location
    const dressLocationIds = dress.locations.map((loc: any) => loc.toString())
    if (!dressLocationIds.includes(bookingData.location.toString())) {
      throw new BusinessLogicError(ErrorCode.VALIDATION_ERROR, 'Dress is not available at the specified location', context)
    }

    // Check for booking conflicts using a simpler approach to avoid casting issues
    // Find all bookings for this dress with active statuses
    const activeBookings = await Booking.find({
      dress: bookingData.dress,
      $or: [
        { status: 'pending' },
        { status: 'deposit' },
        { status: 'paid' },
        { status: 'reserved' }
      ]
    })

    // Check for date conflicts manually to avoid MongoDB casting issues
    const conflictingBooking = activeBookings.find(booking => {
      const bookingFrom = new Date(booking.from)
      const bookingTo = new Date(booking.to)

      // Check if dates overlap (allow adjacent bookings by using < and > instead of <= and >=)
      return (
        // Booking starts before our start date and ends after our start date
        (bookingFrom < fromDate && bookingTo > fromDate) ||
        // Booking starts before our end date and ends after our end date
        (bookingFrom < toDate && bookingTo > toDate) ||
        // Booking is completely within our date range
        (bookingFrom >= fromDate && bookingTo <= toDate) ||
        // Our booking is completely within existing booking range
        (fromDate >= bookingFrom && toDate <= bookingTo)
      )
    })

    if (conflictingBooking) {
      throw new BusinessLogicError(ErrorCode.BOOKING_CONFLICT, 'Dress is not available for the selected dates', context)
    }

    // Create the booking
    const booking = new Booking(bookingData)
    await booking.save()

    // Log audit event
    logger.logAuditEvent(
      'booking_created',
      'booking',
      {
        bookingId: booking._id,
        dress: bookingData.dress,
        customer: bookingData.customer,
        supplier: bookingData.supplier,
        from: fromDate,
        to: toDate
      },
      context
    )

    res.json(booking)
  } catch (err: any) {
    if (err instanceof AppError) {
      throw err
    }

    // Handle MongoDB errors
    if (err.name === 'ValidationError') {
      throw new ValidationError(err.message, undefined, undefined, context)
    }

    if (err.code === 11000) {
      throw new DatabaseError('Duplicate booking detected', 'create_booking', context)
    }

    // Generic database error
    throw new DatabaseError(err.message || 'Failed to create booking', 'create_booking', context)
  }
})

/**
 * Notify a supplier or admin.
 *
 * @async
 * @param {env.User} customer
 * @param {string} bookingId
 * @param {env.User} user
 * @param {boolean} notificationMessage
 * @returns {void}
 */
export const notify = async (customer: env.User, bookingId: string, user: env.User, notificationMessage: string) => {
  i18n.locale = user.language

  // notification
  const message = `${customer.fullName} ${notificationMessage} ${bookingId}.`
  const notification = new Notification({
    user: user._id,
    message,
    booking: bookingId,
  })

  await notification.save()
  let counter = await NotificationCounter.findOne({ user: user._id })
  if (counter && typeof counter.count !== 'undefined') {
    counter.count += 1
    await counter.save()
  } else {
    counter = new NotificationCounter({ user: user._id, count: 1 })
    await counter.save()
  }

  // mail
  if (user.enableEmailNotifications) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: env.SMTP_FROM,
      to: user.email,
      subject: message,
      html: `<p>
    ${i18n.t('HELLO')}${user.fullName},<br><br>
    ${message}<br><br>
    ${helper.joinURL(env.BACKEND_HOST, `update-booking?b=${bookingId}`)}<br><br>
    ${i18n.t('REGARDS')}<br>
    </p>`,
    }

    await mailHelper.sendMail(mailOptions)
  }
}

/**
 * Send checkout confirmation email to customer.
 *
 * @async
 * @param {env.User} user
 * @param {env.Booking} booking
 * @param {boolean} payLater
 * @returns {unknown}
 */
export const confirm = async (user: env.User, supplier: env.User, booking: env.Booking, payLater: boolean) => {
  const { language } = user
  const locale = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US'
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: env.TIMEZONE,
  }
  const from = booking.from.toLocaleString(locale, options)
  const to = booking.to.toLocaleString(locale, options)
  const dress = await Dress.findById(booking.dress).populate('supplier')
  if (!dress) {
    logger.info(`Dress ${booking.dress} not found`)
    return false
  }
  const location = await Location.findById(booking.location).populate('values')
  if (!location) {
    logger.info(`Location ${booking.location} not found`)
    return false
  }

  const locationName = (location.values as unknown as env.LocationValue[]).filter((value) => value.language === language)[0].value

  let contractFile: string | null = null
  if (supplier.contracts && supplier.contracts.length > 0) {
    contractFile = supplier.contracts.find((c) => c.language === user.language)?.file || null
    if (!contractFile) {
      contractFile = supplier.contracts.find((c) => c.language === 'en')?.file || null
    }
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: env.SMTP_FROM,
    to: user.email,
    subject: `${i18n.t('BOOKING_CONFIRMED_SUBJECT_PART1')} ${booking._id} ${i18n.t('BOOKING_CONFIRMED_SUBJECT_PART2')}`,
    html:
      `<p>
        ${i18n.t('HELLO')}${user.fullName},<br><br>
        ${!payLater ? `${i18n.t('BOOKING_CONFIRMED_PART1')} ${booking._id} ${i18n.t('BOOKING_CONFIRMED_PART2')}`
        + '<br><br>' : ''}
        ${i18n.t('BOOKING_CONFIRMED_PART3')}${(dress.supplier as unknown as env.User).fullName}${i18n.t('BOOKING_CONFIRMED_PART4')}${locationName}${i18n.t('BOOKING_CONFIRMED_PART5')}`
      + `${from} ${i18n.t('BOOKING_CONFIRMED_PART6')}`
      + `${dress.name}${i18n.t('BOOKING_CONFIRMED_PART7')}`
      + `<br><br>${i18n.t('BOOKING_CONFIRMED_PART8')}<br><br>`
      + `${i18n.t('BOOKING_CONFIRMED_PART9')}${(dress.supplier as unknown as env.User).fullName}${i18n.t('BOOKING_CONFIRMED_PART10')}${locationName}${i18n.t('BOOKING_CONFIRMED_PART11')}`
      + `${to} ${i18n.t('BOOKING_CONFIRMED_PART12')}`
      + `<br><br>${i18n.t('BOOKING_CONFIRMED_PART13')}<br><br>${i18n.t('BOOKING_CONFIRMED_PART14')}${env.FRONTEND_HOST}<br><br>
        ${i18n.t('REGARDS')}<br>
        </p>`,
  }

  if (contractFile) {
    const file = path.join(env.CDN_CONTRACTS, contractFile)
    if (await helper.pathExists(file)) {
      mailOptions.attachments = [{ path: file }]
    }
  }

  await mailHelper.sendMail(mailOptions)

  return true
}

/**
 * Complete checkout process and create Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const checkout = asyncHandler(async (req: Request, res: Response) => {
  let user: env.User | null
  const { body }: { body: bookcarsTypes.CheckoutPayload } = req
  const { customer } = body
  const context = logger.createRequestContext(req)

  // Validate required fields
  if (!body.booking) {
    throw new ValidationError('Booking data is required', 'booking', body.booking, context)
  }

  if (!body.booking.supplier) {
    throw new ValidationError('Supplier is required', 'supplier', body.booking.supplier, context)
  }

  const supplier = await User.findById(body.booking.supplier)
  if (!supplier) {
    throw new BusinessLogicError(ErrorCode.RESOURCE_NOT_FOUND, 'Supplier not found', context)
  }

    if (customer) {
      customer.verified = false
      customer.blacklisted = false
      customer.type = bookcarsTypes.UserType.User

      user = new User(customer)
      await user.save()

      const token = new Token({ user: user._id, token: helper.generateToken() })
      await token.save()

      i18n.locale = user.language

      const mailOptions: nodemailer.SendMailOptions = {
        from: env.SMTP_FROM,
        to: user.email,
        subject: i18n.t('ACCOUNT_ACTIVATION_SUBJECT'),
        html: `<p>
        ${i18n.t('HELLO')}${user.fullName},<br><br>
        ${i18n.t('ACCOUNT_ACTIVATION_LINK')}<br><br>
        ${helper.joinURL(env.FRONTEND_HOST, 'activate')}/?u=${encodeURIComponent(user.id)}&e=${encodeURIComponent(user.email)}&t=${encodeURIComponent(token.token)}<br><br>
        ${i18n.t('REGARDS')}<br>
        </p>`,
      }
      await mailHelper.sendMail(mailOptions)

      body.booking.customer = user.id
    } else {
      user = await User.findById(body.booking.customer)
    }

    if (!user) {
      throw new BusinessLogicError(ErrorCode.RESOURCE_NOT_FOUND, 'Customer not found', context)
    }

    // Payment processing
    if (!body.payLater) {
      const { payPal, paymentIntentId, sessionId } = body

      if (!payPal && !paymentIntentId && !sessionId) {
        throw new ValidationError('Payment information is required', 'payment', { payPal, paymentIntentId, sessionId }, context)
      }

      if (!payPal) {
        body.booking.customerId = body.customerId
      }

      if (paymentIntentId) {
        try {
          const paymentIntent = await stripeAPI.paymentIntents.retrieve(paymentIntentId)
          if (paymentIntent.status !== 'succeeded') {
            throw new PaymentError(
              `Payment failed: ${paymentIntent.status}`,
              'stripe',
              paymentIntentId,
              context
            )
          }

          body.booking.paymentIntentId = paymentIntentId
          body.booking.status = body.booking.isDeposit ? bookcarsTypes.BookingStatus.Deposit : bookcarsTypes.BookingStatus.Paid
        } catch (err: any) {
          if (err instanceof AppError) {
            throw err
          }
          throw new PaymentError(
            'Failed to verify payment with Stripe',
            'stripe',
            paymentIntentId,
            context
          )
        }
      } else {
        //
        // Bookings created from checkout with Stripe are temporary
        // and are automatically deleted if the payment checkout session expires.
        //
        let expireAt = new Date()
        expireAt.setSeconds(expireAt.getSeconds() + env.BOOKING_EXPIRE_AT)

        body.booking.sessionId = !payPal ? body.sessionId : undefined
        body.booking.status = bookcarsTypes.BookingStatus.Void
        body.booking.expireAt = expireAt

        //
        // Non verified and active users created from checkout with Stripe are temporary
        // and are automatically deleted if the payment checkout session expires.
        //
        if (!user.verified) {
          expireAt = new Date()
          expireAt.setSeconds(expireAt.getSeconds() + env.USER_EXPIRE_AT)

          user.expireAt = expireAt
          await user.save()
        }
      }
    }

    const { customerId } = body
    if (customerId) {
      user.customerId = customerId
      await user?.save()
    }

    const { language } = user
    i18n.locale = language

    const booking = new Booking(body.booking)

    await booking.save()

    if (booking.status === bookcarsTypes.BookingStatus.Paid && body.paymentIntentId && body.customerId) {
      const dress = await Dress.findById(booking.dress)
      if (!dress) {
        throw new BusinessLogicError(ErrorCode.RESOURCE_NOT_FOUND, 'Dress not found for booking', context)
      }

      dress.rentals += 1
      await dress.save()

      // Create revenue record
      try {
        await accountingController.createRevenue(booking.id, 'rental')
      } catch (err: any) {
        logger.warn('Failed to create revenue record', { bookingId: booking.id, error: err.message, ...context })
      }

      // Update customer insights
      try {
        await businessIntelligenceController.updateCustomerInsights(booking.customer.toString(), booking.supplier.toString())
      } catch (err: any) {
        logger.warn('Failed to update customer insights', { bookingId: booking.id, error: err.message, ...context })
      }
    }

    if (body.payLater || (booking.status === bookcarsTypes.BookingStatus.Paid && body.paymentIntentId && body.customerId)) {
      // Mark dress as fully booked
      // if (env.MARK_DRESS_AS_FULLY_BOOKED_ON_CHECKOUT) {
      //   await Dress.updateOne({ _id: booking.dress }, { fullyBooked: false })
      // }

      // Send confirmation email to customer
      try {
        const emailSent = await confirm(user, supplier, booking, body.payLater)
        if (!emailSent) {
          logger.warn('Failed to send confirmation email', { bookingId: booking.id, ...context })
        }
      } catch (err: any) {
        logger.warn('Error sending confirmation email', { bookingId: booking.id, error: err.message, ...context })
      }

      // Notify supplier
      try {
        i18n.locale = supplier.language
        let message = body.payLater ? i18n.t('BOOKING_PAY_LATER_NOTIFICATION') : i18n.t('BOOKING_PAID_NOTIFICATION')
        await notify(user, booking.id, supplier, message)
      } catch (err: any) {
        logger.warn('Failed to notify supplier', { bookingId: booking.id, supplierId: supplier._id, error: err.message, ...context })
      }

      // Notify admin
      try {
        const admin = !!env.ADMIN_EMAIL && (await User.findOne({ email: env.ADMIN_EMAIL, type: bookcarsTypes.UserType.Admin }))
        if (admin) {
          i18n.locale = admin.language
          let message = body.payLater ? i18n.t('BOOKING_PAY_LATER_NOTIFICATION') : i18n.t('BOOKING_PAID_NOTIFICATION')
          await notify(user, booking.id, admin, message)
        }
      } catch (err: any) {
        logger.warn('Failed to notify admin', { bookingId: booking.id, error: err.message, ...context })
      }
    }

    // Log successful checkout
    logger.logAuditEvent(
      'booking_checkout_completed',
      'booking',
      {
        bookingId: booking.id,
        customerId: user._id,
        supplierId: supplier._id,
        payLater: body.payLater,
        paymentIntentId: body.paymentIntentId,
        amount: booking.price
      },
      context
    )

    res.status(200).send({ bookingId: booking.id })
})

/**
 * Notify customer and send push notification.
 *
 * @async
 * @param {env.Booking} booking
 * @returns {void}
 */
const notifyCustomer = async (booking: env.Booking) => {
  const customer = await User.findById(booking.customer)
  if (!customer) {
    logger.info(`Customer ${booking.customer} not found`)
    return
  }

  i18n.locale = customer.language

  const message = `${i18n.t('BOOKING_UPDATED_NOTIFICATION_PART1')} ${booking._id} ${i18n.t('BOOKING_UPDATED_NOTIFICATION_PART2')}`
  const notification = new Notification({
    user: customer._id,
    message,
    booking: booking._id,
  })
  await notification.save()

  let counter = await NotificationCounter.findOne({ user: customer._id })
  if (counter && typeof counter.count !== 'undefined') {
    counter.count += 1
    await counter.save()
  } else {
    counter = new NotificationCounter({ user: customer._id, count: 1 })
    await counter.save()
  }

  // mail
  if (customer.enableEmailNotifications) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: env.SMTP_FROM,
      to: customer.email,
      subject: message,
      html: `<p>
    ${i18n.t('HELLO')}${customer.fullName},<br><br>
    ${message}<br><br>
    ${helper.joinURL(env.FRONTEND_HOST, `booking?b=${booking._id}`)}<br><br>
    ${i18n.t('REGARDS')}<br>
    </p>`,
    }
    await mailHelper.sendMail(mailOptions)
  }

  // push notification
  const pushToken = await PushToken.findOne({ user: customer._id })
  if (pushToken) {
    const { token } = pushToken
    const expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN, useFcmV1: true })

    if (!Expo.isExpoPushToken(token)) {
      logger.info(`Push token ${token} is not a valid Expo push token.`)
      return
    }

    const messages: ExpoPushMessage[] = [
      {
        to: token,
        sound: 'default',
        body: message,
        data: {
          user: customer._id,
          notification: notification._id,
          booking: booking._id,
        },
      },
    ]

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    const chunks = expo.chunkPushNotifications(messages)
    const tickets: ExpoPushTicket[] = [];

    (async () => {
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (const chunk of chunks) {
        try {
          const ticketChunks = await expo.sendPushNotificationsAsync(chunk)

          tickets.push(...ticketChunks)

          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
          for (const ticketChunk of ticketChunks) {
            if (ticketChunk.status === 'ok') {
              logger.info(`Push notification sent: ${ticketChunk.id}`)
            } else {
              throw new Error(ticketChunk.message)
            }
          }
        } catch (error) {
          logger.error('Error while sending push notification', error)
        }
      }
    })()
  }
}

/**
 * Update Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const update = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.UpsertBookingPayload } = req
    const booking = await Booking.findById(body.booking._id)

    if (booking) {
      const {
        supplier,
        dress,
        customer,
        location,
        from,
        to,
        status,
        cancellation,
        amendments,
        price,
        isDeposit,
        paidAmount,
        remainingAmount,
        paymentStatus,
        fittingRequired,
        fittingDate,
        alterationNotes,
        accessoriesIncluded,
      } = body.booking

      const previousStatus = booking.status

      booking.supplier = new mongoose.Types.ObjectId(supplier as string)
      booking.dress = new mongoose.Types.ObjectId(dress as string)
      booking.customer = new mongoose.Types.ObjectId(customer as string)
      booking.location = new mongoose.Types.ObjectId(location as string)
      booking.from = from
      booking.to = to
      booking.status = status
      booking.cancellation = cancellation
      booking.amendments = amendments
      booking.price = price as number
      booking.isDeposit = isDeposit || false

      // Update payment information if provided
      if (paidAmount !== undefined) {
        booking.paidAmount = paidAmount
      }
      if (remainingAmount !== undefined) {
        booking.remainingAmount = remainingAmount
      }
      if (paymentStatus !== undefined) {
        booking.paymentStatus = paymentStatus
      }

      // Update dress rental specific fields
      if (fittingRequired !== undefined) {
        booking.fittingRequired = fittingRequired
      }
      if (fittingDate !== undefined) {
        booking.fittingDate = fittingDate
      }
      if (alterationNotes !== undefined) {
        booking.alterationNotes = alterationNotes
      }
      if (accessoriesIncluded !== undefined) {
        booking.accessoriesIncluded = accessoriesIncluded
      }

      await booking.save()

      if (previousStatus !== status) {
        // Skip email notifications in development to avoid SMTP errors
        if (process.env.NODE_ENV !== 'development') {
          await notifyCustomer(booking)
        } else {
          console.log('[DEBUG] Skipping email notification in development mode')
        }
      }

      res.json(booking)
      return
    }

    logger.error('[booking.update] Booking not found:', body.booking._id)
    res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.update] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Admin Create Booking - Create a new booking with admin privileges.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const adminCreateBooking = async (req: Request, res: Response) => {
  try {
    const {
      supplier,
      dress,
      customer,
      location,
      from,
      to,
      status,
      price,
      paidAmount,
      paymentStatus,
      fittingRequired,
      fittingDate,
      alterationNotes,
      accessoriesIncluded,
    } = req.body

    // Validation
    if (!supplier || !dress || !customer || !location) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    if (!from || !to || new Date(from) >= new Date(to)) {
      res.status(400).json({ error: 'Invalid date range' })
      return
    }

    // Validate that the dress belongs to the specified supplier
    const dressDoc = await Dress.findById(dress)
    if (!dressDoc) {
      res.status(404).json({ error: 'Dress not found' })
      return
    }

    if (dressDoc.supplier.toString() !== supplier.toString()) {
      res.status(400).json({ error: 'Dress does not belong to the specified supplier' })
      return
    }

    // Validate that the dress is available at the specified location
    const dressLocationIds = dressDoc.locations.map((loc: any) => loc.toString())
    if (!dressLocationIds.includes(location.toString())) {
      res.status(400).json({ error: 'Dress is not available at the specified location' })
      return
    }

    // Check if dress is available for the requested dates
    const fromDateObj = new Date(from)
    const toDateObj = new Date(to)

    // Use the same approach as booking creation to avoid casting issues
    const activeBookings = await Booking.find({
      dress,
      $or: [
        { status: 'pending' },
        { status: 'deposit' },
        { status: 'paid' },
        { status: 'reserved' }
      ]
    })

    // Check for date conflicts manually to avoid MongoDB casting issues
    const conflictingBooking = activeBookings.find(booking => {
      const bookingFrom = new Date(booking.from)
      const bookingTo = new Date(booking.to)

      // Check if dates overlap (allow adjacent bookings by using < and > instead of <= and >=)
      return (
        // Booking starts before our start date and ends after our start date
        (bookingFrom < fromDateObj && bookingTo > fromDateObj) ||
        // Booking starts before our end date and ends after our end date
        (bookingFrom < toDateObj && bookingTo > toDateObj) ||
        // Booking is completely within our date range
        (bookingFrom >= fromDateObj && bookingTo <= toDateObj) ||
        // Our booking is completely within existing booking range
        (fromDateObj >= bookingFrom && toDateObj <= bookingTo)
      )
    })

    if (conflictingBooking) {
      res.status(409).json({ error: 'Dress is not available for the selected dates' })
      return
    }

    // Create booking
    const bookingData = {
      supplier,
      dress,
      customer,
      location,
      from: new Date(from),
      to: new Date(to),
      status: status || bookcarsTypes.BookingStatus.Pending,
      price: price || 0,
      paidAmount: paidAmount || 0,
      remainingAmount: Math.max(0, (price || 0) - (paidAmount || 0)),
      paymentStatus: paymentStatus || 'pending',
      fittingRequired: fittingRequired || false,
      fittingDate: fittingDate ? new Date(fittingDate) : undefined,
      alterationNotes: alterationNotes || '',
      accessoriesIncluded: accessoriesIncluded || [],
    }

    const booking = new Booking(bookingData)
    await booking.save()

    // Create payment record if payment amount is provided
    if (paidAmount && paidAmount > 0) {
      const paymentRecord = new Payment({
        booking: booking._id,
        amount: paidAmount,
        remainingAmount: booking.remainingAmount,
        totalAmount: booking.price,
        status: paymentStatus || 'pending',
        paymentMethod: 'manual',
        paymentDate: new Date(),
        notes: 'Admin created booking with initial payment',
      })
      await paymentRecord.save()
    }

    // Update dress rental count if status is paid/completed
    if (status === bookcarsTypes.BookingStatus.Paid || status === 'completed') {
      const dressDoc = await Dress.findById(dress)
      if (dressDoc) {
        dressDoc.rentals = (dressDoc.rentals || 0) + 1
        dressDoc.bookingCount = (dressDoc.bookingCount || 0) + 1
        dressDoc.totalRevenue = (dressDoc.totalRevenue || 0) + (paidAmount || 0)
        await dressDoc.save()

        // Create revenue record
        await accountingController.createRevenue(booking.id, 'rental')

        // Update customer insights
        await businessIntelligenceController.updateCustomerInsights(customer, supplier)
      }
    }

    // Send notifications
    const customerDoc = await User.findById(customer)
    const dressDocForNotification = await Dress.findById(dress).populate('supplier', 'fullName')
    const supplierDoc = await User.findById(supplier)

    if (customerDoc && dressDocForNotification && supplierDoc) {
      // Notify customer
      await notificationController.createBookingStatusNotification(
        customer,
        booking._id.toString(),
        status || 'pending',
        dressDoc.name,
        supplierDoc.fullName,
        supplier
      )

      // Create fitting notification if fitting is required
      if (fittingRequired && fittingDate) {
        await notificationController.createFittingNotification(
          customer,
          booking._id.toString(),
          new Date(fittingDate),
          dressDoc.name,
          supplierDoc.fullName,
          supplier
        )
      }
    }

    // Return created booking with populated fields
    const populatedBooking = await Booking.findById(booking._id)
      .populate('supplier', 'fullName email')
      .populate('dress', 'name dressCode price')
      .populate('customer', 'fullName email')
      .populate('location', 'name')

    res.status(201).json(populatedBooking)
  } catch (err) {
    logger.error(`[booking.adminCreateBooking] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Admin/Supplier Update Booking - Enhanced version for admin/supplier management.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const adminUpdateBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      status,
      paidAmount,
      remainingAmount,
      paymentStatus,
      fittingRequired,
      fittingDate,
      alterationNotes,
      accessoriesIncluded,
      notes,
    } = req.body

    const booking = await Booking.findById(id)
    if (!booking) {
      logger.error('[booking.adminUpdateBooking] Booking not found:', id)
      res.status(404).json({ error: 'Booking not found' })
      return
    }

    const previousStatus = booking.status
    const previousPaymentStatus = booking.paymentStatus

    // Update booking fields
    if (status !== undefined) {
      booking.status = status
    }
    if (paidAmount !== undefined) {
      booking.paidAmount = paidAmount
      // Auto-calculate remaining amount
      booking.remainingAmount = Math.max(0, booking.price - paidAmount)

      // Auto-update payment status based on amounts
      if (paidAmount === 0) {
        booking.paymentStatus = 'pending'
      } else if (paidAmount >= booking.price) {
        booking.paymentStatus = 'fully-paid'
      } else {
        booking.paymentStatus = 'partially-paid'
      }
    }
    if (remainingAmount !== undefined) {
      booking.remainingAmount = remainingAmount
    }
    if (paymentStatus !== undefined) {
      booking.paymentStatus = paymentStatus
    }
    if (fittingRequired !== undefined) {
      booking.fittingRequired = fittingRequired
    }
    if (fittingDate !== undefined) {
      booking.fittingDate = fittingDate
    }
    if (alterationNotes !== undefined) {
      booking.alterationNotes = alterationNotes
    }
    if (accessoriesIncluded !== undefined) {
      booking.accessoriesIncluded = accessoriesIncluded
    }

    await booking.save()

    // Create payment record if payment amount changed
    if (paidAmount !== undefined && paidAmount > 0) {
      const paymentRecord = new Payment({
        booking: booking._id,
        amount: paidAmount,
        remainingAmount: booking.remainingAmount,
        totalAmount: booking.price,
        status: booking.paymentStatus,
        paymentMethod: 'manual', // Admin manual entry
        paymentDate: new Date(),
        notes: notes || 'Admin/Supplier manual payment entry',
      })
      await paymentRecord.save()
    }

    // Update dress rental count if status changed to paid/completed
    if (previousStatus !== status &&
        (status === bookcarsTypes.BookingStatus.Paid || status === 'completed') &&
        booking.dress) {
      const dress = await Dress.findById(booking.dress)
      if (dress && !(booking as any).rentalCounted) {
        dress.rentals = (dress.rentals || 0) + 1
        dress.bookingCount = (dress.bookingCount || 0) + 1
        dress.totalRevenue = (dress.totalRevenue || 0) + (booking.paidAmount || 0)
        await dress.save()

        // Mark as counted
        ;(booking as any).rentalCounted = true
        await booking.save()

        // Create revenue record
        await accountingController.createRevenue(booking.id, 'rental')

        // Update customer insights
        await businessIntelligenceController.updateCustomerInsights(booking.customer.toString(), booking.supplier.toString())
      }
    }

    // Notify customer if status changed
    if (previousStatus !== status || previousPaymentStatus !== booking.paymentStatus) {
      await notifyCustomer(booking)

      // Send comprehensive notifications
      const dress = await Dress.findById(booking.dress).populate('supplier', 'fullName')
      const supplier = await User.findById(booking.supplier)
      const dressName = dress?.name || 'Unknown Dress'
      const supplierName = supplier?.fullName
      const supplierId = supplier?._id?.toString()

      if (previousStatus !== status) {
        await notificationController.createBookingStatusNotification(
          booking.customer.toString(),
          booking._id.toString(),
          status,
          dressName,
          supplierName,
          supplierId
        )
      }

      if (previousPaymentStatus !== booking.paymentStatus) {
        await notificationController.createPaymentNotification(
          booking.customer.toString(),
          booking._id.toString(),
          booking.paymentStatus || 'pending',
          booking.paidAmount || 0,
          dressName,
          supplierName,
          supplierId
        )
      }

      // Create fitting notification if fitting date is set
      if (booking.fittingRequired && booking.fittingDate) {
        await notificationController.createFittingNotification(
          booking.customer.toString(),
          booking._id.toString(),
          booking.fittingDate,
          dressName,
          supplierName,
          supplierId
        )
      }
    }

    // Return updated booking with populated fields
    const updatedBooking = await Booking.findById(id)
      .populate('supplier', 'fullName email')
      .populate('dress', 'name dressCode')
      .populate('customer', 'fullName email')
      .populate('location', 'name')

    res.json(updatedBooking)
  } catch (err) {
    logger.error(`[booking.adminUpdateBooking] ${i18n.t('DB_ERROR')} ${req.params.id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update Booking Status.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.UpdateStatusPayload } = req
    const { ids: _ids, status } = body
    const ids = _ids.map((id) => new mongoose.Types.ObjectId(id))
    const bulk = Booking.collection.initializeOrderedBulkOp()
    const bookings = await Booking.find({ _id: { $in: ids } })

    bulk.find({ _id: { $in: ids } }).update({ $set: { status } })
    await bulk.execute()

    for (const booking of bookings) {
      if (booking.status !== status) {
        // Increment rentals count when booking status changes to Paid
        if (status === bookcarsTypes.BookingStatus.Paid && booking.dress) {
          const dress = await Dress.findById(booking.dress)
          if (dress) {
            dress.rentals = (dress.rentals || 0) + 1
            await dress.save()
          }
        }
        await notifyCustomer(booking)
      }
    }

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[booking.updateStatus] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete Bookings.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteBookings = async (req: Request, res: Response) => {
  try {
    const { body }: { body: string[] } = req
    const ids = body.map((id) => new mongoose.Types.ObjectId(id))

    await Booking.deleteMany({ _id: { $in: ids } })

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[booking.deleteBookings] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete temporary Booking created from checkout session.
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteTempBooking = async (req: Request, res: Response) => {
  const { bookingId, sessionId } = req.params

  try {
    const booking = await Booking.findOne({ _id: bookingId, sessionId, status: bookcarsTypes.BookingStatus.Void, expireAt: { $ne: null } })
    if (booking) {
      const user = await User.findOne({ _id: booking.customer, verified: false, expireAt: { $ne: null } })
      await user?.deleteOne()
    }
    await booking?.deleteOne()
    res.sendStatus(200)
  } catch (err) {
    logger.error(`[booking.deleteTempBooking] ${i18n.t('DB_ERROR')} ${JSON.stringify({ bookingId, sessionId })}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Booking by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBooking = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const booking = await Booking.findById(id)
      .populate<{ supplier: env.UserInfo }>('supplier')
      .populate<{ dress: env.DressInfo }>({
        path: 'dress',
        populate: {
          path: 'supplier',
          model: 'User',
        },
      })
      .populate<{ customer: env.User }>('customer')
      .populate<{ location: env.LocationInfo }>({
        path: 'location',
        populate: {
          path: 'values',
          model: 'LocationValue',
        },
      })
      .lean()

    if (booking) {
      const { language } = req.params

      booking.supplier = {
        _id: booking.supplier._id,
        fullName: booking.supplier.fullName,
        avatar: booking.supplier.avatar,
        payLater: booking.supplier.payLater,
        priceChangeRate: booking.supplier.priceChangeRate,
      }

      booking.dress.supplier = {
        _id: booking.dress.supplier._id,
        fullName: booking.dress.supplier.fullName,
        avatar: booking.dress.supplier.avatar,
        payLater: booking.dress.supplier.payLater,
        priceChangeRate: booking.dress.supplier.priceChangeRate,
      }

      // Handle location name with safety check for values
      if (booking.location.values && booking.location.values.length > 0) {
        const locationValue = booking.location.values.find((value) => value.language === language)
        booking.location.name = locationValue ? locationValue.value : booking.location.name || 'Unknown Location'
      } else {
        booking.location.name = booking.location.name || 'Unknown Location'
      }

      res.json(booking)
      return
    }

    logger.error('[booking.getBooking] Booking not found:', id)
    res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.getBooking] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Booking by sessionId.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBookingId = async (req: Request, res: Response) => {
  const { sessionId } = req.params

  try {
    const booking = await Booking.findOne({ sessionId })

    if (!booking) {
      logger.error('[booking.getBookingId] Booking not found (sessionId):', sessionId)
      res.sendStatus(204)
      return
    }
    res.json(booking?.id)
  } catch (err) {
    logger.error(`[booking.getBookingId] (sessionId) ${i18n.t('DB_ERROR')} ${sessionId}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Bookings.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
/**
 * Get analytics data for dashboard.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, supplierId } = req.query

    // Create cache key for this specific request
    const cacheKey = `analytics-${supplierId || 'all'}-${startDate || 'nostart'}-${endDate || 'noend'}`

    // Check cache first (5 minute TTL for analytics)
    const cachedAnalytics = cache.get(cacheKey)
    if (cachedAnalytics) {
      logger.info('Returning cached analytics data', { metadata: { cacheKey } })
      res.status(200).json(cachedAnalytics)
    }

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string)
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string)
    }

    // Build supplier filter
    const supplierFilter = supplierId ? { supplier: new mongoose.Types.ObjectId(supplierId as string) } : {}

    // Optimized aggregate bookings data with performance improvements
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          ...supplierFilter,
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        }
      },
      // Use lean lookups with only required fields
      {
        $lookup: {
          from: 'dresses',
          localField: 'dress',
          foreignField: '_id',
          as: 'dressInfo',
          pipeline: [
            { $project: { type: 1, name: 1 } } // Only get required fields
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerInfo',
          pipeline: [
            { $project: { fullName: 1, email: 1 } } // Only get required fields
          ]
        }
      },
      {
        $unwind: { path: '$dressInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$price' },
          categoryBreakdown: {
            $push: {
              category: '$dressInfo.type',
              revenue: '$price'
            }
          },
          monthlyData: {
            $push: {
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' },
              revenue: '$price',
              bookingId: '$_id'
            }
          }
        }
      }
    ]).allowDiskUse(true)

    // Optimized dress inventory stats with performance improvements
    const dressStats = await Dress.aggregate([
      {
        $match: supplierFilter
      },
      {
        $group: {
          _id: null,
          totalDresses: { $sum: 1 },
          availableDresses: {
            $sum: { $cond: [{ $eq: ['$available', true] }, 1, 0] }
          },
          sizeDistribution: {
            $push: {
              size: '$size',
              available: '$available'
            }
          },
          typeDistribution: {
            $push: {
              type: '$type',
              rentals: '$rentals'
            }
          }
        }
      }
    ]).allowDiskUse(true)

    // Get top performing dresses with their ratings
    const topDresses = await Dress.find(supplierFilter)
      .sort({ rentals: -1 })
      .limit(5)
      .populate('supplier', 'fullName')
      .select('_id name rentals price rating')

    // Process category breakdown
    const categoryMap = new Map()
    if (bookingStats[0]?.categoryBreakdown) {
      bookingStats[0].categoryBreakdown.forEach((item: any) => {
        const existing = categoryMap.get(item.category) || { category: item.category, revenue: 0, bookings: 0 }
        existing.revenue += item.revenue
        existing.bookings += 1
        categoryMap.set(item.category, existing)
      })
    }

    // Process monthly trends
    const monthlyMap = new Map()
    if (bookingStats[0]?.monthlyData) {
      bookingStats[0].monthlyData.forEach((item: any) => {
        const key = `${item.year}-${item.month}`
        const existing = monthlyMap.get(key) || { month: item.month, year: item.year, revenue: 0, bookings: 0 }
        existing.revenue += item.revenue
        existing.bookings += 1
        monthlyMap.set(key, existing)
      })
    }

    // Process size distribution
    const sizeMap = new Map()
    if (dressStats[0]?.sizeDistribution) {
      dressStats[0].sizeDistribution.forEach((item: any) => {
        const existing = sizeMap.get(item.size) || { size: item.size, count: 0, available: 0 }
        existing.count += 1
        if (item.available) {
          existing.available += 1
        }
        sizeMap.set(item.size, existing)
      })
    }

    const analytics = {
      overview: {
        totalRevenue: bookingStats[0]?.totalRevenue || 0,
        totalBookings: bookingStats[0]?.totalBookings || 0,
        averageBookingValue: Math.round(bookingStats[0]?.averageBookingValue || 0),
        totalDresses: dressStats[0]?.totalDresses || 0,
        availableDresses: dressStats[0]?.availableDresses || 0,
        topCategories: Array.from(categoryMap.values()),
      },
      inventory: {
        sizeDistribution: Array.from(sizeMap.values()).map(item => ({
          ...item,
          utilization: item.count > 0 ? Math.round((item.available / item.count) * 100) : 0
        })),
        topPerformers: topDresses.map((dress: any) => ({
          _id: dress._id,
          name: dress.name,
          bookingCount: dress.rentals,
          revenue: dress.rentals * dress.price,
          rating: dress.rating || 0 // Use actual rating from dress model, default to 0 if no rating
        }))
      },
      trends: {
        monthlyRevenue: Array.from(monthlyMap.values()).sort((a, b) =>
          a.year - b.year || a.month - b.month
        )
      }
    }

    // Cache the analytics data for 5 minutes
    cache.set(cacheKey, analytics, 300) // 300 seconds = 5 minutes
    logger.info('Cached analytics data', { metadata: { cacheKey, ttl: 300 } })

    res.json(analytics)
  } catch (err) {
    logger.error(`[booking.getAnalytics] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

export const getBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.GetBookingsPayload } = req
    const page = Number.parseInt(req.params.page, 10)
    const size = Number.parseInt(req.params.size, 10)
    const userType = req.user?.type
    const userId = req.user?.id

    // Ensure only admin and suppliers can access bookings
    if (![bookcarsTypes.UserType.Admin, bookcarsTypes.UserType.Supplier].includes(userType as bookcarsTypes.UserType)) {
      res.status(403).json({ error: 'Access denied: Booking access requires admin or supplier privileges' })
      return
    }

    // Filter suppliers based on user type
    let suppliers: mongoose.Types.ObjectId[]
    if (userType === bookcarsTypes.UserType.Admin) {
      // Admin can see all suppliers' bookings - validate and convert supplier IDs
      suppliers = (body.suppliers || [])
        .filter((id: any) => id && mongoose.Types.ObjectId.isValid(typeof id === 'string' ? id : String(id)))
        .map((id: any) => {
          // Handle Buffer objects by converting to hex string first
          const idStr = Buffer.isBuffer(id) ? id.toString('hex') : (typeof id === 'string' ? id : String(id))
          return new mongoose.Types.ObjectId(idStr)
        })
    } else {
      // Suppliers can only see their own bookings
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        suppliers = [new mongoose.Types.ObjectId(userId)]
      } else {
        suppliers = []
      }
    }

    const {
      statuses,
      user,
      dress,
    } = body
    const from = (body.filter && body.filter.from && new Date(body.filter.from)) || null
    const dateBetween = (body.filter && body.filter.dateBetween && new Date(body.filter.dateBetween)) || null
    const to = (body.filter && body.filter.to && new Date(body.filter.to)) || null
    const location = (body.filter && body.filter.location) || null
    let keyword = (body.filter && body.filter.keyword) || ''
    const options = 'i'

    // Build the main match criteria for the aggregation pipeline
    const mainMatchCriteria: mongoose.FilterQuery<any> = {
      expireAt: null
    }

    // Only add supplier filter if we have valid suppliers
    if (suppliers.length > 0) {
      mainMatchCriteria.supplier = { $in: suppliers }
    }

    // Only add status filter if statuses are provided
    if (statuses && statuses.length > 0) {
      mainMatchCriteria.status = { $in: statuses }
    }

    // Add additional filters to the main match criteria with validation
    if (user && mongoose.Types.ObjectId.isValid(user)) {
      mainMatchCriteria.customer = new mongoose.Types.ObjectId(user)
    }
    if (dress && mongoose.Types.ObjectId.isValid(dress)) {
      mainMatchCriteria.dress = new mongoose.Types.ObjectId(dress)
    }

    if (dateBetween) {
      const dateBetweenStart = new Date(dateBetween)
      dateBetweenStart.setHours(0, 0, 0, 0)
      const dateBetweenEnd = new Date(dateBetween)
      dateBetweenEnd.setHours(23, 59, 59, 999)

      mainMatchCriteria.$and = [
        { from: { $lte: dateBetweenEnd } },
        { to: { $gte: dateBetweenStart } },
      ]
    } else if (from) {
      mainMatchCriteria.from = { $gte: from }
    }

    if (to) {
      mainMatchCriteria.to = { $lte: to }
    }
    if (location && mongoose.Types.ObjectId.isValid(location)) {
      mainMatchCriteria.location = new mongoose.Types.ObjectId(location)
    }

    const { language } = req.params

    const data = await Booking.aggregate([
      // Apply all filters in the initial $match stage
      {
        $match: mainMatchCriteria
      },

      // Optimized lookups with lean projections
      {
        $lookup: {
          from: 'User',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplier',
          pipeline: [
            { $project: { fullName: 1, avatar: 1, priceChangeRate: 1, email: 1 } }
          ]
        },
      },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'Dress',
          localField: 'dress',
          foreignField: '_id',
          as: 'dress',
          pipeline: [
            { $project: { name: 1, price: 1, image: 1, type: 1, size: 1, style: 1 } }
          ]
        },
      },
      { $unwind: { path: '$dress', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'User',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
          pipeline: [
            { $project: { fullName: 1, email: 1, phone: 1, avatar: 1 } }
          ]
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'Location',
          localField: 'location',
          foreignField: '_id',
          as: 'location',
          pipeline: [
            {
              $lookup: {
                from: 'LocationValue',
                let: { values: '$values' },
                pipeline: [
                  {
                    $match: {
                      $and: [
                        { $expr: { $in: ['$_id', '$$values'] } },
                        { $expr: { $eq: ['$language', language] } }
                      ],
                    },
                  },
                ],
                as: 'value',
              },
            },
            {
              $addFields: { name: { $arrayElemAt: ['$value.value', 0] } },
            },
            { $project: { name: 1, address: 1 } }
          ],
        },
      },
      { $unwind: { path: '$location', preserveNullAndEmptyArrays: false } },

      // Apply keyword search after lookups if needed
      ...(keyword ? [{
        $match: {
          $or: [
            { 'supplier.fullName': { $regex: keyword, $options: options } },
            { 'customer.fullName': { $regex: keyword, $options: options } },
            { 'dress.name': { $regex: keyword, $options: options } },
          ],
        }
      }] : []),

      // Use facet for parallel processing
      {
        $facet: {
          resultData: [
            { $sort: { createdAt: -1, _id: 1 } },
            { $skip: (page - 1) * size },
            { $limit: size }
          ],
          pageInfo: [{ $count: 'totalRecords' }],
        },
      },
    ], { allowDiskUse: true })

    const bookings: env.BookingInfo[] = data[0].resultData

    for (const booking of bookings) {
      const { _id, fullName, avatar, priceChangeRate } = booking.supplier
      booking.supplier = { _id, fullName, avatar, priceChangeRate }
    }

    res.json(data)
  } catch (err) {
    logger.error(`[booking.getBookings] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Check if a customer has Bookings.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const hasBookings = async (req: Request, res: Response) => {
  const { customer } = req.params

  try {
    const count = await Booking
      .find({
        customer: new mongoose.Types.ObjectId(customer),
      })
      .limit(1)
      .countDocuments()

    if (count === 1) {
      res.sendStatus(200)
      return
    }

    res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.hasBookings] ${i18n.t('DB_ERROR')} ${customer}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Cancel a Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const cancelBooking = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const booking = await Booking
      .findOne({
        _id: new mongoose.Types.ObjectId(id),
      })
      .populate<{ supplier: env.User }>('supplier')
      .populate<{ customer: env.User }>('customer')

    if (booking && booking.cancellation && !booking.cancelRequest) {
      booking.cancelRequest = true
      await booking.save()

      // Notify supplier
      const supplier = await User.findById(booking.supplier)
      if (!supplier) {
        logger.info(`Supplier ${booking.supplier} not found`)
        res.sendStatus(204)
        return
      }
      i18n.locale = supplier.language
      await notify(booking.customer, booking.id, supplier, i18n.t('CANCEL_BOOKING_NOTIFICATION'))

      // Notify admin
      const admin = !!env.ADMIN_EMAIL && (await User.findOne({ email: env.ADMIN_EMAIL, type: bookcarsTypes.UserType.Admin }))
      if (admin) {
        i18n.locale = admin.language
        await notify(booking.customer, booking.id, admin, i18n.t('CANCEL_BOOKING_NOTIFICATION'))
      }

      res.sendStatus(200)
      return
    }

    res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.cancelBooking] ${i18n.t('DB_ERROR')} ${id}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Check booking conflicts for a dress and date range.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBookingConflicts = async (req: Request, res: Response) => {
  try {
    const { dressId, startDate, endDate } = req.body

    if (!dressId || !startDate || !endDate) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    // Use the same approach as booking creation to avoid casting issues
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    // Fix ObjectId casting issue - ensure dressId is properly converted
    const dressObjectId = new mongoose.Types.ObjectId(dressId)

    // Find all bookings for this dress with active statuses
    const activeBookings = await Booking.find({
      dress: dressObjectId,
      $or: [
        { status: 'pending' },
        { status: 'deposit' },
        { status: 'paid' },
        { status: 'reserved' }
      ]
    })
    .populate('customer', 'fullName email')
    .populate('dress', 'name dressCode')

    // Check for date conflicts manually to avoid MongoDB casting issues
    const conflicts = activeBookings.filter(booking => {
      const bookingFrom = new Date(booking.from)
      const bookingTo = new Date(booking.to)

      // Check if dates overlap (allow adjacent bookings by using < and > instead of <= and >=)
      return (
        // Booking starts before our start date and ends after our start date
        (bookingFrom < startDateObj && bookingTo > startDateObj) ||
        // Booking starts before our end date and ends after our end date
        (bookingFrom < endDateObj && bookingTo > endDateObj) ||
        // Booking is completely within our date range
        (bookingFrom >= startDateObj && bookingTo <= endDateObj) ||
        // Our booking is completely within existing booking range
        (startDateObj >= bookingFrom && endDateObj <= bookingTo)
      )
    })

    res.json(conflicts)
  } catch (err) {
    logger.error(`[booking.getBookingConflicts] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Validate booking availability.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const validateBookingAvailability = async (req: Request, res: Response) => {
  try {
    const { dressId, startDate, endDate, excludeBookingId } = req.body

    if (!dressId || !startDate || !endDate) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    // Use the same approach as booking creation to avoid casting issues
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    // Fix ObjectId casting issue - ensure dressId is properly converted
    const dressObjectId = new mongoose.Types.ObjectId(dressId)

    // Find all bookings for this dress with active statuses
    let activeBookings = await Booking.find({
      dress: dressObjectId,
      $or: [
        { status: 'pending' },
        { status: 'deposit' },
        { status: 'paid' },
        { status: 'reserved' }
      ]
    })
    .populate('customer', 'fullName email')
    .populate('dress', 'name dressCode')

    // Exclude specific booking if provided
    if (excludeBookingId) {
      activeBookings = activeBookings.filter(booking =>
        booking._id.toString() !== excludeBookingId
      )
    }

    // Check for date conflicts manually to avoid MongoDB casting issues
    const conflicts = activeBookings.filter(booking => {
      const bookingFrom = new Date(booking.from)
      const bookingTo = new Date(booking.to)

      // Check if dates overlap (allow adjacent bookings by using < and > instead of <= and >=)
      return (
        // Booking starts before our start date and ends after our start date
        (bookingFrom < startDateObj && bookingTo > startDateObj) ||
        // Booking starts before our end date and ends after our end date
        (bookingFrom < endDateObj && bookingTo > endDateObj) ||
        // Booking is completely within our date range
        (bookingFrom >= startDateObj && bookingTo <= endDateObj) ||
        // Our booking is completely within existing booking range
        (startDateObj >= bookingFrom && endDateObj <= bookingTo)
      )
    })

    res.json({
      available: conflicts.length === 0,
      conflicts
    })
  } catch (err) {
    logger.error(`[booking.validateBookingAvailability] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get customer booking history.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getCustomerBookingHistory = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params

    // Fix ObjectId casting issue - ensure customerId is properly converted
    const customerObjectId = new mongoose.Types.ObjectId(customerId)

    const bookings = await Booking.find({ customer: customerObjectId })
      .populate('dress', 'name dressCode image')
      .populate('supplier', 'fullName')
      .populate('location', 'name')
      .sort({ createdAt: -1 })

    res.json(bookings)
  } catch (err) {
    logger.error(`[booking.getCustomerBookingHistory] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get booking calendar data for admin view.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBookingCalendar = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, supplierId } = req.query

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Start date and end date are required' })
      return
    }

    const start = new Date(startDate as string)
    const end = new Date(endDate as string)

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Invalid date format' })
      return
    }

    let query: any = {
      $or: [
        { from: { $gte: start, $lte: end } },
        { to: { $gte: start, $lte: end } },
        { from: { $lte: start }, to: { $gte: end } }
      ]
    }

    if (supplierId) {
      query.supplier = supplierId
    }

    const bookings = await Booking.find(query)
      .populate('dress', 'name dressCode image')
      .populate('customer', 'fullName email')
      .populate('supplier', 'fullName')
      .populate('location', 'name')
      .sort({ from: 1 })

    res.json(bookings)
  } catch (err) {
    logger.error(`[booking.getBookingCalendar] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
