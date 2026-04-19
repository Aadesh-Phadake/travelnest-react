const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        subject: { type: String, trim: true },
        message: { type: String, required: true, trim: true, maxlength: 5000 },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

// ===== DATABASE INDEXES =====
contactMessageSchema.index({ email: 1 });         // Contact message lookups by email
contactMessageSchema.index({ createdAt: -1 });    // Sorted messages

module.exports = mongoose.model('ContactMessage', contactMessageSchema);


