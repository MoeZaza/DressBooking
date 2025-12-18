import { Schema, model } from 'mongoose'

export interface IWeddingPackage {
  _id?: string
  name: string
  description: string
  type: 'complete-wedding' | 'bridal-only' | 'bridesmaid' | 'mother-of-bride' | 'custom'
  dresses: Array<{
    dressId: string
    dressName: string
    role: string
    included: boolean
    additionalCost?: number
  }>
  services: Array<{
    service: string
    included: boolean
    additionalCost?: number
  }>
  pricing: {
    basePrice: number
    discountPercentage: number
    finalPrice: number
    depositRequired: number
  }
  duration: {
    startDate: Date
    endDate: Date
    fittingSchedule: Array<{
      date: Date
      type: string
      duration: number
    }>
  }
  terms: {
    cancellationPolicy: string
    alterationPolicy: string
    damagePolicy: string
  }
  isActive: boolean
  popularity: number
  bookingsCount: number
  supplier?: string
  createdAt?: Date
  updatedAt?: Date
}

const weddingPackageSchema = new Schema<IWeddingPackage>({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
    maxlength: [200, 'Package name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Package description is required'],
    trim: true,
    maxlength: [1000, 'Package description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Package type is required'],
    enum: {
      values: ['complete-wedding', 'bridal-only', 'bridesmaid', 'mother-of-bride', 'custom'],
      message: 'Invalid package type'
    }
  },
  dresses: [{
    dressId: {
      type: String,
      required: true
    },
    dressName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    included: {
      type: Boolean,
      required: true,
      default: true
    },
    additionalCost: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  services: [{
    service: {
      type: String,
      required: true,
      trim: true
    },
    included: {
      type: Boolean,
      required: true,
      default: true
    },
    additionalCost: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative']
    },
    discountPercentage: {
      type: Number,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100'],
      default: 0
    },
    finalPrice: {
      type: Number,
      required: [true, 'Final price is required'],
      min: [0, 'Final price cannot be negative']
    },
    depositRequired: {
      type: Number,
      required: [true, 'Deposit amount is required'],
      min: [0, 'Deposit cannot be negative']
    }
  },
  duration: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    fittingSchedule: [{
      date: {
        type: Date,
        required: true
      },
      type: {
        type: String,
        required: true,
        trim: true
      },
      duration: {
        type: Number,
        required: true,
        min: [1, 'Duration must be at least 1 minute']
      }
    }]
  },
  terms: {
    cancellationPolicy: {
      type: String,
      required: [true, 'Cancellation policy is required'],
      trim: true
    },
    alterationPolicy: {
      type: String,
      required: [true, 'Alteration policy is required'],
      trim: true
    },
    damagePolicy: {
      type: String,
      required: [true, 'Damage policy is required'],
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  popularity: {
    type: Number,
    min: [0, 'Popularity cannot be negative'],
    max: [100, 'Popularity cannot exceed 100'],
    default: 0
  },
  bookingsCount: {
    type: Number,
    min: [0, 'Bookings count cannot be negative'],
    default: 0
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  strict: true,
  collection: 'WeddingPackage',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better query performance
weddingPackageSchema.index({ type: 1, isActive: 1 })
weddingPackageSchema.index({ supplier: 1, isActive: 1 })
weddingPackageSchema.index({ popularity: -1 })
weddingPackageSchema.index({ 'pricing.basePrice': 1 })
weddingPackageSchema.index({ 'duration.startDate': 1, 'duration.endDate': 1 })

// Virtual for effective price (considering discounts)
weddingPackageSchema.virtual('effectivePrice').get(function() {
  return this.pricing.finalPrice
})

// Pre-save middleware to validate dates and calculate final price
weddingPackageSchema.pre('save', function(next) {
  // Validate duration dates
  if (this.duration.startDate && this.duration.endDate) {
    if (this.duration.startDate >= this.duration.endDate) {
      return next(new Error('Start date must be before end date'))
    }
  }

  // Calculate final price if not provided
  if (this.pricing.basePrice && this.pricing.discountPercentage !== undefined) {
    this.pricing.finalPrice = this.pricing.basePrice * (1 - this.pricing.discountPercentage / 100)
  }

  next()
})

// Static method to find available packages
weddingPackageSchema.statics.findAvailable = function(date?: Date) {
  const query: any = { isActive: true }

  if (date) {
    query.$and = [
      {
        $or: [
          { 'duration.startDate': { $exists: false } },
          { 'duration.startDate': { $lte: date } }
        ]
      },
      {
        $or: [
          { 'duration.endDate': { $exists: false } },
          { 'duration.endDate': { $gte: date } }
        ]
      }
    ]
  }

  return this.find(query).sort({ popularity: -1, bookingsCount: -1 })
}

// Instance method to check availability for a specific date
weddingPackageSchema.methods.isAvailableOn = function(date: Date): boolean {
  if (!this.isActive) {
    return false
  }

  if (this.duration.startDate && date < this.duration.startDate) {
    return false
  }
  if (this.duration.endDate && date > this.duration.endDate) {
    return false
  }

  return true
}

// Instance method to increment booking count
weddingPackageSchema.methods.incrementBookings = function() {
  this.bookingsCount += 1
  this.popularity = Math.min(100, this.popularity + 1)
  return this.save()
}

export default model<IWeddingPackage>('WeddingPackage', weddingPackageSchema)
