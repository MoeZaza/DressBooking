import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const paymentSchema = new Schema<env.Payment>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, "can't be blank"],
    },
    amount: {
      type: Number,
      required: [true, "can't be blank"],
    },
    remainingAmount: {
      type: Number,
      required: [true, "can't be blank"],
    },
    totalAmount: {
      type: Number,
      required: [true, "can't be blank"],
    },
    status: {
      type: String,
      enum: ['pending', 'partially-paid', 'fully-paid', 'refunded', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['payPal', 'stripe', 'visa'],
      required: [true, "can't be blank"],
    },
    transactionId: {
      type: String,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Payment',
  },
)

// Add indexes for efficient queries
paymentSchema.index({ booking: 1, paymentDate: -1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ paymentMethod: 1 })
paymentSchema.index({ transactionId: 1 })

const Payment = model<env.Payment>('Payment', paymentSchema)

// Create indexes manually and handle potential errors
Payment.syncIndexes().catch((err) => {
  console.error('Error creating Payment indexes:', err)
})

export default Payment
