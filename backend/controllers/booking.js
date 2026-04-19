/**
 * Booking Controller
 * 
 * Handles booking CRUD operations.
 * 
 * Optimizations:
 *   - .lean() on read queries for performance
 *   - console.time() for query benchmarking
 */

const Booking = require('../models/booking');

module.exports.getUserBookings = async (req, res) => {
    try {
        console.time('⏱️ GET /bookings (user)');
        const bookings = await Booking.find({ user: req.user._id })
            .populate('listing', 'title location images')
            .sort({ createdAt: -1 })
            .lean(); // Performance: return plain JS objects

        console.timeEnd('⏱️ GET /bookings (user)');
        res.status(200).json({ bookings });
    } catch (error) {
        console.timeEnd('⏱️ GET /bookings (user)');
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
    }
};

module.exports.getBooking = async (req, res) => {
    try {
        console.time(`⏱️ GET /bookings/${req.params.id}`);
        const booking = await Booking.findById(req.params.id)
            .populate('listing', 'title location images')
            .populate('user', 'username email')
            .lean(); // Performance: return plain JS objects

        if (!booking) {
            console.timeEnd(`⏱️ GET /bookings/${req.params.id}`);
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user._id.toString() !== req.user._id.toString()) {
            console.timeEnd(`⏱️ GET /bookings/${req.params.id}`);
            return res.status(403).json({ message: 'Access denied' });
        }

        console.timeEnd(`⏱️ GET /bookings/${req.params.id}`);
        res.status(200).json({ booking });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking', error: error.message });
    }
};

module.exports.checkUserBooking = async (req, res) => {
    try {
        console.time('⏱️ GET /bookings/check');
        const booking = await Booking.findOne({
            user: req.user._id,
            listing: req.params.id
        }).lean(); // Performance: only need existence check

        console.timeEnd('⏱️ GET /bookings/check');
        res.status(200).json({ hasBooked: !!booking });
    } catch (error) {
        console.timeEnd('⏱️ GET /bookings/check');
        res.status(500).json({ message: 'Error checking booking', error: error.message });
    }
};

module.exports.createBooking = async (req, res) => {
    try {
        const booking = new Booking({
            ...req.body,
            user: req.user._id
        });

        await booking.save();
        res.status(201).json({ message: 'Booking created successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Error creating booking', error: error.message });
    }
};

module.exports.updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        Object.assign(booking, req.body);
        await booking.save();

        res.status(200).json({ message: 'Booking updated successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking', error: error.message });
    }
};

module.exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling booking', error: error.message });
    }
};
