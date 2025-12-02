const mongoose = require('mongoose');
const schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new schema({
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
    }
}, {
    timestamps: true  // This will automatically add createdAt and updatedAt fields
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);