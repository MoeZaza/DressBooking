import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

/**
 * Create a review for a dress.
 *
 * @param {bookcarsTypes.CreateReviewPayload} data
 * @returns {Promise<bookcarsTypes.Review>}
 */
export const createReview = (data: bookcarsTypes.CreateReviewPayload): Promise<bookcarsTypes.Review> =>
  axiosInstance
    .post(
      '/api/reviews',
      data,
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Get reviews for a dress.
 *
 * @param {string} dressId
 * @param {bookcarsTypes.GetReviewsPayload} params
 * @returns {Promise<bookcarsTypes.ReviewResult>}
 */
export const getDressReviews = (dressId: string, params?: bookcarsTypes.GetReviewsPayload): Promise<bookcarsTypes.ReviewResult> => {
  const queryParams = new URLSearchParams()
  
  if (params?.page) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString())
  }
  if (params?.sortBy) {
    queryParams.append('sortBy', params.sortBy)
  }
  if (params?.sortOrder) {
    queryParams.append('sortOrder', params.sortOrder)
  }
  if (params?.minRating) {
    queryParams.append('minRating', params.minRating.toString())
  }
  if (params?.verified !== undefined) {
    queryParams.append('verified', params.verified.toString())
  }

  return axiosInstance
    .get(`/api/reviews/dress/${encodeURIComponent(dressId)}?${queryParams.toString()}`)
    .then((res) => res.data)
}

/**
 * Get customer reviews.
 *
 * @returns {Promise<bookcarsTypes.Review[]>}
 */
export const getCustomerReviews = (): Promise<bookcarsTypes.Review[]> =>
  axiosInstance
    .get(
      '/api/reviews/customer',
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Mark review as helpful.
 *
 * @param {string} reviewId
 * @returns {Promise<bookcarsTypes.Review>}
 */
export const markReviewHelpful = (reviewId: string): Promise<bookcarsTypes.Review> =>
  axiosInstance
    .put(
      `/api/reviews/${encodeURIComponent(reviewId)}/helpful`,
      {},
      { withCredentials: true }
    )
    .then((res) => res.data)

/**
 * Delete review (admin only).
 *
 * @param {string} reviewId
 * @returns {Promise<void>}
 */
export const deleteReview = (reviewId: string): Promise<void> =>
  axiosInstance
    .delete(
      `/api/reviews/${encodeURIComponent(reviewId)}`,
      { withCredentials: true }
    )
    .then(() => {})

/**
 * Report review.
 *
 * @param {string} reviewId
 * @param {string} reason
 * @returns {Promise<bookcarsTypes.Review>}
 */
export const reportReview = (reviewId: string, reason?: string): Promise<bookcarsTypes.Review> =>
  axiosInstance
    .put(
      `/api/reviews/${encodeURIComponent(reviewId)}/report`,
      { reason },
      { withCredentials: true }
    )
    .then((res) => res.data)
