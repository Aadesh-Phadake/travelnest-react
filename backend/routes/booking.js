const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn } = require('../middleware');
const bookingController = require('../controllers/booking');

// Check if user has booked a specific listing
router.get('/check/:id', isLoggedIn, wrapAsync(bookingController.checkUserBooking));

module.exports = router;
