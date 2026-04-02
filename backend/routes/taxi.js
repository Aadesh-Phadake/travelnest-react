const express = require('express');
const router = express.Router({ mergeParams: true });
const { isLoggedIn } = require('../middleware');
const taxiController = require('../controllers/taxi');

/**
 * @swagger
 * /listings/{id}/taxi/estimate:
 *   post:
 *     tags: [Taxis]
 *     summary: Estimate taxi fare for a listing
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupLocation
 *               - dropLocation
 *               - distanceKm
 *               - taxiType
 *             properties:
 *               pickupLocation:
 *                 type: string
 *                 example: "Bengaluru Airport"
 *               dropLocation:
 *                 type: string
 *                 example: "MG Road, Bengaluru"
 *               distanceKm:
 *                 type: number
 *                 example: 18.5
 *               taxiType:
 *                 type: string
 *                 enum: [Standard, SUV, Luxury]
 *                 example: Standard
 *     responses:
 *       200:
 *         description: Fare estimate
 *       400:
 *         description: Invalid input (missing fields or distance out of range)
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Hotel not found
 */
router.post('/listings/:id/taxi/estimate', isLoggedIn, taxiController.estimate);

/**
 * @swagger
 * /listings/{id}/taxi/order:
 *   post:
 *     tags: [Taxis]
 *     summary: Create taxi order and provisional booking
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupLocation
 *               - dropLocation
 *               - distanceKm
 *               - taxiType
 *             properties:
 *               pickupLocation:
 *                 type: string
 *               dropLocation:
 *                 type: string
 *               distanceKm:
 *                 type: number
 *               taxiType:
 *                 type: string
 *                 enum: [Standard, SUV, Luxury]
 *     responses:
 *       200:
 *         description: Order created
 *       400:
 *         description: Invalid input (missing fields or distance out of range)
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Hotel not found
 */
router.post('/listings/:id/taxi/order', isLoggedIn, taxiController.createOrder);

/**
 * @swagger
 * /taxis/verify:
 *   post:
 *     tags: [Taxis]
 *     summary: Verify taxi payment callback
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               bookingId:
 *                 type: string
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified
 *       400:
 *         description: Verification failed / invalid order/signature
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Booking not found
 */
router.post('/taxis/verify', isLoggedIn, taxiController.verifyPayment);

/**
 * @swagger
 * /taxis/bookings:
 *   get:
 *     tags: [Taxis]
 *     summary: Get current user's taxi bookings
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of taxi bookings
 */
router.get('/taxis/bookings', isLoggedIn, taxiController.userBookings);

module.exports = router;