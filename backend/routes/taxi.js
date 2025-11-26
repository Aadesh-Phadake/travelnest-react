const express = require('express');
const router = express.Router({ mergeParams: true });
const { isLoggedIn } = require('../middleware');
const taxiController = require('../controllers/taxi');

// REMOVED: router.get('/listings/:id/taxi') 
// React handles the UI for the booking page. 
// If it needs listing data, it will use the main listings/:id API.

// Estimate fare (API)
router.post('/listings/:id/taxi/estimate', isLoggedIn, taxiController.estimate);

// Create order and provisional booking (API)
router.post('/listings/:id/taxi/order', isLoggedIn, taxiController.createOrder);

// Verify payment callback (API)
router.post('/taxis/verify', isLoggedIn, taxiController.verifyPayment);

// User taxi bookings (API)
// Note: You must ensure userBookings controller returns JSON
router.get('/taxis/bookings', isLoggedIn, taxiController.userBookings);

module.exports = router;