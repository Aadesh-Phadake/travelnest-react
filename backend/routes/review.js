const express = require('express'); 
const router = express.Router({mergeParams: true});
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, validateReview, isAuthor, requireTraveller } = require('../middleware');
const reviewController = require('../controllers/review');

// Create Review
// Endpoint: POST /listings/:id/reviews
router.post('/', isLoggedIn, requireTraveller, validateReview, wrapAsync(reviewController.postReview));

// Delete Review
// Endpoint: DELETE /listings/:id/reviews/:reviewId
router.delete('/:reviewId', isLoggedIn, isAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;