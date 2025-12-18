import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const fittingAppointmentSchema = new Schema<env.FittingAppointment>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
    },
    dress: {
      type: Schema.Types.ObjectId,
      ref: 'Dress',
      required: [true, "can't be blank"],
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, "can't be blank"],
    },
    appointmentDate: {
      type: Date,
      required: [true, "can't be blank"],
    },
    timeSlot: {
      type: String,
      required: [true, "can't be blank"],
      enum: [
        '09:00-10:00',
        '10:00-11:00',
        '11:00-12:00',
        '12:00-13:00',
        '13:00-14:00',
        '14:00-15:00',
        '15:00-16:00',
        '16:00-17:00',
        '17:00-18:00',
        '18:00-19:00',
        '19:00-20:00',
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    customerName: {
      type: String,
      required: [true, "can't be blank"],
    },
    customerPhone: {
      type: String,
      required: [true, "can't be blank"],
    },
    customerEmail: {
      type: String,
      required: [true, "can't be blank"],
    },
    notes: {
      type: String,
    },
    measurements: {
      bust: Number,
      waist: Number,
      hips: Number,
      height: Number,
      shoulderWidth: Number,
      armLength: Number,
    },
    alterationsNeeded: {
      type: String,
    },
    fittingNotes: {
      type: String,
    },
    duration: {
      type: Number,
      default: 60, // minutes
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'FittingAppointment',
  },
)

// Add indexes for efficient queries
fittingAppointmentSchema.index({ supplier: 1, appointmentDate: 1, timeSlot: 1 }, { unique: true })
fittingAppointmentSchema.index({ customer: 1, appointmentDate: 1 })
fittingAppointmentSchema.index({ dress: 1, appointmentDate: 1 })
fittingAppointmentSchema.index({ location: 1, appointmentDate: 1 })
fittingAppointmentSchema.index({ status: 1 })
fittingAppointmentSchema.index({ appointmentDate: 1, timeSlot: 1 })

const FittingAppointment = model<env.FittingAppointment>('FittingAppointment', fittingAppointmentSchema)

export default FittingAppointment
