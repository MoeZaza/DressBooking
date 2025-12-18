import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'
import * as logger from '../common/logger'

const notificationSchema = new Schema<env.Notification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
      index: true,
    },
    message: {
      type: String,
      required: [true, "can't be blank"],
    },
    title: {
      type: String,
    },
    type: {
      type: String,
      enum: ['booking', 'payment', 'fitting', 'reminder', 'system', 'review', 'promotion'],
      default: 'system',
      index: true,
    },
    category: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    dress: {
      type: Schema.Types.ObjectId,
      ref: 'Dress',
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    pushSent: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
    },
    actionText: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Notification',
  },
)

// Add custom indexes
notificationSchema.index({ user: 1, createdAt: -1, _id: 1 })

const Notification = model<env.Notification>('Notification', notificationSchema)

// Create indexes manually and handle potential errors
Notification.syncIndexes().catch((err) => {
  logger.error('Error creating Notification indexes:', err)
})

export default Notification
