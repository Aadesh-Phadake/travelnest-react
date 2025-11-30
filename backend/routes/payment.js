const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { isLoggedIn } = require('../middleware');
const Listing = require('../models/listing');

// Create payment order for a listing
// React will call this when the user clicks "Reserve"
router.get('/create/:propertyId', isLoggedIn, async (req, res, next) => {
    try {
        const propertyId = req.params.propertyId;
        const { checkIn, checkOut, guests } = req.query;
        
        // Check room availability before creating order
        const { checkRoomAvailability } = require('../utils/roomAllocation');
        const availabilityCheck = await checkRoomAvailability(propertyId, guests);
        
        if (!availabilityCheck.available) {
            return res.status(400).json({ 
                success: false, 
                message: availabilityCheck.message || 'Rooms not available for the selected number of guests.' 
            });
        }
        
        // Check membership status
        const isMember = req.user && req.user.isMember && req.user.membershipExpiresAt && new Date(req.user.membershipExpiresAt) > new Date();

        // Create order with membership-aware pricing
        const orderDetails = await paymentController.createOrderForListing(propertyId, isMember, checkIn, checkOut, guests);

        // Return JSON for React to open Razorpay Modal
        res.status(200).json({
            success: true,
            key_id: process.env.RAZORPAY_KEY_ID, // React needs this key
            orderId: orderDetails.orderId,
            amount: orderDetails.totalPrice * 100, // Send in paise for consistency check
            currency: "INR",
            property: orderDetails.property,
            bookingDetails: {
                checkIn: orderDetails.checkIn,
                checkOut: orderDetails.checkOut,
                guests: orderDetails.guests,
                totalPrice: orderDetails.totalPrice,
                isMember
            },
            user: {
                name: req.user.username,
                email: req.user.email,
                contact: "9999999999" // Replace with actual user contact if available
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verify payment and include 5% admin fee
router.post('/verify', isLoggedIn, async (req, res, next) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            propertyId,
            checkIn,
            checkOut,
            guests
        } = req.body;

        // Fetch the property to calculate the total amount
        const property = await Listing.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found.' });
        }

        const isMember = req.user && req.user.isMember && req.user.membershipExpiresAt && new Date(req.user.membershipExpiresAt) > new Date();
        
        // Date Parsing Logic
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            if (dateStr.includes('-') && dateStr.split('-').length === 3) {
                const parts = dateStr.split('-');
                if (parts[0].length <= 2) {
                    const [day, month, year] = parts.map(Number);
                    const date = new Date(year, month - 1, day);
                    return isNaN(date.getTime()) ? null : date;
                } else {
                    const date = new Date(dateStr);
                    return isNaN(date.getTime()) ? null : date;
                }
            }
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        };
        
        const checkInDate = parseDate(checkIn);
        const checkOutDate = parseDate(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const numGuests = parseInt(guests) || 1;
        
        // Recalculate price on server side for security
        let basePrice = property.price * nights;
        if (numGuests > 2) {
            const additionalGuestFee = (numGuests - 2) * 500 * nights;
            basePrice += additionalGuestFee;
        }
        const adminFee = isMember ? 0 : basePrice * 0.05;
        const totalAmount = basePrice + adminFee;

        const bookingDetails = {
            user: req.user._id,
            listing: propertyId,
            checkIn,
            checkOut,
            guests,
            totalAmount: totalAmount.toFixed(2)
        };

        // Check room availability before payment verification
        const { checkRoomAvailability } = require('../utils/roomAllocation');
        const availabilityCheck = await checkRoomAvailability(propertyId, guests);
        
        if (!availabilityCheck.available) {
            return res.status(400).json({ 
                success: false, 
                message: availabilityCheck.message || 'Rooms not available for the selected number of guests.' 
            });
        }

        // Verify and Save
        const verificationResult = await paymentController.verifyPaymentWithFee(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingDetails
        );

        if (verificationResult.success) {
            res.status(200).json({ 
                success: true, 
                message: 'Payment successful! Your booking has been confirmed.',
                bookingId: verificationResult.booking._id,
                allocation: verificationResult.allocation
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: verificationResult.message || 'Payment verification failed.' 
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Internal server error during verification.' });
    }
});

// Membership checkout
router.get('/membership', isLoggedIn, async (req, res, next) => {
    try {
        const { orderId, amount } = await paymentController.createMembershipOrder();
        res.status(200).json({ 
            success: true,
            orderId, 
            amount,
            key_id: process.env.RAZORPAY_KEY_ID,
            currency: "INR",
            user: req.user 
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Verify Membership
router.post('/membership/verify', isLoggedIn, async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const result = await paymentController.verifyMembershipPayment(req.user._id, razorpay_order_id, razorpay_payment_id, razorpay_signature);
        
        if (result.success) {
            res.status(200).json({ 
                success: true, 
                message: 'Membership activated!',
                expiresAt: result.expiresAt
            });
        } else {
            res.status(400).json({ success: false, message: 'Membership payment verification failed' });
        }
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;