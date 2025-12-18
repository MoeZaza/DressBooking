import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const expenseSchema = new Schema<env.Expense>(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['maintenance', 'cleaning', 'storage', 'marketing', 'utilities', 'rent', 'other'],
      required: true,
    },
    description: {
      type: String,
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
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dress: {
      type: Schema.Types.ObjectId,
      ref: 'Dress',
      required: false, // Optional - for dress-specific expenses
    },
    receiptUrl: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      required: false,
    },
    tags: [{
      type: String,
    }],
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Expense',
  },
)

expenseSchema.index({ supplier: 1, date: -1 })
expenseSchema.index({ category: 1, date: -1 })
expenseSchema.index({ dress: 1, date: -1 })

const Expense = model<env.Expense>('Expense', expenseSchema)

export default Expense
