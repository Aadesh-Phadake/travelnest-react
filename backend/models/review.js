const mongoose = require('mongoose');
const schema = mongoose.Schema;

const ReviewSchema = new schema({
    comment: {
        type: String
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    photos: [{
        type: String // URLs of uploaded photos
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// ===== DATABASE INDEXES =====
ReviewSchema.index({ author: 1 });           // User review lookups
ReviewSchema.index({ createdAt: -1 });       // Sorted reviews

module.exports = mongoose.model('Review', ReviewSchema);