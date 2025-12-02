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
        const { checkIn, checkOut, guests, walletDeduction = 0 } = req.query;

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

        // Calculate final amount after wallet deduction
        const totalAmount = parseFloat(orderDetails.totalPrice);
        const finalAmount = Math.max(0, totalAmount - parseFloat(walletDeduction || 0));

        // Create Razorpay order for the final amount after wallet deduction
        const options = {
            amount: Math.round(finalAmount * 100), // Convert to paise and round
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        const razorpayOrder = await razorpay.orders.create(options);

        // Return JSON for React to open Razorpay Modal
        res.status(200).json({
            success: true,
            key_id: process.env.RAZORPAY_KEY_ID, // React needs this key
            orderId: razorpayOrder.id,
            amount: options.amount, // Send in paise for consistency check
            currency: "INR",
            property: orderDetails.property,
            bookingDetails: {
                checkIn: orderDetails.checkIn,
                checkOut: orderDetails.checkOut,
                guests: orderDetails.guests,
                totalPrice: orderDetails.totalPrice,
                walletDeduction: parseFloat(walletDeduction || 0),
                finalAmount: finalAmount,
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
            guests,
            walletDeduction = 0
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
            totalAmount: totalAmount.toFixed(2), // Use total amount (wallet deduction handled separately)
            walletDeduction: walletDeduction
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
        const verificationResult = await require('../controllers/paymentController').verifyPaymentWithFee(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingDetails,
            walletDeduction
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

// Full wallet payment (no Razorpay needed)
router.post('/wallet-only', isLoggedIn, async (req, res, next) => {
    console.log('🔥 WALLET-ONLY ROUTE HIT! 🔥');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user._id);
    try {
        const { propertyId, checkIn, checkOut, guests, walletAmount } = req.body;

        // Validate required fields
        if (!propertyId || !checkIn || !checkOut || !guests || !walletAmount) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if user has sufficient wallet balance
        const user = await require('../models/user').findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.walletBalance < walletAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        // Fetch property and calculate total amount
        const property = await require('../models/listing').findById(propertyId);
        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }

        // Calculate total amount (same logic as createOrderForListing)
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        };

        const checkInDate = parseDate(checkIn);
        const checkOutDate = parseDate(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const numGuests = parseInt(guests) || 1;

        let basePrice = property.price * nights;
        if (numGuests > 2) {
            const additionalGuestFee = (numGuests - 2) * 500 * nights;
            basePrice += additionalGuestFee;
        }

        const isMember = user.isMember && user.membershipExpiresAt && new Date(user.membershipExpiresAt) > new Date();
        const adminFee = isMember ? 0 : basePrice * 0.05;
        const totalAmount = basePrice + adminFee;

        // Verify wallet amount covers the full payment
        if (walletAmount < totalAmount) {
            return res.status(400).json({
                success: false,
                message: `Wallet amount ₹${walletAmount} is insufficient for total ₹${totalAmount}`
            });
        }

        // Check room availability
        const { checkRoomAvailability } = require('../utils/roomAllocation');
        const availabilityCheck = await checkRoomAvailability(propertyId, guests);

        if (!availabilityCheck.available) {
            return res.status(400).json({
                success: false,
                message: availabilityCheck.message || 'Rooms not available for the selected number of guests.'
            });
        }

        // Allocate rooms and create booking first
        const { allocateRooms } = require('../utils/roomAllocation');
        const allocationResult = await allocateRooms(property, guests);

        if (!allocationResult.success) {
            return res.status(400).json({
                success: false,
                message: allocationResult.message || 'Room allocation failed'
            });
        }

        // Create booking
        const Booking = require('../models/booking');
        const newBooking = new Booking({
            user: req.user._id,
            listing: propertyId,
            checkIn,
            checkOut,
            guests,
            totalAmount: totalAmount.toFixed(2),
            roomAllocation: allocationResult.allocation
        });
        await newBooking.save();

        // Deduct from wallet balance after booking creation
        console.log(`Wallet payment: User ${user._id} balance before: ₹${user.walletBalance}, deducting: ₹${totalAmount}`);
        user.walletBalance -= totalAmount;
        await user.save();
        console.log(`Wallet payment: User ${user._id} balance after: ₹${user.walletBalance}`);

        // Award reward points (10 points per ₹100 spent)
        const pointsEarned = Math.floor(totalAmount / 100) * 10;
        if (pointsEarned > 0) {
            user.rewardPoints += pointsEarned;
            await user.save();

            // Create transaction record for earned points
            const Transaction = require('../models/transaction');
            const transaction = new Transaction({
                user: req.user._id,
                type: 'earn',
                amount: pointsEarned,
                description: `Earned ${pointsEarned} points for hotel booking (₹${totalAmount})`
            });
            await transaction.save();
        }

        // Create transaction record for wallet deduction
        const Transaction = require('../models/transaction');
        const walletTransaction = new Transaction({
            user: req.user._id,
            type: 'spend',
            amount: totalAmount,
            description: `Paid ₹${totalAmount} for hotel booking using wallet`
        });
        await walletTransaction.save();

        res.status(200).json({
            success: true,
            message: 'Booking confirmed with wallet payment!',
            bookingId: newBooking._id,
            allocation: allocationResult.allocation,
            pointsEarned: pointsEarned || 0
        });

    } catch (error) {
        console.error('Wallet payment error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during wallet payment' });
    }
});

module.exports = router;
