const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['traveler', 'manager'],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
});

const chatSchema = new Schema({
    // Link to booking - one chat per booking
    booking: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true
    },
    // The property this chat is about
    listing: {
        type: Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    // The traveler (guest)
    traveler: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The property manager/owner
    manager: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Messages array
    messages: [messageSchema],
    // For quick display
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    // Unread counts
    unreadByTraveler: {
        type: Number,
        default: 0
    },
    unreadByManager: {
        type: Number,
        default: 0
    },
    // Chat status
    status: {
        type: String,
        enum: ['open', 'resolved'],
        default: 'open'
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
// Note: booking field already has unique: true, so no need to index it again
chatSchema.index({ traveler: 1 });
chatSchema.index({ manager: 1 });
chatSchema.index({ listing: 1 });
chatSchema.index({ lastMessageTime: -1 });

module.exports = mongoose.model('Chat', chatSchema);
