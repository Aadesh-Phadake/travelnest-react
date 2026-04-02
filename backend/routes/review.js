const express = require('express');
const router = express.Router({mergeParams: true});
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, validateReview, isAuthor, requireTraveller, hasBookedListing } = require('../middleware');
const reviewController = require('../controllers/review');
const multer = require('../utils/multer');

/**
 * @swagger
 * /listings/{id}/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review for a listing
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Review created
 *       401:
 *         description: Not authenticated
 */
router.post('/', isLoggedIn, hasBookedListing, multer.array('photos', 5), wrapAsync(reviewController.postReview));

/**
 * @swagger
 * /listings/{id}/reviews/{reviewId}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted
 *       401:
 *         description: Not authenticated
 */
router.delete('/:reviewId', isLoggedIn, isAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;
