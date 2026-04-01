const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn } = require('../middleware');
const bookingController = require('../controllers/booking');

/**
 * @swagger
 * /bookings/check/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Check if current user has booked a specific listing
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Booking check result
 *       401:
 *         description: Not authenticated
 */
router.get('/check/:id', isLoggedIn, wrapAsync(bookingController.checkUserBooking));

module.exports = router;
