import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const dressMaintenanceSchema = new Schema<env.DressMaintenance>(
  {
    dress: {
      type: Schema.Types.ObjectId,
      ref: 'Dress',
      required: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['cleaning', 'repair', 'alteration', 'inspection', 'storage', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ILS',
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    completedDate: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    serviceProvider: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    beforeImages: [{
      type: String,
    }],
    afterImages: [{
      type: String,
    }],
    nextMaintenanceDate: {
      type: Date,
      required: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringInterval: {
      type: Number, // in days
      required: false,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'DressMaintenance',
  },
)

dressMaintenanceSchema.index({ dress: 1, scheduledDate: -1 })
dressMaintenanceSchema.index({ supplier: 1, status: 1 })
dressMaintenanceSchema.index({ type: 1, status: 1 })

const DressMaintenance = model<env.DressMaintenance>('DressMaintenance', dressMaintenanceSchema)

export default DressMaintenance
