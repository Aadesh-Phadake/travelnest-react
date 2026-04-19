//imported 
const express = require('express');
const router = express.Router();
const { isLoggedIn, requireManager } = require('../middleware');
const Listing = require('../models/listing');
const Booking = require('../models/booking');
const ContactMessage = require('../models/contactMessage');
const wrapAsync = require('../utils/wrapAsync');

/**
 * @swagger
 * /manager/dashboard:
 *   get:
 *     tags: [Manager]
 *     summary: Get manager dashboard metadata
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metadata (UI is handled by React frontend)
 *       403:
 *         description: Manager access required
 */
router.get('/dashboard', isLoggedIn, requireManager, wrapAsync(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Manager dashboard is handled by the frontend',
        currentUser: {
            id: req.user?._id,
            username: req.user?.username,
            email: req.user?.email,
            role: req.user?.role,
        }
    });
}));


/**
 * @swagger
 * /manager/api/hotels:
 *   get:
 *     tags: [Manager]
 *     summary: Get all hotels owned by the manager with stats
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of hotels with booking statistics
 */
router.get('/api/hotels', isLoggedIn, requireManager, wrapAsync(async (req, res) => {
    try {
        const hotels = await Listing.find({ owner: req.user._id })
            .sort('-createdAt');

        // Add booking statistics for each hotel
        const hotelsWithStats = await Promise.all(hotels.map(async (hotel) => {
            const bookings = await Booking.find({ listing: hotel._id });
            const totalBookings = bookings.length;
            const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
            const recentBookings = bookings.slice(0, 5); // Last 5 bookings

            // Calculate total rooms from roomTypes if rooms field is not set
            const calculatedRooms = hotel.rooms ||
                ((hotel.roomTypes?.single || 0) + (hotel.roomTypes?.double || 0) + (hotel.roomTypes?.triple || 0));

            return {
                _id: hotel._id,
                title: hotel.title,
                location: hotel.location,
                country: hotel.country,
                price: hotel.price,
                images: hotel.images,
                status: hotel.status,
                rooms: calculatedRooms,
                roomTypes: hotel.roomTypes,
                createdAt: hotel.createdAt,
                lastUpdated: hotel.lastUpdated,
                totalBookings,
                totalRevenue,
                recentBookings
            };
        }));

        res.json({ success: true, hotels: hotelsWithStats });
    } catch (error) {
        console.error('Error fetching manager hotels:', error);
        res.status(500).json({ error: 'Failed to fetch hotels' });
    }
}));

/**
 * @swagger
 * /manager/api/bookings:
 *   get:
 *     tags: [Manager]
 *     summary: Get all bookings for manager's hotels
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of bookings
 */
router.get('/api/bookings', isLoggedIn, requireManager, wrapAsync(async (req, res) => {
    try {
        const managerHotels = await Listing.find({ owner: req.user._id }, '_id');
        const hotelIds = managerHotels.map(hotel => hotel._id);

        const bookings = await Booking.find({ listing: { $in: hotelIds } })
            .populate('user', 'username email')
            .populate('listing', 'title location images')
            .sort('-createdAt');

        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Error fetching manager bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
}));

/**
 * @swagger
 * /manager/api/taxi-bookings:
 *   get:
 *     tags: [Manager]
 *     summary: Get taxi bookings for manager's hotels
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of taxi bookings
 */
router.get('/api/taxi-bookings', isLoggedIn, requireManager, wrapAsync(async (req, res) => {
    try {
        const managerHotels = await Listing.find({ owner: req.user._id }, '_id');
        const hotelIds = managerHotels.map(hotel => hotel._id);

        const TaxiBooking = require('../models/taxiBooking');
        const taxiBookings = await TaxiBooking.find({ listing: { $in: hotelIds } })
            .populate('user', 'username email')
            .populate('listing', 'title location images')
            .sort('-createdAt');

        res.json({ success: true, taxiBookings });
    } catch (error) {
        console.error('Error fetching manager taxi bookings:', error);
        res.status(500).json({ error: 'Failed to fetch taxi bookings' });
    }
}));

/**
 * @swagger
 * /manager/api/stats:
 *   get:
 *     tags: [Manager]
 *     summary: Get dashboard statistics for manager
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Stats object with totals
 */
router.get('/api/stats', isLoggedIn, requireManager, wrapAsync(async (req, res) => {
    try {
        const managerHotels = await Listing.find({ owner: req.user._id }, '_id');
        const hotelIds = managerHotels.map(hotel => hotel._id);

        const totalHotels = managerHotels.length;

        const bookings = await Booking.find({ listing: { $in: hotelIds } });
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
        const avgBookingValue = totalBookings > 0 ? (totalRevenue / totalBookings) : 0;

        // Recent bookings (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentBookings = bookings.filter(booking => new Date(booking.createdAt) > thirtyDaysAgo);

        res.json({
            success: true,
            stats: {
                totalHotels,
                totalBookings,
                totalRevenue,
                avgBookingValue: Math.round(avgBookingValue),
                recentBookings: recentBookings.length
            }
        });
    } catch (error) {
        console.error('Error fetching manager stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
}));

/**
 * @swagger
 * /manager/api/messages:
 *   get:
 *     tags: [Manager]
 *     summary: Get messages/complaints for manager
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of contact messages
 */
router.get('/api/messages', isLoggedIn, requireManager, wrapAsync(async (req, res) => {
    try {
        const messages = await ContactMessage.find({ recipient: req.user._id })
            .populate('booking', 'checkIn checkOut totalAmount')
            .populate('user', 'username email')
            .sort('-createdAt');

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching manager messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}));

/**
 * @swagger
 * /manager/api/bookings/{id}/cancel:
 *   post:
 *     tags: [Manager]
 *     summary: Cancel a booking and process refund
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled and refund initiated
 *       404:
 *         description: Booking not found
 *       403:
 *         description: Not authorized
 */
router.post('/api/bookings/:id/cancel', isLoggedIn, requireManager, wrapAsync(async (req, res) => {
    try {
        const bookingId = req.params.id;

        // Verify the booking belongs to one of manager's hotels
        const booking = await Booking.findById(bookingId).populate('listing');
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // Check if this booking is for one of the manager's hotels
        const managerHotels = await Listing.find({ owner: req.user._id }, '_id');
        const hotelIds = managerHotels.map(h => h._id.toString());

        const bookingListingId = booking.listing?._id?.toString() || booking.listing?.toString();
        if (!hotelIds.includes(bookingListingId)) {
            return res.status(403).json({ success: false, error: 'You can only cancel bookings for your own hotels' });
        }

        // Process the refund
        const { processRefund } = require('../controllers/paymentController');
        const result = await processRefund(bookingId, 'owner');

        if (result.success) {
            res.json({
                success: true,
                message: 'Booking cancelled and refund initiated',
                booking: result.booking,
                refundId: result.refundId
            });
        } else {
            res.status(400).json({ success: false, error: result.message });
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ success: false, error: 'Failed to cancel booking' });
    }
}));

//exported
module.exports = router;