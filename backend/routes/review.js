const express = require('express');
const router = express.Router({mergeParams: true});
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, validateReview, isAuthor, requireTraveller, hasBookedListing } = require('../middleware');
const reviewController = require('../controllers/review');
const multer = require('../utils/multer');

// Create Review
// Endpoint: POST /listings/:id/reviews
router.post('/', isLoggedIn, hasBookedListing, multer.array('photos', 5), wrapAsync(reviewController.postReview));

// Delete Review
// Endpoint: DELETE /listings/:id/reviews/:reviewId
router.delete('/:reviewId', isLoggedIn, isAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;
