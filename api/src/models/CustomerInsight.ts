import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const customerInsightSchema = new Schema<env.CustomerInsight>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    averageBookingValue: {
      type: Number,
      default: 0,
    },
    preferredDressTypes: [{
      type: String,
    }],
    preferredSizes: [{
      type: String,
    }],
    preferredColors: [{
      type: String,
    }],
    lastBookingDate: {
      type: Date,
      required: false,
    },
    firstBookingDate: {
      type: Date,
      required: false,
    },
    customerLifetimeValue: {
      type: Number,
      default: 0,
    },
    loyaltyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    cancellationRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    notes: {
      type: String,
      required: false,
    },
    tags: [{
      type: String,
    }],
    isVip: {
      type: Boolean,
      default: false,
    },
    communicationPreference: {
      type: String,
      enum: ['email', 'sms', 'phone', 'whatsapp'],
      default: 'email',
    },
    specialRequests: [{
      type: String,
    }],
    seasonalPreferences: {
      spring: [String],
      summer: [String],
      autumn: [String],
      winter: [String],
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'CustomerInsight',
  },
)

customerInsightSchema.index({ customer: 1, supplier: 1 }, { unique: true })
customerInsightSchema.index({ supplier: 1, loyaltyScore: -1 })
customerInsightSchema.index({ supplier: 1, totalSpent: -1 })

const CustomerInsight = model<env.CustomerInsight>('CustomerInsight', customerInsightSchema)

export default CustomerInsight
