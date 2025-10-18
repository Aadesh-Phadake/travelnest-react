/**
 * @file user.js
 * @description Mongoose schema for User model, defining user roles, profiles, memberships, and financial data.
 */

const mongoose = require('mongoose');
const schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

/**
 * User Schema
 * Defines the structure for user documents in the database.
 * Supports multiple roles: traveller, manager, admin with role-specific fields.
 */
const userSchema = new schema({
    // Authentication fields
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['traveller', 'manager', 'admin'],
        default: 'traveller'
    },
    // Profile fields
    name: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    travelPreferences: {
        type: String,
        default: ''
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    // Manager-specific fields
    hotelName: {
        type: String,
        default: ''
    },
    hotelAddress: {
        type: String,
        default: ''
    },
    documents: [{
        type: String // URLs to uploaded documents
    }],
    // Admin-specific fields
    systemAccess: [{
        type: String
    }],
    // Manager approval fields
    isApproved: {
        type: Boolean,
        default: true // normal users are approved by default
    },
    approvedAt: {
        type: Date,
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Membership fields
    isMember: {
        type: Boolean,
        default: false
    },
    membershipExpiresAt: {
        type: Date,
        default: null
    },
    // Cancellation tracking
    freeCancellationsUsed: {
        type: Number,
        default: 0
    },
    freeCancellationsResetAt: {
        type: Date,
        default: null
    },
    // Wallet and rewards
    walletBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    rewardPoints: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true  // This will automatically add createdAt and updatedAt fields
});

/**
 * Plugin configuration
 * Adds Passport-Local Mongoose methods for authentication
 */
userSchema.plugin(passportLocalMongoose);

/**
 * Export the User model
 * Creates and exports the Mongoose model for User documents
 */
module.exports = mongoose.model('User', userSchema);