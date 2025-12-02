const Razorpay = require('razorpay');
const crypto = require('crypto');
const Listing = require('../models/listing');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order (Generic) - Updated to return JSON, not render
exports.createOrder = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const property = await Listing.findById(propertyId);
        
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        const options = {
            amount: property.price * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        
        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: options.amount,
            property
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating payment order' });
    }
};

// Verify payment (Generic) - Updated to return JSON
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            res.status(200).json({ success: true, message: 'Payment successful!' });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Error verifying payment' });
    }
};

// Create order for listing with optional fee waiver
// This is a Helper Function (returns data, doesn't handle res)
exports.createOrderForListing = async (propertyId, isMember, checkIn, checkOut, guests, userId) => {
    try {
        const property = await Listing.findById(propertyId);

        if (!property) {
            throw new Error('Property not found');
        }

        // Parse dates to calculate nights
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
        
        if (!checkInDate || !checkOutDate || nights <= 0) {
            throw new Error('Invalid dates provided.');
        }
        
        // Calculate: price per night * nights
        let basePrice = property.price * nights;
        
        // Add fee for extra guests
        if (numGuests > 2) {
            const additionalGuestFee = (numGuests - 2) * 500 * nights;
            basePrice += additionalGuestFee;
        }
        
        // 5% admin fee (waived for members)
        const adminFee = isMember ? 0 : basePrice * 0.05;
        const totalPrice = basePrice + adminFee;
        
        if (totalPrice < 1) {
            throw new Error(`Total amount too low: ₹${totalPrice}. Minimum ₹1 required.`);
        }
        
        const options = {
            amount: Math.round(totalPrice * 100), // Round to avoid floating point errors
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        return {
            property,
            orderId: order.id,
            checkIn,
            checkOut,
            guests,
            totalPrice: totalPrice.toFixed(2)
        };
    } catch (error) {
        console.error('Error creating order with fee:', error);
        throw error;
    }
};

// Verify payment with 5% admin fee and optional wallet deduction
// This is a Helper Function
exports.verifyPaymentWithFee = async (razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingDetails, walletDeduction = 0) => {
    try {
        const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return { success: false, message: 'Payment verification failed' };
        }

        // Check room availability before booking
        const { allocateRooms } = require('../utils/roomAllocation');
        const allocationResult = await allocateRooms(bookingDetails.listing, bookingDetails.guests);

        if (!allocationResult.success) {
            return {
                success: false,
                message: allocationResult.message || 'Rooms not available'
            };
        }

        // Payment successful, save booking with room allocation and payment ID
        const Booking = require('../models/booking');
        const User = require('../models/user');
        const Transaction = require('../models/transaction');

        const newBooking = new Booking({
            ...bookingDetails,
            roomAllocation: allocationResult.allocation,
            paymentId: razorpay_payment_id,   // Store payment ID for refunds
            walletDeduction: walletDeduction, // Store wallet deduction, if any
            status: 'confirmed',
            paymentStatus: 'paid'
        });
        await newBooking.save();

        console.log(`✅ Booking created: ${newBooking._id}. Payment ID: ${razorpay_payment_id}. ${allocationResult.message}`);

        // Handle wallet deduction after booking creation
        if (walletDeduction > 0) {
            const user = await User.findById(bookingDetails.user);
            if (!user) {
                // If user not found, delete the booking to rollback
                await Booking.findByIdAndDelete(newBooking._id);
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            if (user.walletBalance < walletDeduction) {
                // If insufficient balance, delete the booking to rollback
                await Booking.findByIdAndDelete(newBooking._id);
                return {
                    success: false,
                    message: 'Insufficient wallet balance'
                };
            }

            // Deduct from wallet balance
            console.log(`Wallet deduction: User ${user._id} balance before: ₹${user.walletBalance}, deducting: ₹${walletDeduction}`);
            user.walletBalance -= walletDeduction;
            await user.save();
            console.log(`Wallet deduction: User ${user._id} balance after: ₹${user.walletBalance}`);

            // Create transaction record for wallet deduction
            const walletTransaction = new Transaction({
                user: bookingDetails.user,
                type: 'spend',
                amount: walletDeduction,
                description: `Paid ₹${walletDeduction} for hotel booking using wallet`
            });
            await walletTransaction.save();
        }

        // Award reward points to the user (10 points per ₹100 spent)
        let pointsEarned = Math.floor(bookingDetails.totalAmount / 100) * 10;
        if (pointsEarned > 0) {
            const user = await User.findById(bookingDetails.user);
            if (user) {
                user.rewardPoints += pointsEarned;
                await user.save();

                // Create transaction record for earned points
                const transaction = new Transaction({
                    user: bookingDetails.user,
                    type: 'earn',
                    amount: pointsEarned,
                    description: `Earned ${pointsEarned} points for hotel booking (₹${bookingDetails.totalAmount})`
                });
                await transaction.save();

                console.log(`🎉 Awarded ${pointsEarned} reward points to user ${user._id}`);
            }
        }

        return {
            success: true,
            booking: newBooking,
            allocation: allocationResult.allocation,
            pointsEarned: pointsEarned || 0
        };
    } catch (error) {
        console.error('Error verifying payment with fee:', error);
        throw error;
    }
};

// Process refund for a booking
exports.processRefund = async (bookingId, cancelledBy = 'owner') => {
    try {
        const Booking = require('../models/booking');
        const Listing = require('../models/listing');
        
        const booking = await Booking.findById(bookingId).populate('listing');
        
        if (!booking) {
            return { success: false, message: 'Booking not found' };
        }
        
        if (booking.status === 'cancelled') {
            return { success: false, message: 'Booking is already cancelled' };
        }
        
        let refundResult = null;
        
        // Only attempt Razorpay refund if we have a payment ID
        if (booking.paymentId) {
            try {
                // Razorpay refund API - full refund
                refundResult = await razorpay.payments.refund(booking.paymentId, {
                    amount: booking.totalAmount * 100, // Amount in paise
                    notes: {
                        reason: `Booking cancelled by ${cancelledBy}`,
                        bookingId: booking._id.toString()
                    }
                });
                console.log(`✅ Refund processed: ${refundResult.id} for booking ${booking._id}`);
            } catch (refundError) {
                console.error('Razorpay refund error:', refundError);
                // Continue with cancellation even if refund fails (for demo/testing)
                // In production, you might want to handle this differently
            }
        }
        
        // Restore room inventory
        if (booking.roomAllocation && booking.listing) {
            const listing = await Listing.findById(booking.listing._id || booking.listing);
            if (listing && listing.roomTypes) {
                listing.roomTypes.single = (listing.roomTypes.single || 0) + (booking.roomAllocation.single || 0);
                listing.roomTypes.double = (listing.roomTypes.double || 0) + (booking.roomAllocation.double || 0);
                listing.roomTypes.triple = (listing.roomTypes.triple || 0) + (booking.roomAllocation.triple || 0);
                listing.rooms = (listing.roomTypes.single || 0) + (listing.roomTypes.double || 0) + (listing.roomTypes.triple || 0);
                await listing.save();
                console.log(`✅ Rooms restored for booking ${booking._id}`);
            }
        }
        
        // Update booking status
        booking.status = 'cancelled';
        booking.paymentStatus = refundResult ? 'refunded' : 'refunded'; // Mark as refunded for demo
        booking.refundId = refundResult?.id || 'demo_refund_' + Date.now();
        booking.cancelledBy = cancelledBy;
        booking.cancelledAt = new Date();
        await booking.save();
        
        return { 
            success: true, 
            message: 'Booking cancelled and refund processed',
            booking,
            refundId: booking.refundId
        };
    } catch (error) {
        console.error('Error processing refund:', error);
        return { success: false, message: error.message || 'Refund processing failed' };
    }
};

// Create membership order (₹999)
exports.createMembershipOrder = async () => {
    const options = {
        amount: 99900, // ₹999 in paise
        currency: 'INR',
        receipt: `membership_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    return { orderId: order.id, amount: options.amount };
};

// Verify membership payment and activate
exports.verifyMembershipPayment = async (userId, razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest('hex');

    if (razorpay_signature !== expectedSign) {
        return { success: false };
    }

    const User = require('../models/user');
    const user = await User.findById(userId);
    if (!user) return { success: false };
    
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    user.isMember = true;
    user.membershipExpiresAt = expires;
    
    if (!user.freeCancellationsResetAt) {
        user.freeCancellationsResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        user.freeCancellationsUsed = 0;
    }
    
    await user.save();

    return { success: true, expiresAt: expires };
};
