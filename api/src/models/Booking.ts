import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'
import * as logger from '../common/logger'

export const BOOKING_EXPIRE_AT_INDEX_NAME = 'expireAt'

const bookingSchema = new Schema<env.Booking>(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
      index: true,
    },
    dress: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'Dress',
    },
    customer: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
      index: true,
    },
    location: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'Location',
    },
    from: {
      type: Date,
      required: [true, "can't be blank"],
    },
    to: {
      type: Date,
      required: [true, "can't be blank"],
    },
    status: {
      type: String,
      enum: [
        bookcarsTypes.BookingStatus.Void,
        bookcarsTypes.BookingStatus.Pending,
        bookcarsTypes.BookingStatus.Deposit,
        bookcarsTypes.BookingStatus.Paid,
        bookcarsTypes.BookingStatus.Reserved,
        bookcarsTypes.BookingStatus.Completed,
        bookcarsTypes.BookingStatus.Cancelled,
      ],
      required: [true, "can't be blank"],
    },
    cancellation: {
      type: Boolean,
      default: false,
    },
    cancellationReason: {
      type: String,
    },
    amendments: {
      type: Boolean,
      default: false,
    },


    price: {
      type: Number,
      required: [true, "can't be blank"],
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partially-paid', 'fully-paid', 'refunded', 'failed'],
      default: 'pending',
    },
    cancelRequest: {
      type: Boolean,
      default: false,
    },
    sessionId: {
      type: String,
      index: true,
    },
    paymentIntentId: {
      type: String,
    },
    customerId: {
      type: String,
    },
    isDeposit: {
      type: Boolean,
      default: false,
    },
    paypalOrderId: {
      type: String,
    },
    expireAt: {
      //
      // Bookings created from checkout with Stripe are temporary and
      // are automatically deleted if the payment checkout session expires.
      //
      type: Date,
      index: { name: BOOKING_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.BOOKING_EXPIRE_AT, background: true },
    },
    fittingRequired: {
      type: Boolean,
      default: false,
    },
    fittingDate: {
      type: Date,
    },
    fittingNotes: {
      type: String,
    },
    alterationNotes: {
      type: String,
    },
    accessoriesIncluded: [{
      type: String,
    }],
    notes: {
      type: String,
    },

  },
  {
    timestamps: true,
    strict: true,
    collection: 'Booking',
  },
)

// Common filter for every query
bookingSchema.index({ 'supplier._id': 1, status: 1, expireAt: 1 })

// Optional filters (can combine with the above depending on frequency)
bookingSchema.index({ 'customer._id': 1 })
bookingSchema.index({ 'dress._id': 1 })
bookingSchema.index({ from: 1, to: 1 }) // For date range filtering
bookingSchema.index({ 'location._id': 1 })

// If keyword is used often with regex, and performance is an issue:
bookingSchema.index({ 'supplier.fullName': 1 }) // Consider text index if full-text search is needed
bookingSchema.index({ 'customer.fullName': 1 })
bookingSchema.index({ 'dress.name': 1 })
bookingSchema.index({ fittingRequired: 1 })
bookingSchema.index({ fittingDate: 1 })

const Booking = model<env.Booking>('Booking', bookingSchema)

// Create indexes manually and handle potential errors
Booking.syncIndexes().catch((err) => {
  logger.error('Error creating Booking indexes:', err)
})

export default Booking
