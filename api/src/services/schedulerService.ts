import cron from 'node-cron'
import Booking from '../models/Booking'
import FittingAppointment from '../models/FittingAppointment'
import Notification from '../models/Notification'
import * as rentalCountService from './rentalCountService'
import { BookingStatus } from ':bookcars-types'

/**
 * Initialize scheduled tasks
 */
export const initializeScheduler = (): void => {
  // Run rental count update daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily rental count update...')
    try {
      await rentalCountService.updateRentalCounts()
      console.log('Daily rental count update completed successfully')
    } catch (error) {
      console.error('Error in daily rental count update:', error)
    }
  })

  // Run rental count update every hour during business hours (9 AM - 9 PM)
  cron.schedule('0 9-21 * * *', async () => {
    console.log('Running hourly rental count update...')
    try {
      await rentalCountService.updateRentalCounts()
      console.log('Hourly rental count update completed successfully')
    } catch (error) {
      console.error('Error in hourly rental count update:', error)
    }
  })

  // Run booking status manager every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running booking status manager...')
    try {
      await updateBookingStatuses()
      console.log('Booking status manager completed successfully')
    } catch (error) {
      console.error('Error in booking status manager:', error)
    }
  })

  // Run booking expiration handler every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running booking expiration handler...')
    try {
      await handleExpiredBookings()
      console.log('Booking expiration handler completed successfully')
    } catch (error) {
      console.error('Error in booking expiration handler:', error)
    }
  })

  // Run appointment reminder scheduler every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    console.log('Running appointment reminder scheduler...')
    try {
      await sendAppointmentReminders()
      console.log('Appointment reminder scheduler completed successfully')
    } catch (error) {
      console.error('Error in appointment reminder scheduler:', error)
    }
  })

  // Run booking pickup/return reminder scheduler every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    console.log('Running booking reminder scheduler...')
    try {
      await sendBookingReminders()
      console.log('Booking reminder scheduler completed successfully')
    } catch (error) {
      console.error('Error in booking reminder scheduler:', error)
    }
  })

  console.log('Scheduler initialized with all scheduled tasks')
}

/**
 * Update booking statuses based on time and payment
 */
const updateBookingStatuses = async (): Promise<void> => {
  const now = new Date()

  // Find bookings that should be auto-confirmed (paid and start date is within 24 hours)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const bookingsToConfirm = await Booking.find({
    status: BookingStatus.Paid,
    from: { $lte: tomorrow, $gt: now }
  }).populate('customer dress supplier')

  for (const booking of bookingsToConfirm) {
    booking.status = BookingStatus.Reserved
    await booking.save()

    // Send notification
    if (booking.customer && booking.dress) {
      try {
        const notification = new Notification({
          user: (booking.customer as any)._id,
          type: 'booking',
          title: 'Booking Confirmed',
          message: `Your booking for ${(booking.dress as any).name} has been confirmed and is ready for pickup.`,
          booking: booking._id,
          dress: (booking.dress as any)._id,
          supplier: (booking.supplier as any)?._id
        })
        await notification.save()
      } catch (err) {
        console.error('Error sending confirmation notification:', err)
      }
    }
  }

  // Find bookings that should be marked as completed (end date has passed)
  const bookingsToComplete = await Booking.find({
    status: { $in: [BookingStatus.Reserved, BookingStatus.Paid] },
    to: { $lt: now }
  }).populate('customer dress supplier')

  for (const booking of bookingsToComplete) {
    booking.status = BookingStatus.Completed
    await booking.save()

    // Send completion notification and review request
    if (booking.customer && booking.dress) {
      try {
        const notification = new Notification({
          user: (booking.customer as any)._id,
          type: 'review',
          title: 'Booking Completed',
          message: `Thank you for renting ${(booking.dress as any).name}! Please consider leaving a review.`,
          booking: booking._id,
          dress: (booking.dress as any)._id,
          supplier: (booking.supplier as any)?._id
        })
        await notification.save()
      } catch (err) {
        console.error('Error sending completion notification:', err)
      }
    }
  }

  console.log(`Updated ${bookingsToConfirm.length} bookings to Reserved, ${bookingsToComplete.length} bookings to Completed`)
}

/**
 * Handle expired bookings (unpaid bookings past their start date)
 */
const handleExpiredBookings = async (): Promise<void> => {
  const now = new Date()

  // Find pending bookings that have passed their start date
  const expiredBookings = await Booking.find({
    status: BookingStatus.Pending,
    from: { $lt: now },
    paymentStatus: { $in: ['pending', 'partially-paid'] }
  }).populate('customer dress supplier')

  for (const booking of expiredBookings) {
    booking.status = BookingStatus.Cancelled
    booking.cancellationReason = 'Auto-cancelled: Payment not received before rental start date'
    await booking.save()

    // Send cancellation notification
    if (booking.customer && booking.dress) {
      try {
        const notification = new Notification({
          user: (booking.customer as any)._id,
          type: 'booking',
          category: 'warning',
          title: 'Booking Cancelled',
          message: `Your booking for ${(booking.dress as any).name} has been cancelled due to non-payment.`,
          booking: booking._id,
          dress: (booking.dress as any)._id,
          supplier: (booking.supplier as any)?._id
        })
        await notification.save()
      } catch (err) {
        console.error('Error sending cancellation notification:', err)
      }
    }
  }

  console.log(`Cancelled ${expiredBookings.length} expired bookings`)
}

/**
 * Send appointment reminders
 */
const sendAppointmentReminders = async (): Promise<void> => {
  const now = new Date()
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  // Find appointments in the next 24 hours
  const upcomingAppointments = await FittingAppointment.find({
    appointmentDate: { $gte: in24Hours, $lt: in25Hours },
    status: { $in: ['pending', 'confirmed'] }
  }).populate('customer dress supplier')

  for (const appointment of upcomingAppointments) {
    if (appointment.customer && appointment.dress) {
      try {
        const customerId = typeof appointment.customer === 'string' ? appointment.customer : (appointment.customer as any)._id
        const notification = new Notification({
          user: customerId,
          type: 'fitting',
          title: 'Fitting Appointment Reminder',
          message: `Reminder: You have a fitting appointment for ${(appointment.dress as any).name} tomorrow at ${appointment.timeSlot}.`,
          dress: typeof appointment.dress === 'string' ? appointment.dress : (appointment.dress as any)._id,
          supplier: typeof appointment.supplier === 'string' ? appointment.supplier : (appointment.supplier as any)?._id
        })
        await notification.save()
      } catch (err) {
        console.error('Error sending appointment reminder:', err)
      }
    }
  }

  console.log(`Sent ${upcomingAppointments.length} appointment reminders`)
}

/**
 * Send booking pickup and return reminders
 */
const sendBookingReminders = async (): Promise<void> => {
  const now = new Date()
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  // Find bookings starting in 24 hours (pickup reminder)
  const pickupReminders = await Booking.find({
    status: { $in: [BookingStatus.Paid, BookingStatus.Reserved] },
    from: { $gte: in24Hours, $lt: in48Hours }
  }).populate('customer dress supplier location')

  for (const booking of pickupReminders) {
    if (booking.customer && booking.dress) {
      try {
        const notification = new Notification({
          user: (booking.customer as any)._id,
          type: 'reminder',
          title: 'Pickup Reminder',
          message: `Reminder: Your rental for ${(booking.dress as any).name} starts tomorrow. Please pick it up at ${(booking.location as any)?.name || 'your selected location'}.`,
          booking: booking._id,
          dress: (booking.dress as any)._id,
          supplier: (booking.supplier as any)?._id
        })
        await notification.save()
      } catch (err) {
        console.error('Error sending pickup reminder:', err)
      }
    }
  }

  // Find bookings ending in 24 hours (return reminder)
  const returnReminders = await Booking.find({
    status: { $in: [BookingStatus.Paid, BookingStatus.Reserved] },
    to: { $gte: in24Hours, $lt: in48Hours }
  }).populate('customer dress supplier location')

  for (const booking of returnReminders) {
    if (booking.customer && booking.dress) {
      try {
        const notification = new Notification({
          user: (booking.customer as any)._id,
          type: 'reminder',
          title: 'Return Reminder',
          message: `Reminder: Your rental for ${(booking.dress as any).name} ends tomorrow. Please return it to ${(booking.location as any)?.name || 'your selected location'}.`,
          booking: booking._id,
          dress: (booking.dress as any)._id,
          supplier: (booking.supplier as any)?._id
        })
        await notification.save()
      } catch (err) {
        console.error('Error sending return reminder:', err)
      }
    }
  }

  console.log(`Sent ${pickupReminders.length} pickup reminders, ${returnReminders.length} return reminders`)
}

/**
 * Manually trigger rental count update
 */
export const triggerRentalCountUpdate = async (): Promise<void> => {
  try {
    await rentalCountService.updateRentalCounts()
    console.log('Manual rental count update completed successfully')
  } catch (error) {
    console.error('Error in manual rental count update:', error)
    throw error
  }
}
