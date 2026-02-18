import { Schema, model, Model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'

export interface IReview {
  _id?: string
  booking: string
  dress: string
  customer: string
  rating: number
  comment?: string
  photos?: string[]
  verified: boolean
  helpful: number
  helpfulVotes?: string[] // Array of user IDs who found this helpful
  reportedBy?: string[] // Array of user IDs who reported this review
  isReported: boolean
  isApproved: boolean
  moderatorNotes?: string
  createdAt?: Date
  updatedAt?: Date

  // Instance methods
  markHelpful(userId: string): Promise<IReview>
  report(userId: string, reason?: string): Promise<IReview>
}

// Interface for static methods
interface IReviewModel extends Model<IReview> {
  getForDress(dressId: string, options?: any): Promise<IReview[]>
  getAverageRating(dressId: string): Promise<{
    averageRating: number
    totalReviews: number
    ratingDistribution: { [key: number]: number }
  }>
}

const reviewSchema = new Schema<IReview>({
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required']
  } as any,
  dress: {
    type: Schema.Types.ObjectId,
    ref: 'Dress',
    required: [true, 'Dress reference is required']
  } as any,
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer reference is required']
  } as any,
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value)
      },
      message: 'Rating must be a whole number'
    }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  photos: [{
    type: String,
    validate: {
      validator: function(url: string) {
        // Basic URL validation
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url)
      },
      message: 'Invalid photo URL format'
    }
  }],
  verified: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0,
    min: [0, 'Helpful count cannot be negative']
  },
  helpfulVotes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isReported: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  moderatorNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Moderator notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  strict: true,
  collection: 'Review',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better query performance
reviewSchema.index({ dress: 1, isApproved: 1 })
reviewSchema.index({ customer: 1 })
reviewSchema.index({ booking: 1 }, { unique: true }) // One review per booking
reviewSchema.index({ rating: 1 })
reviewSchema.index({ createdAt: -1 })
reviewSchema.index({ verified: 1, isApproved: 1 })

// Virtual for review age
reviewSchema.virtual('reviewAge').get(function() {
  if (!(this as any).createdAt) {
    return 0
  }
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - (this as any).createdAt.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) // Days
})

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  if (!(this as any).helpfulVotes || (this as any).helpfulVotes.length === 0) {
    return 0
  }
  return Math.round(((this as any).helpful / (this as any).helpfulVotes.length) * 100)
})

// Pre-save middleware to validate business rules
reviewSchema.pre('save', async function(next) {
  // Ensure customer has actually booked this dress
  if (this.isNew) {
    const Booking = model('Booking')
    const booking = await Booking.findOne({
      _id: (this as any).booking,
      customer: (this as any).customer,
      dress: (this as any).dress
    })

    if (!booking) {
      return next(new Error('Customer must have a valid booking for this dress to leave a review'))
    }

    // Check if review already exists for this booking
    const existingReview = await model('Review').findOne({ booking: (this as any).booking })
    if (existingReview) {
      return next(new Error('A review already exists for this booking'))
    }

    // Auto-verify if booking is paid (completed payment)
    if (booking.status === bookcarsTypes.BookingStatus.Paid) {
      (this as any).verified = true
    }
  }
  
  next()
})

// Post-save middleware to update dress rating
reviewSchema.post('save', async function() {
  await updateDressRating((this as any).dress)
})

// Post-remove middleware to update dress rating
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateDressRating(doc.dress)
  }
})

// Static method to get reviews for a dress
reviewSchema.statics.getForDress = function(dressId: string, options: any = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = -1,
    minRating,
    verified
  } = options
  
  const query: any = {
    dress: dressId,
    isApproved: true
  }
  
  if (minRating) {
    query.rating = { $gte: minRating }
  }
  
  if (verified !== undefined) {
    query.verified = verified
  }
  
  return this.find(query)
    .populate('customer', 'fullName avatar')
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
}

// Static method to get average rating for a dress
reviewSchema.statics.getAverageRating = async function(dressId: string) {
  const result = await this.aggregate([
    {
      $match: {
        dress: new Schema.Types.ObjectId(dressId),
        isApproved: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ])
  
  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  }
  
  const data = result[0]
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  
  data.ratingDistribution.forEach((rating: number) => {
    distribution[rating as keyof typeof distribution]++
  })
  
  return {
    averageRating: Math.round(data.averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: data.totalReviews,
    ratingDistribution: distribution
  }
}

// Instance method to mark as helpful
reviewSchema.methods.markHelpful = function(userId: string) {
  if (!this.helpfulVotes.includes(userId)) {
    this.helpfulVotes.push(userId)
    this.helpful = this.helpfulVotes.length
    return this.save()
  }
  return Promise.resolve(this)
}

// Instance method to report review
reviewSchema.methods.report = function(userId: string, reason?: string) {
  if (!this.reportedBy.includes(userId)) {
    this.reportedBy.push(userId)
    this.isReported = true
    if (reason && this.moderatorNotes) {
      this.moderatorNotes += `\nReported by user ${userId}: ${reason}`
    } else if (reason) {
      this.moderatorNotes = `Reported by user ${userId}: ${reason}`
    }
    return this.save()
  }
  return Promise.resolve(this)
}

// Duplicate method removed - already defined above

// Helper function to update dress rating
async function updateDressRating(dressId: string) {
  const Review = model<IReview, IReviewModel>('Review')
  const Dress = model('Dress')

  const ratingData = await Review.getAverageRating(dressId)

  await Dress.findByIdAndUpdate(dressId, {
    rating: ratingData.averageRating,
    reviewCount: ratingData.totalReviews
  })
}

export default model<IReview, IReviewModel>('Review', reviewSchema)
