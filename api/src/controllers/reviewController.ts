import { Request, Response } from 'express'
import mongoose from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import i18n from '../lang/i18n'
import * as logger from '../common/logger'
import Booking from '../models/Booking'
import Review from '../models/Review'

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    type: string
  }
}

/**
 * Create a review for a dress.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const createReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, rating, comment, photos } = req.body
    const customerId = req.user?.id

    if (!customerId) {
      res.status(401).send('Unauthorized')
      return
    }

    if (!bookingId || !rating) {
      res.status(400).send('Booking ID and rating are required')
      return
    }

    if (rating < 1 || rating > 5) {
      res.status(400).send('Rating must be between 1 and 5')
      return
    }

    // Verify booking exists and belongs to customer
    const booking = await Booking.findOne({
      _id: bookingId,
      customer: customerId,
      status: { $in: ['completed', 'paid'] } // Only allow reviews for completed bookings
    }).populate('dress')

    if (!booking) {
      res.status(404).send('Booking not found or not eligible for review')
      return
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId })

    if (existingReview) {
      res.status(400).send('Review already exists for this booking')
      return
    }

    // Create new review using MongoDB model
    const newReview = new Review({
      booking: bookingId,
      dress: booking.dress,
      customer: customerId,
      rating,
      comment: comment || '',
      photos: photos || [],
      verified: booking.status === bookcarsTypes.BookingStatus.Paid, // Auto-verify if booking is paid
      helpful: 0
    })

    const savedReview = await newReview.save()

    // Populate customer information for response
    await savedReview.populate('customer', 'fullName avatar')

    res.status(201).json(savedReview)
  } catch (err: any) {
    logger.error(`[review.createReview] ${i18n.t('DB_ERROR')}`, err)

    if (err.name === 'ValidationError') {
      res.status(400).send(err.message)
    } else {
      res.status(400).send(i18n.t('DB_ERROR') + err)
    }
  }
}

/**
 * Get reviews for a dress.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getDressReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dressId } = req.params
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', minRating, verified } = req.query

    if (!mongoose.Types.ObjectId.isValid(dressId)) {
      res.status(400).send('Invalid dress ID')
      return
    }

    // Use the static method from Review model
    const options = {
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder === 'desc' ? -1 : 1,
      minRating: minRating ? Number(minRating) : undefined,
      verified: verified !== undefined ? verified === 'true' : undefined
    }

    const reviews = await Review.getForDress(dressId, options)
    const statistics = await Review.getAverageRating(dressId)

    // Get total count for pagination
    const totalQuery: any = {
      dress: dressId,
      isApproved: true
    }

    if (options.minRating) {
      totalQuery.rating = { $gte: options.minRating }
    }

    if (options.verified !== undefined) {
      totalQuery.verified = options.verified
    }

    const totalReviews = await Review.countDocuments(totalQuery)

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalReviews,
        pages: Math.ceil(totalReviews / Number(limit))
      },
      statistics
    })
  } catch (err: any) {
    logger.error(`[review.getDressReviews] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

// Note: updateDressRating is now handled automatically by the Review model's post-save middleware

/**
 * Get customer reviews.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getCustomerReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.id

    if (!customerId) {
      res.status(401).send('Unauthorized')
      return
    }

    const customerReviews = await Review.find({ customer: customerId })
      .populate('dress', 'name image')
      .populate('booking', 'from to')
      .sort({ createdAt: -1 })

    res.json(customerReviews)
  } catch (err: any) {
    logger.error(`[review.getCustomerReviews] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update review helpfulness.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const markReviewHelpful = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params
    const userId = req.user?.id

    if (!userId) {
      res.status(401).send('Unauthorized')
      return
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).send('Invalid review ID')
      return
    }

    const review = await Review.findById(reviewId)

    if (!review) {
      res.status(404).send('Review not found')
      return
    }

    // Use the instance method to mark as helpful
    const updatedReview = await review.markHelpful(userId)

    res.json(updatedReview)
  } catch (err: any) {
    logger.error(`[review.markReviewHelpful] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Report review.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const reportReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params
    const { reason } = req.body
    const userId = req.user?.id

    if (!userId) {
      res.status(401).send('Unauthorized')
      return
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).send('Invalid review ID')
      return
    }

    const review = await Review.findById(reviewId)

    if (!review) {
      res.status(404).send('Review not found')
      return
    }

    // Use the instance method to report the review
    const updatedReview = await review.report(userId, reason)

    res.json(updatedReview)
  } catch (err: any) {
    logger.error(`[review.reportReview] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete review (admin only).
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params
    const userType = req.user?.type

    if (userType !== bookcarsTypes.UserType.Admin) {
      res.status(403).send('Admin access required')
      return
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).send('Invalid review ID')
      return
    }

    // Find and delete the review (admin can delete any review)
    const deletedReview = await Review.findByIdAndDelete(reviewId)

    if (!deletedReview) {
      res.status(404).send('Review not found or does not belong to customer')
      return
    }

    res.status(200).send('Review deleted successfully')
  } catch (err: any) {
    logger.error(`[review.deleteReview] ${i18n.t('DB_ERROR')}`, err)
    res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
