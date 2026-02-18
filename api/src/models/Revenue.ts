import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const revenueSchema = new Schema<env.Revenue>(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    dress: {
      type: Schema.Types.ObjectId,
      ref: 'Dress',
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ILS',
    },
    type: {
      type: String,
      enum: ['rental', 'deposit', 'late_fee', 'damage_fee', 'cleaning_fee'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'paypal', 'stripe'],
      required: true,
    },
    transactionId: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    isRefunded: {
      type: Boolean,
      default: false,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Revenue',
  },
)

revenueSchema.index({ supplier: 1, date: -1 })
revenueSchema.index({ booking: 1 })
revenueSchema.index({ dress: 1, date: -1 })
revenueSchema.index({ type: 1, date: -1 })

const Revenue = model<env.Revenue>('Revenue', revenueSchema)

// Create indexes manually and handle potential errors
Revenue.syncIndexes().catch((err) => {
  console.error('Error creating Revenue indexes:', err)
})

export default Revenue
