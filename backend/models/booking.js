const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    checkIn: {
        type: String,
        required: true
    },
    checkOut: {
        type: String,
        required: true
    },
    guests: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    totalAmount: {
        type: Number,
        required: true
    },
    // Platform commission (service fee) charged per booking
    platformCommission: {
        type: Number,
        default: 0
    },
    roomAllocation: {
        single: {
            type: Number,
            default: 0
        },
        double: {
            type: Number,
            default: 0
        },
        triple: {
            type: Number,
            default: 0
        }
    },
    // Booking status: confirmed, cancelled
    status: {
        type: String,
        enum: ['confirmed', 'cancelled'],
        default: 'confirmed'
    },
    // Payment status: pending, paid, refunded
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'paid'
    },
    // Razorpay payment ID (needed for refunds)
    paymentId: {
        type: String,
        default: null
    },
    // Razorpay refund ID (after refund is processed)
    refundId: {
        type: String,
        default: null
    },
    // Who cancelled the booking: 'user', 'owner', 'admin'
    cancelledBy: {
        type: String,
        enum: ['user', 'owner', 'admin', null],
        default: null
    },
    // When the booking was cancelled
    cancelledAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking; 