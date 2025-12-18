import express from 'express'
import authJwt from '../middlewares/authJwt'
import * as reviewController from '../controllers/reviewController'

const routes = express.Router()

// Review routes
routes.route('/api/reviews').post(authJwt.verifyToken, reviewController.createReview)
routes.route('/api/reviews/customer').get(authJwt.verifyToken, reviewController.getCustomerReviews)
routes.route('/api/reviews/dress/:dressId').get(reviewController.getDressReviews)
routes.route('/api/reviews/:reviewId/helpful').put(authJwt.verifyToken, reviewController.markReviewHelpful)
routes.route('/api/reviews/:reviewId/report').put(authJwt.verifyToken, reviewController.reportReview)
routes.route('/api/reviews/:reviewId').delete(authJwt.verifyToken, reviewController.deleteReview)

export default routes
