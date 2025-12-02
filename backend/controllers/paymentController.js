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
exports.createOrderForListing = async (propertyId, isMember, checkIn, checkOut, guests) => {
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

// Verify payment with 5% admin fee
// This is a Helper Function
exports.verifyPaymentWithFee = async (razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingDetails) => {
    try {
        const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Check room availability before booking
            const { allocateRooms } = require('../utils/roomAllocation');
            const allocationResult = await allocateRooms(bookingDetails.listing, bookingDetails.guests);
            
            if (!allocationResult.success) {
                return {
                    success: false,
                    message: allocationResult.message || 'Rooms not available'
                };
            }

            // Payment successful, save booking with room allocation
            const Booking = require('../models/booking');
            const newBooking = new Booking({
                ...bookingDetails,
                roomAllocation: allocationResult.allocation
            });
            await newBooking.save();

            console.log(`Booking created: ${newBooking._id}. ${allocationResult.message}`);

            return {
                success: true,
                booking: newBooking,
                allocation: allocationResult.allocation
            };
        } else {
            return { success: false };
        }
    } catch (error) {
        console.error('Error verifying payment with fee:', error);
        throw error;
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